# Requirements: SpeakAI

**Defined:** 2026-02-20
**Core Value:** Every screen matches the Stitch designs pixel-for-pixel so the UI feels production-ready on mobile before any backend is wired up.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Design token CSS variables (primary #4cae4f, accent-orange #FF6B35, Inter font, border-radius scale) are configured globally and applied to all pages
- [ ] **FOUND-02**: System dark/light mode detection is implemented — app theme follows OS preference automatically
- [ ] **FOUND-03**: Mobile-first container (max-width 430px, centered) is applied globally matching Stitch viewport
- [ ] **FOUND-04**: Vue Router is configured with named routes for all pages and guards mock-auth flow
- [ ] **FOUND-05**: Pinia stores are created for mock auth state, session state, and user profile (hardcoded mock data)
- [ ] **FOUND-06**: Axios boot file is replaced/stripped — no real HTTP calls; all data is mocked inline

### Landing

- [x] **LAND-01**: User can view landing/sign-in page matching Stitch `sign_in_to_speakai` design (logo, headline, tagline)
- [x] **LAND-02**: User can tap Google Sign-In button which navigates to onboarding (mocked — no real OAuth)

### Onboarding

- [x] **ONBD-01**: User can view 3-step onboarding wizard implemented with QStepper matching Stitch welcome/assessment designs
- [x] **ONBD-02**: User can complete Assessment step (language level quiz with selectable options)
- [x] **ONBD-03**: User can complete First Session intro step (explains the app flow)
- [x] **ONBD-04**: User can view Level Result step showing assessed level and proceeds to Dashboard

### Dashboard

- [ ] **DASH-01**: User can view Dashboard with stats cards (total sessions, streak days, vocabulary learned) matching Stitch `home_dashboard` design
- [ ] **DASH-02**: User can view weekly activity bar chart with mock data
- [ ] **DASH-03**: User can view streak counter prominently displayed
- [ ] **DASH-04**: User can tap QFab "Start Session" button which navigates to Session screen

### Session

- [ ] **SESS-01**: User can view Session screen with QChatMessage transcript (alternating user/AI messages, mock conversation) matching Stitch `active_session` design
- [ ] **SESS-02**: User can view mic button (UI only — tapping toggles active visual state; no real audio recording)
- [ ] **SESS-03**: User can view live session timer counting up
- [ ] **SESS-04**: User can view mistake counter incrementing with mock data
- [ ] **SESS-05**: User can end session which navigates to Feedback screen

### Feedback

- [ ] **FEED-01**: User can view Feedback screen with animated score circle displaying overall score, matching Stitch `session_feedback` design
- [ ] **FEED-02**: User can switch between Pronunciation, Grammar, and Vocabulary tabs using QTabs
- [ ] **FEED-03**: User can view detailed feedback items per tab (mock corrections and tips)
- [ ] **FEED-04**: User can navigate back to Dashboard from Feedback screen

### Paywall

- [ ] **PAYW-01**: User can view Paywall modal (QDialog) with subscription headline and feature list matching Stitch `upgrade_to_pro` design
- [ ] **PAYW-02**: User can view pricing tiers (monthly / annual) in paywall modal
- [ ] **PAYW-03**: User can dismiss paywall modal and return to previous screen

### Your Progress

- [ ] **PROG-01**: User can view Your Progress page with session history stats matching Stitch `your_progress` design
- [ ] **PROG-02**: User can view progress charts and improvement metrics (mock data)

### Vocabulary Bank

- [ ] **VOCAB-01**: User can view Vocabulary Bank page with saved words list (new page built from design system — no Stitch source)
- [ ] **VOCAB-02**: User can view each word entry with definition, example sentence, and difficulty badge

### Profile & Settings

- [ ] **PROF-01**: User can view Profile/Settings page matching Stitch `account_settings` design (avatar, display name, level badge)
- [ ] **PROF-02**: User can view and interact with settings toggles (notifications, dark mode override, sound — UI only, no persistence)

## v1.1 Requirements — Backend (Firebase)

**Milestone:** v1.1 backend
**Defined:** 2026-02-23
**TRD Reference:** /TRD.md

### Infrastructure

- [x] **INFRA-01**: Firebase SDK is initialized via `src/boot/firebase.js` with env vars for `apiKey`, `authDomain`, `projectId`, `appId` loaded from `.env` / `.env.local`
- [ ] **INFRA-02**: Firestore security rules from TRD are deployed (users / sessions / vocabulary / leaderboard / subscriptions / system_config collections)
- [ ] **INFRA-03**: Cloud Functions project is scaffolded in `functions/` directory (Node.js 18, `firebase-admin`, `@google/generative-ai`) with Gemini and MozPayments API keys in Functions config

### Authentication

- [ ] **AUTH-01**: User can sign in with a real Google account via Firebase Auth — replaces mock sign-in navigation in LandingPage.vue
- [ ] **AUTH-02**: Firestore `users/{userId}` document is created on first sign-in with default fields from TRD schema (email, displayName, photoURL, currentLevel, onboardingCompleted: false, subscriptionStatus: "none", etc.)
- [x] **AUTH-03**: Auth state persists across page refreshes — Firebase Auth SDK handles token refresh automatically
- [ ] **AUTH-04**: Route guard redirects unauthenticated users to `/` (landing); redirects authenticated users with `onboardingCompleted == false` to `/onboarding`
- [ ] **AUTH-05**: `useAuthStore` reflects real Firebase Auth state (`uid`, `email`, `displayName`, `photoURL`, `isAuthenticated`) and replaces mock auth values

### Firestore Data Layer

- [ ] **DATA-01**: `useProfileStore` reads user document from Firestore `users/{userId}` on auth — replaces all hardcoded mock data (streak, level, session count, vocab count)
- [ ] **DATA-02**: DashboardPage displays real stats (`dailyStreak`, `totalSessionsCompleted`, `totalVocabularyWords`) from Firestore user document
- [ ] **DATA-03**: Onboarding completion writes initial user document to Firestore (`currentLevel`, `levelProgress: 0`, `onboardingCompleted: true`, `createdAt`, `freeSessionUsed: false`)
- [ ] **DATA-04**: ProgressPage reads real user progress (`levelProgress`, `averageScore`, `totalHoursPracticed`, `currentLevel`) from Firestore
- [ ] **DATA-05**: VocabularyPage reads words from `vocabulary/{userId}/words` subcollection in Firestore — replaces hardcoded word array
- [ ] **DATA-06**: User can save a word to vocabulary bank from FeedbackPage — writes to `vocabulary/{userId}/words/{wordId}` in Firestore
- [ ] **DATA-07**: Firestore offline persistence is enabled via `enableIndexedDbPersistence()` — dashboard data is viewable offline from cache
- [ ] **DATA-08**: `useSessionStore` syncs active session metadata to Firestore `sessions/{sessionId}` document (topic, userId, userLevel, createdAt)

### Voice & AI Conversation

- [ ] **CONV-01**: Web Speech API (`SpeechRecognition`) is integrated in SessionPage — mic button starts real voice recognition (`lang: 'en-US'`, `continuous: false`, `interimResults: true`)
- [ ] **CONV-02**: Text input fallback (`QInput` + send button) is shown in SessionPage when `SpeechRecognition` is unavailable (non-Chrome/Edge browsers)
- [ ] **CONV-03**: `startConversation` Cloud Function is called when session begins — creates session document in Firestore, returns AI-generated topic and opening message via Gemini
- [ ] **CONV-04**: `sendMessage` Cloud Function is called for each user message — sends message + conversation history to Gemini (last 10 messages), returns AI response and detected mistakes; session transcript updated in Firestore
- [ ] **CONV-05**: Paywall gate in SessionPage prevents session start if `freeSessionUsed == true` and `subscriptionStatus != "active"` — opens PaywallDialog instead

### Session Scoring & Feedback

- [ ] **SCORE-01**: `endSession` Cloud Function is called when user ends session — sends full transcript to Gemini for scoring (fluency / grammar / vocabulary / overall), updates user stats (`totalHoursPracticed`, `averageScore`, `dailyStreak`, `totalSessionsCompleted`) in Firestore
- [ ] **SCORE-02**: FeedbackPage reads real scores (`fluency`, `grammar`, `vocabulary`, `overall`) from Firestore `sessions/{sessionId}` — replaces hardcoded score values
- [ ] **SCORE-03**: FeedbackPage Mistakes tab displays real grammar and pronunciation mistakes array from Firestore session document
- [ ] **SCORE-04**: FeedbackPage Vocabulary tab displays real `newVocabulary` array from Firestore session document; user can tap "Add to Bank" to save each word (triggers DATA-06)

### Cloud Functions

- [ ] **FUNC-01**: `startConversation` HTTPS callable — validates subscription gate (sessionNumber > 1 requires active subscription), calls Gemini topic-assignment prompt, creates `sessions/{sessionId}` doc, returns `{ sessionId, topic, initialMessage }`
- [ ] **FUNC-02**: `sendMessage` HTTPS callable — validates session active, calls Gemini conversation prompt with history (last 10 messages), parses JSON response for `{ response, mistakes, newVocabulary }`, appends to Firestore transcript, returns parsed response
- [ ] **FUNC-03**: `endSession` HTTPS callable — calls Gemini to score full transcript (fluency/grammar/vocabulary/overall), updates session `scores` and `completedAt` in Firestore, updates user stats document, updates leaderboard entry for current week, returns `{ scores, feedback }`
- [ ] **FUNC-04**: `createSubscription` HTTPS callable — creates `subscriptions/{userId}` doc with `status: "pending"`, calls MozPayments API to create checkout session, returns `{ checkoutUrl, subscriptionId }`
- [ ] **FUNC-05**: `handlePaymentWebhook` HTTPS function — verifies HMAC-SHA256 webhook signature (MozPayments secret), on `payment.success` updates subscription doc to `status: "active"` with `expiresAt: now + 30 days`, updates `users/{userId}.subscriptionStatus: "active"`, appends payment to `paymentHistory`
- [ ] **FUNC-06**: `deleteOldTranscripts` scheduled function (daily 02:00 UTC) — batch-queries sessions where `createdAt < now - 30 days`, removes `transcript` field (batch delete 500 at a time), preserves scores/mistakes
- [ ] **FUNC-07**: `updateWeeklyLeaderboard` scheduled function (Monday 00:00 UTC) — queries top 100 users by `weeklySessionTime`, calculates final ranks, archives to `leaderboard_archive/{weekId}`, creates new week doc with reset stats

### Payments & Subscriptions

- [ ] **SUB-01**: PaywallDialog reads real `subscriptionStatus` from `useProfileStore` — dialog trigger in DashboardPage shows only when `subscriptionStatus != "active"`
- [ ] **SUB-02**: User can initiate subscription from PaywallDialog — "Subscribe Now" calls `createSubscription` Cloud Function and redirects to the returned `checkoutUrl` (MozPayments hosted page)
- [ ] **SUB-03**: Webhook confirmation activates subscription — after `handlePaymentWebhook` runs, Firestore `users/{userId}.subscriptionStatus` is `"active"` and user can start unlimited sessions

## Out of Scope (v1.1)

| Feature | Reason |
|---------|--------|
| Push notifications | v2 feature — requires additional Firebase setup |
| Desktop-optimized layout | Mobile-first (430px); responsive to tablet only |
| E2E / unit tests | Deferred until backend is stable |
| Internationalization | English only |
| Stripe production integration | Stripe test mode only; MozPayments is primary |
| Real pronunciation phonetic scoring | Web Speech API doesn't provide phonetic data; Gemini simulates |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| LAND-01 | Phase 2 | Complete |
| LAND-02 | Phase 2 | Complete |
| ONBD-01 | Phase 2 | Complete |
| ONBD-02 | Phase 2 | Complete |
| ONBD-03 | Phase 2 | Complete |
| ONBD-04 | Phase 2 | Complete |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| DASH-04 | Phase 3 | Pending |
| SESS-01 | Phase 4 | Pending |
| SESS-02 | Phase 4 | Pending |
| SESS-03 | Phase 4 | Pending |
| SESS-04 | Phase 4 | Pending |
| SESS-05 | Phase 4 | Pending |
| FEED-01 | Phase 4 | Pending |
| FEED-02 | Phase 4 | Pending |
| FEED-03 | Phase 4 | Pending |
| FEED-04 | Phase 4 | Pending |
| PAYW-01 | Phase 5 | Pending |
| PAYW-02 | Phase 5 | Pending |
| PAYW-03 | Phase 5 | Pending |
| PROG-01 | Phase 5 | Pending |
| PROG-02 | Phase 5 | Pending |
| VOCAB-01 | Phase 5 | Pending |
| VOCAB-02 | Phase 5 | Pending |
| PROF-01 | Phase 5 | Pending |
| PROF-02 | Phase 5 | Pending |

**v1.0 Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 (complete coverage)

**v1.1 Traceability** (updated during roadmap creation):

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 6 | Complete |
| INFRA-02 | Phase 6 | Pending |
| INFRA-03 | Phase 6 | Pending |
| AUTH-01 | Phase 6 | Pending |
| AUTH-02 | Phase 6 | Pending |
| AUTH-03 | Phase 6 | Complete |
| AUTH-04 | Phase 6 | Pending |
| AUTH-05 | Phase 6 | Pending |
| DATA-01 | Phase 7 | Pending |
| DATA-02 | Phase 7 | Pending |
| DATA-03 | Phase 7 | Pending |
| DATA-04 | Phase 7 | Pending |
| DATA-05 | Phase 7 | Pending |
| DATA-06 | Phase 7 | Pending |
| DATA-07 | Phase 7 | Pending |
| DATA-08 | Phase 7 | Pending |
| CONV-01 | Phase 8 | Pending |
| CONV-02 | Phase 8 | Pending |
| CONV-03 | Phase 8 | Pending |
| CONV-04 | Phase 8 | Pending |
| CONV-05 | Phase 8 | Pending |
| FUNC-01 | Phase 8 | Pending |
| FUNC-02 | Phase 8 | Pending |
| SCORE-01 | Phase 9 | Pending |
| SCORE-02 | Phase 9 | Pending |
| SCORE-03 | Phase 9 | Pending |
| SCORE-04 | Phase 9 | Pending |
| FUNC-03 | Phase 9 | Pending |
| SUB-01 | Phase 10 | Pending |
| SUB-02 | Phase 10 | Pending |
| SUB-03 | Phase 10 | Pending |
| FUNC-04 | Phase 10 | Pending |
| FUNC-05 | Phase 10 | Pending |
| FUNC-06 | Phase 10 | Pending |
| FUNC-07 | Phase 10 | Pending |

**v1.1 Coverage:**
- v1.1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 (complete coverage)

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-23 after v1.1 backend milestone start*
