---
phase: 10-payments-cron
plan: "01"
subsystem: payments
tags: [mozpayments, cloud-functions, webhook, hmac-sha256, firestore, subscriptions]

# Dependency graph
requires:
  - phase: 06-firebase-setup
    provides: functions/index.js scaffold, MOZPAYMENTS_API_KEY secret declared, Admin SDK init
  - phase: 08-ai-session
    provides: onCall pattern, secrets pattern, Admin SDK write patterns
provides:
  - exports.createSubscription onCall: creates subscriptions/{userId} pending doc, returns MozPayments checkoutUrl
  - exports.handlePaymentWebhook onRequest: HMAC-SHA256 verified webhook, activates subscription on payment.success
  - mozPaymentsCreateCheckout helper: raw https.request POST to MozPayments /v1/checkout
  - verifyMozPaymentsSignature helper: crypto.timingSafeEqual HMAC check with rawBody
affects:
  - 10-02-paywall-ui (uses createSubscription callable, reads subscriptionStatus after webhook activates)
  - 10-03-cron-jobs (same file, same patterns)

# Tech tracking
tech-stack:
  added:
    - node:https (built-in) — MozPayments API call from Cloud Function
    - node:crypto (built-in) — HMAC-SHA256 webhook signature verification
  patterns:
    - onRequest handler for external webhook POST (not onCall)
    - crypto.timingSafeEqual for timing-safe HMAC comparison
    - rawBody fallback: req.rawBody || Buffer.from(JSON.stringify(req.body)) for emulator compat
    - externalSubscriptionId reverse-lookup pattern: store in createSubscription, query in webhook
    - Promise.all for parallel Firestore writes in webhook handler

key-files:
  created: []
  modified:
    - functions/index.js

key-decisions:
  - "externalSubscriptionId stored in subscriptions/{userId} doc during createSubscription — webhook queries this field to reverse-lookup userId from MozPayments subscriptionId"
  - "handlePaymentWebhook uses onRequest (not onCall) — MozPayments server cannot send Firebase auth token"
  - "rawBody fallback to Buffer.from(JSON.stringify(req.body)) allows emulator testing but is not production-safe for HMAC; documented with comment"
  - "Unknown subscriptionId in webhook returns 200 (not 4xx) to prevent MozPayments retry loop"
  - "MozPayments API hostname api.mozpayments.co.mz and path /v1/checkout are assumed from TRD — no public docs; flagged in code comment"

patterns-established:
  - "onRequest webhook: POST-only check → HMAC-SHA256 verify → destructure body → process event → always 200"
  - "timingSafeEqual guard: check buffer lengths before calling timingSafeEqual to avoid crash on mismatched lengths"
  - "Parallel Firestore writes via Promise.all for subscription doc + users doc update"

requirements-completed: [FUNC-04, FUNC-05, SUB-03]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 10 Plan 01: createSubscription + handlePaymentWebhook Summary

**MozPayments payment loop via createSubscription onCall (pending doc + checkoutUrl) and handlePaymentWebhook onRequest (HMAC-SHA256 verified, activates subscriptions/{userId} and users/{userId} on payment.success)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T16:19:34Z
- **Completed:** 2026-03-06T16:21:58Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- `exports.createSubscription` — authenticated onCall that calls MozPayments, writes `subscriptions/{userId}` with `status: pending` and `externalSubscriptionId`, returns `{ checkoutUrl, subscriptionId, expiresIn }`
- `exports.handlePaymentWebhook` — onRequest with HMAC-SHA256 signature verification via `crypto.timingSafeEqual`; on `payment.success` queries by `externalSubscriptionId`, runs parallel updates to `subscriptions/{userId}` (status: active, expiresAt, paymentHistory) and `users/{userId}` (subscriptionStatus: active)
- Both helper functions: `mozPaymentsCreateCheckout` (raw https.request, no extra packages) and `verifyMozPaymentsSignature` (timing-safe, rawBody-based)

## Task Commits

Each task was committed atomically:

1. **Task 1: createSubscription Cloud Function** - `bab1bfc` (feat)
2. **Task 2: handlePaymentWebhook Cloud Function** - `bab1bfc` (feat, same commit — both tasks implemented together as Phase 10 block)

## Files Created/Modified

- `functions/index.js` — Added `require('https')`, `require('crypto')`, `mozPaymentsCreateCheckout()` helper, `exports.createSubscription`, `verifyMozPaymentsSignature()` helper, `exports.handlePaymentWebhook`

## Decisions Made

- `handlePaymentWebhook` uses `onRequest` not `onCall` — MozPayments server cannot provide Firebase auth tokens required by `onCall`
- `externalSubscriptionId` stored in `subscriptions/{userId}` during createSubscription so the webhook can reverse-lookup `userId` from MozPayments' `subscriptionId` field
- Unknown `subscriptionId` in webhook returns HTTP 200 (not 404) to prevent MozPayments retry loops for unrecognized events
- `rawBody` fallback (`req.rawBody || Buffer.from(JSON.stringify(req.body))`) documented as emulator-only workaround — not production-safe for HMAC
- MozPayments hostname (`api.mozpayments.co.mz`) and path (`/v1/checkout`) are assumed from TRD spec; flagged in code comments for validation when real credentials are available

## Deviations from Plan

None — plan executed exactly as written. Both tasks combined in one commit because the implementation is a single contiguous code block in functions/index.js.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan. MOZPAYMENTS_API_KEY secret was already declared in Phase 6; actual key value must be set via `firebase functions:secrets:set MOZPAYMENTS_API_KEY` before deployment.

## Next Phase Readiness

- `createSubscription` and `handlePaymentWebhook` are deployed-ready (pending actual MozPayments credentials)
- Phase 10-02 can now wire `PaywallDialog.vue` to call `createSubscription` via `httpsCallable` and redirect to `checkoutUrl`
- No blockers for 10-02 or 10-03

## Self-Check: PASSED

- functions/index.js: FOUND
- .planning/phases/10-payments-cron/10-01-SUMMARY.md: FOUND
- Commit bab1bfc: FOUND

---
*Phase: 10-payments-cron*
*Completed: 2026-03-06*
