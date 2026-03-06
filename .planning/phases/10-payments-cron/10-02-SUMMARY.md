---
phase: 10-payments-cron
plan: "02"
subsystem: payments
tags: [firebase, httpsCallable, vue, quasar, mozpayments]

# Dependency graph
requires:
  - phase: 10-payments-cron/10-01
    provides: createSubscription Cloud Function deployed to Firebase
  - phase: 07-firestore-data
    provides: useProfileStore() with subscriptionStatus field
provides:
  - PaywallDialog.vue wired to createSubscription Cloud Function with loading state and redirect
  - DashboardPage.vue Go Pro chip hidden for active subscribers via v-if guard
affects:
  - Any future phase that adds post-subscription UI flows
  - 10-03 (cron/status sync) — subscriptionStatus field read here must be kept consistent

# Tech tracking
tech-stack:
  added: []
  patterns:
    - httpsCallable created at module level in component (same pattern as session.js store)
    - QBtn :loading prop used for in-flight Cloud Function loading state (no extra template needed)

key-files:
  created: []
  modified:
    - src/components/PaywallDialog.vue
    - src/pages/DashboardPage.vue

key-decisions:
  - "selectedPlan 'monthly' maps to mpesa, 'annual' maps to emola — matches MozPayments payment method enum"
  - "On createSubscription error, dialog stays open for user retry — no auto-close on failure"
  - "Go Pro chip v-if checks !== 'active' — chip visible for 'none' and 'pending' states"

patterns-established:
  - "httpsCallable at module level in component: same pattern established in session.js, now applied to PaywallDialog"
  - "QBtn :loading + :disable pair: prevents double-tap and shows Quasar built-in spinner without extra template"

requirements-completed: [SUB-01, SUB-02]

# Metrics
duration: 5min
completed: 2026-03-06
---

# Phase 10 Plan 02: PaywallDialog + Go Pro Chip Wiring Summary

**PaywallDialog calls createSubscription httpsCallable and redirects to MozPayments checkout; Go Pro chip hidden for active subscribers via subscriptionStatus v-if guard**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-06T16:25:51Z
- **Completed:** 2026-03-06T16:30:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- PaywallDialog.vue Subscribe Now button wired to createSubscription Cloud Function with loading state
- On successful response, browser redirects to result.data.checkoutUrl (MozPayments hosted checkout)
- DashboardPage.vue Go Pro chip guarded with v-if to hide for active subscribers
- Build passes without errors — zero visual/layout changes made

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire PaywallDialog to createSubscription** - `5c830fc` (feat)
2. **Task 2: Guard Go Pro chip with subscriptionStatus v-if** - `abba979` (feat)

**Plan metadata:** `[pending]` (docs: complete plan)

## Files Created/Modified
- `src/components/PaywallDialog.vue` - Added httpsCallable imports, createSubscriptionFn at module level, isSubscribing ref, handleSubscribe() function, updated Subscribe Now QBtn with @click/loading/disable
- `src/pages/DashboardPage.vue` - Added v-if="profile.subscriptionStatus !== 'active'" to go-pro-chip div

## Decisions Made
- selectedPlan 'monthly' maps to mpesa, 'annual' maps to emola — consistent with MozPayments payment method enum in TRD
- On createSubscription error, dialog stays open (no auto-close) — user can retry without re-opening paywall
- v-if checks !== 'active' specifically — chip remains visible for 'none' and 'pending' states so pending subscribers can still navigate to checkout if needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required for this plan. MozPayments credentials were handled in 10-01.

## Next Phase Readiness
- Subscription UI flow is complete: paywall triggers checkout, chip hides after activation
- Ready for 10-03: cron job to sync subscription status from MozPayments API
- The subscriptionStatus field read in DashboardPage must remain 'active' string — cron must write this exact value

---
*Phase: 10-payments-cron*
*Completed: 2026-03-06*
