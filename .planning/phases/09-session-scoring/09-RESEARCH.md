# Phase 09: Session Scoring & Real Feedback - Research

**Researched:** 2026-02-26
**Domain:** Firebase Cloud Functions (endSession), Gemini scoring prompt, FeedbackPage data wiring, user stats update
**Confidence:** HIGH — all implementation details drawn from existing codebase, TRD spec, and Phase 8 established patterns

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCORE-01 | `endSession` Cloud Function called when user ends session — sends full transcript to Gemini for scoring (fluency/grammar/vocabulary/overall), updates user stats (`totalHoursPracticed`, `averageScore`, `dailyStreak`, `totalSessionsCompleted`) in Firestore | Cloud Function pattern established in Phase 8; TRD spec at lines 325-362 of TRD.md; Admin SDK update pattern from sendMessage |
| SCORE-02 | FeedbackPage reads real scores (`fluency`, `grammar`, `vocabulary`, `overall`) from Firestore `sessions/{sessionId}` — replaces hardcoded score values | `sessions/{sessionId}.scores` object written by endSession; FeedbackPage already has `session.sessionId` available; Firestore `getDoc` pattern from Phase 7 |
| SCORE-03 | FeedbackPage Mistakes tab displays real grammar and pronunciation mistakes array from Firestore session document | `sessions/{sessionId}.mistakes` array already accumulated by `sendMessage` arrayUnion; FeedbackPage needs v-for over real array |
| SCORE-04 | FeedbackPage Vocabulary tab displays real `newVocabulary` array from Firestore session document; user can tap "Add to Bank" to save each word (triggers DATA-06) | `sessions/{sessionId}.newVocabulary` accumulated by `sendMessage`; `saveWord()` already wired in FeedbackPage via `vocabStore.saveWord()` |
| FUNC-03 | `endSession` HTTPS callable — calls Gemini to score full transcript, updates session `scores` and `completedAt`, updates user stats, updates leaderboard entry for current week, returns `{ scores, feedback }` | Stub exists at `functions/index.js` line 208-209; GoogleGenAI pattern from startConversation/sendMessage; Admin SDK batch update pattern established |
</phase_requirements>

---

## Summary

Phase 9 completes the session feedback loop by implementing the `endSession` Cloud Function and connecting FeedbackPage to real Firestore data. The work divides cleanly into two concerns: (1) the Cloud Function that analyzes the transcript via Gemini and persists scores + user stats, and (2) the frontend wiring that replaces FeedbackPage's hardcoded mock data with live Firestore reads.

The Phase 8 codebase provides everything Phase 9 builds on. `functions/index.js` already has `startConversation` and `sendMessage` with their full Gemini + Admin SDK patterns — `endSession` follows the same shape. `SessionPage.vue` already calls `session.endSession(82)` (hardcoded) and navigates to feedback; Phase 9 replaces the `82` with a real Cloud Function call. `FeedbackPage.vue` already reads `session.overallScore` for the hero card and already has `vocabStore.saveWord()` wired; Phase 9 replaces the three hardcoded `animateValue(pronPct, 85)` calls and the static `vocabWords` array with data from Firestore.

The `sendMessage` Cloud Function already accumulates `mistakes` and `newVocabulary` arrays in the Firestore session document via `FieldValue.arrayUnion`. This means Phase 9's FeedbackPage can simply read `sessions/{sessionId}` and get the full arrays — no additional Cloud Function calls needed for Mistakes/Vocabulary tabs. The only new Cloud Function call is `endSession` itself (triggered on "End Session" tap), which adds the `scores` object and `completedAt` timestamp to the session document.

**Primary recommendation:** Implement `endSession` using the exact same GoogleGenAI + Admin SDK pattern as `sendMessage`. Wire the session store to call `endSessionFn` httpsCallable in `session.endSession()`. Add a Firestore `getDoc` in FeedbackPage `onMounted` to load the full session document and replace mock values.

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | installed in `functions/` | Gemini API calls for transcript scoring | Phase 8 decision: replaces deprecated `@google/generative-ai` |
| `firebase-admin` | installed in `functions/` | Admin SDK for Firestore writes (user stats, session update) | Server-side Admin credentials; established in Phase 8 |
| `firebase/functions` | `firebase@12.9.0` | `httpsCallable` for `endSessionFn` in session store | Already used for `startConversationFn` and `sendMessageFn` |
| `firebase/firestore` | `firebase@12.9.0` | `getDoc`, `doc` for reading `sessions/{sessionId}` in FeedbackPage | Already used throughout Phase 7 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase-functions/params` | bundled | `defineSecret(GEMINI_API_KEY)` for endSession | Required for any function that calls Gemini |
| `firebase-functions/https` | bundled | `onCall`, `HttpsError` | All HTTPS callable functions |
| `firebase-functions/logger` | bundled | Structured logging | Debug scoring issues in production |

**Installation:** No new packages needed — all dependencies are already in `functions/package.json` and `package.json`.

---

## Architecture Patterns

### Recommended File Changes

```
functions/
└── index.js          # Add exports.endSession (implements FUNC-03)

