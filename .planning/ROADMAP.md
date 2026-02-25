# Roadmap: SpeakAI

## Overview

**v1.0 (Phases 1-5):** Converted the Quasar/Vue 3 scaffold into a pixel-perfect, fully-navigable English conversation practice PWA using static mock data.

**v1.1 (Phases 6-10):** Wires a real Firebase backend into the existing UI — replacing all mock data with Firestore, mock auth with Firebase Auth, conversation bubbles with Gemini AI via Cloud Functions, mic button with Web Speech API, and the paywall dialog with real MozPayments subscriptions.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Design system, routing, stores, and mock data infrastructure
- [x] **Phase 2: Entry Flow** - Landing page and 3-step onboarding wizard
- [x] **Phase 3: Dashboard** - Main hub with stats, chart, streak, and session start
- [x] **Phase 4: Session Loop** - Active session screen and post-session feedback screen
- [x] **Phase 5: Supporting Pages** - Paywall modal, Your Progress, Vocabulary Bank, Profile/Settings

*— v1.0 complete — v1.1 backend below —*

- [x] **Phase 6: Firebase Auth & Infrastructure** - SDK setup, real Google Sign-In, Firestore user docs, route guards (completed 2026-02-24)
- [x] **Phase 7: Firestore Data Layer** - All Pinia stores connected to Firestore, all pages read real data, offline persistence (completed 2026-02-24)
- [ ] **Phase 8: AI Conversation Engine** - Cloud Functions (startConversation + sendMessage), Web Speech API, Gemini integration
- [ ] **Phase 9: Session Scoring & Real Feedback** - Cloud Function endSession, FeedbackPage reads real data, vocabulary save
- [ ] **Phase 10: Payments, Subscriptions & Cron Jobs** - MozPayments integration, webhook handler, scheduled cleanup functions

## Phase Details

