# Phase 10: Payments, Subscriptions & Cron Jobs - Research

**Researched:** 2026-03-06
**Domain:** MozPayments API, Firebase Cloud Functions HTTPS webhook, Firebase Cloud Scheduler (onSchedule), HMAC-SHA256 signature verification, Firestore batch operations
**Confidence:** MEDIUM (MozPayments API not publicly documented — TRD is the authoritative spec; all other domains HIGH)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUB-01 | PaywallDialog reads real `subscriptionStatus` from `useProfileStore` — dialog trigger in DashboardPage shows only when `subscriptionStatus != "active"` | profileStore.subscriptionStatus already exists; DashboardPage Go Pro chip always shows — needs v-if guard added |
| SUB-02 | User can initiate subscription from PaywallDialog — "Subscribe Now" calls `createSubscription` Cloud Function and redirects to returned `checkoutUrl` (MozPayments hosted page) | httpsCallable pattern established in session.js; redirect via `window.location.href`; TRD specifies exact input/output contract |
| SUB-03 | Webhook confirmation activates subscription — after `handlePaymentWebhook` runs, Firestore `users/{userId}.subscriptionStatus` is `"active"` and user can start unlimited sessions | onRequest + HMAC-SHA256 verify + Admin SDK write; rawBody available on deployed onRequest; TRD specifies full logic |
| FUNC-04 | `createSubscription` HTTPS callable — creates `subscriptions/{userId}` doc with `status: "pending"`, calls MozPayments API to create checkout session, returns `{ checkoutUrl, subscriptionId }` | Pattern same as existing onCall functions; MOZPAYMENTS_API_KEY secret already declared |
| FUNC-05 | `handlePaymentWebhook` HTTPS function — verifies HMAC-SHA256 webhook signature (MozPayments secret), on `payment.success` updates subscription doc to `status: "active"` with `expiresAt: now + 30 days`, updates `users/{userId}.subscriptionStatus: "active"`, appends payment to `paymentHistory` | onRequest (not onCall); Node.js crypto module; req.rawBody is Buffer in deployed functions |
| FUNC-06 | `deleteOldTranscripts` scheduled function (daily 02:00 UTC) — batch-queries sessions where `createdAt < now - 30 days`, removes `transcript` field (batch delete 500 at a time), preserves scores/mistakes | onSchedule from firebase-functions/v2/scheduler; FieldValue.delete(); 500 ops/batch limit; crontab syntax `0 2 * * *` |
| FUNC-07 | `updateWeeklyLeaderboard` scheduled function (Monday 00:00 UTC) — queries top 100 users by `weeklySessionTime`, calculates final ranks, archives to `leaderboard_archive/{weekId}`, creates new week doc with reset stats | onSchedule; getWeekId() helper already exists in functions/index.js; query leaderboard/{weekId}/users ordered by weeklySessionTime |
</phase_requirements>

---

## Summary

Phase 10 has three distinct workstreams that share little coupling: (1) MozPayments subscription creation + webhook activation, (2) PaywallDialog UI wired to real data and real Cloud Function, and (3) two scheduled cron jobs for data hygiene and leaderboard management.

The Cloud Function scaffolding is already in place — MOZPAYMENTS_API_KEY secret is declared, all import patterns are established, and the commented stubs at the bottom of `functions/index.js` document exactly what needs to be added. The primary unknowns are the exact MozPayments API request/response shape (no public docs found — TRD.md is the authoritative contract) and whether the `africa-south1` region is supported for Cloud Scheduler. The TRD specifies enough about MozPayments to implement without external docs. For scheduled functions, region should be passed directly in the options object rather than relying on `setGlobalOptions` (known JavaScript bug where setGlobalOptions does not propagate to all function types).

The PaywallDialog UI change is minimal — it already exists and renders correctly. The plan needs to: (a) wire `subscriptionStatus` to conditionally show/hide the Go Pro chip, (b) add an `httpsCallable` for `createSubscription`, (c) replace the static Subscribe Now handler with a real call + redirect. The webhook function uses `onRequest` (not `onCall`) because MozPayments posts directly to it — this is the only `onRequest` in the codebase so far, and rawBody access for HMAC verification is confirmed to work in deployed Cloud Functions.

