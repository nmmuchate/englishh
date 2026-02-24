# Phase 8: AI Conversation Engine - Research

**Researched:** 2026-02-24
**Domain:** Web Speech API + Firebase Cloud Functions v2 (onCall) + @google/genai v1 + firebase/functions client SDK
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONV-01 | Web Speech API (SpeechRecognition) integrated in SessionPage — mic button starts real voice recognition (lang: 'en-US', continuous: false, interimResults: true) | `window.SpeechRecognition || window.webkitSpeechRecognition` pattern; browser availability check gates mic path vs. fallback; `onresult` event with `event.results[i].isFinal` drives message submission |
| CONV-02 | Text input fallback (QInput + send button) shown in SessionPage when SpeechRecognition unavailable (non-Chrome/Edge browsers) | `!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)` detection at mount time; already a keyboard toggle button in the footer (`sym_o_keyboard`) to wire |
| CONV-03 | `startConversation` Cloud Function called when session begins — creates session doc, returns AI-generated topic and opening message | `onCall` in `functions/index.js`; subscription gate via Admin SDK Firestore read; `@google/genai` `ai.models.generateContent()` with topic-assignment prompt; `addDoc` writes `sessions/{sessionId}`; returns `{ sessionId, topic, initialMessage }` |
| CONV-04 | `sendMessage` Cloud Function called for each user message — sends message + last 10 messages to Gemini; returns AI response and detected mistakes; updates Firestore transcript | `onCall`; validate session active; `@google/genai` with conversation prompt; parse JSON `{ response, mistakes, newVocabulary }`; `updateDoc` appends to transcript array; returns parsed response |
| CONV-05 | Paywall gate in SessionPage prevents session start if `freeSessionUsed == true` and `subscriptionStatus != "active"` — opens PaywallDialog instead | `useProfileStore` must expose `freeSessionUsed` and `subscriptionStatus` (currently missing from store); gate check in SessionPage `onMounted` before calling `startConversation` |
| FUNC-01 | `startConversation` HTTPS callable — validates subscription gate (sessionNumber > 1 requires active subscription), calls Gemini topic-assignment prompt, creates `sessions/{sessionId}` doc, returns `{ sessionId, topic, initialMessage }` | `onCall({ secrets: [GEMINI_API_KEY] }, handler)` pattern already scaffolded in `functions/index.js` comments; Admin SDK reads `users/{uid}` doc for subscription check; `@google/genai` topic prompt returns JSON `{ topic, openingQuestion }` |
| FUNC-02 | `sendMessage` HTTPS callable — validates session active, calls Gemini conversation prompt with history (last 10 messages), parses JSON `{ response, mistakes, newVocabulary }`, appends to Firestore transcript, returns parsed response | `onCall` with `request.data = { sessionId, userMessage, conversationHistory }`; `getDoc` validates session; Gemini prompt with `responseMimeType: 'application/json'` for reliable JSON output; `updateDoc` with `arrayUnion` on transcript field |
</phase_requirements>

---

## Summary

Phase 8 has two independent halves that must be built in sequence: (1) the Cloud Functions backend (`startConversation`, `sendMessage`) and (2) the SessionPage frontend wiring (Web Speech API, paywall gate, calling the functions, rendering live transcript). Everything scaffolded in Phase 6 is ready: `functions/index.js` already imports `onCall`, declares `GEMINI_API_KEY` secret, and has commented stubs for both functions. `@google/genai` v1.42.0 is already installed in `functions/node_modules` with working CJS support via `dist/node/index.cjs`.

The most important technical issue is **JSON parsing reliability from Gemini**. The TRD conversation prompt requires Gemini to return strict JSON. The new `@google/genai` v1 API supports `responseMimeType: 'application/json'` in the `config` object, which enforces JSON output at the API level — this is far more reliable than prompting alone. This must be used for both `sendMessage` (conversation prompt) and `startConversation` (topic prompt).

The second critical finding is that **`useProfileStore` is missing `freeSessionUsed` and `subscriptionStatus`**. These fields exist in Firestore (`createUserProfile` writes them) and `fetchUserProfile` reads the full document, but `useProfileStore.setProfile()` ignores them. The CONV-05 paywall gate reads these fields. They must be added to the store before the gate can work. This is a small store expansion, not an architecture change.

