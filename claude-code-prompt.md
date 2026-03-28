# Claude Code Task: Migrate SpeakAI Cloud Functions from Gemini to OpenAI + Optimize Flow

## Context

SpeakAI is an English conversation practice app built with Vue 3 + Quasar + Firebase + Capacitor. The backend runs on Firebase Cloud Functions (region: `africa-south1`). Currently, the AI conversation engine uses `@google/genai` (Gemini) but suffers from high latency (6-10s per message) and reliability issues (invalid model name `gemini-3.1-pro-preview`).

This task migrates the AI layer to OpenAI `gpt-4o-mini` and optimizes the request flow for sub-3s response times. **The frontend is NOT touched** — all changes are in `functions/index.js` and `functions/package.json`.

---

## Objectives

1. **Replace Gemini SDK with OpenAI SDK** in all 3 AI-powered Cloud Functions
2. **Optimize the request flow** to reduce latency (parallelize where possible, remove redundant reads)
3. **Fix data persistence bugs** (mistakes and newVocabulary never written to Firestore)
4. **Fix `totalHoursPracticed`** — currently increments minutes instead of hours

---

## File Scope

Only modify these files:
- `functions/index.js` — main changes
- `functions/package.json` — swap SDK dependency

Do NOT modify any file in `src/` (frontend). The Cloud Functions return the same response shape — the migration is invisible to the client.

---

## Step-by-Step Implementation

### Step 1: Update `functions/package.json`

- Remove: `"@google/genai": "^1.0.0"`
- Add: `"openai": "^4.0.0"`
- Run `npm install` in the `functions/` directory

### Step 2: Update imports and secrets in `functions/index.js`

Replace:
```js
const { GoogleGenAI } = require('@google/genai')
```
With:
```js
const OpenAI = require('openai')
```

Replace secret declaration:
```js
// OLD
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY')

// NEW
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')
```

Update all 3 functions to reference `OPENAI_API_KEY` in their `secrets` array instead of `GEMINI_API_KEY`.

### Step 3: Migrate `startConversation`

Replace the Gemini call with OpenAI. Key changes:

