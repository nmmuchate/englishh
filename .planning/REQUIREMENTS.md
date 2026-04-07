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
- [x] **INFRA-02**: Firestore security rules from TRD are deployed (users / sessions / vocabulary / leaderboard / subscriptions / system_config collections)
- [x] **INFRA-03**: Cloud Functions project is scaffolded in `functions/` directory (Node.js 18, `firebase-admin`, `@google/generative-ai`) with Gemini and MozPayments API keys in Functions config

### Authentication

- [ ] **AUTH-01**: User can sign in with a real Google account via Firebase Auth — replaces mock sign-in navigation in LandingPage.vue
- [ ] **AUTH-02**: Firestore `users/{userId}` document is created on first sign-in with default fields from TRD schema (email, displayName, photoURL, currentLevel, onboardingCompleted: false, subscriptionStatus: "none", etc.)
- [x] **AUTH-03**: Auth state persists across page refreshes — Firebase Auth SDK handles token refresh automatically
- [ ] **AUTH-04**: Route guard redirects unauthenticated users to `/` (landing); redirects authenticated users with `onboardingCompleted == false` to `/onboarding`
- [ ] **AUTH-05**: `useAuthStore` reflects real Firebase Auth state (`uid`, `email`, `displayName`, `photoURL`, `isAuthenticated`) and replaces mock auth values

### Firestore Data Layer

- [x] **DATA-01**: `useProfileStore` reads user document from Firestore `users/{userId}` on auth — replaces all hardcoded mock data (streak, level, session count, vocab count)
- [x] **DATA-02**: DashboardPage displays real stats (`dailyStreak`, `totalSessionsCompleted`, `totalVocabularyWords`) from Firestore user document
- [x] **DATA-03**: Onboarding completion writes initial user document to Firestore (`currentLevel`, `levelProgress: 0`, `onboardingCompleted: true`, `createdAt`, `freeSessionUsed: false`)
- [x] **DATA-04**: ProgressPage reads real user progress (`levelProgress`, `averageScore`, `totalHoursPracticed`, `currentLevel`) from Firestore
- [x] **DATA-05**: VocabularyPage reads words from `vocabulary/{userId}/words` subcollection in Firestore — replaces hardcoded word array
- [x] **DATA-06**: User can save a word to vocabulary bank from FeedbackPage — writes to `vocabulary/{userId}/words/{wordId}` in Firestore
- [x] **DATA-07**: Firestore offline persistence is enabled via `enableIndexedDbPersistence()` — dashboard data is viewable offline from cache
- [x] **DATA-08**: `useSessionStore` syncs active session metadata to Firestore `sessions/{sessionId}` document (topic, userId, userLevel, createdAt)

### Voice & AI Conversation

- [x] **CONV-01**: Web Speech API (`SpeechRecognition`) is integrated in SessionPage — mic button starts real voice recognition (`lang: 'en-US'`, `continuous: false`, `interimResults: true`)
- [x] **CONV-02**: Text input fallback (`QInput` + send button) is shown in SessionPage when `SpeechRecognition` is unavailable (non-Chrome/Edge browsers)
- [x] **CONV-03**: `startConversation` Cloud Function is called when session begins — creates session document in Firestore, returns AI-generated topic and opening message via Gemini
- [x] **CONV-04**: `sendMessage` Cloud Function is called for each user message — sends message + conversation history to Gemini (last 10 messages), returns AI response and detected mistakes; session transcript updated in Firestore
- [x] **CONV-05**: Paywall gate in SessionPage prevents session start if `freeSessionUsed == true` and `subscriptionStatus != "active"` — opens PaywallDialog instead

### Session Scoring & Feedback

- [x] **SCORE-01**: `endSession` Cloud Function is called when user ends session — sends full transcript to Gemini for scoring (fluency / grammar / vocabulary / overall), updates user stats (`totalHoursPracticed`, `averageScore`, `dailyStreak`, `totalSessionsCompleted`) in Firestore
- [ ] **SCORE-02**: FeedbackPage reads real scores (`fluency`, `grammar`, `vocabulary`, `overall`) from Firestore `sessions/{sessionId}` — replaces hardcoded score values
- [ ] **SCORE-03**: FeedbackPage Mistakes tab displays real grammar and pronunciation mistakes array from Firestore session document
- [ ] **SCORE-04**: FeedbackPage Vocabulary tab displays real `newVocabulary` array from Firestore session document; user can tap "Add to Bank" to save each word (triggers DATA-06)

