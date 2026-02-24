---
phase: 06-firebase-auth
plan: 02
subsystem: auth
tags: [firebase, pinia, firestore, vue-router, google-auth, route-guard]

# Dependency graph
requires:
  - phase: 06-01
    provides: "Firebase singleton (app, auth, db) exported from boot/firebase.js"
provides:
  - "Real Firebase Auth Pinia store (useAuthStore) with uid, email, displayName, photoURL, isLoading, onboardingCompleted, isAuthenticated"
  - "Firestore userProfile service: createUserProfile (TRD schema, no-overwrite) and fetchUserProfile"
  - "Auth boot file with onAuthStateChanged subscriber and router.beforeEach route guard"
  - "Google Sign-In wired in LandingPage.vue via authStore.signInWithGoogle()"
affects: [07-onboarding, 08-session, 09-progress, 10-payments, all-phases-with-auth-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getCurrentUser() promise-wrapper for router guard race-condition fix on hard refresh"
    - "onAuthStateChanged persistent subscriber in boot file keeps Pinia store synced"
    - "createUserProfile getDoc-check-before-setDoc pattern prevents returning-user overwrites"
    - "signInWithPopup called synchronously inside action (no await before popup) to avoid mobile popup blocking"
    - "Legacy alias pattern: hasCompletedOnboarding + completeOnboarding preserved for v1.0 component compatibility"

key-files:
  created:
    - src/stores/auth.js
    - src/services/userProfile.js
    - src/boot/auth.js
  modified:
    - quasar.config.js
    - src/pages/LandingPage.vue

key-decisions:
  - "getCurrentUser() one-shot Promise wraps onAuthStateChanged to resolve auth state before router guard decisions — standard race-condition fix for Firebase + SPA routers"
  - "isLoading starts true and only sets false after first onAuthStateChanged emission — guards never make decisions while SDK is still initializing"
  - "onboarding route is NOT in PUBLIC_ROUTES — authenticated users without onboardingCompleted land there; unauthenticated users still redirected to landing"
  - "signInWithGoogle calls signInWithPopup synchronously (no preceding await) inside the action to prevent mobile browser popup blocking"
  - "Boot order firebase→auth is critical: auth boot imports { auth } from boot/firebase, which must be initialized first"

patterns-established:
  - "Auth store pattern: setUser(firebaseUser) for full state update, setOnboardingCompleted(bool) for profile flag, signOutUser() for logout"
  - "Route guard pattern: 3-case guard (unauthenticated→landing, authenticated+landing→redirect, authenticated+!onboarding→onboarding)"
  - "userProfile service pattern: always getDoc first, only setDoc on new users"

requirements-completed: [AUTH-01, AUTH-02, AUTH-04, AUTH-05]

# Metrics
duration: 4min
completed: 2026-02-24
---

# Phase 06 Plan 02: Firebase Auth Store + Route Guard Summary

**Real Google Sign-In with Pinia auth store, Firestore users/{uid} document creation (TRD schema), and router.beforeEach guard with getCurrentUser() race-condition fix**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-24T05:36:18Z
- **Completed:** 2026-02-24T05:40:30Z
- **Tasks:** 2 of 3 completed (Task 3 is checkpoint:human-verify — awaiting user)
- **Files modified:** 5

## Accomplishments
- Replaced mock auth store with full Firebase Auth state (uid, email, displayName, photoURL, isLoading, onboardingCompleted, isAuthenticated)
- Created userProfile service with createUserProfile (getDoc check prevents overwriting returning users) and TRD-schema Firestore document
- Created auth boot file with persistent onAuthStateChanged subscriber and router.beforeEach guard covering 3 protection cases
- Wired LandingPage.vue handleSignIn to call real authStore.signInWithGoogle() with try/catch error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace src/stores/auth.js and create src/services/userProfile.js** - `b921ac2` (feat)
2. **Task 2: Create src/boot/auth.js, update quasar.config.js, update LandingPage.vue** - `a6b773d` (feat)

_Task 3 is checkpoint:human-verify — committed after user approves end-to-end verification_

## Files Created/Modified
- `src/stores/auth.js` - Real Firebase Auth Pinia store replacing mock; exports useAuthStore with full state shape
- `src/services/userProfile.js` - Firestore user document management; createUserProfile + fetchUserProfile
- `src/boot/auth.js` - Auth state subscriber + getCurrentUser() + router.beforeEach route guard
- `quasar.config.js` - Boot array updated to ['firebase', 'auth'] (order critical)
- `src/pages/LandingPage.vue` - handleSignIn() replaced with real Google Sign-In; template/style unchanged

## Decisions Made
- getCurrentUser() one-shot Promise is the standard pattern to fix the router guard race condition where auth.currentUser is null until Firebase SDK emits its first state
- isLoading starts as true and flips to false only after first onAuthStateChanged emission — prevents premature redirect decisions
- onboarding is NOT a public route to preserve the flow: unauthenticated → landing, authenticated + !onboardingCompleted → onboarding
- signInWithPopup called synchronously (no preceding await) inside signInWithGoogle action to prevent mobile browser popup blocking
- Boot order firebase → auth is enforced because auth boot imports { auth } from boot/firebase which must be initialized first

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Checkpoint awaiting user verification — see Task 3 in the plan for the 6-test verification checklist:
1. Unauthenticated redirect to landing from /app/dashboard
2. Google Sign-In popup opens and completes
3. Firestore users/{uid} document created with TRD schema fields
4. Returning user sign-in does NOT overwrite existing Firestore document
5. Auth persistence across hard refresh (F5 on /app/dashboard stays on dashboard)
6. Landing page UI visually unchanged

Prerequisites: .env.local must have real Firebase config. Google Sign-In must be enabled in Firebase Console.

## Next Phase Readiness
- Auth store, userProfile service, and route guards are production-ready
- Once user approves checkpoint, Phase 07 (onboarding wiring) can read authStore.uid and write onboardingCompleted to Firestore
- Legacy compatibility aliases (completeOnboarding, hasCompletedOnboarding) preserved — v1.0 onboarding components need no changes

---
*Phase: 06-firebase-auth*
*Completed: 2026-02-24*

## Self-Check: PASSED

- FOUND: src/stores/auth.js
- FOUND: src/services/userProfile.js
- FOUND: src/boot/auth.js
- FOUND: .planning/phases/06-firebase-auth/06-02-SUMMARY.md
- FOUND commit: b921ac2 (Task 1)
- FOUND commit: a6b773d (Task 2)