**Primary recommendation:** Follow TRD spec exactly. Implement in plan order: 10-01 (both Cloud Functions backend), then 10-02 (PaywallDialog UI wiring), then 10-03 (two cron jobs). No new npm packages required.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase-functions/v2/scheduler` | ^7.0.0 (already installed) | `onSchedule` for cron jobs | Official Firebase v2 scheduler module |
| `firebase-functions/https` | ^7.0.0 (already installed) | `onRequest` for webhook handler | Already used for healthCheck |
| `node:crypto` | Built-in (Node 24) | HMAC-SHA256 signature verification | No external package needed — Node built-in |
| `firebase-admin` | ^13.6.0 (already installed) | Firestore Admin SDK writes | Already initialized in functions/index.js |
| `firebase/functions` (client) | Already installed | `httpsCallable` for createSubscription | Same pattern as startConversationFn/endSessionFn |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node-fetch` / `https` | Built-in | MozPayments API call from Cloud Function | For createSubscription to call MozPayments REST API |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node built-in `crypto` | `jsonwebtoken` or `bcrypt` | No reason to add a package — HMAC-SHA256 is one function call in Node crypto |
| App Engine cron syntax `"every 24 hours"` | Crontab `"0 2 * * *"` | Crontab is more precise (exact time); TRD specifies 02:00 UTC and Monday 00:00 UTC |

**Installation:** No new packages needed. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new files or directories. All additions go into:
```
functions/
└── index.js        # Add createSubscription, handlePaymentWebhook, deleteOldTranscripts, updateWeeklyLeaderboard

src/
├── components/
│   └── PaywallDialog.vue   # Add createSubscription call + loading state
└── pages/
    └── DashboardPage.vue   # Add v-if guard on Go Pro chip
```

### Pattern 1: onRequest Webhook Handler (handlePaymentWebhook)

**What:** HTTPS function receiving POST from MozPayments. Not callable — external webhook.
**When to use:** Any time an external service pushes events to your backend (payments, notifications, etc.)

```javascript
// Source: firebase-functions/https docs + Node crypto built-in
const { onRequest } = require('firebase-functions/https')
const crypto = require('crypto')

exports.handlePaymentWebhook = onRequest(
  { secrets: [MOZPAYMENTS_API_KEY] },
  async (req, res) => {
    // 1. Only accept POST
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    // 2. HMAC-SHA256 signature verification
    //    req.rawBody is a Buffer (available in deployed functions; undefined in emulator)
    const secret = MOZPAYMENTS_API_KEY.value()
    const signature = req.headers['x-mozpayments-signature'] || ''
    const computed = crypto
      .createHmac('sha256', secret)
      .update(req.rawBody)      // Buffer — must use rawBody, not JSON.stringify(req.body)
      .digest('hex')

    const sigBuffer  = Buffer.from(signature, 'utf8')
    const calcBuffer = Buffer.from(computed, 'utf8')

    if (sigBuffer.length !== calcBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, calcBuffer)) {
      logger.warn('handlePaymentWebhook: invalid signature')
      res.status(401).send('Invalid signature')
      return
    }

    // 3. Process event
    const { event, subscriptionId, amount, phoneNumber, receiptId } = req.body
    if (event === 'payment.success') {
      // ... Admin SDK writes (see Code Examples section)
    }

    res.status(200).json({ received: true })
  }
)
```

**Critical pitfall:** The signature header name `x-mozpayments-signature` is assumed from TRD convention — verify with actual MozPayments docs or test payload when available.

### Pattern 2: onSchedule Cron Function

**What:** Cloud Scheduler invokes the function at a defined cron interval.
**When to use:** Any periodic background job — daily cleanup, weekly resets.

```javascript
// Source: firebase-functions/v2/scheduler — WebSearch verified
const { onSchedule } = require('firebase-functions/v2/scheduler')

// Pass region DIRECTLY in options (not via setGlobalOptions — known CJS bug)
exports.deleteOldTranscripts = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'UTC', region: 'africa-south1' },
  async (event) => {
    // ... implementation
  }
)

exports.updateWeeklyLeaderboard = onSchedule(
  { schedule: '0 0 * * 1', timeZone: 'UTC', region: 'africa-south1' },
  async (event) => {
    // ... implementation
  }
)
```

