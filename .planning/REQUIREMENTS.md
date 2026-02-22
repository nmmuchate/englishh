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

## v2 Requirements

### Enhancements

- **ENH-01**: Real microphone recording and speech-to-text integration
- **ENH-02**: Firebase authentication with real Google Sign-In
- **ENH-03**: Gemini AI integration for real conversation responses
- **ENH-04**: localStorage or IndexedDB persistence for user progress
- **ENH-05**: Push notifications for streak reminders
- **ENH-06**: Leaderboard / social features

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend API integration | Static UI only — v1 validates design |
| Real authentication (Firebase/Google OAuth) | Mock sign-in flow sufficient for v1 |
| Real audio recording / speech recognition | No backend to process it; v2 feature |
| Gemini AI conversation | Requires backend; hardcoded transcript for v1 |
| Desktop-optimized layout | Mobile-first (430px); responsive to tablet only |
| E2E or unit tests | UI-only project; no test infrastructure needed for v1 |
| Internationalization | English only |

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

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 (complete coverage)

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-20 after roadmap creation*
