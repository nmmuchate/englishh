---
phase: 17-progression-mistake-tracking
plan: "02"
subsystem: ui
tags: [level-up, progression, feedback, pinia, vue, session-store]

requires:
  - phase: 17-01
    provides: endSession Cloud Function now returns levelUps array and persists mistakePatterns

provides:
  - levelUps reactive ref in useSessionStore (reset on startSession, set from CF response)
  - useLearningStore refresh after endSession (reads updated user doc from Firestore)
  - Level-up banner UI on FeedbackPage.vue (above hero card, v-if guarded, styled per 17-UI-SPEC)

affects: [Phase 19 Dashboard redesign (banner pattern), Phase 18 Free Tier Funnel (FeedbackPage modifications)]

tech-stack:
  added: []
  patterns:
    - dynamic import of stores/learning inside endSession to avoid circular dependency
    - auth.currentUser?.uid used to get UID inside store action (profile store does not expose uid)
    - v-if banner render (not v-show) for zero DOM cost when levelUps is empty

key-files:
  modified:
    - src/stores/session.js
    - src/pages/FeedbackPage.vue

key-decisions:
  - "auth.currentUser?.uid used inside endSession() instead of profileStore.uid — profile store does not expose uid field; auth is already imported from boot/firebase"
  - "Dynamic import of stores/learning inside endSession try-catch — avoids circular dependency at module init (same pattern as startSession)"
  - "Learning store refresh is wrapped in inner try-catch (non-fatal) so a Firestore read failure does not break the session end flow"
  - "v-if on level-up banner container (not v-show) — zero DOM cost when levelUps is empty, per plan requirement"
  - "capitalize() is a standalone helper function (not a computed) — single call per render, no memoization overhead needed for small array"

requirements-completed: [PROG-v12-02, PROG-v12-03]

duration: ~12min
completed: 2026-04-16
---

# Phase 17 Plan 02: Level-Up Banner UI + Learning Store Refresh Summary

**Level-up banner wired into FeedbackPage.vue from useSessionStore.levelUps, with learning store Firestore refresh after each session for mistake recycling.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-16T00:00:00Z
- **Completed:** 2026-04-16T00:12:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `useSessionStore` exposes a new `levelUps = ref([])` reactive ref — reset in `startSession()`, populated from the `endSession` Cloud Function response
- `endSession()` now refreshes `useLearningStore` by reading the updated `users/{uid}` Firestore doc after the CF resolves, ensuring `mistakePatterns` is current before the next `generateSessionPlan` call
- `FeedbackPage.vue` renders one green level-up banner per entry in `session.levelUps`, positioned inside the feedback-scroll div above the hero card, styled exactly per 17-UI-SPEC (3px left stripe, primary green tint, `sym_o_trending_up` icon, `text-subtitle2 text-weight-bold`, light-mode override, 0.3s fade-in animation)

## Task Commits

1. **Task 1: Extend useSessionStore with levelUps ref and learning-store refresh** - `72ad9c8` (feat)
2. **Task 2: Add level-up banner section to FeedbackPage.vue above hero card** - `7ebf2bb` (feat)

## Files Created/Modified

- `src/stores/session.js` (lines 1-9 imports, 26 levelUps ref, 40 reset, 133-170 endSession rewrite, 175 return) — adds levelUps ref, learning store refresh
- `src/pages/FeedbackPage.vue` (lines 27-45 banner template, 271-278 capitalize helper, 415-430 CSS, 635-641 light-mode override) — level-up banner UI

## Decisions Made

- **auth.currentUser?.uid not profileStore.uid** — the profile store does not expose a `uid` property. Used `auth.currentUser?.uid` (auth already imported from `boot/firebase` in this file) to retrieve the Firebase Auth UID for the Firestore read.
- **Non-fatal inner try-catch for learning store refresh** — if the Firestore read fails after endSession, the user still gets their score and levelUps; the learning store refresh failure is logged but does not throw.
- **Dynamic import of `stores/learning`** — same pattern established in `startSession()` to avoid circular dependency at module initialization time.
- **v-if (not v-show) on banner container** — zero DOM cost when `levelUps` is empty, as required by the plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] profileStore.uid does not exist — used auth.currentUser?.uid instead**
- **Found during:** Task 1 (useSessionStore extension)
- **Issue:** Plan specified `profileStore.uid` to get the Firebase Auth UID for the Firestore re-read, but `useProfileStore` does not expose a `uid` property in its return statement
- **Fix:** Import `auth` from `boot/firebase` (already imported for `db`) and use `auth.currentUser?.uid` — the Firebase Auth `currentUser` object is always available during an active authenticated session
- **Files modified:** src/stores/session.js
- **Verification:** grep confirms `auth.currentUser?.uid` present; build passes
- **Committed in:** 72ad9c8 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — incorrect API assumption in plan)
**Impact on plan:** Minimal; the fix achieves the exact same goal (reading UID for the Firestore re-read). No scope creep.

## Issues Encountered

None beyond the profileStore.uid deviation documented above.

## User Setup Required

None — no external service configuration required. Cloud Function deployment (endSession) was handled in Plan 17-01.

## Next Phase Readiness

- Phase 17 is complete: backend (17-01) + UI (17-02) both delivered
- `useLearningStore.mistakePatterns` is refreshed after each session, so Phase 18 (Free Tier Funnel) and Phase 19 (Dashboard redesign) can read real mistake data
- FeedbackPage level-up banner pattern can be referenced by Phase 19 when extending the Progress page

## Self-Check

- [x] src/stores/session.js modified — levelUps ref, reset, endSession extension, export
- [x] src/pages/FeedbackPage.vue modified — banner template, capitalize helper, CSS, light-mode
- [x] Task 1 commit: 72ad9c8
- [x] Task 2 commit: 7ebf2bb
- [x] `npm run build` — Build succeeded
- [x] Banner before hero-card: level-up-stack at line 30, hero-card at line 46

## Self-Check: PASSED

---
*Phase: 17-progression-mistake-tracking*
*Completed: 2026-04-16*