A third finding: the **Functions emulator is not configured** in `firebase.json` — the `emulators` block only has `auth` (9099) and `firestore` (8080). The Functions port (default 5001) is absent. Adding it and calling `connectFunctionsEmulator` from `boot/firebase.js` is required for local development. Without it, frontend calls during `quasar dev` will hit production Functions.

**Primary recommendation:** Build backend functions first (they're testable independently with emulator curl), then wire SessionPage frontend. Use `responseMimeType: 'application/json'` in all Gemini calls to guarantee parseable output. Add `freeSessionUsed` and `subscriptionStatus` to `useProfileStore` as the first task.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | 1.42.0 (installed) | Gemini API calls from Cloud Functions | Official Google SDK; replaces deprecated `@google/generative-ai`; CJS-compatible via `dist/node/index.cjs` |
| `firebase-functions` | 7.0.5 (installed) | `onCall`, `onRequest`, `setGlobalOptions`, `defineSecret` | Already in `functions/package.json`; v2 callable pattern already scaffolded |
| `firebase-admin` | 13.6.0 (installed) | Admin Firestore reads/writes inside functions | Already initialized in `functions/index.js` |
| `firebase/functions` | (web SDK, installed) | `getFunctions`, `httpsCallable`, `connectFunctionsEmulator` | Client-side callable invocation |
| Web Speech API | Browser native | `SpeechRecognition` voice capture | Zero cost; required by TRD; already in architecture |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase/firestore` `arrayUnion` | built-in | Append transcript entries atomically | `sendMessage` transcript updates — avoids read-modify-write on array |
| `firebase/firestore` `getDoc`, `updateDoc` | built-in | Validate session doc + update transcript | Inside `sendMessage` function |
| `firebase-functions` `HttpsError` | built-in | Return structured errors to client | Auth gate failures, validation failures |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `responseMimeType: 'application/json'` | Regex parse the text response | `responseMimeType` is guaranteed JSON at API level; regex fails on malformed output and model hallucinations |
| `onCall` for both functions | `onRequest` with manual auth header parsing | `onCall` auto-decodes the Firebase ID token into `request.auth`; no manual JWT validation needed |
| `arrayUnion` for transcript | Read doc, push, write back | `arrayUnion` is atomic — safe under concurrent `sendMessage` calls even if rare |
| Direct `window.SpeechRecognition` | VueUse `useSpeechRecognition` | VueUse adds a dependency; `window.SpeechRecognition || window.webkitSpeechRecognition` is 3 lines and well-understood |

**Installation:** No new packages needed — all dependencies are already installed in both `functions/node_modules` and the root `node_modules`.

---

## Architecture Patterns

### Recommended Project Structure

```
functions/
└── index.js              # ADD: startConversation + sendMessage exports

src/
├── boot/
│   └── firebase.js       # ADD: getFunctions init + connectFunctionsEmulator
├── stores/
│   └── profile.js        # ADD: freeSessionUsed + subscriptionStatus fields
└── pages/
    └── SessionPage.vue   # REPLACE: mock transcript + toggleMic with real SpeechRecognition,
                          #          real function calls, paywall gate, live transcript render
```

### Pattern 1: `@google/genai` in CJS Cloud Functions

**What:** `@google/genai` v1 has `"type": "module"` in its package.json but ships a CJS build at `dist/node/index.cjs`. Node.js package exports resolve `require('@google/genai')` to the CJS build when the caller is CJS (confirmed via live test in `functions/` directory).

**When to use:** All Gemini API calls inside Cloud Functions. Initialize once at module level, outside the handler.

**Example:**
```javascript
// functions/index.js — at module level (outside handler)
// Source: @google/genai package.json exports field + verified via require() test
const { GoogleGenAI } = require('@google/genai')

// Inside the function handler, after GEMINI_API_KEY is available:
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })

const result = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: promptString,
  config: {
    responseMimeType: 'application/json',
    temperature: 0.7
  }
})

const parsed = JSON.parse(result.text)
```

**Critical:** `GEMINI_API_KEY.value()` is only valid inside a function handler invocation, not at module initialization time. Instantiate `GoogleGenAI` inside the handler or lazily.

### Pattern 2: `onCall` v2 with Auth Gate

**What:** Firebase Functions v2 `onCall` auto-decodes the Firebase ID token. `request.auth` is an `AuthData` object with `uid` and `token` fields (or `undefined` if unauthenticated). Throw `HttpsError('unauthenticated', msg)` to return a structured 401 to the client.

**When to use:** Both `startConversation` and `sendMessage` require the caller to be authenticated.

**Example:**
```javascript
// Source: firebase-functions v7 lib/common/providers/https.d.ts lines 37-44, 69-98
const { onCall, HttpsError } = require('firebase-functions/https')

