# Roadmap: SpeakAI

## Overview

**v1.0 (Phases 1-5):** Converted the Quasar/Vue 3 scaffold into a pixel-perfect, fully-navigable English conversation practice PWA using static mock data.

**v1.1 (Phases 6-10):** Wires a real Firebase backend into the existing UI — replacing all mock data with Firestore, mock auth with Firebase Auth, conversation bubbles with Gemini AI via Cloud Functions, mic button with Web Speech API, and the paywall dialog with real MozPayments subscriptions.

**v1.2 (Phases 11-19):** Replaces the fake 3-step onboarding with a real adaptive CEFR placement test, adds a personalised immersion learning system with 4 session types, per-skill progression tracking, a mistake pattern bank, and a free→Pro conversion funnel.

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
- [x] **Phase 8: AI Conversation Engine** - Cloud Functions (startConversation + sendMessage), Web Speech API, Gemini integration (completed 2026-02-26)
- [x] **Phase 9: Session Scoring & Real Feedback** - Cloud Function endSession, FeedbackPage reads real data, vocabulary save
- [x] **Phase 10: Payments, Subscriptions & Cron Jobs** - MozPayments integration, webhook handler, scheduled cleanup functions (completed 2026-03-06)

*— v1.1 complete — v1.2 Onboarding Assessment & Immersion Learning below —*

- [ ] **Phase 11: Stores & Firestore Schema** - New Pinia stores (placement.js, learning.js), Firestore schema extensions, scenarioLibrary collection
- [x] **Phase 12: Quick Profile & Onboarding Rewrite** - Quick Profile form, OnboardingPage rewritten as placement test wrapper, user doc extended (completed 2026-04-07)
- [x] **Phase 13: Vocabulary & Grammar Test** - Adaptive Vocabulary/Reading + Grammar test stages, generateTestQuestions Cloud Function (completed 2026-04-07)
- [x] **Phase 14: Listening Test** - Listening test stage with browser TTS audio, ListeningPlayer component (completed 2026-04-09)
- [x] **Phase 15: Speaking, Writing & Placement Results** - Speaking + Writing stages, AI evaluation functions, calculatePlacement, PlacementResultPage with radar chart, skip logic (completed 2026-04-11)
- [ ] **Phase 16: Session Types & Personalisation** - 4 session types, SessionTypeSelectPage, ScenarioBriefPage, generateSessionPlan Cloud Function, CEFR gates
- [ ] **Phase 17: Progression & Mistake Tracking** - Per-skill progression, level-up logic, mistake pattern bank, getWeeklyReview Cloud Function
- [ ] **Phase 18: Free Tier Funnel** - Placement test always free, 1 free session gate, post-session paywall with achievement summary, free user restrictions
- [ ] **Phase 19: Dashboard & Progress Redesign** - Skill radar mini-chart, per-skill trend charts, mistake pattern cards, recommended session card

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
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md — Create placement.js + learning.js stores, extend profile store with v1.2 fields, wire auth boot, update Firestore rules
- [ ] 11-02-PLAN.md — Create idempotent scenarioLibrary seed script with 40 scenario templates

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
- [ ] 08-01-PLAN.md — Profile store paywall fields (freeSessionUsed/subscriptionStatus), Functions boot init, startConversation + sendMessage Cloud Functions
- [ ] 08-02-PLAN.md — useSessionStore wired to Cloud Functions, SessionPage Web Speech API + text fallback + paywall gate + live transcript
- [ ] 08-03-PLAN.md — Human verification: end-to-end conversation loop (voice + text + paywall gate)

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
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — Cloud Function: endSession (Gemini transcript scoring, user stats update, leaderboard entry update, return scores + feedback)
- [x] 09-02-PLAN.md — FeedbackPage connected to Firestore sessions/{sessionId} (real scores in rings, real mistakes tab, real vocabulary tab, Add to Bank wired)

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
**Plans**: 3 plans

Plans:
- [ ] 10-01-PLAN.md — Cloud Functions: createSubscription (MozPayments checkout) + handlePaymentWebhook (signature verify, subscription activation)
- [ ] 10-02-PLAN.md — PaywallDialog connected to real subscriptionStatus + createSubscription function
- [ ] 10-03-PLAN.md — Cloud Functions: deleteOldTranscripts (daily cron) + updateWeeklyLeaderboard (weekly cron)

*— v1.1 complete — v1.2 Onboarding Assessment & Immersion Learning below —*