src/
├── stores/
│   └── session.js    # endSession() becomes async; calls endSessionFn httpsCallable
└── pages/
    ├── SessionPage.vue    # doEndSession() awaits session.endSession(); removes hardcoded 82
    └── FeedbackPage.vue   # onMounted reads sessions/{sessionId} from Firestore; replaces mock data
```

### Pattern 1: endSession Cloud Function (follows Phase 8 pattern exactly)

**What:** HTTPS callable that reads session transcript, calls Gemini for scoring, writes scores to session doc, updates user stats.
**When to use:** Called once per session when user taps "End Session".

```javascript
// Source: functions/index.js (Phase 8 established pattern)
// Add after sendMessage, uncomment the Phase 9 stub at line 208

exports.endSession = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const uid = request.auth.uid
  const { sessionId, finalTranscript } = request.data

  // Validate session exists and belongs to user
  const sessionSnap = await admin.firestore().doc(`sessions/${sessionId}`).get()
  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', 'Session not found')
  }
  if (sessionSnap.data().userId !== uid) {
    throw new HttpsError('permission-denied', 'Session does not belong to user')
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })

  // Scoring prompt — asks Gemini to analyze transcript and return scores + feedback
  const scoringPrompt = `You are an English language assessment expert. Analyze this conversation transcript and provide objective scores.

TRANSCRIPT:
${JSON.stringify(finalTranscript)}

Score each dimension 0-100 based on:
- fluency: Flow, pace, natural expression, lack of hesitation
- grammar: Correctness of grammar, verb tenses, articles, prepositions
- vocabulary: Range of words used, appropriate complexity for topic
- overall: Weighted average (fluency 30%, grammar 40%, vocabulary 30%)

OUTPUT (JSON only):
{
  "scores": {
    "fluency": number,
    "grammar": number,
    "vocabulary": number,
    "overall": number
  },
  "feedback": {
    "pronunciationIssues": [],
    "grammarMistakes": [],
    "vocabularySuggestions": []
  }
}`

  const result = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: scoringPrompt,
    config: { responseMimeType: 'application/json' }
  })

  let parsed
  try {
    parsed = JSON.parse(result.text)
  } catch {
    parsed = {
      scores: { fluency: 70, grammar: 70, vocabulary: 70, overall: 70 },
      feedback: { pronunciationIssues: [], grammarMistakes: [], vocabularySuggestions: [] }
    }
  }

  const scores = parsed.scores
  const now = admin.firestore.Timestamp.now()

  // Update session document with scores + completedAt
  await admin.firestore().doc(`sessions/${sessionId}`).update({
    scores:      scores,
    completedAt: now
  })

  // Update user stats
  const userSnap = await admin.firestore().doc(`users/${uid}`).get()
  const userData = userSnap.data()
  const durationMinutes = Math.round((finalTranscript.length * 15) / 60) // estimate
  const newTotal = (userData.totalSessionsCompleted ?? 0) + 1
  const newAvg   = Math.round(
    ((userData.averageScore ?? 0) * Math.min(newTotal - 1, 9) + scores.overall)
    / Math.min(newTotal, 10)
  )
  const lastDate = userData.lastSessionDate?.toDate?.()
  const today    = new Date()
  const isConsecutive = lastDate &&
    (today - lastDate) < 48 * 60 * 60 * 1000  // within 48h window
  const newStreak = isConsecutive ? (userData.dailyStreak ?? 0) + 1 : 1

  await admin.firestore().doc(`users/${uid}`).update({
    totalSessionsCompleted: admin.firestore.FieldValue.increment(1),
    totalHoursPracticed:    admin.firestore.FieldValue.increment(durationMinutes),
    averageScore:           newAvg,
    dailyStreak:            newStreak,
    lastSessionDate:        now,
    freeSessionUsed:        true,
    updatedAt:              now
  })

  // Leaderboard update — current week entry
  const weekId = getWeekId()
  await admin.firestore()
    .doc(`leaderboard/${weekId}/users/${uid}`)
    .set({
      displayName:        userData.displayName ?? '',
      photoURL:           userData.photoURL ?? '',
      weeklySessionTime:  admin.firestore.FieldValue.increment(durationMinutes),
      weeklySessionCount: admin.firestore.FieldValue.increment(1),
      currentStreak:      newStreak,
      lastUpdated:        now
    }, { merge: true })

  return { scores, feedback: parsed.feedback }
})

