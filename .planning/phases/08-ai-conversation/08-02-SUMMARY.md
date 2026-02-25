---
phase: 08-ai-conversation
plan: "02"
subsystem: ui
tags: [session-store, speech-api, cloud-functions, pinia, vue, paywall]

# Dependency graph
requires:
  - phase: 08-01
    provides: "startConversation + sendMessage Cloud Functions, functions boot export, profile store paywall fields"
  - phase: 07-firestore-data
    provides: "Profile store with currentLevel, totalSessionsCompleted, freeSessionUsed, subscriptionStatus"
provides:
  - "useSessionStore with httpsCallable wiring: startSession calls startConversationFn, sendMessage calls sendMessageFn"
  - "transcript state: reactive array of { speaker, text } messages"
  - "Web Speech API integration: SpeechRecognition with lang:en-US, continuous:false, interimResults:true"
  - "Text input fallback: QInput shown when speechAvailable is false or keyboard button tapped"
  - "Paywall gate in onMounted: opens PaywallDialog when freeSessionUsed and subscription not active"
  - "Live transcript v-for render in SessionPage replacing hardcoded chat bubbles"
affects:
  - 08-03-speech-paywall
  - 09-session-scoring

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "httpsCallable references created at module level outside store — functions instance available at module init time"
    - "Optimistic transcript append: user message added to transcript before Cloud Function responds"
    - "Web Speech API in onMounted (not defineAsyncComponent) — recognition object created lazily after speechAvailable check"
    - "nextTick scroll: scrollTop = scrollHeight called after AI response to keep latest message visible"
    - "PaywallDialog v-model pattern: showPaywallDialog ref toggled by startSession paywallRequired return value"

key-files:
  created: []
  modified:
    - "src/stores/session.js"
    - "src/pages/SessionPage.vue"

key-decisions:
  - "httpsCallable created at module level (not inside store action) — functions boot export is available at import time, unlike GEMINI_API_KEY which requires invocation"
  - "Paywall gate lives in session store startSession() — single authoritative check; SessionPage reads return value to open dialog"
  - "SpeechRecognition set up in onMounted (not at script setup level) — avoids SSR issues and ensures DOM/window is ready"
  - "showTextInput defaults to !speechAvailable — text input shown immediately on non-Chrome browsers with no user action required"

patterns-established:
  - "Cloud Function callable: httpsCallable(functions, 'name') at module level, called inside store action"
  - "Paywall gate pattern: store returns { paywallRequired } signal, component reacts by opening dialog"
  - "Transcript v-for pattern: session.transcript array of { speaker, text } rendered with conditional avatar/bubble classes"

requirements-completed: [CONV-01, CONV-02, CONV-05]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 8 Plan 02: Conversation UI Wired to Cloud Functions Summary

**useSessionStore rewritten with httpsCallable calls and transcript state; SessionPage wired with Web Speech API voice input, text fallback, paywall gate, and live v-for transcript replacing all hardcoded chat bubbles**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-25T10:28:40Z
- **Completed:** 2026-02-25T10:31:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Rewrote `useSessionStore`: replaced `addDoc` Firestore write with `startConversationFn` httpsCallable, added `topic`, `transcript`, `isSending` refs, added `sendMessage(userText)` action with optimistic transcript update, paywall gate returns `{ paywallRequired }` signal
- Added `sendMessageFn` httpsCallable to session store: sends sessionId, userMessage, last 10 messages of conversation history, userLevel, topic; appends AI response to transcript; increments mistakeCount
- Wired `SessionPage.vue` `onMounted` to handle `paywallRequired` return and open `PaywallDialog` instead of starting timer
- Implemented Web Speech API: `SpeechRecognition` with `lang:en-US`, `continuous:false`, `interimResults:true`; `onresult` shows interim text and sends final transcript via `sendUserMessage`
- Added text input fallback: `QInput` + send button shown when `speechAvailable` is false or when keyboard button is toggled; keyboard button icon swaps between `sym_o_keyboard` and `sym_o_mic`
- Replaced all hardcoded chat bubble HTML with `v-for` loop over `session.transcript` array; added interim text preview bubble and thinking indicator
- Session header title now shows `session.topic` (not hardcoded "Ordering at a Cafe")
- Transcript scrolls to bottom after each exchange via `nextTick(() => el.scrollTop = el.scrollHeight)`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend useSessionStore with transcript state and Cloud Function calls** - `5326061` (feat)
2. **Task 2: Rewrite SessionPage.vue with Web Speech API, text fallback, paywall gate, live transcript** - `c37136c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/stores/session.js` - Replaced addDoc with httpsCallable; added topic/transcript/isSending state; added sendMessage action
- `src/pages/SessionPage.vue` - Web Speech API setup; v-for transcript; text input fallback; paywall gate; topic binding

## Decisions Made

- httpsCallable references created at module level (outside store): `functions` boot export is available at import time, unlike `GEMINI_API_KEY` which requires Cloud Function invocation context
- Paywall gate lives in store `startSession()` — single authoritative check; `SessionPage` reads return value `{ paywallRequired }` to open dialog
- `SpeechRecognition` instantiated in `onMounted` — avoids SSR issues and ensures window is ready
- `showTextInput` defaults to `!speechAvailable` — text input shown immediately on non-Chrome browsers

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — requires Firebase Functions emulator running with `startConversation` and `sendMessage` deployed or emulated. See 08-01 for emulator setup.

## Next Phase Readiness

- Conversation loop is functional: voice/text → Cloud Function → AI response → transcript
- `session.transcript` populated for Phase 9 session scoring (FeedbackPage replacement)
- Paywall gate wired; Phase 8 plan 3 can implement full paywall subscription flow
- Next: 08-03 handles remaining speech + paywall edge cases (if any), or Phase 9 session scoring

## Self-Check: PASSED

- FOUND: src/stores/session.js
- FOUND: src/pages/SessionPage.vue
- FOUND: .planning/phases/08-ai-conversation/08-02-SUMMARY.md
- FOUND commit: 5326061 (Task 1)
- FOUND commit: c37136c (Task 2)

---
*Phase: 08-ai-conversation*
*Completed: 2026-02-25*
