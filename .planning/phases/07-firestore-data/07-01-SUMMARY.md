---
phase: 07-firestore-data
plan: 01
subsystem: database
tags: [firebase, firestore, pinia, offline-persistence, IndexedDB]

# Dependency graph
requires:
  - phase: 06-firebase-auth
    provides: Firebase initialization, auth boot, useAuthStore with uid, fetchUserProfile service
provides:
  - Firestore offline persistence via IndexedDB (persistentLocalCache + persistentSingleTabManager)
  - useProfileStore with real TRD Firestore field names and setProfile/reset actions
  - profileStore populated on every sign-in, cleared on sign-out
  - Firestore session document written to sessions collection on startSession()
affects:
  - 07-02 through 07-07: all page wiring plans depend on useProfileStore having real data

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "initializeFirestore + persistentLocalCache replaces getFirestore for offline-capable Firestore"
    - "Store setProfile(data) / reset() action pair for sign-in/sign-out lifecycle"
    - "Pinia store imports done inside action body (not top-level) to avoid circular dependency at boot"

key-files:
  created: []
  modified:
    - src/boot/firebase.js
    - src/stores/profile.js
    - src/boot/auth.js
    - src/stores/session.js
    - src/pages/SessionPage.vue

key-decisions:
  - "persistentSingleTabManager chosen over persistentMultipleTabManager — this is a mobile PWA, not a multi-tab desktop app"
  - "setProfile() called only when profile document exists (inside if (profile) guard) — users without a Firestore doc are not affected"
  - "startSession() made async — SessionPage onMounted updated to await it to ensure sessionId is available before timer starts"

patterns-established:
  - "Profile store data flow: fetchUserProfile() -> setProfile(data) in auth boot onAuthStateChanged"
  - "Sign-out cleanup pattern: else branch in onAuthStateChanged calls profileStore.reset()"
  - "Firestore writes in store actions use addDoc + serverTimestamp for server-side timestamps"

requirements-completed: [DATA-01, DATA-07, DATA-08]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 7 Plan 01: Firestore Data Foundation Summary

**Firestore offline persistence (IndexedDB), real profile store with TRD field names, sign-in data pump, and sessions collection write on startSession()**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T14:05:44Z
- **Completed:** 2026-02-24T14:08:30Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Firestore now caches all reads in IndexedDB for offline PWA use via persistentLocalCache
- useProfileStore completely rewritten with real TRD field names — no mock data remains
- Auth boot wires Firestore profile data into the store on every sign-in, resets it on sign-out
- Every session start creates a Firestore document in the sessions collection with userId, topic, userLevel, and serverTimestamp

## Task Commits

Each task was committed atomically:

1. **Task 1: Enable Firestore offline persistence** - `a10bc3d` (feat)
2. **Task 2: Replace mock profile store with real Firestore fields** - `ce2dfcd` (feat)
3. **Task 3: Wire profileStore into auth boot and add Firestore session write** - `ba6a536` (feat)

## Files Created/Modified
- `src/boot/firebase.js` - Replaced getFirestore() with initializeFirestore() + persistentLocalCache + persistentSingleTabManager
- `src/stores/profile.js` - Completely rewritten: removed Sarah Chen mock data, added 8 TRD field refs, setProfile()/reset() actions
- `src/boot/auth.js` - Added useProfileStore import, setProfile call after fetchUserProfile, reset() on sign-out
- `src/stores/session.js` - Added addDoc/serverTimestamp imports, sessionId ref, async startSession() writes to Firestore sessions collection
- `src/pages/SessionPage.vue` - onMounted made async, awaits session.startSession()

## Decisions Made
- persistentSingleTabManager chosen over persistentMultipleTabManager — this is a mobile PWA, not a multi-tab desktop app
- setProfile() only called inside the `if (profile)` guard in auth boot, so users without a Firestore doc are not affected
- startSession() made async and awaited in SessionPage.vue onMounted to ensure sessionId is set before timer starts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- useProfileStore now holds real Firestore data after sign-in — all Phase 7 page wiring plans (07-02 through 07-07) can proceed
- DashboardPage.vue still references old mock field names (level, streakDays, etc.) — Plan 07-02 will update those bindings
- No blockers

## Self-Check: PASSED

All files verified present. All commits (a10bc3d, ce2dfcd, ba6a536) verified in git log.

---
*Phase: 07-firestore-data*
*Completed: 2026-02-24*
