---
phase: 14-listening-test
plan: 02
subsystem: ui
tags: [vue3, quasar, placement-test, listening, adaptive-difficulty, tts, cloud-functions]

# Dependency graph
requires:
  - phase: 14-listening-test
    plan: 01
    provides: ListeningPlayer.vue TTS component and generateTestQuestions type='listening'

provides:
  - ListeningStage.vue: 3-task listening comprehension flow with adaptive CEFR difficulty and audio gate
  - OnboardingPage.vue: ListeningStage wired into placement test shell replacing Phase 14 stub

affects:
  - OnboardingPage.vue placement flow (vocabulary -> listening -> grammar now fully wired)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - hasPlayedCurrent gate: answer options hidden/disabled until @played fires from ListeningPlayer
    - Adaptive difficulty mirrored from VocabularyStage (2-consecutive-correct up, 2-consecutive-wrong down)
    - handleListeningComplete async with isSaving/saveError pattern (matches handleVocabComplete)
    - handleListeningSkip sync with B1 default skipped result (matches handleVocabSkip)

key-files:
  created:
    - src/pages/ListeningStage.vue
  modified:
    - src/pages/OnboardingPage.vue

key-decisions:
  - "hasPlayedCurrent ref resets to false in handleNext — each new task requires its own audio playback before answering"
  - "Question card uses v-if='hasPlayedCurrent' (not v-show) — options are fully removed from DOM until audio fires"
  - "ListeningStage emit contract matches VocabularyStage/GrammarStage exactly: { score, level, answers }"
  - "handleListeningComplete/handleListeningSkip follow identical pattern to vocab/grammar handlers in OnboardingPage"

requirements-completed: [PLACE-03]

# Metrics
duration: 2min
completed: 2026-04-09
---

# Phase 14 Plan 02: ListeningStage Component and OnboardingPage Wiring Summary

**ListeningStage.vue built with hasPlayedCurrent audio gate, adaptive CEFR difficulty, and ListeningPlayer integration; wired into OnboardingPage.vue replacing the Phase 14 stub**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T11:21:28Z
- **Completed:** 2026-04-09T11:23:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created ListeningStage.vue with 3-task sequential flow consuming generateTestQuestions type='listening'
- Implemented hasPlayedCurrent audio gate — answer options are hidden from DOM until ListeningPlayer fires @played
- Adaptive difficulty engine (2-consecutive correct/wrong threshold) mirrored exactly from VocabularyStage.vue
- Emit contract { score, level, answers } matches VocabularyStage and GrammarStage for consistent placement test aggregation
- Wired ListeningStage into OnboardingPage.vue: replaced stub (q-icon hearing / "Coming in Phase 14") with real component
- Added handleListeningComplete (async with isSaving/saveError) and handleListeningSkip (sync with B1 default)
- Placement test flow is now vocabulary -> listening -> grammar (all 3 middle stages wired)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ListeningStage.vue with 3-task flow and adaptive difficulty** - `fbf4c63` (feat)
2. **Task 2: Wire ListeningStage into OnboardingPage.vue** - `d036c86` (feat)

## Files Created/Modified

- `src/pages/ListeningStage.vue` - New SFC: 3-task listening comprehension with audio gate, adaptive difficulty, ListeningPlayer integration
- `src/pages/OnboardingPage.vue` - Added ListeningStage import and handlers; replaced listening stub

## Decisions Made

- hasPlayedCurrent resets to false in handleNext so each new task requires its own audio playback before answers are shown
- Question card uses v-if (not v-show) on hasPlayedCurrent — removes options from DOM entirely, not just hides them
- emit('complete') format `{ score, level, answers }` mirrors VocabularyStage and GrammarStage for uniform placement test data
- handleListeningComplete/handleListeningSkip follow the exact same async/sync pattern as vocab/grammar handlers — no new patterns introduced

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - ListeningStage fully wired to generateTestQuestions Cloud Function; no placeholder data.

## Issues Encountered

None.

## Next Phase Readiness

- Listening stage (Stage 3 of 5) is now complete and wired in the placement test flow
- Stages 1 (Profile), 2 (Vocabulary), 3 (Listening), 4 (Grammar) are all wired — only Stage 5 (Speaking/Writing) stub remains
- Phase 15 can implement SpeakingStage and wire it into OnboardingPage.vue following the identical pattern

---
*Phase: 14-listening-test*
*Completed: 2026-04-09*