exports.startConversation = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  // Auth gate — request.auth is undefined if client is not signed in
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }
  const uid = request.auth.uid
  const { userLevel, sessionNumber } = request.data
  // ...
})
```

**Note:** `require('firebase-functions/https')` is the correct path for v2 functions (not `firebase-functions/v2/https`). Verified: `require('firebase-functions/https')` exports `onCall` correctly in v7.0.5.

### Pattern 3: Subscription Gate Inside `startConversation`

**What:** If `sessionNumber > 1`, verify the user has an active subscription by reading `users/{uid}` from Firestore via the Admin SDK. Match TRD FUNC-01 logic.

**Example:**
```javascript
// Source: TRD /TRD.md FUNC-01 + Admin SDK pattern
const admin = require('firebase-admin')

// Inside startConversation handler:
const uid = request.auth.uid
const { sessionNumber, userLevel } = request.data

if (sessionNumber > 1) {
  const userDoc = await admin.firestore().doc(`users/${uid}`).get()
  const userData = userDoc.data()
  if (!userData || userData.subscriptionStatus !== 'active') {
    throw new HttpsError('permission-denied', 'Active subscription required')
  }
}
```

### Pattern 4: Gemini Topic Assignment Prompt (FUNC-01)

**What:** `startConversation` calls Gemini with the topic-assignment prompt from TRD. Expects JSON `{ topic, openingQuestion }`. Uses `responseMimeType: 'application/json'` for reliable parsing.

**Example:**
```javascript
// Source: TRD /TRD.md "Topic Assignment Prompt" section
const topicPrompt = `Generate an engaging conversation topic for a ${userLevel} English learner.

LEVEL GUIDELINES:
- A1-A2 (Beginner): Daily routines, family, hobbies, food, weather
- B1-B2 (Intermediate): Work, travel experiences, opinions on current events
- C1-C2 (Advanced): Abstract concepts, debates, professional discussions

SESSION NUMBER: ${sessionNumber}

OUTPUT (JSON):
{"topic": "Clear specific topic statement", "openingQuestion": "Friendly first question"}`

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })
const result = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: topicPrompt,
  config: { responseMimeType: 'application/json' }
})
const { topic, openingQuestion } = JSON.parse(result.text)
```

### Pattern 5: Gemini Conversation Prompt (FUNC-02)

**What:** `sendMessage` passes user message + last 10 messages from `conversationHistory` array. Expects JSON `{ response, mistakes, newVocabulary }`. The full system prompt is in TRD.

**Example:**
```javascript
// Source: TRD /TRD.md "Conversation System Prompt" section
const { sessionId, userMessage, conversationHistory } = request.data

// Build prompt from TRD template
const systemPrompt = `You are an encouraging English conversation teacher named Alex...
[FULL TRD PROMPT]
CONVERSATION HISTORY: ${JSON.stringify(conversationHistory.slice(-10))}
USER'S LATEST MESSAGE: "${userMessage}"
Your response (JSON only):
`

const result = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: systemPrompt,
  config: {
    responseMimeType: 'application/json',
    temperature: 0.7,
    maxOutputTokens: 1024
  }
})

const parsed = JSON.parse(result.text)
// parsed = { response, mistakes: [...], newVocabulary: [...] }
```

### Pattern 6: Firestore Transcript Append (FUNC-02)

**What:** After a successful Gemini call, append both the user message and AI response to `sessions/{sessionId}.transcript` using `arrayUnion`. This is atomic and safe under concurrent calls.

**Example:**
```javascript
// Source: firebase-admin Admin SDK + arrayUnion
const admin = require('firebase-admin')
const FieldValue = admin.firestore.FieldValue