### Cloud Functions

- [x] **FUNC-01**: `startConversation` HTTPS callable — validates subscription gate (sessionNumber > 1 requires active subscription), calls Gemini topic-assignment prompt, creates `sessions/{sessionId}` doc, returns `{ sessionId, topic, initialMessage }`
- [x] **FUNC-02**: `sendMessage` HTTPS callable — validates session active, calls Gemini conversation prompt with history (last 10 messages), parses JSON response for `{ response, mistakes, newVocabulary }`, appends to Firestore transcript, returns parsed response
- [x] **FUNC-03**: `endSession` HTTPS callable — calls Gemini to score full transcript (fluency/grammar/vocabulary/overall), updates session `scores` and `completedAt` in Firestore, updates user stats document, updates leaderboard entry for current week, returns `{ scores, feedback }`
- [x] **FUNC-04**: `createSubscription` HTTPS callable — creates `subscriptions/{userId}` doc with `status: "pending"`, calls MozPayments API to create checkout session, returns `{ checkoutUrl, subscriptionId }`
- [x] **FUNC-05**: `handlePaymentWebhook` HTTPS function — verifies HMAC-SHA256 webhook signature (MozPayments secret), on `payment.success` updates subscription doc to `status: "active"` with `expiresAt: now + 30 days`, updates `users/{userId}.subscriptionStatus: "active"`, appends payment to `paymentHistory`
- [x] **FUNC-06**: `deleteOldTranscripts` scheduled function (daily 02:00 UTC) — batch-queries sessions where `createdAt < now - 30 days`, removes `transcript` field (batch delete 500 at a time), preserves scores/mistakes
- [x] **FUNC-07**: `updateWeeklyLeaderboard` scheduled function (Monday 00:00 UTC) — queries top 100 users by `weeklySessionTime`, calculates final ranks, archives to `leaderboard_archive/{weekId}`, creates new week doc with reset stats

### Payments & Subscriptions

- [x] **SUB-01**: PaywallDialog reads real `subscriptionStatus` from `useProfileStore` — dialog trigger in DashboardPage shows only when `subscriptionStatus != "active"`
- [x] **SUB-02**: User can initiate subscription from PaywallDialog — "Subscribe Now" calls `createSubscription` Cloud Function and redirects to the returned `checkoutUrl` (MozPayments hosted page)
- [x] **SUB-03**: Webhook confirmation activates subscription — after `handlePaymentWebhook` runs, Firestore `users/{userId}.subscriptionStatus` is `"active"` and user can start unlimited sessions

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
| INFRA-02 | Phase 6 | Complete |
| INFRA-03 | Phase 6 | Complete |
| AUTH-01 | Phase 6 | Pending |
| AUTH-02 | Phase 6 | Pending |
| AUTH-03 | Phase 6 | Complete |
| AUTH-04 | Phase 6 | Pending |
| AUTH-05 | Phase 6 | Pending |
| DATA-01 | Phase 7 | Complete |
| DATA-02 | Phase 7 | Complete |
| DATA-03 | Phase 7 | Complete |
| DATA-04 | Phase 7 | Complete |
| DATA-05 | Phase 7 | Complete |
| DATA-06 | Phase 7 | Complete |
| DATA-07 | Phase 7 | Complete |
| DATA-08 | Phase 7 | Complete |
| CONV-01 | Phase 8 | Complete |
| CONV-02 | Phase 8 | Complete |
| CONV-03 | Phase 8 | Complete |
| CONV-04 | Phase 8 | Complete |
| CONV-05 | Phase 8 | Complete |
| FUNC-01 | Phase 8 | Complete |
| FUNC-02 | Phase 8 | Complete |
| SCORE-01 | Phase 9 | Complete |
| SCORE-02 | Phase 9 | Pending |
| SCORE-03 | Phase 9 | Pending |
| SCORE-04 | Phase 9 | Pending |
| FUNC-03 | Phase 9 | Complete |
| SUB-01 | Phase 10 | Complete |
| SUB-02 | Phase 10 | Complete |
| SUB-03 | Phase 10 | Complete |
| FUNC-04 | Phase 10 | Complete |
| FUNC-05 | Phase 10 | Complete |
| FUNC-06 | Phase 10 | Complete |
| FUNC-07 | Phase 10 | Complete |

