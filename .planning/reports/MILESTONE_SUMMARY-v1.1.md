# Milestone v1.1 — Project Summary

**Generated:** 2026-03-28
**Purpose:** Team onboarding and project review

---

## 1. Project Overview

**SpeakAI** is a Quasar/Vue 3 PWA for English conversation practice targeted at Mozambican users learning English via AI-powered spoken conversations.

**Milestone v1.0** delivered a complete pixel-perfect static UI (10 screens, all hardcoded mock data) matching Stitch designs exactly.

**Milestone v1.1** (this milestone) wired a full Firebase backend to the static frontend — replacing every piece of mock data with real infrastructure:

| Layer | What was built |
|-------|----------------|
| Auth | Real Google Sign-In via Firebase Auth, route guards, user document creation |
| Data | 5 Firestore collections, offline persistence, all stores connected to real data |
| AI | Gemini-powered conversation engine (startConversation, sendMessage) via Cloud Functions |
| Voice | Web Speech API with text fallback for non-Chrome browsers |
| Scoring | endSession Cloud Function scores full transcripts via Gemini, writes to Firestore |
| Payments | MozPayments subscription flow (createSubscription + handlePaymentWebhook webhook) |
| Cron | Two scheduled jobs: daily transcript cleanup + weekly leaderboard archival |

**Target users:** Mozambican English learners — app uses MZN pricing, MozPayments (M-Pesa / e-Mola), and is deployed to `africa-south1` region to minimise latency.

---

## 2. Architecture & Technical Decisions

### Stack

- **Frontend:** Quasar 2.16.0 + Vue 3 (Composition API, `<script setup>`) + Pinia + Vue Router 4
- **Backend:** Firebase Cloud Functions (Node.js 24, CommonJS) — region `africa-south1`
- **Database:** Cloud Firestore — 5 collections (`users`, `sessions`, `vocabulary`, `leaderboard`, `subscriptions`)
- **AI:** Google Gemini via `@google/genai@1.42.0` (`gemini-3.1-pro-preview`)
- **Auth:** Firebase Authentication (Google OAuth)
- **Payments:** MozPayments (M-Pesa / e-Mola) via HTTPS callable + webhook
- **Voice:** Web Speech API (`SpeechRecognition`) with QInput text fallback

### Key Architectural Decisions

- **Firebase singleton boot pattern** — `src/boot/firebase.js` initialises `auth`, `db`, `functions` once; exported for all consumers. Emulator auto-connects in `DEV` mode.
  - *Why:* Prevents duplicate `initializeApp()` calls on hot reload; single source of truth for all Firebase instances.
  - *Phase:* 06

- **Cloud Functions in CommonJS (not ESM)** — `functions/index.js` uses `require()` throughout.
  - *Why:* Node 24 + Firebase Functions v2 defaults to CJS; ESM caused import resolution issues with `firebase-admin`.
  - *Phase:* 06

- **GoogleGenAI instantiated inside handler body** — not at module level.
  - *Why:* `GEMINI_API_KEY.value()` only resolves during function invocation, not at cold-start module init.
  - *Phase:* 08

- **`africa-south1` region for all functions** — matches Firestore database location.
  - *Why:* Reduces cross-region latency; all Cloud Functions and Firestore reads stay in the same region.
  - *Phase:* 08

- **`persistentSingleTabManager` for Firestore offline persistence** — not `persistentMultipleTabManager`.
  - *Why:* SpeakAI is a mobile PWA — users don't open multiple tabs. Multi-tab manager adds overhead unnecessarily.
  - *Phase:* 07

- **`onRequest` for `handlePaymentWebhook`** (not `onCall`).
  - *Why:* MozPayments server cannot send Firebase auth tokens required by `onCall`. Webhook uses HMAC-SHA256 signature verification instead.
  - *Phase:* 10

- **`externalSubscriptionId` stored in `subscriptions/{userId}` during createSubscription.**
  - *Why:* Webhook arrives with only the MozPayments `subscriptionId`, not the Firebase UID. Reverse-lookup via this field maps it back.
  - *Phase:* 10