await admin.firestore().doc(`sessions/${sessionId}`).update({
  transcript: FieldValue.arrayUnion(
    { speaker: 'user', text: userMessage, timestamp: Date.now() },
    { speaker: 'ai', text: parsed.response, timestamp: Date.now() }
  )
})
```

**Note:** Admin SDK uses `admin.firestore.FieldValue.arrayUnion()`, not the `arrayUnion` imported from `firebase/firestore` (that's the web SDK). Inside Cloud Functions, always use the Admin SDK for Firestore.

### Pattern 7: Client-Side `httpsCallable` Setup

**What:** Frontend calls Cloud Functions via `httpsCallable` from the `firebase/functions` web SDK. `getFunctions` must be initialized with the same `app` instance from `boot/firebase.js`. `connectFunctionsEmulator` must be called in dev mode.

**When to use:** In `boot/firebase.js` alongside existing `auth` and `db` initialization. Export `functions` alongside `app`, `auth`, `db`.

**Example:**
```javascript
// src/boot/firebase.js — additions
// Source: @firebase/functions dist/functions-public.d.ts line 126, 143, 19
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const functions = getFunctions(app, 'africa-south1')  // must match setGlobalOptions region

if (process.env.DEV) {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export { app, auth, db, functions }
```

**Also:** Add `functions` port to `firebase.json` emulators block:
```json
"functions": { "port": 5001 }
```

### Pattern 8: Calling Functions from SessionPage / SessionStore

**What:** `httpsCallable` returns a function that, when called, returns a Promise with `{ data: ... }`. Call `startConversation` in `useSessionStore.startSession()` (which already handles the Firestore session write). Call `sendMessage` after each user voice/text input.

**Example:**
```javascript
// src/stores/session.js — extended startSession
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'

const startConversationFn = httpsCallable(functions, 'startConversation')
const sendMessageFn = httpsCallable(functions, 'sendMessage')

async function startSession() {
  const profileStore = useProfileStore()
  const authStore = useAuthStore()

  // Paywall check — done BEFORE calling function (also validated server-side)
  if (profileStore.freeSessionUsed && profileStore.subscriptionStatus !== 'active') {
    // Caller (SessionPage) must open PaywallDialog instead
    return { paywallRequired: true }
  }

  const result = await startConversationFn({
    userLevel: profileStore.currentLevel ?? 'B1',
    sessionNumber: profileStore.totalSessionsCompleted + 1
  })
  // result.data = { sessionId, topic, initialMessage }
  sessionId.value = result.data.sessionId
  topic.value = result.data.topic
  // Add initial AI message to transcript
  transcript.value.push({ speaker: 'ai', text: result.data.initialMessage })
}
```

### Pattern 9: Web Speech API in SessionPage

**What:** `SpeechRecognition` requires the vendor prefix on Chrome/Edge. Check availability at mount, fall back to text input if absent. Set `lang`, `continuous`, `interimResults` per TRD CONV-01.

**Example:**
```javascript
// src/pages/SessionPage.vue — script setup
// Source: MDN Web Speech API docs + caniuse.com (confirmed Chrome/Edge support 2025)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const speechAvailable = !!SpeechRecognition

let recognition = null
if (speechAvailable) {
  recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = false      // single utterance per tap (TRD CONV-01)
  recognition.interimResults = true   // show interim text while speaking

  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1]
    interimText.value = lastResult[0].transcript
    if (lastResult.isFinal) {
      sendUserMessage(lastResult[0].transcript)
    }
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    isMicActive.value = false
  }
}