**Crontab syntax:**
- `0 2 * * *` = daily at 02:00 UTC (TRD: deleteOldTranscripts)
- `0 0 * * 1` = Monday 00:00 UTC (TRD: updateWeeklyLeaderboard)

### Pattern 3: httpsCallable for createSubscription (Client Side)

**What:** Vue component calls Cloud Function, receives checkoutUrl, redirects browser.
**When to use:** Any callable Cloud Function that returns a redirect URL.

```javascript
// Source: Established pattern from session.js
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'

const createSubscriptionFn = httpsCallable(functions, 'createSubscription')

// In PaywallDialog.vue subscribe handler:
async function handleSubscribe() {
  isLoading.value = true
  try {
    const result = await createSubscriptionFn({
      phoneNumber: '',          // TRD input field — may be empty if MozPayments collects it
      paymentMethod: selectedPlan.value === 'monthly' ? 'mpesa' : 'emola'
    })
    // Redirect to hosted checkout page
    window.location.href = result.data.checkoutUrl
  } catch (err) {
    console.error('createSubscription error:', err)
  } finally {
    isLoading.value = false
  }
}
```

### Pattern 4: Firestore Batch Field Delete (deleteOldTranscripts)

**What:** Query old sessions, remove `transcript` field in batches of 500.
**When to use:** Bulk field removal across many documents.

```javascript
// Source: Firebase Admin SDK docs — Batch limit 500 ops confirmed
const cutoff = admin.firestore.Timestamp.fromDate(
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
)

const snap = await admin.firestore()
  .collection('sessions')
  .where('createdAt', '<', cutoff)
  .select()           // only fetch doc refs, not data
  .get()

// Chunk into groups of 500
const batchSize = 500
for (let i = 0; i < snap.docs.length; i += batchSize) {
  const chunk = snap.docs.slice(i, i + batchSize)
  const batch = admin.firestore().batch()
  chunk.forEach(doc => {
    batch.update(doc.ref, {
      transcript: admin.firestore.FieldValue.delete()
    })
  })
  await batch.commit()
}
```

### Anti-Patterns to Avoid

- **Using `===` for HMAC signature comparison:** Vulnerable to timing attacks. Always use `crypto.timingSafeEqual()`.
- **Using `req.body` (parsed JSON) for HMAC:** Signature is computed over raw bytes. JSON serialization can reorder keys or change whitespace — must use `req.rawBody`.
- **Relying on `setGlobalOptions` for onSchedule region:** Known JavaScript bug — region is not applied. Pass `region` directly in the onSchedule options object.
- **Using `onCall` for the webhook:** MozPayments posts from its server, not from a Firebase client. It cannot send the Firebase auth token required by `onCall`. Must use `onRequest`.
- **Committing `> 500` ops in one batch:** Firestore limit is 500 writes per batch. For large session cleanup, always chunk.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HMAC computation | Custom crypto logic | `node:crypto` built-in | Timing-safe equality, tested, zero dependencies |
| Webhook signature verification | String comparison | `crypto.timingSafeEqual` | Prevents timing attacks — character-by-character comparison leaks information |
| Scheduled job triggering | External cron service, polling Cloud Function | `onSchedule` (Firebase Cloud Scheduler) | Managed by Firebase, no infrastructure to maintain, $0.10/month |
| MozPayments API HTTP call | Raw http.request | Node built-in `https` or `node-fetch` | Simple POST — one function call; no library needed |

**Key insight:** Every tool needed for this phase is already installed or built into Node 24. Zero new packages.

---

## Common Pitfalls

### Pitfall 1: rawBody Undefined in Emulator

**What goes wrong:** `crypto.timingSafeEqual` crashes because `req.rawBody` is `undefined` when testing with Firebase emulator.
**Why it happens:** The Firebase Functions emulator does not populate `req.rawBody`. This is a known, long-standing issue (github.com/firebase/firebase-tools/issues/1830).
**How to avoid:** Add a guard: `const body = req.rawBody || Buffer.from(JSON.stringify(req.body))`. The fallback allows emulator testing but is NOT safe for production signature verification. Document the limitation clearly.
**Warning signs:** `TypeError: The "buffer" argument must be an instance of Buffer` in emulator logs.