- **Native Gemini multi-turn `contents` format for `sendMessage`** (not `JSON.stringify(history)` in prompt).
  - *Why:* Proper turn-based context is processed more efficiently by the model; avoids history serialisation overhead; reduces prompt token count.
  - *Phase:* 08 (optimised 2026-03-28)

- **`getCurrentUser()` one-shot Promise wraps `onAuthStateChanged`** for route guard.
  - *Why:* Fixes router guard race condition on hard refresh — without this, the guard runs before Firebase resolves auth state and incorrectly redirects authenticated users to landing.
  - *Phase:* 06

- **Streak calculation in UTC+2 (Mozambique time)** using calendar-day comparison.
  - *Why:* Server runs UTC; user plays at 23:00 local time (= 21:00 UTC). Without TZ offset, the "consecutive day" check breaks at midnight boundaries.
  - *Phase:* 09 (fixed 2026-03-28)

- **`totalMinutesPracticed` field** (not `totalHoursPracticed`).
  - *Why:* Session duration is measured in minutes — storing it in a field named "hours" was a semantic bug. Field renamed to reflect actual unit.
  - *Phase:* 09 (fixed 2026-03-28)

---

## 3. Phases Delivered

### v1.0 — Static UI (foundation)

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 01 | Foundation & Design System | ✅ Complete | Design tokens, routing scaffold, Pinia stores, dark/light theming |
| 02 | Entry Flow | ✅ Complete | LandingPage + 3-step Onboarding wizard with QStepper |
| 03 | Dashboard | ✅ Complete | Stats cards, weekly bar chart, streak counter, FAB — wired to profile store |
| 04 | Session Loop | ✅ Complete | SessionPage with live timer, custom chat bubbles, mic FAB, end-session dialog |
| 05 | Supporting Pages | ✅ Complete | PaywallDialog, ProgressPage, VocabularyPage, ProfilePage — all 4 completed |

### v1.1 — Firebase Backend

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 06 | Firebase Auth | ✅ Complete | Real Google Sign-In, Firebase boot singleton, Firestore security rules, Functions scaffold |
| 07 | Firestore Data Layer | ✅ Complete | All 5 collections live, offline persistence, profile/vocabulary/session stores connected |
| 08 | AI Conversation | ✅ Complete | startConversation + sendMessage Cloud Functions with Gemini; Web Speech API voice input |
| 09 | Session Scoring | ✅ Complete | endSession scores transcripts via Gemini; FeedbackPage reads real scores/mistakes/vocabulary |
| 10 | Payments & Cron | ✅ Complete | MozPayments subscription flow + handlePaymentWebhook + 2 scheduled cron jobs |

---

## 4. Requirements Coverage

### v1.1 Backend Requirements (35 total)

