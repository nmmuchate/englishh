---
phase: 14-listening-test
plan: 01
subsystem: ui
tags: [vue3, quasar, speechSynthesis, tts, cloud-functions, openai, gpt-4o-mini, placement-test]

# Dependency graph
requires:
  - phase: 13-vocabulary-grammar-test
    provides: generateTestQuestions Cloud Function with vocabulary/grammar branches

provides:
  - generateTestQuestions Cloud Function extended to support type='listening' returning 3 structured tasks
  - ListeningPlayer.vue TTS playback component encapsulating speechSynthesis state

affects:
  - 14-02 (ListeningStage.vue consumes both artifacts from this plan)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - speechSynthesis play-on-click (not on mount) for iOS Safari compatibility
    - onUnmounted speechSynthesis.cancel() for audio bleed prevention
    - watch(props.text) to reset playCount when task changes
    - cancel() + speak() pattern — always cancel before speaking

key-files:
  created:
    - src/pages/ListeningPlayer.vue
  modified:
    - functions/index.js

key-decisions:
  - "ListeningPlayer play() always calls cancel() before speak() to clear any in-progress utterance"
  - "Grammar branch changed from bare else to else if (type === 'grammar') to allow explicit listening else branch"
  - "Dialogue prompts written as narrative (not speaker labels) to avoid TTS reading colons — enforced in Cloud Function system prompt"
  - "Prompt length constrained to 140 chars in system instruction to prevent Android Chrome truncation"

patterns-established:
  - "Pattern: ListeningPlayer encapsulates all speechSynthesis state — parent never accesses API directly"
  - "Pattern: ttsAvailable checked in onMounted via 'speechSynthesis' in window — QBanner fallback shown if false"

requirements-completed: [PLACE-03]

# Metrics
duration: 8min
completed: 2026-04-09
---

# Phase 14 Plan 01: Listening Test Foundation Summary

**generateTestQuestions Cloud Function extended for type='listening' (3 TTS tasks with 140-char prompt constraint) and ListeningPlayer.vue component built with play-on-click, 1 replay, unmount cancel, and ttsAvailable fallback**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-09T00:00:00Z
- **Completed:** 2026-04-09T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended generateTestQuestions Cloud Function with a listening branch generating 3 structured tasks (sentence, dialogue, monologue) via GPT-4o-mini
- Created ListeningPlayer.vue with play-on-click TTS (iOS-safe), 1 replay, graceful fallback, and unmount cleanup
- Updated type guard to include 'listening' and changed grammar branch to explicit `else if` to support the new branch

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend generateTestQuestions for type='listening'** - `60af3ea` (feat)
2. **Task 2: Create ListeningPlayer.vue TTS component** - `31e0f7c` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `functions/index.js` - Extended generateTestQuestions with listening branch; updated type guard and grammar branch
- `src/pages/ListeningPlayer.vue` - Self-contained TTS playback component with play/replay, fallback, and cleanup

## Decisions Made
- Grammar branch changed from bare `else` to `else if (type === 'grammar')` to support clean separation before the listening `else` block
- Dialogue prompt uses narrative framing enforced in system instruction — avoids TTS reading speaker name + colon artifacts
- Prompt constrained to 140 chars in Cloud Function instruction — Android Chrome TTS truncation prevention
- play() triggers only on @click — never on mount — ensuring iOS Safari user-gesture requirement is met

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Cloud Function uses the existing OPENAI_API_KEY secret already deployed.

## Next Phase Readiness
- generateTestQuestions now handles all 3 stage types (vocabulary, grammar, listening)
- ListeningPlayer.vue is ready for consumption by ListeningStage.vue (Plan 14-02)
- Plan 14-02 can import ListeningPlayer and call generateTestQuestions({type:'listening'}) without further function changes

---
*Phase: 14-listening-test*
*Completed: 2026-04-09*
