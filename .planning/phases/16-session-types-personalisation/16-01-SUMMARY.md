---
phase: 16-session-types-personalisation
plan: 01
subsystem: api
tags: [cloud-functions, firebase, openai, gpt-4o-mini, pinia, vue-router, cefr, session-types]

# Dependency graph
requires:
  - phase: 15-speaking-writing-placement
    provides: calculatePlacement Cloud Function and placement store pattern
  - phase: 13-vocabulary-grammar-test
    provides: generateTestQuestions pattern (onCall + OpenAI + JSON fallback)
  - phase: 11-stores-firestore-schema
    provides: placement.js store with finalResult.overallLevel
provides:
  - generateSessionPlan Cloud Function (onCall, africa-south1, OPENAI_API_KEY secret)
  - session.js store with generateSessionPlanFn, sessionPlan ref, sessionType ref
  - /sessions route (SessionTypeSelectPage) under FullscreenLayout
  - /session/brief route (ScenarioBriefPage) under FullscreenLayout
  - DashboardPage FAB updated to route to /sessions
affects: [16-02-session-type-ui, SessionTypeSelectPage, ScenarioBriefPage, SessionPage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "generateSessionPlan 5-part system prompt: base persona + session type rules + user context + skill focus + mistake recycling"
    - "CEFR gate server-side: A1/A2 blocked from story-builder and debate via CEFR_VALUE numeric comparison"
    - "Session store dynamic import pattern for placement and learning stores inside startSession()"
    - "sessionPlan ref pattern: stores role, context, objectives from Cloud Function response for brief page"

key-files:
  created: []
  modified:
    - functions/index.js
    - src/stores/session.js
    - src/router/routes.js
    - src/pages/DashboardPage.vue

key-decisions:
  - "generateSessionPlanFn replaces startConversationFn in session store — startConversation export kept in index.js for backward compatibility"
  - "Dynamic import of useLearningStore and usePlacementStore inside startSession() — avoids circular dependency at module level"
  - "sessionPlan ref stores full plan data (topic, role, context, objectives, systemPrompt) for ScenarioBriefPage to consume"
  - "CEFR gate enforced server-side in generateSessionPlan — client-side lock state in SessionTypeSelectPage (Plan 02) is UX only"

patterns-established:
  - "5-part system prompt builder: base persona + session type rules + user context + skill focus + mistake recycling (PRD §5.3)"
  - "Session plan flow: SessionTypeSelectPage calls generateSessionPlanFn → stores plan in sessionPlan ref → ScenarioBriefPage reads from store"

requirements-completed: [SESSION-03, SESSION-04, SESSION-05, SESSION-06, SESSION-07, SESSION-08]

# Metrics
duration: 15min
completed: 2026-04-11
---

# Phase 16 Plan 01: Session Types Backend Summary

**generateSessionPlan Cloud Function with 5-part personalised system prompt builder (PRD §5.3), CEFR level gate blocking A1-A2 from story-builder/debate, and session store refactored to accept session type and pass profile/skill data**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-11T15:09:00Z
- **Completed:** 2026-04-11T15:24:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `generateSessionPlan` Cloud Function with auth check, CEFR gate, subscription gate, 5-part system prompt builder, GPT-4o-mini topic/brief generation, Firestore session doc creation, and structured return payload
- Refactored `session.js` store: replaced `startConversationFn` with `generateSessionPlanFn`, updated `startSession(type)` to accept a type parameter and pass profile, skill gaps, and session history, added `sessionPlan` and `sessionType` refs
- Added `/sessions` and `/session/brief` routes under FullscreenLayout in `routes.js`; updated DashboardPage FAB to navigate to `/sessions`

## Task Commits

1. **Task 1: Add generateSessionPlan Cloud Function** - `cad9875` (feat)
2. **Task 2: Refactor session store, add routes, update FAB navigation** - `3915173` (feat)

## Files Created/Modified

- `functions/index.js` - Added `exports.generateSessionPlan` with CEFR gate, subscription gate, 5-part prompt builder, GPT call, Firestore session creation
- `src/stores/session.js` - Replaced `startConversationFn` with `generateSessionPlanFn`; `startSession(type)` now passes profile/skillGaps/sessionHistory; added `sessionPlan` and `sessionType` refs
- `src/router/routes.js` - Added `{ path: 'sessions', name: 'sessions' }` and `{ path: 'session/brief', name: 'session-brief' }` routes
- `src/pages/DashboardPage.vue` - FAB `goToSession()` now pushes `{ name: 'sessions' }` instead of `{ name: 'session' }`

## Decisions Made

- `generateSessionPlanFn` replaces `startConversationFn` in the session store. `startConversation` export is preserved in `functions/index.js` for backward compatibility (per D-03).
- Dynamic import of `useLearningStore` and `usePlacementStore` inside `startSession()` to avoid circular dependency at module-init time (consistent with Phase 8 pattern for store-in-store access).
- `sessionPlan` ref stores full plan object (`topic`, `role`, `context`, `objectives`, `systemPrompt`) in session store so ScenarioBriefPage (Plan 02) can read it without a second API call.
- CEFR gate is enforced server-side in `generateSessionPlan` using `CEFR_VALUE` numeric comparison. Client-side lock state UI in `SessionTypeSelectPage` (Plan 02) is purely UX.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. `generateSessionPlan` uses the existing `OPENAI_API_KEY` Firebase secret set in Phase 13.

## Next Phase Readiness

- Backend (Cloud Function) and data layer (store + routes) are complete. Plan 02 can implement `SessionTypeSelectPage.vue` and `ScenarioBriefPage.vue` which consume:
  - `useSessionStore().startSession(type)` to trigger plan generation
  - `useSessionStore().sessionPlan` to read topic, role, context, objectives for the brief
  - `useSessionStore().sessionType` to know which type was selected
  - Route `sessions` and `session-brief` already defined

---
*Phase: 16-session-types-personalisation*
*Completed: 2026-04-11*