### Phase 11: Stores & Firestore Schema
**Goal**: The data layer for v1.2 is in place — two new Pinia stores manage placement test state and the learning path, the Firestore user document is extended with v1.2 fields, and the scenarioLibrary collection is seeded
**Depends on**: Phase 10
**Requirements**: INFRA-v12-01, INFRA-v12-02, INFRA-v12-03, INFRA-v12-04
**Success Criteria** (what must be TRUE):
  1. `usePlacementStore` is importable in any component and exposes `currentStage`, `stageResults`, `adaptiveLevel`, and `finalResult` with correct initial values
  2. `useLearningStore` is importable and exposes `recommendedSession`, `skillProgress`, `mistakePatterns`, and `weeklyGoal` with correct initial values
  3. `scenarioLibrary` Firestore collection exists and contains at least one seeded scenario template document per supported field/interest category
  4. `users/{uid}` documents contain the new v1.2 fields: `profile`, `placement`, `mistakePatterns`, and `sessionTypesCompleted` (added via migration or new sign-up flow)
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Create placement.js + learning.js stores, extend profile store with v1.2 fields, wire auth boot, update Firestore rules
- [ ] 11-02-PLAN.md — Create idempotent scenarioLibrary seed script with 40 scenario templates

### Phase 12: Quick Profile & Onboarding Rewrite
**Goal**: New users entering the app for the first time see a real placement test flow instead of the mock 3-step wizard — OnboardingPage.vue becomes the placement test shell and the Quick Profile step collects occupation, interests, goal, and prior experience
**Depends on**: Phase 11
**Requirements**: PLACE-01, PLACE-11
**Success Criteria** (what must be TRUE):
  1. User sees the Quick Profile form with fields for occupation, interests, learning goal, and prior English experience — all fields are required before advancing
  2. Completing Quick Profile writes the data to `users/{uid}.profile` in Firestore and advances to the first test stage
  3. OnboardingPage.vue renders as a multi-stage placement test wrapper (not the old QStepper) with a visible stage progress indicator
  4. Partially completed placement data is saved to Firestore `placementTests/{uid}` so progress is not lost on refresh
**UI hint**: yes
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — Create QuickProfileStage.vue (4 sub-steps: occupation, interests, goal, prior experience) with chip + radio-card UI
- [ ] 12-02-PLAN.md — Rewrite OnboardingPage.vue as 5-stage placement shell consuming QuickProfileStage; dual Firestore write to users.profile + placementTests/{uid}

### Phase 13: Vocabulary & Grammar Test
**Goal**: Users can take the adaptive Vocabulary/Reading and Grammar test stages — questions are AI-generated on demand and the adaptive difficulty engine adjusts the next question based on the previous answer
**Depends on**: Phase 12
**Requirements**: PLACE-02, PLACE-04, PLACE-08
**Success Criteria** (what must be TRUE):
  1. User sees the Vocabulary & Reading test stage with 6-8 questions including at least one reading passage, rendered from GPT-4o-mini output
  2. User sees the Grammar test stage with error-spotting and sentence completion questions, rendered from GPT-4o-mini output
  3. Answering a question correctly increases the adaptive difficulty level for the next question; answering incorrectly decreases it — observable via question complexity change
  4. `generateTestQuestions` Cloud Function is deployed and returns correctly structured question payloads for both vocabulary and grammar stages
**Plans**: 4 plans

Plans:
- [x] 13-01-PLAN.md — Add generateTestQuestions Cloud Function (gpt-4o-mini, vocabulary + grammar types, adaptive level support)
- [x] 13-02-PLAN.md — Create VocabularyStage.vue (6-8 MCQ + reading passage, adaptive difficulty engine)
- [x] 13-03-PLAN.md — Create GrammarStage.vue (error-spotting + sentence-completion, adaptive difficulty engine)
- [x] 13-04-PLAN.md — Wire VocabularyStage + GrammarStage into OnboardingPage.vue, replace stubs

### Phase 14: Listening Test
**Goal**: Users can hear audio prompts for the Listening test stage using browser speechSynthesis TTS — a dedicated ListeningPlayer component handles playback, replay, and answer capture
**Depends on**: Phase 13
**Requirements**: PLACE-03
**Success Criteria** (what must be TRUE):
  1. User sees the Listening test stage with 3 tasks; each task has a play button that triggers browser speechSynthesis to speak the prompt aloud
  2. User can replay any audio prompt at least once using a replay button
  3. User can submit their answer for each listening task and advance to the next task
  4. ListeningPlayer.vue component encapsulates TTS playback and exposes a `play` / `replay` interface usable by the test stage