### Pitfall 2: onSchedule Region Not Applied (JavaScript CJS)

**What goes wrong:** Scheduled functions deploy to `us-central1` despite `setGlobalOptions({ region: 'africa-south1' })`.
**Why it happens:** In JavaScript (CommonJS) projects, `setGlobalOptions` only applies to functions defined in the same file scope — a known Firebase Functions bug (github.com/firebase/firebase-functions/issues/1502, open as of Jan 2024).
**How to avoid:** Pass `region: 'africa-south1'` directly in each `onSchedule` options object. All other functions already use `setGlobalOptions` correctly because they use `onCall`/`onRequest` which are immune to the bug.
**Warning signs:** Post-deploy function appears in Firebase Console under `us-central1`.

### Pitfall 3: Missing Firestore Index for Batch Query

**What goes wrong:** `deleteOldTranscripts` query fails with "The query requires an index" error.
**Why it happens:** Querying sessions by `createdAt <` requires a single-field index. Firestore auto-creates basic single-field indexes but may not have it deployed yet.
**How to avoid:** Add the index to `firestore.indexes.json` or let the error message provide the Console URL to create it. Check `firestore.indexes.json` before deploying.
**Warning signs:** Cloud Function logs show `FAILED_PRECONDITION: The query requires an index`.

### Pitfall 4: Subscription Doc Lookup in Webhook

**What goes wrong:** `handlePaymentWebhook` cannot find which user to update from `subscriptionId` alone.
**Why it happens:** The `subscriptions` collection is keyed by `userId`, not `subscriptionId`. The webhook payload has `subscriptionId` (MozPayments external ID), not `userId`.
**How to avoid:** When creating the subscription doc in `createSubscription`, store `externalSubscriptionId`. In the webhook, query subscriptions where `externalSubscriptionId == subscriptionId` to get the doc (and thus the userId).
**Warning signs:** Admin SDK `.doc(`subscriptions/${subscriptionId}`)` always returns "not found".

### Pitfall 5: Go Pro Chip Always Visible After Payment

**What goes wrong:** After subscription activates, the Go Pro chip remains visible because DashboardPage currently shows it unconditionally.
**Why it happens:** The chip has no conditional rendering — it was static UI from Phase 5, and Phase 10 must add the `v-if`.
**How to avoid:** Wrap the chip with `v-if="profile.subscriptionStatus !== 'active'"` in DashboardPage.vue. The profileStore already has `subscriptionStatus` — it's populated from Firestore on auth.
**Warning signs:** "Go Pro" chip visible even after successful payment.

---

## Code Examples

Verified patterns from official sources and established project patterns:

### HMAC-SHA256 Webhook Verification (Production Safe)

```javascript
// Source: Node.js crypto built-in docs + firebase-functions PR #420 (rawBody confirmed as Buffer)
const crypto = require('crypto')

function verifyMozPaymentsSignature(req, secret) {
  const signature = req.headers['x-mozpayments-signature'] || ''
  // req.rawBody is a Buffer in deployed Cloud Functions (not emulator)
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body))
  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  const sigBuf  = Buffer.from(signature, 'utf8')
  const calcBuf = Buffer.from(computed, 'utf8')
  if (sigBuf.length !== calcBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, calcBuf)
}
```

### onSchedule Import (CommonJS — matches existing code style)

```javascript
// Source: WebSearch verified — firebase-functions v2 scheduler CommonJS pattern
const { onSchedule } = require('firebase-functions/v2/scheduler')

exports.deleteOldTranscripts = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'UTC', region: 'africa-south1' },
  async (event) => {
    logger.info('deleteOldTranscripts: starting daily cleanup')
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    const snap = await admin.firestore()
      .collection('sessions')
      .where('createdAt', '<', cutoff)
      .get()

    const batchSize = 500
    for (let i = 0; i < snap.docs.length; i += batchSize) {
      const chunk = snap.docs.slice(i, i + batchSize)
      const batch = admin.firestore().batch()
      chunk.forEach(doc => {
        batch.update(doc.ref, {
          transcript: admin.firestore.FieldValue.delete()
        })
      })
      await batch.commit()
    }
    logger.info(`deleteOldTranscripts: cleaned ${snap.size} sessions`)
  }
)
```