function toggleMic() {
  if (!speechAvailable) return
  if (isMicActive.value) {
    recognition.stop()
    isMicActive.value = false
  } else {
    recognition.start()
    isMicActive.value = true
  }
}
```

### Anti-Patterns to Avoid

- **Instantiating `GoogleGenAI` at module level with `GEMINI_API_KEY.value()`:** `defineSecret` values are only accessible inside function handler invocations, not during module initialization. Calling `.value()` at module load throws. Instantiate inside the handler or lazily on first call.
- **Using `arrayUnion` from `firebase/firestore` inside Cloud Functions:** Inside functions, use `admin.firestore.FieldValue.arrayUnion()`. The web SDK `arrayUnion` is for client-side use only.
- **Relying on Gemini's text output being valid JSON without `responseMimeType`:** The model can hallucinate, add markdown fences, or include prose before JSON. Setting `responseMimeType: 'application/json'` enforces JSON mode at the API level — never skip this for structured responses.
- **Not configuring the Functions emulator in `firebase.json`:** Without `"functions": { "port": 5001 }` in the emulators block, `firebase emulators:start` will not run the Functions emulator. The frontend's `connectFunctionsEmulator` call will then fail silently or connect to nothing.
- **Calling `recognition.start()` while already active:** If `isFinal` hasn't fired and the user taps again, `start()` throws `InvalidStateError`. Guard with `isMicActive` state check.
- **Not catching `httpsCallable` errors in the frontend:** Firebase Functions errors come as `FirebaseError` with `code` in the format `"functions/unauthenticated"`. Catch and display appropriately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON output from Gemini | Manual text extraction, regex, try-catch on JSON.parse with fallback | `config: { responseMimeType: 'application/json' }` | API-level enforcement eliminates parse errors from malformed model output |
| Auth token validation in functions | Manual JWT decode/verify | `request.auth` in `onCall` handler | Firebase SDK validates token automatically; manual validation is error-prone and bypasses Firebase's revocation checks |
| Subscription check on client only | Frontend `if (freeSessionUsed && ...)` as sole gate | Server-side `HttpsError('permission-denied')` in `startConversation` | Client-side checks are bypassable; server-side is authoritative |
| Transcript array management | Read doc, push entry, write back | `admin.firestore.FieldValue.arrayUnion(...)` in `updateDoc` | Atomic — no race condition if multiple messages arrive quickly |
| Speech availability detection | User agent parsing | `!!( window.SpeechRecognition \|\| window.webkitSpeechRecognition)` | Feature detection is more reliable than UA sniffing; handles future engine changes |

**Key insight:** The two hardest problems in this phase are (1) reliable JSON from Gemini and (2) auth propagation from client to function. Both have framework-level solutions that must be used — hand-rolling either creates subtle bugs that only manifest under edge cases.

---

## Common Pitfalls

### Pitfall 1: `GEMINI_API_KEY.value()` Called at Module Init Time

**What goes wrong:** `const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })` at the top level of `functions/index.js` throws `Error: Secret GEMINI_API_KEY is not available` because secret values are injected into the process environment only when the function handler is invoked, not at module load.

**Why it happens:** `defineSecret` returns a `SecretParam` reference. The `.value()` call reads `process.env.GEMINI_API_KEY` which is only set at function invocation time.

**How to avoid:** Declare `let ai = null` at module level. Inside the handler, lazily initialize: `if (!ai) ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })`. Or instantiate inside the handler function body directly.

**Warning signs:** Function deployment succeeds, but invocation immediately throws `Secret ... is not available`.

### Pitfall 2: Functions Emulator Not Started / Not Connected

**What goes wrong:** Frontend calls during `quasar dev` hit production Cloud Functions (not emulator), consuming real API quota and failing if the function hasn't been deployed yet.

**Why it happens:** Two separate gaps: (A) `firebase.json` emulators block missing `"functions": { "port": 5001 }` means the emulator doesn't start; (B) `boot/firebase.js` missing `connectFunctionsEmulator(functions, '127.0.0.1', 5001)` in the `if (process.env.DEV)` block means the client doesn't route to the emulator even if it's running.

**How to avoid:** Fix both: add port to `firebase.json` AND add `connectFunctionsEmulator` call to `boot/firebase.js`. Both are required.

**Warning signs:** Function calls succeed in dev but show Gemini API usage in production console; or calls fail with CORS errors (production function not deployed yet).

### Pitfall 3: `useProfileStore` Missing `freeSessionUsed` and `subscriptionStatus`

**What goes wrong:** The CONV-05 paywall gate reads `profileStore.freeSessionUsed` and `profileStore.subscriptionStatus`. These fields exist in Firestore and are fetched by `fetchUserProfile`, but `useProfileStore.setProfile()` currently ignores them (not in the store's reactive state). The gate always reads `undefined`, which evaluates as falsy — paywall never triggers.

**Why it happens:** Phase 7 only added stat fields needed by the dashboard/progress pages. Subscription/paywall fields were not added.

**How to avoid:** Add `freeSessionUsed: ref(false)` and `subscriptionStatus: ref('none')` to `useProfileStore`, and map them in `setProfile()`. This is a 4-line change.

**Warning signs:** Paywall gate in SessionPage is never triggered for users who have used their free session.

### Pitfall 4: `arrayUnion` Source Confusion (Web SDK vs Admin SDK)

**What goes wrong:** Developer imports `arrayUnion` from `firebase/firestore` (web SDK) inside Cloud Functions. This works with the web SDK client but the Admin SDK uses a different API. Using the web SDK inside Cloud Functions creates a second Firestore client initialization, conflicts with admin auth, and may cause connection errors.

**Why it happens:** The web SDK and Admin SDK look similar but are separate packages.

**How to avoid:** Inside Cloud Functions, use only the Admin SDK. Transcript append: `admin.firestore.FieldValue.arrayUnion(entry1, entry2)` passed to `admin.firestore().doc(path).update({ transcript: ... })`.

**Warning signs:** "Could not reach Cloud Firestore backend" errors inside functions; functions work with emulator but fail in production.

### Pitfall 5: `recognition.start()` Called When Already Listening

**What goes wrong:** If the user taps the mic button while speech recognition is already active (e.g., double-tap), `recognition.start()` throws `DOMException: Failed to execute 'start' on 'SpeechRecognition': recognition has already started`.

**Why it happens:** `SpeechRecognition` is not idempotent — calling `start()` on an active instance is an error.

**How to avoid:** Guard every `recognition.start()` call with `if (!isMicActive.value)`. Set `isMicActive.value = true` immediately on start, `false` in `onend` event handler (fires after `stop()` or natural end).

**Warning signs:** Console `DOMException` on double-tap; mic state becomes stuck.

### Pitfall 6: `continuous: false` Requires Re-Start After Each Utterance

**What goes wrong:** With `continuous: false` (required by TRD CONV-01), `SpeechRecognition` stops after each utterance. If the developer expects it to stay active for the next message, it doesn't — the mic state deactivates after `onend` fires.

**Why it happens:** `continuous: false` means "stop after first complete utterance". `onend` fires after the final result, not just on explicit `stop()`.

**How to avoid:** In `onend`, set `isMicActive.value = false`. User must tap mic again for each message. This is the intended UX (TRD: "mic button starts real voice recognition"). The footer already shows "TAP TO SPEAK" which implies per-tap activation.

**Warning signs:** Mic icon shows active but recognition isn't listening; no new results captured after first message.

### Pitfall 7: Gemini 1.5 Flash vs 2.0 Flash Model Name

**What goes wrong:** TRD specifies `gemini-1.5-flash`. The `@google/genai` v1 docs show examples with `gemini-2.0-flash`. Using the wrong model name causes `404 Model not found` errors.

**Why it happens:** New SDK documentation uses newer model names in examples.

**How to avoid:** Use `'gemini-1.5-flash'` exactly as specified in the TRD. Prior decision `[v1.1-Init]` locks this. The model ID is valid as of 2026-02-24.

**Warning signs:** `GoogleGenAIError: 404 models/gemini-X is not found`.

---

## Code Examples

Verified patterns from installed package type definitions and confirmed working via live `require()` test:

### `@google/genai` — CJS require and generateContent
```javascript
// Source: @google/genai v1.42.0 dist/genai.d.ts lines 4202-4212, 4957-4975
// Verified: require('@google/genai') works in functions/ directory (Node.js CJS resolution
//            picks dist/node/index.cjs via package exports)
const { GoogleGenAI } = require('@google/genai')

