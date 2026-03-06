---
phase: 10-payments-cron
plan: "03"
subsystem: infra
tags: [firebase, cloud-functions, firestore, cron, scheduler, leaderboard, data-hygiene]

# Dependency graph
requires:
  - phase: 10-01
    provides: createSubscription + handlePaymentWebhook onRequest exports already in functions/index.js
  - phase: 09-01
    provides: endSession writes leaderboard/{weekId}/users + getWeekId() helper that updateWeeklyLeaderboard reuses
provides:
  - deleteOldTranscripts onSchedule export — daily 02:00 UTC, removes transcript field from sessions older than 30 days
  - updateWeeklyLeaderboard onSchedule export — Monday 00:00 UTC, archives top 100 + creates next week placeholder
  - firestore.indexes.json fieldOverride for sessions.createdAt (ASCENDING + DESCENDING)
affects: [deployment, firestore-data, payments-cron]

# Tech tracking
tech-stack:
  added: [firebase-functions/v2/scheduler (onSchedule)]
  patterns:
    - onSchedule with region in options object (not setGlobalOptions — CJS bug workaround)
    - Firestore batch writes chunked at 500 docs to respect write-per-batch limit
    - FieldValue.delete() for field removal without touching other document fields
    - leaderboard_archive/{weekId}/users sub-collection pattern for historical leaderboard data

key-files:
  created: [firestore.indexes.json]
  modified: [functions/index.js]

key-decisions:
  - "onSchedule region passed directly in options object (not relying on setGlobalOptions) — known CJS bug where setGlobalOptions does not apply to onSchedule"
  - "deleteOldTranscripts uses batch.update with FieldValue.delete() — preserves scores, mistakes, newVocabulary; removes only transcript field"
  - "updateWeeklyLeaderboard computes nextWeekId inline (duplicating getWeekId logic with +7 days) — avoids date-at-invocation-time ambiguity"
  - "onSchedule try/catch re-throws error — Cloud Scheduler will retry on throw, which is desired for transient failures"
  - "firestore.indexes.json fieldOverride for sessions.createdAt required — range queries on non-indexed fields fail with FAILED_PRECONDITION"

patterns-established:
  - "Cron pattern: onSchedule({ schedule, timeZone, region }) with explicit region in options"
  - "Batch delete pattern: query all docs, slice into 500-doc chunks, batch.update with FieldValue.delete()"
  - "Archive pattern: leaderboard_archive/{weekId} summary doc + leaderboard_archive/{weekId}/users sub-collection with rank field"

requirements-completed: [FUNC-06, FUNC-07]

# Metrics
duration: 5min
completed: 2026-03-06
---

# Phase 10 Plan 03: Cron Jobs Summary

**Daily transcript cleanup (30-day retention) and weekly leaderboard archival via onSchedule functions with explicit africa-south1 region in options and batched Firestore writes**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-06T10:51:11Z
- **Completed:** 2026-03-06T10:56:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `deleteOldTranscripts` (daily 02:00 UTC) — removes transcript field from sessions older than 30 days in batches of 500, preserving all other fields
- Added `updateWeeklyLeaderboard` (Monday 00:00 UTC) — archives top 100 leaderboard entries with computed ranks to `leaderboard_archive/{weekId}`, creates next week placeholder doc
- Added `sessions.createdAt` fieldOverride in `firestore.indexes.json` — prevents FAILED_PRECONDITION on first cron run

## Task Commits

Each task was committed atomically:

1. **Task 1: deleteOldTranscripts + updateWeeklyLeaderboard cron functions** - `103d020` (feat)
2. **Task 2: Add createdAt Firestore index for transcript cleanup query** - `dc1edb4` (feat)

**Plan metadata:** (docs commit — see final_commit below)

## Files Created/Modified
- `functions/index.js` - Added onSchedule import, deleteOldTranscripts export, updateWeeklyLeaderboard export
- `firestore.indexes.json` - Added sessions.createdAt fieldOverride (ASCENDING + DESCENDING)

## Decisions Made
- onSchedule region passed directly in options object — setGlobalOptions does not apply to onSchedule in CJS modules (confirmed in 10-RESEARCH.md)
- updateWeeklyLeaderboard computes nextWeekId inline with `+7 days` rather than calling getWeekId() — avoids ambiguity about what "current date" means at Monday midnight
- Both cron functions re-throw errors in catch blocks — Cloud Scheduler treats thrown errors as failures and retries, which is the correct behavior for transient Firestore failures
- firestore.indexes.json fieldOverride added for sessions.createdAt — the `where('createdAt', '<', cutoff)` range query requires this index or the first production run would fail

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Indexes deploy automatically via `firebase deploy --only firestore:indexes`. Cron functions deploy via `firebase deploy --only functions`.

## Next Phase Readiness
- Phase 10 is complete — all 3 plans done (10-01 payments, 10-02 paywall UI, 10-03 cron jobs)
- All 8 Cloud Functions exports valid and load without error
- Deployment ready: `firebase deploy --only functions,firestore:indexes`

---
*Phase: 10-payments-cron*
*Completed: 2026-03-06*
