---
phase: 06-firebase-auth
plan: 03
subsystem: infra
tags: [firestore, cloud-functions, security-rules, @google/genai, defineSecret, firebase-admin]

# Dependency graph
requires:
  - phase: 06-01
    provides: Firebase project initialized, Firestore configured
  - phase: 06-02
    provides: Firebase Auth wired, auth boot file, user profile creation
provides:
  - Production Firestore security rules — 6 collection match blocks, owner-only access, subscription gating
  - Cloud Functions scaffold with defineSecret for GEMINI_API_KEY and MOZPAYMENTS_API_KEY
  - @google/genai installed in functions/node_modules for Phase 8 AI integration
affects: [phase 8 AI integration, phase 9 session scoring, phase 10 payments, all Firestore reads/writes]

# Tech tracking
tech-stack:
  added: ["@google/genai@^1.0.0 (GA version, replaces deprecated @google/generative-ai)"]
  patterns:
    - "Firestore security rules: helper functions (isAuthenticated, isOwner, hasActiveSubscription) centralize auth logic"
    - "defineSecret() pattern for Firebase Secret Manager — secrets declared at module level, accessed via .value() inside function body"
    - "setGlobalOptions with region: africa-south1 ensures all functions colocate with Firestore"

key-files:
  created: []
  modified:
    - firestore.rules
    - functions/package.json
    - functions/index.js
    - functions/package-lock.json

key-decisions:
  - "@google/genai replaces deprecated @google/generative-ai — GA version as of Nov 2025"
  - "node:24 preserved in functions/package.json — Node 18 decommissioned for Cloud Functions Oct 2025"
  - "functions/index.js uses CommonJS (require) not ESM import — Cloud Functions v2 with Node 24 defaults to CJS"
  - "hasActiveSubscription() reads users doc via get() call — single rule function handles subscription gating"
  - "Leaderboard and subscriptions write-locked to false (client side) — only Admin SDK can write via Cloud Functions"
  - "Delete forbidden on users and sessions — soft-delete via status field preserves data integrity"

patterns-established:
  - "Secret pattern: defineSecret('KEY_NAME') at module level, { secrets: [KEY_NAME] } in function options"
  - "Firestore rules helper functions at top of match block — avoids duplicating auth checks per collection"
  - "healthCheck onRequest function for deployment smoke testing"

requirements-completed: [INFRA-02, INFRA-03]

# Metrics
duration: 8min
completed: 2026-02-24
---

# Phase 6 Plan 03: Firestore Production Rules + Cloud Functions Scaffold Summary

**TRD production Firestore rules (6 collections, owner-only, subscription-gated) with Cloud Functions scaffold declaring GEMINI_API_KEY and MOZPAYMENTS_API_KEY via defineSecret()**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-24T08:26:50Z
- **Completed:** 2026-02-24T08:34:00Z
- **Tasks:** 2 of 3 complete (Task 3 is checkpoint:human-verify)
- **Files modified:** 4

## Accomplishments

- Replaced open-dev wildcard Firestore rule with 6-collection production rules — no data is publicly accessible
- Added 3 helper functions (isAuthenticated, isOwner, hasActiveSubscription) that centralize auth logic
- Sessions gated after session 1 by reading subscriptionStatus from users doc via get() call
- Scaffolded functions/index.js with CommonJS, setGlobalOptions (africa-south1), defineSecret for both secrets
- Added @google/genai@1.42.0 to functions — ready for Phase 8 AI integration
- Node 24 preserved in functions/package.json (Node 18 decommissioned Oct 2025)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace firestore.rules with TRD production rules** - `f0f3423` (feat)
2. **Task 2: Update functions/package.json and functions/index.js** - `6bf6166` (feat)
3. **Task 3: Deploy Firestore rules and verify Cloud Functions scaffold** - PENDING (checkpoint:human-verify)

## Files Created/Modified

- `firestore.rules` - Replaced open-dev wildcard with TRD production rules (6 match blocks, 3 helper functions)
- `functions/package.json` - Added @google/genai@^1.0.0, preserved node:24
- `functions/index.js` - Scaffold with setGlobalOptions(africa-south1), defineSecret(GEMINI_API_KEY), defineSecret(MOZPAYMENTS_API_KEY), Admin SDK init, healthCheck function
- `functions/package-lock.json` - Updated lockfile after npm install

## Decisions Made

- `@google/genai` (not `@google/generative-ai`) — GA version replaces the deprecated package as of Nov 2025
- `"node": "24"` kept — Node 18 decommissioned for Cloud Functions in October 2025, would be rejected at deploy
- CommonJS `require()` throughout index.js — Cloud Functions v2 with Node 24 uses CJS by default
- `hasActiveSubscription()` uses `get()` to read users doc — clean way to gate sessions 2+ by subscription
- Delete blocked on users and sessions — soft-delete pattern protects data integrity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- npm EBADENGINE warning during `npm install` (local Node v22 vs required Node 24) — expected, not a problem. Cloud Functions runtime uses Node 24 as declared in engines field.

## User Setup Required

**Deployment requires Firebase CLI authentication.** To complete Task 3 (checkpoint):

1. Authenticate: `firebase login`
2. Link project: `firebase use --add` (select your Firebase project, alias = "default")
3. Deploy rules: `firebase deploy --only firestore:rules`
4. Verify in Firebase Console -> Firestore -> Rules tab
5. Verify genai installed: `cd functions && npm list @google/genai`
6. Syntax check: `cd functions && node -e "require('./index.js'); console.log('OK')"`

## Next Phase Readiness

- Firestore is locked down — no data accessible without auth after rules deploy
- Cloud Functions scaffold ready for Phase 8 (AI conversation), Phase 9 (scoring), Phase 10 (payments)
- GEMINI_API_KEY and MOZPAYMENTS_API_KEY declared — need to be set via `firebase functions:secrets:set` before Phase 8/10

## Self-Check: PASSED

- firestore.rules: FOUND, isAuthenticated function present, wildcard rule absent
- functions/index.js: FOUND, defineSecret(GEMINI_API_KEY) + defineSecret(MOZPAYMENTS_API_KEY) present, africa-south1 region present
- functions/package.json: FOUND, node:24 preserved, @google/genai present
- 06-03-SUMMARY.md: FOUND
- Commits: f0f3423 (Task 1), 6bf6166 (Task 2) — both verified in git log

---
*Phase: 06-firebase-auth*
*Completed: 2026-02-24*