// Inside handler (after GEMINI_API_KEY.value() is available):
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })
const result = await ai.models.generateContent({
  model: 'gemini-1.5-flash',      // TRD model, locked decision
  contents: promptString,          // string or ContentListUnion
  config: {
    responseMimeType: 'application/json',  // enforces JSON output
    temperature: 0.7,
    maxOutputTokens: 1024
  }
})
const text = result.text           // getter on GenerateContentResponse
const parsed = JSON.parse(text)
```

### `onCall` v2 with auth check and `HttpsError`
```javascript
// Source: firebase-functions v7.0.5 lib/common/providers/https.d.ts lines 37-44, 69-98
// lib/v2/providers/https.d.ts line 211
const { onCall, HttpsError } = require('firebase-functions/https')

exports.startConversation = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }
  const uid = request.auth.uid   // request.auth.uid (AuthData.uid)
  const { userLevel, sessionNumber } = request.data

  // Subscription gate
  if (sessionNumber > 1) {
    const userSnap = await admin.firestore().doc(`users/${uid}`).get()
    if (!userSnap.exists || userSnap.data().subscriptionStatus !== 'active') {
      throw new HttpsError('permission-denied', 'Subscription required')
    }
  }
  // ... Gemini call, Firestore write, return
})
```

### Firestore transcript append (Admin SDK)
```javascript
// Source: firebase-admin v13 FieldValue.arrayUnion
const FieldValue = admin.firestore.FieldValue
const now = Date.now()