| ID | Description | Status |
|----|-------------|--------|
| INFRA-01 | Firebase SDK initialised via boot file with env vars | ✅ Complete |
| INFRA-02 | Firestore security rules deployed | ✅ Complete |
| INFRA-03 | Cloud Functions scaffolded (Node.js 24, secrets configured) | ✅ Complete |
| AUTH-01 | Real Google Sign-In via Firebase Auth | ✅ Complete |
| AUTH-02 | `users/{userId}` doc created on first sign-in | ✅ Complete |
| AUTH-03 | Auth state persists across page refreshes | ✅ Complete |
| AUTH-04 | Route guard redirects unauthenticated / incomplete users | ✅ Complete |
| AUTH-05 | `useAuthStore` reflects real Firebase Auth state | ✅ Complete |
| DATA-01 | `useProfileStore` reads from Firestore `users/{userId}` | ✅ Complete |
| DATA-02 | DashboardPage shows real stats from Firestore | ✅ Complete |
| DATA-03 | Onboarding completion writes to Firestore | ✅ Complete |
| DATA-04 | ProgressPage reads real `levelProgress`, `averageScore` | ✅ Complete |
| DATA-05 | VocabularyPage reads from `vocabulary/{userId}/words` | ✅ Complete |
| DATA-06 | "Add to Bank" saves vocabulary word to Firestore | ✅ Complete |
| DATA-07 | Firestore offline persistence (IndexedDB) enabled | ✅ Complete |
| DATA-08 | Session metadata synced to Firestore on `startSession()` | ✅ Complete |
| CONV-01 | Web Speech API integrated in SessionPage | ✅ Complete |
| CONV-02 | Text input fallback shown when SpeechRecognition unavailable | ✅ Complete |
| CONV-03 | `startConversation` Cloud Function creates session + returns topic | ✅ Complete |
| CONV-04 | `sendMessage` Cloud Function calls Gemini, updates transcript | ✅ Complete |
| CONV-05 | Paywall gate blocks session start; opens PaywallDialog | ✅ Complete |
| SCORE-01 | `endSession` scores transcript via Gemini, updates user stats | ✅ Complete |
| SCORE-02 | FeedbackPage score rings show real Gemini scores | ✅ Complete |
| SCORE-03 | FeedbackPage Mistakes tab shows real mistakes from Firestore | ✅ Complete |
| SCORE-04 | FeedbackPage Vocabulary tab shows real words; Add to Bank works | ✅ Complete |
| FUNC-01 | `startConversation` HTTPS callable with subscription gate | ✅ Complete |
| FUNC-02 | `sendMessage` HTTPS callable with Gemini conversation | ✅ Complete |
| FUNC-03 | `endSession` HTTPS callable with Gemini scoring | ✅ Complete |
| SUB-01 | `createSubscription` callable creates pending subscription + checkout | ✅ Complete |
| SUB-02 | `handlePaymentWebhook` verifies HMAC-SHA256, activates subscription | ✅ Complete |
| SUB-03 | PaywallDialog wired to `createSubscription` with phoneNumber input | ✅ Complete |
| FUNC-04 | `deleteOldTranscripts` cron (daily 02:00 UTC) | ✅ Complete |
| FUNC-05 | `updateWeeklyLeaderboard` cron (Monday 00:00 UTC) | ✅ Complete |
| FUNC-06 | Firestore security rules deployed for all 5 collections | ✅ Complete |
| FUNC-07 | `sessions.createdAt` Firestore index for cron queries | ✅ Complete |

**Coverage: 35/35 (100%)**

⚠️ **Known assumption:** MozPayments API endpoint (`api.mozpayments.co.mz`, `/v1/checkout`) assumed from TRD spec — flagged in code. Replace when real credentials are confirmed.

---

## 5. Key Decisions Log

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Firebase singleton boot pattern | 06 | Prevents duplicate `initializeApp()`; single source for `auth`, `db`, `functions` |
| CJS (not ESM) for Cloud Functions | 06 | Node 24 + Firebase Functions v2 CJS default; ESM had resolution issues |
| `signInWithPopup` called synchronously (no await before it) | 06 | Prevents mobile browser popup blocking — popup must be triggered within user gesture |
| `getCurrentUser()` one-shot promise for router guard | 06 | Fixes race condition: guard runs before `onAuthStateChanged` fires on hard refresh |
| `isLoading: true` initial state in auth boot | 06 | Prevents premature redirect decisions before first auth event fires |
| `persistentSingleTabManager` | 07 | Mobile PWA — multi-tab manager unnecessary and adds overhead |
| `updateDoc` (not `setDoc`) in OnboardingPage | 07 | `users/{userId}` doc already exists from sign-in; `setDoc` without `merge:true` would wipe all fields |
| `AdminSDK FieldValue.arrayUnion` for transcript | 08 | Functions run server-side with Admin credentials; web SDK not available in Cloud Functions |
| GoogleGenAI instantiated inside handler body | 08 | `GEMINI_API_KEY.value()` resolves only during invocation, not at cold-start |
| `handlePaymentWebhook` uses `onRequest` not `onCall` | 10 | MozPayments server cannot send Firebase auth tokens required by `onCall` |
| `externalSubscriptionId` stored at subscription creation | 10 | Only field available to reverse-lookup userId from MozPayments webhook payload |
| `onSchedule` region in options object (not `setGlobalOptions`) | 10 | Known CJS bug: `setGlobalOptions` does not apply to `onSchedule` |
| Streak in UTC+2 calendar days | 09 | Server is UTC; Mozambique is UTC+2; 48h window was breaking streak logic at midnight |
| `totalMinutesPracticed` field name | 09 | Field stores minutes, not hours — renamed to match actual unit |
| Native Gemini `contents` array + `systemInstruction` | 08 | Removes JSON.stringify history overhead; proper turn-based format; shorter system prompt |