### Admin SDK Subscription Activation (in handlePaymentWebhook)

```javascript
// Source: Established Admin SDK pattern from endSession
const now = admin.firestore.Timestamp.now()
const expiresAt = admin.firestore.Timestamp.fromDate(
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // now + 30 days
)

// Find subscription doc by externalSubscriptionId
const subQuery = await admin.firestore()
  .collection('subscriptions')
  .where('externalSubscriptionId', '==', subscriptionId)
  .limit(1)
  .get()

if (subQuery.empty) {
  logger.error('handlePaymentWebhook: subscription not found', { subscriptionId })
  // Still return 200 — don't retry unknown webhooks
  res.status(200).json({ received: true })
  return
}

const subDoc = subQuery.docs[0]
const userId = subDoc.id  // subscriptions collection is keyed by userId

// Update subscription doc
await subDoc.ref.update({
  status:    'active',
  expiresAt: expiresAt,
  paymentHistory: admin.firestore.FieldValue.arrayUnion({
    amount:        amount,
    currency:      'MZN',
    paymentMethod: paymentMethod || 'mpesa',
    status:        'success',
    paidAt:        now,
    receiptId:     receiptId
  })
})

// Update users doc
await admin.firestore().doc(`users/${userId}`).update({
  subscriptionStatus:    'active',
  subscriptionExpiresAt: expiresAt,
  updatedAt:             now
})
```

### MozPayments API Call (in createSubscription)