await admin.firestore().doc(`sessions/${sessionId}`).update({
  transcript: FieldValue.arrayUnion(
    { speaker: 'user', text: userMessage, timestamp: now },
    { speaker: 'ai',   text: parsed.response, timestamp: now + 1 }
  )
})
```

### Client-side functions init in `boot/firebase.js`
```javascript
// Source: @firebase/functions dist/functions-public.d.ts lines 19, 126, 143
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const functions = getFunctions(app, 'africa-south1')  // region MUST match setGlobalOptions

if (process.env.DEV) {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export { app, auth, db, functions }
```

### Client-side `httpsCallable` invocation
```javascript
// Source: @firebase/functions dist/functions-public.d.ts line 143
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'

const startConversationFn = httpsCallable(functions, 'startConversation')
const sendMessageFn = httpsCallable(functions, 'sendMessage')

// In store action:
try {
  const result = await startConversationFn({ userLevel, sessionNumber })
  // result.data = { sessionId, topic, initialMessage }
} catch (err) {
  // err.code = 'functions/unauthenticated' | 'functions/permission-denied' etc.
  if (err.code === 'functions/permission-denied') {
    // trigger paywall
  }
}
```

### Web Speech API — full setup
```javascript
// Source: MDN Web Speech API docs; caniuse.com (Chrome/Edge support confirmed 2025)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const speechAvailable = !!SpeechRecognition

// In onMounted:
if (speechAvailable) {
  recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = false
  recognition.interimResults = true

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1]
    interimText.value = result[0].transcript
    if (result.isFinal) {
      isMicActive.value = false
      sendUserMessage(result[0].transcript)
    }
  }
  recognition.onend = () => { isMicActive.value = false }
  recognition.onerror = (e) => { isMicActive.value = false; console.error(e.error) }
}
```

### `useProfileStore` — add missing paywall fields
```javascript
// src/stores/profile.js — add these two refs and map in setProfile()
const freeSessionUsed    = ref(false)
const subscriptionStatus = ref('none')

function setProfile(data) {
  // ... existing fields ...
  freeSessionUsed.value    = data.freeSessionUsed    ?? false
  subscriptionStatus.value = data.subscriptionStatus ?? 'none'
}