**v1.1 Coverage:**
- v1.1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 (complete coverage)

## v1.2 Requirements — Onboarding Assessment & Immersion Learning

**Milestone:** v1.2 Onboarding Assessment & Immersion Learning
**Defined:** 2026-04-06
**PRD Reference:** /SpeakAI-Onboarding-Immersion-PRD.md

### Placement Test (PLACE)

- [x] **PLACE-01**: User can complete Quick Profile (occupation, interests, goal, prior experience)
- [x] **PLACE-02**: User can take adaptive Vocabulary & Reading test (6-8 questions + 1 passage, adaptive difficulty)
- [ ] **PLACE-03**: User can take Listening test with browser TTS audio (3 tasks, adaptive difficulty)
- [x] **PLACE-04**: User can take Grammar test (error-spotting + sentence completion, adaptive difficulty)
- [ ] **PLACE-05**: User can take Speaking test (3-4 AI exchange mini-conversation via Web Speech API)
- [ ] **PLACE-06**: User can complete Writing task (1 prompt, 2-3 sentence response)
- [ ] **PLACE-07**: User sees Results screen with overall CEFR level + per-skill breakdown + radar chart
- [x] **PLACE-08**: Test questions generated dynamically via GPT-4o-mini (`generateTestQuestions` Cloud Function)
- [ ] **PLACE-09**: Speaking + writing evaluated by AI (`evaluateSpeakingTest` Cloud Function)
- [ ] **PLACE-10**: All stage scores combined into final CEFR placement (`calculatePlacement` Cloud Function)
- [x] **PLACE-11**: Placement data stored in Firestore (`placementTests` collection + extended `users` doc)
- [ ] **PLACE-12**: User can skip any stage (defaults to B1; partial progress saved)

### Session Types (SESSION)