---

## 6. Tech Debt & Deferred Items

### Known Assumptions (flag before production)
- **MozPayments endpoint** — `api.mozpayments.co.mz` and `/v1/checkout` assumed from TRD. Flagged in `functions/index.js` with comment.
- **`rawBody` fallback in webhook** — `req.rawBody || Buffer.from(JSON.stringify(req.body))` allows emulator testing but is NOT production-safe for HMAC — JSON serialisation may differ from raw bytes.
- **`gemini-3.1-pro-preview` model** — model name should be verified against Google's current offering before production deploy.

### Deferred to v2
- Push notifications
- Desktop-optimised layout (currently mobile-first only)
- Real pronunciation phonetic scoring (Web Speech API limitation — no phoneme data)
- E2E / unit tests (deferred post-backend stabilisation)
- `weekData` and SVG fluency chart in ProgressPage are static (Stitch design copy) — dynamic chart requires session history query

### Post-launch hardening (identified 2026-03-28)
- `sendMessage` session validation removed for performance — Firestore update will error on invalid sessionId, but no explicit 404 response is returned to client
- `gsd-template/` directory appeared in repo root (untracked) — review before including in any future commits

---

## 7. Getting Started

### Prerequisites
- Node.js 24+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud project with Blaze plan (required for Cloud Functions)
- `.env.local` with Firebase config vars (see `.env.example`)
- Gemini API key (aistudio.google.com)
- MozPayments API key (for payment flow)

### Run locally
```bash
# Frontend
npx quasar dev

# Cloud Functions (separate terminal)
cd functions && npm install
firebase emulators:start --only functions,firestore,auth
```

### Key directories
```
src/
  pages/          — All 9 app screens (LandingPage, DashboardPage, SessionPage, etc.)
  components/     — PaywallDialog, shared UI
  stores/         — Pinia: auth.js, profile.js, session.js, vocabulary.js
  services/       — Firestore helpers: userProfile.js, vocabulary.js
  boot/           — firebase.js (SDK init + emulator)
  router/         — index.js (route guards, named routes)
functions/
  index.js        — All 7 Cloud Functions (startConversation, sendMessage, endSession,
                    createSubscription, handlePaymentWebhook, deleteOldTranscripts,
                    updateWeeklyLeaderboard)
.planning/
  ROADMAP.md      — Phase breakdown and requirements mapping
  REQUIREMENTS.md — Full requirement list with IDs
  TRD.md          — Technical Requirements Document (authoritative backend spec)
  phases/         — Per-phase PLAN.md, SUMMARY.md, VERIFICATION.md artifacts
```

### Entry points
- **App root:** `src/App.vue` — sets up router and dark mode detection
- **Auth flow:** `src/boot/auth.js` — fires `onAuthStateChanged`, pumps user data into stores
- **Session flow:** `src/stores/session.js` — `startSession()` → `sendMessage()` → `endSession()`
- **Cloud Functions:** `functions/index.js` — single file, all functions exported

### Deploy
```bash
# Deploy frontend (App Hosting)
firebase deploy --only hosting

# Deploy Cloud Functions
firebase deploy --only functions

# Set secrets before first deploy
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set MOZPAYMENTS_API_KEY
```

---

## Stats

- **Timeline:** 2026-02-20 → 2026-03-28 (36 days)
- **Phases:** 10/10 complete (5 v1.0 UI + 5 v1.1 backend)
- **Commits:** ~112 (since first planning commit)
- **Files changed:** 146 files (+35,679 / -398 lines)
- **Contributors:** nicolasmuchate
- **Average plan duration:** ~6 min/plan (v1.1 backend phases)

---

*Milestone: v1.1 backend*
*Completed: 2026-03-28*
*Summary generated by Claude Sonnet 4.6 via /gsd:milestone-summary*