function getWeekId() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
  return `${now.getFullYear()}-${week.toString().padStart(2, '0')}`
}
```

### Pattern 2: session.endSession() becomes async Cloud Function call

**What:** Replace hardcoded `session.endSession(82)` with async call to `endSessionFn` that returns real scores.

```javascript
// Source: src/stores/session.js
// Add httpsCallable at module level (follows Phase 8 pattern)
const endSessionFn = httpsCallable(functions, 'endSession')

// Replace existing endSession(score) with:
async function endSession() {
  isActive.value = false
  try {
    const result = await endSessionFn({
      sessionId:       sessionId.value,
      finalTranscript: transcript.value
    })
    // result.data = { scores: { fluency, grammar, vocabulary, overall }, feedback }
    overallScore.value = result.data.scores.overall
    scores.value = result.data.scores  // new ref for FeedbackPage
  } catch (err) {
    overallScore.value = 0
    scores.value = null
    console.error('endSession error:', err)
  }
}
```

### Pattern 3: FeedbackPage reads Firestore session document

**What:** Replace hardcoded `animateValue(pronPct, 85)` calls and `vocabWords` array with Firestore read.

```javascript
// Source: src/pages/FeedbackPage.vue onMounted
// Follows Phase 7 Firestore read pattern
import { doc, getDoc } from 'firebase/firestore'
import { db } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'

