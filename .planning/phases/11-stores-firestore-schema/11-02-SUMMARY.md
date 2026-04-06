---
phase: 11-stores-firestore-schema
plan: 02
subsystem: database
tags: [firestore, firebase-admin, seed, scenario-library]

requires:
  - phase: 11-stores-firestore-schema plan 01
    provides: placement.js and learning.js stores, profile store v1.2 extension

provides:
  - Idempotent seed script populating scenarioLibrary Firestore collection with 40 scenario templates

affects: [16-session-types, any phase reading scenarioLibrary]

tech-stack:
  added: []
  patterns:
    - Admin SDK CJS seed script with snap.exists idempotency check
    - --dry-run flag for safe local testing before live write

key-files:
  created:
    - functions/scripts/seed-scenario-library.js
  modified: []

key-decisions:
  - "Sequential writes with existence check (not batch writes) — enables per-doc skip logging and clean idempotency"
  - "scenarioLibrary/{levelId}/scenarios/{scenarioId} path — level as top-level doc, scenarios as subcollection"
  - "id stripped from docData before set() — document ID in path, not a redundant field in the document body"

patterns-established:
  - "Pattern: Admin SDK seed script — require firebase-admin, idempotent init, snap.exists before ref.set()"

requirements-completed:
  - INFRA-v12-03

duration: ~5min
completed: 2026-04-07
---

# Phase 11-02: scenarioLibrary Seed Script Summary

**40-scenario idempotent Admin SDK seed script covering all 10 categories × 4 session types for scenarioLibrary Firestore collection**

## Performance

- **Duration:** ~5 min
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `functions/scripts/seed-scenario-library.js` — CJS, runnable via `node functions/scripts/seed-scenario-library.js`
- 40 scenario templates across Engineering, Health, Business, Technology, Student, Travel, Gaming, Cooking, Sports, Music × freeTalk, scenario, storyBuilder, debate
- Idempotent: `snap.exists` check skips existing docs; `--dry-run` flag for safe preview

## Task Commits

1. **Task 1: Create idempotent scenarioLibrary seed script** - `835697d` (feat)

## Files Created/Modified
- `functions/scripts/seed-scenario-library.js` — standalone Admin SDK seed script, 40 scenario templates, dry-run support

## Decisions Made
- Sequential writes (not batch) to enable per-document skip logging — idempotency is the primary concern over write speed for a one-shot script
- `id` field stripped before `ref.set()` — doc ID is the scenario ID in the path, no duplicate field in document body

## Deviations from Plan
None — plan executed exactly as written. Script was already partially created in a prior session; committed and verified.

## Issues Encountered
None — all acceptance criteria passed on first verification run.

## User Setup Required
Before running the seed script, set credentials:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# OR rely on firebase login Application Default Credentials
node functions/scripts/seed-scenario-library.js --dry-run   # preview
node functions/scripts/seed-scenario-library.js              # live write
```

## Next Phase Readiness
- Phase 11 complete — all plans (11-01, 11-02) have SUMMARYs
- scenarioLibrary collection ready to be read by Phase 16 (Session Types)
- No blockers

---
*Phase: 11-stores-firestore-schema*
*Completed: 2026-04-07*