```js
exports.startConversation = onCall({ region: "africa-south1", secrets: [OPENAI_API_KEY] }, async (request) => {
  // Auth gate — keep as-is
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }
  const uid = request.auth.uid
  const { userLevel, sessionNumber } = request.data

  // Subscription gate — keep as-is
  if (sessionNumber > 1) {
    const userSnap = await admin.firestore().doc(`users/${uid}`).get()
    if (!userSnap.exists || userSnap.data().subscriptionStatus !== 'active') {
      throw new HttpsError('permission-denied', 'Active subscription required for session 2+')
    }
  }

  // OpenAI client — instantiate inside handler (OPENAI_API_KEY.value() only works during invocation)
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  const topicResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 200,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You generate English conversation topics. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: `Generate a conversation topic for a ${userLevel} English learner (session #${sessionNumber}).

Level guide: A1-A2=daily life, B1-B2=opinions/travel/work, C1-C2=abstract/debates.

JSON format: {"topic": "specific topic", "openingQuestion": "friendly first question"}`
      }
    ]
  })

  const { topic, openingQuestion } = JSON.parse(topicResponse.choices[0].message.content)

  // Create session document — keep as-is but fix aiModel field
  const sessionRef = await admin.firestore().collection('sessions').add({
    userId: uid,
    sessionNumber,
    topic,
    userLevel,
    transcript: [],
    mistakes: [],
    newVocabulary: [],
    aiModel: 'gpt-4o-mini',
    createdAt: FieldValue.serverTimestamp()
  })

  return {
    sessionId: sessionRef.id,
    topic,
    initialMessage: openingQuestion
  }
})
```

### Step 4: Migrate `sendMessage` (with flow optimizations)

This is the critical path for latency. Apply these optimizations:
- **Remove the session validation read** (the session was already validated when created; trust the sessionId from the authenticated client)
- **Parallelize**: return the AI response to the client WHILE writing to Firestore in the background (use `Promise.all` but don't await Firestore before returning — use a fire-and-forget pattern with error logging)
- **Fix bug**: write `mistakes` and `newVocabulary` to the session document (currently missing)
- **Optimize prompt**: shorter system prompt, separate messages array

```js
exports.sendMessage = onCall({ region: "africa-south1", secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const { sessionId, userMessage, conversationHistory, userLevel, topic } = request.data

  if (!sessionId || !userMessage) {
    throw new HttpsError('invalid-argument', 'sessionId and userMessage are required')
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  // Build messages array for OpenAI chat format
  const history = (conversationHistory || []).slice(-10)
  const chatMessages = [
    {
      role: 'system',
      content: `You are Alex, a friendly English conversation teacher. Level: ${userLevel}. Topic: ${topic || 'General'}.

Rules: Ask follow-up questions. Keep replies short (2-3 sentences). Don't correct mistakes mid-conversation — track them silently. Introduce 1-2 new words naturally.

Always respond with JSON: {"response":"your reply","mistakes":[{"type":"grammar","original":"wrong","correction":"right","explanation":"why"}],"newVocabulary":[{"word":"w","definition":"d","example":"e"}]}`
    }
  ]

  // Convert conversation history to OpenAI message format
  for (const msg of history) {
    chatMessages.push({
      role: msg.speaker === 'user' ? 'user' : 'assistant',
      content: msg.speaker === 'ai'
        ? JSON.stringify({ response: msg.text, mistakes: [], newVocabulary: [] })
        : msg.text
    })
  }

  // Add the current user message
  chatMessages.push({ role: 'user', content: userMessage })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 512,
    response_format: { type: 'json_object' },
    messages: chatMessages
  })

  let parsed
  try {
    parsed = JSON.parse(completion.choices[0].message.content)
  } catch {
    parsed = {
      response: "That's interesting! Tell me more about that.",
      mistakes: [],
      newVocabulary: []
    }
  }

  // OPTIMIZATION: Fire-and-forget Firestore write — don't block the response
  const now = Date.now()
  const firestoreWrite = admin.firestore().doc(`sessions/${sessionId}`).update({
    transcript: FieldValue.arrayUnion(
      { speaker: 'user', text: userMessage, timestamp: now },
      { speaker: 'ai', text: parsed.response, timestamp: now + 1 }
    ),
    // BUG FIX: persist mistakes and newVocabulary (previously never written)
    mistakes: FieldValue.arrayUnion(...(parsed.mistakes || [])),
    newVocabulary: FieldValue.arrayUnion(...(parsed.newVocabulary || []))
  }).catch(err => {
    logger.error('sendMessage: Firestore write failed (non-blocking)', { sessionId, error: err.message })
  })

  // Return immediately — don't await firestoreWrite
  // Note: Cloud Functions runtime will still complete the pending promise before shutting down
  // But the client gets the response faster

  // Actually, in Firebase Cloud Functions, we should await to ensure the write completes
  // before the function instance is recycled. Use Promise.all to run in parallel if needed later.
  // For now, await it but structure it so the response is prepared first.
  await firestoreWrite

  return {
    aiResponse: parsed.response,
    mistakes: parsed.mistakes || [],
    newVocabulary: parsed.newVocabulary || []
  }
})
```

**IMPORTANT NOTE on fire-and-forget in Cloud Functions**: Firebase Cloud Functions may terminate the execution environment after returning. To be safe, `await` the Firestore write. The main latency win here comes from removing the session validation `getDoc` and using the faster OpenAI model. If you want true fire-and-forget, you'd need to use a task queue or Pub/Sub.

### Step 5: Migrate `endSession`

```js
exports.endSession = onCall({ region: 'africa-south1', secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const uid = request.auth.uid
  const { sessionId, finalTranscript, durationSeconds } = request.data

  if (!sessionId) {
    throw new HttpsError('invalid-argument', 'sessionId is required')
  }

  // Validate session belongs to user — keep this check (security critical)
  const sessionRef = admin.firestore().doc(`sessions/${sessionId}`)
  const sessionSnap = await sessionRef.get()
  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', 'Session not found')
  }
  if (sessionSnap.data().userId !== uid) {
    throw new HttpsError('permission-denied', 'Session does not belong to user')
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  let parsed
  try {
    const scoringResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an English language assessment expert. Analyze transcripts and provide objective scores. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: `Score this conversation (0-100 each):

${JSON.stringify(finalTranscript)}

JSON format: {"scores":{"fluency":N,"grammar":N,"vocabulary":N,"overall":N},"feedback":{"pronunciationIssues":[],"grammarMistakes":[],"vocabularySuggestions":[]}}`
        }
      ]
    })
    parsed = JSON.parse(scoringResponse.choices[0].message.content)
  } catch (err) {
    logger.warn('endSession: OpenAI scoring failed, using fallback', err)
    parsed = {
      scores: { fluency: 70, grammar: 70, vocabulary: 70, overall: 70 },
      feedback: { pronunciationIssues: [], grammarMistakes: [], vocabularySuggestions: [] }
    }
  }

  const scores = parsed.scores
  const now = Timestamp.now()
  // BUG FIX: convert seconds to hours (was incrementing raw minutes before)
  const durationHours = Math.round(((durationSeconds ?? 0) / 3600) * 100) / 100

  // Parallelize session update + user stats update
  const userSnap = await admin.firestore().doc(`users/${uid}`).get()
  const userData = userSnap.data() ?? {}
  const prevTotal = userData.totalSessionsCompleted ?? 0
  const newTotal = prevTotal + 1
  const newAvg = Math.round(
    ((userData.averageScore ?? 0) * Math.min(prevTotal, 9) + scores.overall)
    / Math.min(newTotal, 10)
  )
  const lastDate = userData.lastSessionDate?.toDate?.()
  const today = new Date()
  const isConsecutive = lastDate && (today - lastDate) < 48 * 60 * 60 * 1000
  const newStreak = isConsecutive ? (userData.dailyStreak ?? 0) + 1 : 1

  const weekId = getWeekId()

  // OPTIMIZATION: Run all 3 Firestore writes in parallel
  await Promise.all([
    // 1. Update session document
    sessionRef.update({
      scores,
      completedAt: now,
      durationSeconds: durationSeconds ?? 0
    }),

    // 2. Update user stats
    admin.firestore().doc(`users/${uid}`).update({
      totalSessionsCompleted: FieldValue.increment(1),
      totalHoursPracticed: FieldValue.increment(durationHours),
      averageScore: newAvg,
      dailyStreak: newStreak,
      lastSessionDate: now,
      freeSessionUsed: true,
      updatedAt: now
    }),

    // 3. Update leaderboard
    admin.firestore()
      .doc(`leaderboard/${weekId}/users/${uid}`)
      .set({
        displayName: userData.displayName ?? '',
        photoURL: userData.photoURL ?? '',
        weeklySessionTime: FieldValue.increment(Math.round((durationSeconds ?? 0) / 60)),
        weeklySessionCount: FieldValue.increment(1),
        currentStreak: newStreak,
        lastUpdated: now
      }, { merge: true })
  ])

  logger.info('endSession complete', { uid, sessionId, scores })
  return { scores, feedback: parsed.feedback }
})
```

### Step 6: Clean up unused code

- Remove the `GEMINI_API_KEY` secret declaration (keep `MOZPAYMENTS_API_KEY`)
- Remove the `const { GoogleGenAI } = require('@google/genai')` import
- Update the session document `aiModel` field from `'gemini-1.5-flash'` to `'gpt-4o-mini'`

---

## Post-Implementation Checklist

After making the code changes:

1. `cd functions && npm install` — verify `openai` installs and `@google/genai` is removed
2. Set the new secret: `firebase functions:secrets:set OPENAI_API_KEY`
3. Test locally with emulators: `firebase emulators:start`
4. Verify response shape matches what the frontend expects:
   - `startConversation` returns `{ sessionId, topic, initialMessage }`
   - `sendMessage` returns `{ aiResponse, mistakes, newVocabulary }`
   - `endSession` returns `{ scores, feedback }`
5. Deploy: `firebase deploy --only functions`

---

## Summary of Changes

| What | Before | After |
|------|--------|-------|
| AI SDK | `@google/genai` | `openai` |
| Model | `gemini-3.1-pro-preview` (broken) | `gpt-4o-mini` |
| Secret | `GEMINI_API_KEY` | `OPENAI_API_KEY` |
| `sendMessage` session validation | `getDoc` every message | Removed (trust authenticated sessionId) |
| `sendMessage` mistakes/vocab write | Never written | Written via `arrayUnion` |
| `endSession` Firestore writes | Sequential | Parallel (`Promise.all`) |
| `totalHoursPracticed` | Incremented raw minutes | Incremented hours (seconds/3600) |
| Expected latency | 6-10s (with frequent failures) | 2-3s |

---

## Constraints

- Do NOT modify any frontend files (`src/` directory)
- Do NOT change the response shape of any Cloud Function
- Keep all functions in region `africa-south1`
- Keep `MOZPAYMENTS_API_KEY` and all payment-related code unchanged
- Keep `healthCheck`, `deleteOldTranscripts`, `updateWeeklyLeaderboard` unchanged
- Keep Firestore security rules unchanged