onMounted(async () => {
  const sessionData = await getDoc(doc(db, 'sessions', session.sessionId))
  if (sessionData.exists()) {
    const data = sessionData.data()
    const s = data.scores ?? {}
    setTimeout(() => {
      animateValue(pronPct,  s.fluency    ?? 0)   // NOTE: TRD maps fluency → pronunciation ring
      animateValue(gramPct,  s.grammar    ?? 0)
      animateValue(vocabPct, s.vocabulary ?? 0)
    }, 300)
    mistakes.value    = data.mistakes      ?? []
    vocabWords.value  = (data.newVocabulary ?? []).map(v => ({
      term:       v.word,
      definition: v.definition,
      example:    v.example ?? v.exampleSentence ?? '',
      level:      'B1'   // no level field in newVocabulary schema; use static badge or omit
    }))
  }
})
```

### Pattern 4: SessionPage doEndSession awaits Cloud Function

**What:** Replace synchronous `session.endSession(82)` with `await session.endSession()`.

```javascript
// Source: src/pages/SessionPage.vue doEndSession()
async function doEndSession() {
  clearInterval(timerInterval)
  isEndingSession.value = true        // new loading state to show spinner
  await session.endSession()          // async — calls endSessionFn
  isEndingSession.value = false
  router.push({ name: 'feedback' })
}
```

### Anti-Patterns to Avoid

- **Calling `endSession` multiple times:** `doEndSession` must clear timer and disable End button before the async call completes. Use a `isEndingSession` boolean ref to prevent double-calls.
- **Reading Firestore before `endSession` resolves:** FeedbackPage `onMounted` reads `sessions/{sessionId}` — it must wait for `session.endSession()` to complete in SessionPage before navigating. Since the navigation happens after the await, Firestore will have scores by the time FeedbackPage mounts.
- **Using Web SDK `arrayUnion`:** All Firestore writes in Cloud Functions MUST use `admin.firestore.FieldValue` (Admin SDK), not the web SDK `arrayUnion`. This is already established in Phase 8.
- **Instantiating GoogleGenAI at module level:** `GEMINI_API_KEY.value()` only works during function invocation. Instantiate inside the handler body, exactly like Phase 8 functions.
- **Missing score field fallback:** `sessions/{sessionId}.scores` won't exist until `endSession` completes. FeedbackPage must guard with `?? 0` fallbacks for all score reads.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scoring transcript quality | Custom algorithm | Gemini JSON output with `responseMimeType: 'application/json'` | Already established pattern in sendMessage; Gemini handles nuanced language quality |
| User stats update | Custom running average | Admin SDK `FieldValue.increment` + rolling average calc | Atomic increment prevents race conditions |
| Streak calculation | Cron-based reset | `lastSessionDate` comparison in endSession handler | Simpler, no cron job needed; TRD describes this approach |
| Week ID generation | External library | Simple JS date math (`getWeekId()` helper) | Leaderboard weekId is `"YYYY-WW"` format per TRD |
| Score animation | External animation library | Existing `animateValue()` with ease-out cubic | Already built in Phase 4, just needs real target values |
| vocabWords level badge | Extra Gemini call | Static `'B1'` or omit level field | `newVocabulary` schema has no level field; existing badge CSS works without it |

**Key insight:** The entire Phase 9 problem is "replace hardcoded values with Firestore reads" — no new UI patterns are needed. The CSS conic-gradient rings, QTabs structure, and badge system are already pixel-perfect from Phase 4. The only structural additions are: one new Cloud Function, one async store action, and one Firestore read in onMounted.

---

## Common Pitfalls

### Pitfall 1: Navigating to FeedbackPage before endSession resolves
**What goes wrong:** SessionPage calls `session.endSession()` but doesn't await it, so FeedbackPage mounts and reads Firestore before scores are written.
**Why it happens:** `endSession` is a network call (~2-4 seconds). Developers often push router immediately and hope the data arrives in time.
**How to avoid:** `doEndSession()` must be `async` and `router.push()` must come AFTER `await session.endSession()`. Add `isEndingSession` loading state to disable End button during the call.
**Warning signs:** FeedbackPage shows `0%` or `null` for scores.

### Pitfall 2: FeedbackPage reads stale data — session.sessionId is null
**What goes wrong:** If user navigates directly to `/feedback` (not via EndSession flow), `session.sessionId` is `null` and `getDoc` throws or returns empty.
**Why it happens:** The session store is in-memory; hard reload loses state.
**How to avoid:** Add a null guard in FeedbackPage `onMounted`. If `session.sessionId` is null, display graceful fallback ("No session data") or redirect to dashboard.
**Warning signs:** JavaScript error "Invalid document reference. Document references must have an even number of segments".

### Pitfall 3: `newVocabulary` schema field mismatch
**What goes wrong:** `sendMessage` stores `{ word, definition, example }` in `newVocabulary` array. TRD sessions schema shows `{ word, definition, exampleSentence, savedToBank }`. The field name differs (`example` vs `exampleSentence`).
**Why it happens:** Phase 8 `sendMessage` prompt outputs `example` but TRD schema uses `exampleSentence`.
**How to avoid:** Read both: `v.example ?? v.exampleSentence ?? ''` in FeedbackPage data mapping. Verify what Phase 8's actual `sendMessage` returns in your environment before assuming.
**Warning signs:** Vocabulary words show empty example sentences.

### Pitfall 4: `averageScore` rolling average diverges over time
**What goes wrong:** Simple `(old + new) / 2` compounding produces exponential decay. TRD specifies "rolling average of last 10 sessions".
**Why it happens:** Rolling average requires storing N values or tracking a window.
**How to avoid:** Use weighted formula: `Math.round((oldAvg * Math.min(sessionCount - 1, 9) + newScore) / Math.min(sessionCount, 10))`. This approximates a 10-session rolling window without storing history.
**Warning signs:** `averageScore` converges toward very low values after many sessions.

### Pitfall 5: Leaderboard write fails silently due to security rules
**What goes wrong:** `endSession` tries to write to `leaderboard/{weekId}/users/{uid}` but Firestore rules say `allow write: if false` (client-side).
**Why it happens:** Cloud Functions use the Admin SDK which bypasses Firestore security rules entirely. The security rules restriction is for client writes only. This is correct behavior.
**How to avoid:** No action needed — Admin SDK always bypasses rules. Document this clearly in implementation so developers don't panic when they see the rule.
**Warning signs:** None — this is expected behavior.

### Pitfall 6: Double "End Session" call
**What goes wrong:** User taps "End Session" twice before the async call resolves, creating two endSession Cloud Function calls and double-incrementing user stats.
**Why it happens:** Network latency means there's a ~2-4 second window where the button is still tappable.
**How to avoid:** Set `isEndingSession = true` before the await. In the End Session dialog's confirm button, bind `:disable="isEndingSession"` or show a loading spinner instead.
**Warning signs:** `totalSessionsCompleted` increments by 2 after one session.

---

## Code Examples

### endSession function inputs from session store

```javascript
// Source: src/stores/session.js (Phase 8 verified)
// Data available to pass to endSessionFn:
{
  sessionId:       session.sessionId,      // set by startConversationFn result
  finalTranscript: session.transcript      // array of { speaker, text } — accumulated by sendMessage
}
// durationSeconds available as: session.durationSeconds
```

### Firestore session document shape after Phase 8

```javascript
// Source: functions/index.js + TRD.md sessions collection schema
// What sessions/{sessionId} contains BEFORE endSession:
{
  userId:        string,
  sessionNumber: number,
  topic:         string,
  userLevel:     string,
  transcript:    [{ speaker: 'user'|'ai', text: string, timestamp: number }],
  mistakes:      [{ type, original, correction, explanation }],  // accumulated by sendMessage
  newVocabulary: [{ word, definition, example }],               // accumulated by sendMessage
  aiModel:       'gemini-1.5-flash',
  createdAt:     Timestamp
  // scores, completedAt added by endSession
}
```

### FeedbackPage mock values to replace

```javascript
// Source: src/pages/FeedbackPage.vue lines 289-295, 309-328
// REMOVE these hardcoded calls:
animateValue(pronPct, 85)   // → animateValue(pronPct, sessionData.scores.fluency ?? 0)
animateValue(gramPct, 70)   // → animateValue(gramPct, sessionData.scores.grammar ?? 0)
animateValue(vocabPct, 90)  // → animateValue(vocabPct, sessionData.scores.vocabulary ?? 0)