**UI hint**: yes
**Plans**: 2 plans

Plans:
- [x] 14-01-PLAN.md — Extend generateTestQuestions for listening type + create ListeningPlayer.vue TTS component
- [ ] 14-02-PLAN.md — Create ListeningStage.vue (3-task flow) + wire into OnboardingPage.vue

### Phase 15: Speaking, Writing & Placement Results
**Goal**: The placement test is complete — users take the Speaking mini-conversation and Writing prompt stages, AI evaluates their responses, the calculatePlacement function combines all stage scores into a CEFR result, and users see a detailed results screen with a per-skill radar chart
**Depends on**: Phase 14
**Requirements**: PLACE-05, PLACE-06, PLACE-07, PLACE-09, PLACE-10, PLACE-12
**Success Criteria** (what must be TRUE):
  1. User can complete a 3-4 exchange Speaking mini-conversation using Web Speech API voice input (or text fallback) within the placement test
  2. User can submit a 2-3 sentence written response to a single Writing prompt
  3. `evaluateSpeakingTest` Cloud Function scores the speaking + writing responses and returns per-skill scores
  4. `calculatePlacement` Cloud Function combines all stage scores and returns an overall CEFR level (A1–C2) with per-skill breakdown
  5. User sees PlacementResultPage with overall CEFR level badge, per-skill scores, and a radar chart — all driven by real `calculatePlacement` output
  6. User can skip any test stage — skipped stages default to B1 and partial progress is saved to Firestore before advancing
**UI hint**: yes
**Plans**: 2 plans

- [x] 15-01-PLAN.md — Cloud Functions (evaluateSpeakingTest + generateTestQuestions speaking type) + SpeakingStage.vue + WritingStage.vue
- [x] 15-02-PLAN.md — calculatePlacement Cloud Function + PlacementResultPage.vue + OnboardingPage wiring + skip logic + route

### Phase 16: Session Types & Personalisation
**Goal**: Users can choose from up to 4 session types based on their CEFR level, view a pre-session briefing, and have their session plan personalised by an AI function that considers their profile, skill gaps, and session history
**Depends on**: Phase 15
**Requirements**: SESSION-01, SESSION-02, SESSION-03, SESSION-04, SESSION-05, SESSION-06, SESSION-07, SESSION-08
**Success Criteria** (what must be TRUE):
  1. User sees SessionTypeSelectPage listing all 4 session types — Free Talk, Scenario, Story Builder, Debate — with lock icons on types unavailable at the user's CEFR level
  2. A1–A2 users see only Free Talk and Scenario unlocked; B1+ users see all 4 types unlocked
  3. Selecting a session type navigates to ScenarioBriefPage showing the role, context, and objectives for that session
  4. `generateSessionPlan` Cloud Function is deployed and returns a personalised session plan incorporating the user's profile, active skill gaps, and session history
  5. Each session type (Free Talk, Scenario, Story Builder, Debate) results in a distinctly different AI conversation framing when the session starts
**UI hint**: yes
**Plans**: 2 plans

Plans:
- [ ] 16-01-PLAN.md — generateSessionPlan Cloud Function + session store refactor + routes + DashboardPage FAB
- [ ] 16-02-PLAN.md — SessionTypeSelectPage + SessionTypeCard + ScenarioBriefPage UI

### Phase 17: Progression & Mistake Tracking
**Goal**: The app tracks each user's progress independently per skill — skill levels advance when rolling 10-session performance meets next-level criteria, mistakes are logged and recycled into future sessions, and a weekly review session can be generated on demand
**Depends on**: Phase 16
**Requirements**: PROG-v12-01, PROG-v12-02, PROG-v12-03, PROG-v12-04, PROG-v12-05
**Success Criteria** (what must be TRUE):
  1. After each session, per-skill scores (vocabulary, reading, listening, grammar, speaking, writing) are individually updated in Firestore — each skill tracks independently
  2. When a user's rolling 10-session average for a skill meets the next-level threshold, their level for that skill increments and a level-up event is visible in the UI
  3. Grammar and vocabulary mistakes from sessions are persisted to `users/{uid}.mistakePatterns` with occurrence count, last correction, and active/resolved status
  4. When `generateSessionPlan` runs for a user with active mistake patterns, the returned plan explicitly references at least one of those patterns to recycle it
  5. `getWeeklyReview` Cloud Function is deployed and returns a review session plan that incorporates the user's mistake patterns from the past 7 days
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Create placement.js + learning.js stores, extend profile store with v1.2 fields, wire auth boot, update Firestore rules
- [ ] 11-02-PLAN.md — Create idempotent scenarioLibrary seed script with 40 scenario templates