### Phase 1: Foundation
**Goal**: The app shell is ready — design tokens, dark/light theming, mobile container, routing skeleton, Pinia stores, and stripped mock data layer are all in place so every subsequent phase can build on a consistent base
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. The app renders with the correct primary green (#4cae4f) and accent orange (#FF6B35) and Inter font on every page
  2. The app automatically applies dark theme when the OS is in dark mode and light theme otherwise, with no manual toggle needed
  3. All page content is constrained to a max-width 430px centered column on any screen size
  4. Navigating directly to any named route (landing, onboarding, dashboard, session, feedback) resolves to the correct page component without a 404
  5. No network requests are made — the app loads and runs fully offline with hardcoded mock data
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Configure design tokens, Inter font, dark mode, FOUC fix (quasar.config.js + index.html + app.css)
- [x] 01-02-PLAN.md — Two-layout routing, MainLayout rewrite with bottom nav, FullscreenLayout, 8 page stubs
- [x] 01-03-PLAN.md — Three Pinia stores (auth/profile/session) with mock data, axios boot stripped
- [x] 01-04-PLAN.md — Human verification checkpoint for all 6 FOUND requirements

### Phase 2: Entry Flow
**Goal**: A new user can open the app, see the branded sign-in screen, tap "Sign In with Google", and complete the 3-step onboarding wizard to arrive at the Dashboard
**Depends on**: Phase 1
**Requirements**: LAND-01, LAND-02, ONBD-01, ONBD-02, ONBD-03, ONBD-04
**Success Criteria** (what must be TRUE):
  1. User sees a landing screen with SpeakAI logo, headline, tagline, and a Google Sign-In button that matches the Stitch sign_in_to_speakai design
  2. Tapping the Google Sign-In button navigates immediately to onboarding (no real OAuth prompt, no error)
  3. User sees a 3-step QStepper with Assessment, First Session, and Level Result steps, visually matching the Stitch welcome/assessment designs
  4. User can select language level options in the Assessment step and advance through all three steps in sequence
  5. Completing the Level Result step navigates the user to the Dashboard
**Plans**: TBD

Plans:
- [x] 02-01: Build LandingPage.vue matching Stitch sign_in_to_speakai design with mock sign-in navigation
- [x] 02-02: Build OnboardingPage.vue with QStepper (Assessment, FirstSession, LevelResult steps) matching Stitch designs

### Phase 3: Dashboard
**Goal**: The Dashboard is the app's home — users land here after onboarding and see their stats, weekly chart, streak, and can launch a new session
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. User sees stats cards for total sessions, streak days, and vocabulary learned with mock numbers, matching the Stitch home_dashboard design
  2. User sees a weekly activity bar chart populated with mock data
  3. User sees a streak counter displayed prominently on the dashboard
  4. Tapping the QFab "Start Session" button navigates to the Session screen
**Plans**: 1 plan

Plans:
- [x] 03-01-PLAN.md — Build DashboardPage.vue with stats cards, weekly bar chart, streak counter, and QFab navigation matching Stitch home_dashboard

### Phase 4: Session Loop
**Goal**: The core product loop works end-to-end — user starts a session, sees a live conversation transcript with timer and mistake counter, ends the session, and receives a scored feedback report with tab-based detail
**Depends on**: Phase 3
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, FEED-01, FEED-02, FEED-03, FEED-04
**Success Criteria** (what must be TRUE):
  1. User sees a Session screen with alternating user/AI QChatMessage bubbles, a mic button, a running timer, and a mistake counter, matching the Stitch active_session design
  2. Tapping the mic button toggles a visible active/inactive visual state (no audio recording occurs)
  3. Tapping "End Session" navigates to the Feedback screen
  4. User sees a Feedback screen with an animated score circle and overall score, matching the Stitch session_feedback design
  5. User can switch between Pronunciation, Grammar, and Vocabulary QTabs and see mock feedback items in each tab
  6. User can navigate back to Dashboard from the Feedback screen
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Build SessionPage.vue with chat transcript, mic toggle, live timer, mistake counter, and end-session navigation
- [x] 04-02-PLAN.md — Build FeedbackPage.vue with CSS conic-gradient score circle, QTabs (Overview/Mistakes/Vocabulary), mock feedback items, and dashboard navigation

### Phase 5: Supporting Pages
**Goal**: The remaining screens complete the full app — paywall modal, progress history, vocabulary bank, and profile/settings — so every Stitch screen is represented and the app feels production-complete
**Depends on**: Phase 4
**Requirements**: PAYW-01, PAYW-02, PAYW-03, PROG-01, PROG-02, VOCAB-01, VOCAB-02, PROF-01, PROF-02
**Success Criteria** (what must be TRUE):
  1. A Paywall QDialog can be triggered, shows subscription headline, feature list, and monthly/annual pricing tiers matching the Stitch upgrade_to_pro design, and can be dismissed to return to the previous screen
  2. User can view a Your Progress page with session history stats and improvement metrics (mock data) matching the Stitch your_progress design
  3. User can view a Vocabulary Bank page listing saved words with definition, example sentence, and difficulty badge for each entry
  4. User can view a Profile/Settings page with avatar, display name, and level badge matching the Stitch account_settings design
  5. Settings toggles (notifications, dark mode override, sound) are visible and interactive in the UI with no persistence errors
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md — Build PaywallDialog.vue (QDialog) with pricing tiers and dismiss behavior; wire Go Pro chip trigger into DashboardPage.vue
- [x] 05-02-PLAN.md — Build ProgressPage.vue matching Stitch your_progress design with level badge, SVG fluency chart, and vocab mini-section
- [x] 05-03-PLAN.md — Build VocabularyPage.vue with 8 mock word entries (definition, example, difficulty badge, POS badge)
- [x] 05-04-PLAN.md — Build ProfilePage.vue matching Stitch account_settings design with initials avatar, menu groups, and QToggle rows

### Phase 6: Firebase Auth & Infrastructure
**Goal**: The app has a real Firebase backend — SDK initialized, real Google Sign-In replaces mock navigation, route guards protect authenticated routes, and first-time users get Firestore profiles created on sign-in
**Depends on**: Phase 5 (existing UI is the foundation)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can sign in with a real Google account — LandingPage.vue calls Firebase Auth and navigates on success
  2. Firestore `users/{userId}` document is created on first sign-in with TRD schema fields
  3. Navigating to `/app/dashboard` while unauthenticated redirects to `/` (landing page)
  4. Authenticated user with `onboardingCompleted: false` is redirected to onboarding
  5. Firebase SDK boot file reads config from `.env.local` — no keys hardcoded in source
  6. Firestore security rules are deployed and tested (users can only read/write their own docs)
  7. Cloud Functions project scaffolded in `functions/` directory with Node.js 24 dependencies installed
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Install firebase SDK, create src/boot/firebase.js (initializeApp + emulators), update quasar.config.js boot, add emulators to firebase.json, create .env.example
- [x] 06-02-PLAN.md — Replace src/stores/auth.js with real Firebase Auth store, create src/services/userProfile.js, create src/boot/auth.js (onAuthStateChanged + route guard), update LandingPage.vue handleSignIn
- [x] 06-03-PLAN.md — Replace firestore.rules with TRD production rules + deploy, add @google/genai to functions/package.json, update functions/index.js with defineSecret declarations

### Phase 7: Firestore Data Layer
**Goal**: All mock data is gone — every Pinia store reads from Firestore, all frontend pages display real user data, onboarding writes the initial user document, and vocabulary bank reads from and writes to the vocabulary subcollection
**Depends on**: Phase 6
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08
**Success Criteria** (what must be TRUE):
  1. DashboardPage shows real `dailyStreak`, `totalSessionsCompleted`, and `totalVocabularyWords` from Firestore — not hardcoded "12", "47", "183"
  2. Completing onboarding writes `currentLevel`, `onboardingCompleted: true`, and `createdAt` to `users/{userId}` in Firestore
  3. VocabularyPage lists words from `vocabulary/{userId}/words` subcollection — not the hardcoded 8-word array
  4. ProgressPage shows real `levelProgress`, `averageScore`, and `totalHoursPracticed` from Firestore
  5. Opening the app while offline still shows the cached dashboard data (Firestore offline persistence)
  6. Tapping "Add to Bank" on FeedbackPage saves the word to `vocabulary/{userId}/words/{wordId}` in Firestore
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md — Enable offline persistence (initializeFirestore), rewrite useProfileStore with real fields, wire setProfile in boot/auth.js, add Firestore session write to useSessionStore
- [x] 07-02-PLAN.md — DashboardPage + ProgressPage bind real Firestore field names; OnboardingPage writes onboardingCompleted:true on completion
- [x] 07-03-PLAN.md — Create vocabulary service + store; VocabularyPage reads subcollection; FeedbackPage vocabulary tab gets "Add to Bank" save button

### Phase 8: AI Conversation Engine
**Goal**: The conversation loop is live — Web Speech API captures real voice input, `startConversation` and `sendMessage` Cloud Functions drive Gemini-powered conversations with real-time mistake detection, and the session paywall gate enforces subscription checks
**Depends on**: Phase 7
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, FUNC-01, FUNC-02
**Success Criteria** (what must be TRUE):
  1. Tapping the mic button in SessionPage starts real voice recognition (Chrome/Edge) — live interim transcript shown while speaking
  2. Text input fallback appears automatically on browsers where `SpeechRecognition` is unavailable
  3. Starting a session calls `startConversation` Cloud Function — session document created in Firestore, AI-generated topic and opening message appear in transcript
  4. Sending a voice/text message calls `sendMessage` — Gemini responds in < 3 seconds, response appears in transcript, mistake count increments if mistakes detected
  5. User without active subscription who has already used their free session sees PaywallDialog when tapping Start Session
  6. `startConversation` function is deployed and callable from the app (no 404 / CORS errors)
  7. `sendMessage` function correctly parses Gemini JSON response and returns `{ aiResponse, mistakes, newVocabulary }`
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Cloud Function: startConversation (Gemini topic assignment, session doc creation, return initialMessage)
- [ ] 08-02-PLAN.md — Cloud Function: sendMessage (Gemini conversation prompt, JSON parsing, Firestore transcript update, mistake detection)
- [ ] 08-03-PLAN.md — SessionPage: Web Speech API integration (mic button, interim results, auto-send on silence), text fallback, connect to startConversation + sendMessage, paywall gate

### Phase 9: Session Scoring & Real Feedback
**Goal**: Sessions produce real scored feedback — `endSession` Cloud Function analyzes the transcript via Gemini and writes scores to Firestore, FeedbackPage reads and displays real scores/mistakes/vocabulary from the session document, and users can save words to their vocabulary bank
**Depends on**: Phase 8
**Requirements**: SCORE-01, SCORE-02, SCORE-03, SCORE-04, FUNC-03
**Success Criteria** (what must be TRUE):
  1. Tapping "End Session" calls `endSession` Cloud Function — session scores (fluency/grammar/vocabulary/overall) are written to Firestore `sessions/{sessionId}.scores`
  2. FeedbackPage score rings display real scores from Firestore — not hardcoded 82/78/90/85
  3. FeedbackPage Mistakes tab lists real grammar/pronunciation mistakes from the session's `mistakes` array in Firestore
  4. FeedbackPage Vocabulary tab lists real `newVocabulary` words from the session document
  5. Tapping "Add to Bank" on a vocabulary word in FeedbackPage saves it to `vocabulary/{userId}/words` (DATA-06 flow wired up)
  6. User stats are updated after session: `totalHoursPracticed`, `averageScore`, `totalSessionsCompleted`, `dailyStreak` reflect the completed session
**Plans**: TBD

Plans:
- [ ] 09-01-PLAN.md — Cloud Function: endSession (Gemini transcript scoring, user stats update, leaderboard entry update, return scores + feedback)
- [ ] 09-02-PLAN.md — FeedbackPage connected to Firestore sessions/{sessionId} (real scores in rings, real mistakes tab, real vocabulary tab, Add to Bank wired)

### Phase 10: Payments, Subscriptions & Cron Jobs
**Goal**: The monetization loop is complete — MozPayments processes real subscription payments via Cloud Functions, the webhook confirms payment and unlocks unlimited sessions, and scheduled cron jobs maintain data hygiene and weekly leaderboard resets
**Depends on**: Phase 9
**Requirements**: SUB-01, SUB-02, SUB-03, FUNC-04, FUNC-05, FUNC-06, FUNC-07
**Success Criteria** (what must be TRUE):
  1. PaywallDialog shows only when `subscriptionStatus != "active"` — disappears automatically after successful payment
  2. Tapping "Subscribe Now" in PaywallDialog calls `createSubscription` and redirects user to the MozPayments checkout URL
  3. After payment webhook fires, `users/{userId}.subscriptionStatus` becomes `"active"` and user can start unlimited sessions
  4. `handlePaymentWebhook` function correctly verifies HMAC-SHA256 signature and rejects invalid webhook payloads
  5. `deleteOldTranscripts` cron runs daily and removes `transcript` field from sessions older than 30 days
  6. `updateWeeklyLeaderboard` cron runs every Monday — new week document created, previous week archived with final ranks
**Plans**: TBD

Plans:
- [ ] 10-01-PLAN.md — Cloud Functions: createSubscription (MozPayments checkout) + handlePaymentWebhook (signature verify, subscription activation)
- [ ] 10-02-PLAN.md — PaywallDialog connected to real subscriptionStatus + createSubscription function
- [ ] 10-03-PLAN.md — Cloud Functions: deleteOldTranscripts (daily cron) + updateWeeklyLeaderboard (weekly cron)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-02-20 |
| 2. Entry Flow | 2/2 | Complete | 2026-02-22 |
| 3. Dashboard | 1/1 | Complete | 2026-02-23 |
| 4. Session Loop | 2/2 | Complete | 2026-02-23 |
| 5. Supporting Pages | 4/4 | Complete | 2026-02-23 |
| 6. Firebase Auth & Infrastructure | 3/3 | Complete   | 2026-02-24 |
| 7. Firestore Data Layer | 3/3 | Complete   | 2026-02-24 |
| 8. AI Conversation Engine | 0/3 | Pending | — |
| 9. Session Scoring & Real Feedback | 0/2 | Pending | — |
| 10. Payments, Subscriptions & Cron Jobs | 0/3 | Pending | — |