```javascript
// Source: TRD.md spec — MozPayments API shape defined there
// No public docs found for MozPayments; TRD is authoritative
const https = require('https')

function mozPaymentsCreateCheckout({ apiKey, userId, phoneNumber, paymentMethod }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      userId,
      phoneNumber,
      paymentMethod,
      plan: 'monthly_unlimited',
      currency: 'MZN',
      amount: 400,
      webhookUrl: `https://africa-south1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/handlePaymentWebhook`
    })
    const options = {
      hostname: 'api.mozpayments.co.mz',   // ASSUMED — verify with actual endpoint
      path:     '/v1/checkout',             // ASSUMED — verify with actual endpoint
      method:   'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}
```

### PaywallDialog: Subscribe Now Handler + Go Pro Chip Guard

```javascript
// In PaywallDialog.vue — add to <script setup>
import { ref } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'

const createSubscriptionFn = httpsCallable(functions, 'createSubscription')
const isSubscribing = ref(false)

async function handleSubscribe() {
  if (isSubscribing.value) return
  isSubscribing.value = true
  try {
    const result = await createSubscriptionFn({ paymentMethod: 'mpesa' })
    window.location.href = result.data.checkoutUrl
  } catch (err) {
    console.error('createSubscription failed:', err)
  } finally {
    isSubscribing.value = false
  }
}
```

```html
<!-- DashboardPage.vue — Go Pro chip with v-if guard -->
<div
  v-if="profile.subscriptionStatus !== 'active'"
  class="go-pro-chip row items-center no-wrap q-px-sm q-py-xs q-ml-sm cursor-pointer"
  @click="showPaywall = true"
>
  <q-icon name="sym_o_star" size="12px" class="q-mr-xs" />
  <span class="text-caption text-weight-bold">Go Pro</span>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `functions.pubsub.schedule()` (v1) | `onSchedule()` from `firebase-functions/v2/scheduler` | Cloud Functions v2 GA 2023 | Better typing, direct cron syntax support, v2 features |
| Node 18 Cloud Functions | Node 24 (already in project) | Oct 2025 — Node 18 decommissioned | Already handled in Phase 6 |
| `@google/generative-ai` | `@google/genai` (already in project) | Nov 2025 | Already handled in Phase 6 |

**Deprecated/outdated:**
- `functions.pubsub.schedule()`: Replaced by `onSchedule` in v2 — do not use.
- `functions.https.onRequest()` (v1): Project uses `require('firebase-functions/https').onRequest` (v2-compatible) — already correct.

---

## Open Questions

1. **MozPayments API endpoint and exact request format**
   - What we know: TRD specifies the input/output contract for `createSubscription` (userId, phoneNumber, paymentMethod → checkoutUrl, subscriptionId, expiresIn)
   - What's unclear: Exact hostname, path, and auth header format for MozPayments REST API; webhook signature header name
   - Recommendation: Use TRD spec as the contract. Stub the MozPayments call with a hardcoded checkoutUrl for development; replace with real endpoint when credentials are available. The MOZPAYMENTS_API_KEY secret is already declared.

2. **Cloud Scheduler availability in africa-south1**
   - What we know: The existing functions (onCall) work in africa-south1 with setGlobalOptions. Cloud Scheduler support per region varies.
   - What's unclear: Whether Cloud Scheduler specifically supports africa-south1 (Firebase docs were truncated during research; could not verify)
   - Recommendation: Try deploying with `region: 'africa-south1'` in onSchedule options. If deployment fails with region error, fall back to `us-central1` for scheduled functions only (acceptable latency — crons don't need to be co-located with Firestore for low-latency).

3. **subscriptions collection key — userId or auto-ID**
   - What we know: TRD shows `subscriptions/{userId}` — keyed by userId. Webhook receives `subscriptionId` (external MozPayments ID), not userId.
   - What's unclear: How exactly to reverse-lookup userId from MozPayments subscriptionId in the webhook. Two strategies: (a) query by `externalSubscriptionId` field, or (b) encode userId in MozPayments metadata at checkout creation.
   - Recommendation: Store `externalSubscriptionId` in the subscription doc during createSubscription and query for it in the webhook (Code Examples above). This is the cleanest approach.

---

## Sources

### Primary (HIGH confidence)
- `functions/index.js` (project file) — existing patterns for onCall, secrets, Admin SDK
- `src/stores/session.js` (project file) — established httpsCallable pattern at module level
- `src/components/PaywallDialog.vue` (project file) — static UI to be wired; selectedPlan ref, Subscribe Now button
- `src/pages/DashboardPage.vue` (project file) — Go Pro chip location, showPaywall ref
- `src/stores/profile.js` (project file) — subscriptionStatus field confirmed present
- `TRD.md` (project file) — authoritative spec for all function contracts, Firestore schema, webhook logic
- Node.js `crypto` module — built-in, no documentation ambiguity

### Secondary (MEDIUM confidence)
- [firebase/firebase-functions PR #420](https://github.com/firebase/firebase-functions/pull/420/files) — confirms `req.rawBody` is `Buffer`, available in `onRequest` handlers on deployed functions (not emulator)
- [Firebase schedule-functions docs](https://firebase.google.com/docs/functions/schedule-functions) — confirmed `onSchedule` from `firebase-functions/v2/scheduler`, crontab syntax `"5 11 * * *"` supported
- [firebase-functions issue #1502](https://github.com/firebase/firebase-functions/issues/1502) — confirmed `setGlobalOptions` region bug in JavaScript CJS projects; workaround: pass `region` directly in function options
- [hookdeck HMAC guide](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification) — HMAC-SHA256 + timingSafeEqual pattern confirmed standard
- WebSearch 2025 results — onSchedule region option object syntax `{ schedule, timeZone, region }` confirmed

### Tertiary (LOW confidence)
- MozPayments API hostname and path — not publicly documented; TRD spec is the only source. Flag for validation when real credentials are available.
- Cloud Scheduler africa-south1 support — could not verify from truncated Firebase docs. Treat as unconfirmed until deploy attempt.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, no new dependencies
- Architecture (onCall/onRequest patterns): HIGH — verified against existing code and Firebase docs
- Architecture (onSchedule): MEDIUM — syntax confirmed but region support for africa-south1 unverified
- Architecture (HMAC webhook): HIGH — Node crypto built-in + rawBody confirmed as Buffer in deployed functions
- MozPayments API: LOW — no public docs; TRD is only source; placeholder implementation required
- Pitfalls: HIGH — rawBody emulator bug and setGlobalOptions region bug both verified with GitHub issues

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable APIs; MozPayments section re-validate when real credentials available)