// Add to return object:
return { ..., freeSessionUsed, subscriptionStatus, setProfile, reset }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` | `@google/genai` | Nov 2025 (GA) | Prior decision locked; already installed; API surface changed — use `ai.models.generateContent()` not `model.generateContent()` |
| `functions.config().gemini.apikey` | `defineSecret('GEMINI_API_KEY').value()` | Functions v2 | Already scaffolded correctly in `functions/index.js` |
| `context.auth.uid` (v1 callable) | `request.auth.uid` (v2 callable) | Functions v2 | `onCall` handler takes `(request)` not `(data, context)` |
| `JSON.parse(text)` on raw Gemini output | `config: { responseMimeType: 'application/json' }` + `JSON.parse(result.text)` | `@google/genai` v1.9.0+ | Enforced at API level; text response is guaranteed JSON string |
| Node 18 for Cloud Functions | Node 24 | Oct 2025 (Node 18 decommissioned) | Already set in `functions/package.json`; no action needed |

**Deprecated/outdated:**
- `@google/generative-ai`: Deprecated; replaced by `@google/genai`. Already removed from `functions/package.json`.
- `functions.config()`: Deprecated in v2; replaced by `defineSecret`. Already avoided in `functions/index.js`.
- `context.auth` in `onCall` handler argument: v1 callable signature `(data, context)`. v2 uses `(request)` with `request.auth` and `request.data`. Functions is v2.

---

## Open Questions

1. **`startConversation` creates the Firestore session doc — `useSessionStore.startSession()` also creates it**
   - What we know: Phase 7 wired `useSessionStore.startSession()` to call `addDoc(collection(db, 'sessions'), {...})` on the client side. FUNC-01 also creates a `sessions/{sessionId}` doc inside the function.
   - What's unclear: Should both writes happen (client creates a minimal doc first, function creates the full doc), or should `startConversation` be the sole writer?
   - Recommendation: Replace the client-side `addDoc` in `useSessionStore.startSession()` with a call to `startConversationFn()`. The function becomes the session document creator. The client receives back the `sessionId` and stores it. This eliminates the duplicate write and the race condition where the client might not yet have the sessionId when the first message is sent.

2. **`firebase.json` has a `backend` functions codebase — only `functions` codebase is relevant**
   - What we know: `firebase.json` has two function codebases: `default` (source: `functions/`) and `backend` (source: `backend/`). Only `functions/` has `index.js` with the scaffolded functions.
   - What's unclear: The `backend/` codebase appears unused — no `index.js` exists there. It may be a leftover.
   - Recommendation: Deploy only the `functions` codebase. The `backend` codebase can be ignored for this phase. No action needed unless it causes emulator issues.

3. **Emulator `functions` port not in `firebase.json` — does `firebase emulators:start` auto-start functions without port config?**
   - What we know: The `emulators` block in `firebase.json` only specifies `auth` (9099), `firestore` (8080), and `ui` (4000). No `functions` entry.
   - What's unclear: Whether omitting `"functions"` from the emulators block prevents the functions emulator from starting, or if it auto-starts on port 5001.
   - Recommendation: Explicitly add `"functions": { "port": 5001 }` to `firebase.json`. This removes ambiguity and ensures `connectFunctionsEmulator(functions, '127.0.0.1', 5001)` has a matching target.

---

## Sources

### Primary (HIGH confidence)
- `functions/node_modules/@google/genai/dist/genai.d.ts` — TypeScript types for installed v1.42.0; confirmed `GoogleGenAI` class, `ai.models.generateContent()`, `GenerateContentParameters` with `responseMimeType`, `result.text` getter
- `functions/node_modules/@google/genai/package.json` — Confirmed `"type": "module"` with `exports.node.require: dist/node/index.cjs` CJS build
- Live `require('@google/genai')` test from `functions/` directory — Confirmed `GoogleGenAI` accessible via CJS `require()`
- `functions/node_modules/firebase-functions/lib/v2/providers/https.d.ts` lines 105-217 — `onCall` v2 signature, `CallableOptions`, `HttpsError`
- `functions/node_modules/firebase-functions/lib/common/providers/https.d.ts` lines 37-98 — `AuthData.uid`, `CallableRequest.auth`, `CallableRequest.data`
- `node_modules/@firebase/functions/dist/functions-public.d.ts` lines 19, 126, 143 — `connectFunctionsEmulator`, `getFunctions`, `httpsCallable` signatures
- `src/services/userProfile.js` (codebase) — Confirmed `freeSessionUsed` and `subscriptionStatus` written to Firestore on first sign-in
- `src/stores/profile.js` (codebase) — Confirmed these fields absent from store reactive state
- `TRD.md` — Full prompt templates for topic-assignment and conversation; Firestore session schema; function I/O contracts; fallback strategy
- `functions/index.js` (codebase) — Confirmed scaffolded `onCall` stubs, `GEMINI_API_KEY` secret declaration, admin init

### Secondary (MEDIUM confidence)
- MDN Web Speech API docs + caniuse.com — Chrome/Edge support confirmed, Firefox unsupported, Safari partial; `webkitSpeechRecognition` prefix needed; `continuous: false`, `interimResults: true` semantics
- Firebase official docs `firebase.google.com/docs/emulator-suite/connect_functions` — `connectFunctionsEmulator(functions, '127.0.0.1', 5001)` pattern
- WebSearch results for Web Speech API 2025 — Chrome 139, Edge 139 confirmed support; Safari partial with permission modal

### Tertiary (LOW confidence)
- WebSearch result suggesting `@google/genai` may have CJS issues — **contradicted by HIGH confidence test above**; `dist/node/index.cjs` exists and `require()` works confirmed

---

## Metadata

**Confidence breakdown:**
- `@google/genai` CJS usage: HIGH — verified via live `require()` test in functions directory
- `onCall` v2 auth pattern: HIGH — verified in installed firebase-functions type definitions
- Web Speech API browser support: HIGH (Chrome/Edge) / MEDIUM (Safari) — multiple sources confirm
- `responseMimeType: 'application/json'` availability: HIGH — confirmed in `dist/genai.d.ts` `GenerateContentConfig`
- Functions emulator port gap: HIGH — confirmed by reading `firebase.json`
- Missing profile store fields: HIGH — confirmed by reading `profile.js` and `userProfile.js`
- Transcript `arrayUnion` pattern: HIGH — standard Admin SDK pattern; confirmed in Admin SDK types

**Research date:** 2026-02-24
**Valid until:** 2026-05-24 (stable Firebase + Gemini APIs; check if `@google/genai` major version bumps)