// REMOVE static vocabWords array (lines 309-328)
// REPLACE with reactive ref loaded from sessionData.newVocabulary

// KEEP: animateValue() function itself — it's correct
// KEEP: session.overallScore in hero card — will be set by store after endSession
// KEEP: vocabStore.saveWord() wiring — already works (DATA-06 verified Phase 7)
```

### Admin SDK user stats update (established pattern from Phase 8)

```javascript
// Source: functions/index.js sendMessage (line 192-198) — FieldValue pattern
// For endSession, use update() not set() — document exists
await admin.firestore().doc(`users/${uid}`).update({
  totalSessionsCompleted: admin.firestore.FieldValue.increment(1),
  totalHoursPracticed:    admin.firestore.FieldValue.increment(durationMinutes),
  averageScore:           newAvg,
  dailyStreak:            newStreak,
  lastSessionDate:        admin.firestore.Timestamp.now(),
  freeSessionUsed:        true,
  updatedAt:              admin.firestore.Timestamp.now()
})
```

---

## State of the Art

| Old Approach (before Phase 9) | New Approach (Phase 9) | Change | Impact |
|-------------------------------|------------------------|--------|--------|
| `session.endSession(82)` — hardcoded score | `await session.endSession()` — calls Cloud Function | Phase 9 | FeedbackPage shows real scores |
| `animateValue(pronPct, 85)` in FeedbackPage onMounted | `animateValue(pronPct, sessionData.scores.fluency)` | Phase 9 | Score rings reflect actual session quality |
| Hardcoded `vocabWords` array (3 mock words) | `sessionData.newVocabulary` from Firestore | Phase 9 | Vocabulary tab shows words from THIS session |
| Hardcoded mistake cards (Article Usage, Verb Tense) | `sessionData.mistakes` v-for loop | Phase 9 | Mistakes tab shows real detected errors |
| `overallScore` set to hardcoded value | `overallScore` set from `endSession` result | Phase 9 | Hero card `{{ session.overallScore }}%` is real |

**Not changing:**
- CSS conic-gradient rings — already pixel-perfect
- QTabs structure (Overview/Mistakes/Vocabulary) — already built
- `animateValue()` animation logic — reused with real targets
- `vocabStore.saveWord()` — already wired (DATA-06 from Phase 7)
- `session.overallScore` binding in FeedbackPage hero card — already correct

---

## Open Questions

1. **Duration calculation in `endSession`**
   - What we know: `session.durationSeconds` is tracked in the frontend store; TRD shows `durationSeconds` field in the sessions schema; `endSession` input per TRD is `{ sessionId, finalTranscript }` — no duration in the contract
   - What's unclear: Should `durationSeconds` be passed as a third input param, or read from the Firestore session document (the sessions doc doesn't currently store durationSeconds — it's only in frontend memory)?
   - Recommendation: Pass `durationSeconds` as an additional input to `endSession` alongside `sessionId` and `finalTranscript`. This is simpler than writing it to Firestore mid-session. Update the session document with `durationSeconds` in the same `endSession` update call.

2. **Pronunciation ring maps to `fluency` score**
   - What we know: FeedbackPage has three rings: Pronunciation, Grammar, Vocabulary. Firestore `scores` has: `fluency`, `grammar`, `vocabulary`, `overall`. There is no separate `pronunciation` score in the TRD spec.
   - What's unclear: Should `pronPct` (Pronunciation ring) use `fluency` score, or should the endSession Gemini prompt return a separate `pronunciation` key?
   - Recommendation: Map `pronPct → scores.fluency` as documented in the TRD note: "Real pronunciation scoring NOT in MVP (Web Speech API doesn't provide phonetic data)." The fluency score is the closest analog. Keep the ring label "Pronunciation" in the UI as designed.

3. **`newVocabulary` per-session vs. cumulative**
   - What we know: `sendMessage` appends to `sessions/{sessionId}.newVocabulary` via `FieldValue.arrayUnion` every turn. The same word could appear multiple times if Gemini repeats it.
   - What's unclear: Should `endSession` deduplicate newVocabulary before returning? Or deduplicate in FeedbackPage?
   - Recommendation: Deduplicate in FeedbackPage by `word` field using a computed property or simple filter. The Cloud Function doesn't need to care about this presentation concern.

---

## Implementation Sequence (for Planner)

Based on dependencies, the correct task sequence is:

**Plan 09-01: Cloud Function `endSession` + Session Store update**
1. Add `endSession` export to `functions/index.js` (FUNC-03)
2. Add `endSessionFn = httpsCallable(functions, 'endSession')` to `session.js`
3. Rewrite `session.endSession()` to `async`, call `endSessionFn`, store `scores` ref
4. Update `SessionPage.vue` `doEndSession()` to be async, await `session.endSession()`, pass `durationSeconds`
5. Add `isEndingSession` loading state in SessionPage, disable End button during call

**Plan 09-02: FeedbackPage connected to Firestore**
1. Add `const mistakes = ref([])` and `const vocabWords = ref([])` reactive refs in FeedbackPage
2. In `onMounted`, read `sessions/{session.sessionId}` from Firestore after `session.endSession()` completes (session store has scores already, Firestore read gets mistakes + newVocabulary)
3. Replace `animateValue(pronPct, 85)` etc. with real score values
4. Replace hardcoded mistakes cards with `v-for="mistake in mistakes"`
5. Replace static `vocabWords` array with Firestore-loaded data
6. Add null guard for missing `session.sessionId`

---

## Sources

### Primary (HIGH confidence)
- `functions/index.js` (this project) — `startConversation` and `sendMessage` implementation patterns; Phase 8 established patterns directly applicable
- `src/stores/session.js` (this project) — existing `endSession(score)` signature, `transcript`, `sessionId`, `durationSeconds` state
- `src/pages/FeedbackPage.vue` (this project) — exact hardcoded values to replace and existing wiring (vocabStore.saveWord already working)
- `TRD.md` — `endSession` spec (lines 325-362), sessions collection schema (lines 128-166), user document schema (lines 100-120), leaderboard schema (lines 192-204)
- `.planning/REQUIREMENTS.md` — SCORE-01 through SCORE-04 and FUNC-03 requirement text
- `.planning/phases/08-ai-conversation/08-VERIFICATION.md` — verified Phase 8 patterns (Admin SDK FieldValue, httpsCallable at module level, GoogleGenAI inside handler)

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — accumulated decisions: `@google/genai` (not deprecated package), node:24, CommonJS in Cloud Functions, Admin SDK FieldValue.arrayUnion
- `.planning/ROADMAP.md` Phase 9 planned tasks — confirms 09-01 (endSession function) and 09-02 (FeedbackPage wiring) plan structure

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all tools verified in Phase 8
- Architecture patterns: HIGH — directly modeled on working Phase 8 code in the same file
- Pitfalls: HIGH — derived from exact code analysis (line numbers cited), not speculation
- Gemini scoring prompt: MEDIUM — no prior art in this codebase; prompt shape inferred from TRD description and sendMessage pattern; planner should include prompt text as a task detail

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (30 days — stable Firebase/Gemini APIs; no fast-moving dependencies)
