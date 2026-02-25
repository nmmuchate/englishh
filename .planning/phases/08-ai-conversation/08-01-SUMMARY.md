---
phase: 08-ai-conversation
plan: "01"
subsystem: api
tags: [firebase-functions, gemini, cloud-functions, firestore, pinia]

# Dependency graph
requires:
  - phase: 06-firebase-auth
    provides: "Firebase boot file with app/auth/db exports and emulator pattern"
  - phase: 07-firestore-data
    provides: "Profile store pattern, Firestore session document structure"
provides:
  - "startConversation Cloud Function: subscription-gated, Gemini topic generation, Firestore session doc creation"
  - "sendMessage Cloud Function: Gemini conversation loop, Admin SDK arrayUnion transcript append"
  - "profile store freeSessionUsed and subscriptionStatus reactive refs"
  - "Firebase Functions initialized in boot file with africa-south1 region + emulator wiring"
affects:
  - 08-02-conversation-ui
  - 08-03-speech-paywall
  - 09-session-scoring
  - 10-payments

# Tech tracking
tech-stack:
  added: ["@google/genai (GoogleGenAI)", "firebase/functions (getFunctions, connectFunctionsEmulator)", "firebase-functions/https (onCall, HttpsError)"]
  patterns: ["GoogleGenAI instantiated inside handler body (not module level) to access secret value at invocation time", "Admin SDK FieldValue.arrayUnion for atomic transcript append", "onCall subscription gate: session 2+ reads users/{uid} subscriptionStatus"]

key-files:
  created: []
  modified:
    - "src/stores/profile.js"
    - "src/boot/firebase.js"
    - "firebase.json"
    - "functions/index.js"

key-decisions:
  - "GoogleGenAI instantiated inside handler body — GEMINI_API_KEY.value() only resolves during function invocation, not at module init"
  - "functions region africa-south1 matches Firestore database location — reduces cross-region latency"
  - "Admin SDK FieldValue.arrayUnion used for transcript (not web SDK) — functions run server-side with Admin credentials"
  - "Subscription gate checks users/{uid}.subscriptionStatus !== 'active' via Admin SDK get() — single consistent rule"
  - "JSON parse fallback in sendMessage for Gemini response resilience — responseMimeType json should prevent failure but fallback prevents crash"

patterns-established:
  - "onCall pattern: always check request.auth first, then business logic gate, then Gemini call"
  - "Secrets declared at module level via defineSecret(), accessed only inside handler via .value()"
  - "Functions emulator: connectFunctionsEmulator(functions, '127.0.0.1', 5001) in DEV block, after connectFirestoreEmulator"

requirements-completed: [FUNC-01, FUNC-02, CONV-03, CONV-04]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 8 Plan 01: AI Conversation Foundation Summary

**startConversation + sendMessage Cloud Functions with Gemini 1.5 Flash, subscription gate, and Firestore session docs; profile store paywall fields wired and Functions emulator connected**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-25T10:22:30Z
- **Completed:** 2026-02-25T10:24:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Implemented `startConversation` Cloud Function: validates auth, gates session 2+ on active subscription, generates topic via Gemini, creates Firestore session document
- Implemented `sendMessage` Cloud Function: validates session, builds 10-message conversation history prompt, calls Gemini, appends transcript atomically via Admin SDK `FieldValue.arrayUnion`
- Added `freeSessionUsed` and `subscriptionStatus` reactive refs to profile store with setProfile/reset/return wiring
- Wired Firebase Functions into boot file: `getFunctions(app, 'africa-south1')` + `connectFunctionsEmulator` in DEV mode, exported as `functions`
- Added functions emulator port 5001 to firebase.json emulators block

## Task Commits

Each task was committed atomically:

1. **Task 1: Profile store paywall fields + Firebase Functions boot init** - `ad26c59` (feat)
2. **Task 2: Implement startConversation and sendMessage Cloud Functions** - `2b9ac91` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/stores/profile.js` - Added freeSessionUsed and subscriptionStatus paywall fields
- `src/boot/firebase.js` - Added getFunctions init, connectFunctionsEmulator, exported functions
- `firebase.json` - Added functions emulator port 5001 to emulators block
- `functions/index.js` - Implemented startConversation and sendMessage exports

## Decisions Made
- GoogleGenAI instantiated inside handler body: `GEMINI_API_KEY.value()` only resolves during invocation, not at module init time
- Functions deployed to `africa-south1` to co-locate with Firestore database, minimizing cross-region latency
- Admin SDK `FieldValue.arrayUnion` used for transcript (not web SDK) — functions run server-side with Admin credentials
- JSON parse fallback in `sendMessage` guards against unexpected Gemini response format without crashing

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan. GEMINI_API_KEY must be set via `firebase functions:secrets:set GEMINI_API_KEY` before emulator or deployment use (pre-existing requirement from Phase 6).

## Next Phase Readiness
- `startConversation` and `sendMessage` functions ready for frontend consumption via `httpsCallable`
- `functions` exported from boot/firebase.js — ready for use in Vue components with `httpsCallable(functions, 'functionName')`
- Profile store paywall fields ready for paywall gate logic in Phase 8 plan 3
- Next: 08-02 wires conversation UI (SessionPage) to the Cloud Functions

## Self-Check: PASSED

- FOUND: src/stores/profile.js
- FOUND: src/boot/firebase.js
- FOUND: firebase.json
- FOUND: functions/index.js
- FOUND: .planning/phases/08-ai-conversation/08-01-SUMMARY.md
- FOUND commit: ad26c59 (Task 1)
- FOUND commit: 2b9ac91 (Task 2)

---
*Phase: 08-ai-conversation*
*Completed: 2026-02-25*
