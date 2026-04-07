---
phase: 12-quick-profile-onboarding-rewrite
plan: 02
subsystem: ui
tags: [vue3, quasar, composition-api, onboarding, placement-test, firestore]

# Dependency graph
requires:
  - phase: 12-01
    provides: QuickProfileStage.vue component with complete event and payload shape
  - phase: 11-stores-firestore-schema
    provides: placement store (setStageResult) and Firestore schema (placementTests collection)

provides:
  - OnboardingPage.vue: 5-stage placement test shell consuming QuickProfileStage and performing dual Firestore write

affects:
  - 13-15 (future placement test stage plans — vocabulary, listening, grammar, speaking stubs become real)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - STAGE_INDEX map for stage-to-index lookup (Pitfall 4 guard against string parsing)
    - Dual Firestore write: updateDoc (users doc) + setDoc merge (placementTests doc) in sequence
    - placementStore.setStageResult called after setDoc to avoid double-write on stages.profile
    - q-linear-progress stage bar above QStepper — stageProgress = stageIndex / 5

key-files:
  created: []
  modified:
    - src/pages/OnboardingPage.vue

key-decisions:
  - "STAGE_INDEX constant map (not computed from string) — prevents off-by-one Pitfall 4 from research"
  - "updateDoc for users/{uid}.profile (not setDoc) — preserves all other user fields; consistent with Phase 7 pattern [07-02]"
  - "setDoc with merge:true for placementTests/{uid} — idempotent; re-running onboarding wont duplicate startedAt if already set"
  - "placementStore.setStageResult called after setDoc, not before — store persists stages.profile separately; no double-write"
  - "handleProfileBack routes to landing — D-02 decision: back from sub-step 1 exits onboarding entirely"
  - "onboardingCompleted untouched in this file — D-07 honored; auth guard correctly keeps mid-test users on /onboarding"

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 12 Plan 02: OnboardingPage Rewrite Summary

**5-stage placement test shell replacing the old 3-step mock wizard: profile step wires QuickProfileStage with dual Firestore write (updateDoc users/{uid}.profile + setDoc merge placementTests/{uid}), stages 2-5 are placeholder stubs, stage progress bar shows Stage X of 5**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T10:42:42Z
- **Completed:** 2026-04-07T10:43:54Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Rewrote `src/pages/OnboardingPage.vue` from 444 lines to 175 lines (-269 lines)
- Removed old welcome/assessment/result steps, handleComplete, features array, goalOptions, selectedGoal
- Added 5-stage QStepper shell with hidden header (D-03, hidden-header pattern from [02-02])
- Stage 1 renders `<QuickProfileStage @complete="handleProfileComplete" @back="handleProfileBack" />`
- `handleProfileComplete` performs dual Firestore write in correct order (updateDoc users → setDoc merge placementTests → setStageResult)
- `q-linear-progress` above stepper shows Stage X of 5 driven by STAGE_INDEX map
- Automated verification: 30/30 checks pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite OnboardingPage.vue as 5-stage shell** - `655e630` (feat)

## Files Created/Modified

- `src/pages/OnboardingPage.vue` - Fully rewritten; 5-stage QStepper shell with QuickProfileStage (Stage 1) and stubs (Stages 2-5); dual Firestore write on profile complete; stage progress bar

## Decisions Made

- STAGE_INDEX constant map for index lookup — never compute stage index from string parsing (Pitfall 4 from research)
- updateDoc for users/{uid}.profile preserves all other user fields (Phase 7 [07-02] pattern)
- setDoc with merge:true for placementTests/{uid} makes initialization idempotent
- placementStore.setStageResult called after setDoc merge to avoid double-write on stages.profile
- handleProfileBack routes to landing — D-02: back from sub-step 1 exits onboarding
- onboardingCompleted NOT set (D-07): auth guard correctly keeps mid-test users on /onboarding

## Deviations from Plan

None — plan executed exactly as written. All Pitfall guards from research implemented as specified. All 30 automated checks pass.

## Known Stubs

Stages 2-5 are intentional placeholder stubs as per plan requirements:

| Stub | File | Content | Resolved By |
|------|------|---------|-------------|
| Vocabulary stub | src/pages/OnboardingPage.vue | "Coming in Phase 13" | Phase 13 plan |
| Grammar stub | src/pages/OnboardingPage.vue | "Coming in Phase 13" | Phase 13 plan |
| Listening stub | src/pages/OnboardingPage.vue | "Coming in Phase 14" | Phase 14 plan |
| Speaking stub | src/pages/OnboardingPage.vue | "Coming in Phase 15" | Phase 15 plan |

These stubs are intentional per plan must_haves ("Stages 2-5 render placeholder stub content") and do NOT prevent PLACE-01 / PLACE-11 from being achieved (Stage 1 Quick Profile is fully functional).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `OnboardingPage.vue` shell is ready; stages 2-5 await Phase 13-15 implementation
- PLACE-01 and PLACE-11 are testable by signing in as a new user, completing Quick Profile, and inspecting Firestore
- D-07 honored: onboardingCompleted remains false until placement test is complete (future phase)

---
*Phase: 12-quick-profile-onboarding-rewrite*
*Completed: 2026-04-07*
