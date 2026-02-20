# Roadmap: SpeakAI

## Overview

Five phases convert the Quasar/Vue 3 scaffold into a pixel-perfect, fully-navigable English conversation practice PWA. Phase 1 wires up the design system and app infrastructure. Phase 2 delivers the entry flow (landing + onboarding). Phase 3 delivers the dashboard hub. Phase 4 delivers the core session-to-feedback loop that is the app's reason for existing. Phase 5 rounds out the supporting pages to complete the full app experience.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Design system, routing, stores, and mock data infrastructure
- [ ] **Phase 2: Entry Flow** - Landing page and 3-step onboarding wizard
- [ ] **Phase 3: Dashboard** - Main hub with stats, chart, streak, and session start
- [ ] **Phase 4: Session Loop** - Active session screen and post-session feedback screen
- [ ] **Phase 5: Supporting Pages** - Paywall modal, Your Progress, Vocabulary Bank, Profile/Settings

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
- [ ] 01-03-PLAN.md — Three Pinia stores (auth/profile/session) with mock data, axios boot stripped
- [ ] 01-04-PLAN.md — Human verification checkpoint for all 6 FOUND requirements

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
- [ ] 02-01: Build LandingPage.vue matching Stitch sign_in_to_speakai design with mock sign-in navigation
- [ ] 02-02: Build OnboardingPage.vue with QStepper (Assessment, FirstSession, LevelResult steps) matching Stitch designs

### Phase 3: Dashboard
**Goal**: The Dashboard is the app's home — users land here after onboarding and see their stats, weekly chart, streak, and can launch a new session
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. User sees stats cards for total sessions, streak days, and vocabulary learned with mock numbers, matching the Stitch home_dashboard design
  2. User sees a weekly activity bar chart populated with mock data
  3. User sees a streak counter displayed prominently on the dashboard
  4. Tapping the QFab "Start Session" button navigates to the Session screen
**Plans**: TBD

Plans:
- [ ] 03-01: Build DashboardPage.vue with stats cards, weekly bar chart, streak counter, and QFab navigation matching Stitch home_dashboard

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
**Plans**: TBD

Plans:
- [ ] 04-01: Build SessionPage.vue with QChatMessage transcript, mic toggle, live timer, mistake counter, and end-session navigation
- [ ] 04-02: Build FeedbackPage.vue with animated score circle, QTabs (Pronunciation/Grammar/Vocabulary), mock feedback items, and dashboard navigation

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
**Plans**: TBD

Plans:
- [ ] 05-01: Build PaywallDialog.vue (QDialog) with pricing tiers and dismiss behavior; wire trigger from dashboard or nav
- [ ] 05-02: Build YourProgressPage.vue matching Stitch your_progress design with mock stats and chart
- [ ] 05-03: Build VocabularyBankPage.vue with mock word list entries (definition, example, difficulty badge)
- [ ] 05-04: Build ProfilePage.vue matching Stitch account_settings design with settings toggles

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/4 | In progress | - |
| 2. Entry Flow | 0/2 | Not started | - |
| 3. Dashboard | 0/1 | Not started | - |
| 4. Session Loop | 0/2 | Not started | - |
| 5. Supporting Pages | 0/4 | Not started | - |