- [ ] **SESSION-01**: User can view available session types with lock states (`SessionTypeSelectPage`)
- [ ] **SESSION-02**: User can view pre-session briefing (role, context, objectives) before starting (`ScenarioBriefPage`)
- [ ] **SESSION-03**: Free Talk session type available (open conversation on a topic from user's life)
- [ ] **SESSION-04**: Scenario session type available (role-play a real-world situation personalised to user's field)
- [ ] **SESSION-05**: Story Builder session type available (narrate/continue a story with AI prompts)
- [ ] **SESSION-06**: Debate session type available (user argues position; AI takes opposing view)
- [ ] **SESSION-07**: Session types gated by CEFR level (A1-A2: Free Talk + Scenario only; B1+: all 4)
- [ ] **SESSION-08**: AI session plan generated from profile + skill gaps + history (`generateSessionPlan` Cloud Function)

### Progression & Learning (PROG)

- [ ] **PROG-v12-01**: Per-skill progress tracked independently (6 skills: vocabulary, reading, listening, grammar, speaking, writing)
- [ ] **PROG-v12-02**: User levels up per skill when rolling 10-session performance meets next-level criteria
- [ ] **PROG-v12-03**: Mistake patterns tracked (occurrences, corrections, active/resolved status)
- [ ] **PROG-v12-04**: AI recycles active mistake patterns in future session plans until resolved
- [ ] **PROG-v12-05**: Weekly review session generated incorporating week's mistake patterns (`getWeeklyReview` Cloud Function)

### Free Tier & Funnel (FREE)

- [ ] **FREE-01**: Placement test is always free (no gate)
- [ ] **FREE-02**: First session is fully free with all features enabled
- [ ] **FREE-03**: Sessions 2+ require Pro subscription — post-session paywall shows achievement summary + subscribe CTA
- [ ] **FREE-04**: Free users retain read-only vocabulary bank from trial session
- [ ] **FREE-05**: Free users can retake placement test once per month
- [ ] **FREE-06**: Pro gate enforced on: additional sessions, session type variety, personalised scenarios, review sessions, full progress tracking

### Dashboard & Progress Redesign (DASH)

- [ ] **DASH-v12-01**: Dashboard shows real skill data — skill radar mini-chart + next recommended session card
- [ ] **DASH-v12-02**: ProgressPage shows per-skill trend charts (real data replacing static SVG)
- [ ] **DASH-v12-03**: ProgressPage shows active mistake patterns list (`MistakePatternCard` component)

### Infrastructure (INFRA)

- [x] **INFRA-v12-01**: `placement.js` Pinia store manages placement test state (currentStage, stageResults, adaptiveLevel, finalResult)
- [x] **INFRA-v12-02**: `learning.js` Pinia store manages learning path (recommendedSession, skillProgress, mistakePatterns, weeklyGoal)
- [ ] **INFRA-v12-03**: `scenarioLibrary` Firestore collection stores scenario templates (pre-generated per field/interest)
- [x] **INFRA-v12-04**: `users/{uid}` extended with profile, placement, mistakePatterns, sessionTypesCompleted fields

## Out of Scope (v1.2)

| Feature | Reason |
|---------|--------|
| Real-time feedback enhancements | Separate PRD — deferred to v1.3 |
| Azure TTS for listening audio | Browser speechSynthesis sufficient for MVP |
| Word-by-word pronunciation scoring | Web Speech API limitation |
| Weekly progress email | v2 feature |
| Writing skill as separate UI stage | Assessed via Cloud Function; included in results only |

**v1.2 Traceability** (updated during roadmap creation):

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLACE-01 | Phase 12 | Complete |
| PLACE-02 | Phase 13 | Complete |
| PLACE-03 | Phase 14 | Pending |
| PLACE-04 | Phase 13 | Complete |
| PLACE-05 | Phase 15 | Pending |
| PLACE-06 | Phase 15 | Pending |
| PLACE-07 | Phase 15 | Pending |
| PLACE-08 | Phase 13 | Complete |
| PLACE-09 | Phase 15 | Pending |
| PLACE-10 | Phase 15 | Pending |
| PLACE-11 | Phase 12 | Complete |
| PLACE-12 | Phase 15 | Pending |
| SESSION-01 | Phase 16 | Pending |
| SESSION-02 | Phase 16 | Pending |
| SESSION-03 | Phase 16 | Pending |
| SESSION-04 | Phase 16 | Pending |
| SESSION-05 | Phase 16 | Pending |
| SESSION-06 | Phase 16 | Pending |
| SESSION-07 | Phase 16 | Pending |
| SESSION-08 | Phase 16 | Pending |
| PROG-v12-01 | Phase 17 | Pending |
| PROG-v12-02 | Phase 17 | Pending |
| PROG-v12-03 | Phase 17 | Pending |
| PROG-v12-04 | Phase 17 | Pending |
| PROG-v12-05 | Phase 17 | Pending |
| FREE-01 | Phase 18 | Pending |
| FREE-02 | Phase 18 | Pending |
| FREE-03 | Phase 18 | Pending |
| FREE-04 | Phase 18 | Pending |
| FREE-05 | Phase 18 | Pending |
| FREE-06 | Phase 18 | Pending |
| DASH-v12-01 | Phase 19 | Pending |
| DASH-v12-02 | Phase 19 | Pending |
| DASH-v12-03 | Phase 19 | Pending |
| INFRA-v12-01 | Phase 11 | Complete |
| INFRA-v12-02 | Phase 11 | Complete |
| INFRA-v12-03 | Phase 11 | Pending |
| INFRA-v12-04 | Phase 11 | Complete |

**v1.2 Coverage:**
- v1.2 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 (complete coverage)

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-04-06 after v1.2 roadmap created (Phases 11-19)*