### Phase 18: Free Tier Funnel
**Goal**: The free→Pro conversion funnel is enforced — placement test is ungated, the first session is fully featured, subsequent sessions trigger a post-session paywall with an achievement summary, and free users have clearly defined read-only access to trial data
**Depends on**: Phase 17
**Requirements**: FREE-01, FREE-02, FREE-03, FREE-04, FREE-05, FREE-06
**Success Criteria** (what must be TRUE):
  1. A user with no subscription can complete the full placement test without any paywall prompt appearing
  2. A user with no subscription can start and complete their first session with all features (session types, AI conversation, scoring) fully enabled
  3. After the first session completes, a free user sees a post-session paywall screen displaying their session achievement summary alongside a Pro subscription CTA
  4. A free user can open their vocabulary bank and view words saved during the trial session in read-only mode — no add/edit capability
  5. A free user can retake the placement test — the retake is blocked by a UI prompt if they have already retaken within the past 30 days
  6. Attempting to start a second session, switch session types, access personalised scenarios, request a weekly review, or view full progress tracking shows the Pro gate UI
**UI hint**: yes
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Create placement.js + learning.js stores, extend profile store with v1.2 fields, wire auth boot, update Firestore rules
- [ ] 11-02-PLAN.md — Create idempotent scenarioLibrary seed script with 40 scenario templates

### Phase 19: Dashboard & Progress Redesign
**Goal**: The Dashboard and Progress pages display real v1.2 data — the dashboard surfaces a skill radar mini-chart and a recommended session card, and the Progress page shows per-skill trend charts and the user's active mistake patterns
**Depends on**: Phase 18
**Requirements**: DASH-v12-01, DASH-v12-02, DASH-v12-03
**Success Criteria** (what must be TRUE):
  1. DashboardPage shows a SkillRadarChart mini-chart built from real per-skill progress data from `useLearningStore` — not a static placeholder
  2. DashboardPage shows a recommended session card driven by `useLearningStore.recommendedSession` — card content changes based on skill gaps and session history
  3. ProgressPage per-skill trend charts render real session score history for each of the 6 skills — replacing the static SVG chart
  4. ProgressPage shows a list of MistakePatternCard components populated from `users/{uid}.mistakePatterns` — each card shows the mistake, occurrence count, and resolved/active status
**UI hint**: yes
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Create placement.js + learning.js stores, extend profile store with v1.2 fields, wire auth boot, update Firestore rules
- [ ] 11-02-PLAN.md — Create idempotent scenarioLibrary seed script with 40 scenario templates

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-02-20 |
| 2. Entry Flow | 2/2 | Complete | 2026-02-22 |
| 3. Dashboard | 1/1 | Complete | 2026-02-23 |
| 4. Session Loop | 2/2 | Complete | 2026-02-23 |
| 5. Supporting Pages | 4/4 | Complete | 2026-02-23 |
| 6. Firebase Auth & Infrastructure | 3/3 | Complete   | 2026-02-24 |
| 7. Firestore Data Layer | 3/3 | Complete   | 2026-02-24 |
| 8. AI Conversation Engine | 3/3 | Complete   | 2026-02-26 |
| 9. Session Scoring & Real Feedback | 0/2 | Pending | — |
| 10. Payments, Subscriptions & Cron Jobs | 3/3 | Complete   | 2026-03-06 |
| 11. Stores & Firestore Schema | 1/2 | In Progress|  |
| 12. Quick Profile & Onboarding Rewrite | 1/2 | Complete    | 2026-04-07 |
| 13. Vocabulary & Grammar Test | 4/4 | Complete   | 2026-04-07 |
| 14. Listening Test | 1/2 | Complete    | 2026-04-09 |
| 15. Speaking, Writing & Placement Results | 2/2 | Complete   | 2026-04-11 |
| 16. Session Types & Personalisation | 0/2 | In Progress | — |
| 17. Progression & Mistake Tracking | 0/0 | Not started | — |
| 18. Free Tier Funnel | 0/0 | Not started | — |
| 19. Dashboard & Progress Redesign | 0/0 | Not started | — |
