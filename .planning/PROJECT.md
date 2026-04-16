# SpeakAI — English Conversation Practice App

## What This Is

A Quasar/Vue 3 PWA for English conversation practice. v1.0 delivered a complete pixel-perfect static UI. v1.1 wired a Firebase backend — real auth, Firestore data, GPT-powered AI conversations, Web Speech API voice input, MozPayments subscriptions, and Cloud Functions. v1.2 replaces the fake onboarding with a real adaptive CEFR placement test and adds a personalised immersion learning system with 4 session types, progression tracking, and a free→Pro conversion funnel.

## Core Value

Every screen matches the Stitch designs pixel-for-pixel so the UI feels production-ready on mobile before any backend is wired up.

## Current Milestone: v1.2 Onboarding Assessment & Immersion Learning

**Goal:** Replace the fake 3-step onboarding with a real adaptive CEFR placement test, add a personalised immersion learning system with 4 session types, and implement a free→Pro conversion funnel.

**Target features:**
- **Part A — Placement Test**: 5-stage adaptive test (Quick Profile → Vocabulary/Reading → Listening → Grammar → Speaking/Writing), AI-generated questions via GPT-4o-mini, CEFR result screen with per-skill radar chart
- **Part B — Immersion System**: 4 session types (Free Talk, Scenario, Story Builder, Debate), personalisation engine (profile + skill gaps + session history), per-skill progression tracking, mistake pattern bank + level-up logic, weekly review session generation
- **Part C — Free Tier Funnel**: 1 free session gate, post-session paywall with achievement summary, feature restrictions for free users
- **Dashboard & Progress redesign**: Real data, skill radar mini-chart, recommended session card, per-skill trend charts + mistake patterns
- **Backend**: 5 new Cloud Functions (generateTestQuestions, evaluateSpeakingTest, calculatePlacement, generateSessionPlan, getWeeklyReview), new Firestore collections (placementTests, scenarioLibrary), new Pinia stores (placement.js, learning.js)

## Requirements

### Validated

- ✓ Quasar 2.16.0 + Vue 3 scaffold initialized — existing
- ✓ Vue Router configured (hash-based routing) — existing
- ✓ Pinia store bootstrapped — existing
- ✓ PWA mode configured (Workbox GenerateSW) — existing
- ✓ PostCSS + Autoprefixer configured — existing

### Active

- [ ] Landing page (sign-in screen with Google Sign-In button)
- [ ] Onboarding wizard — 3-step QStepper (Assessment → FirstSession → LevelResult)
- [ ] Dashboard — stats cards, weekly chart, streak counter, FAB "Start Session"
- [ ] Session screen — QChatMessage transcript, mic button, timer, mistake counter
- [ ] Feedback screen — score circle, 3 QTabs (Pronunciation, Grammar, Vocabulary)
- [ ] Paywall modal — QDialog subscription CTA with pricing tiers
- [ ] Your Progress page — progress stats and history
- [ ] Vocabulary Bank page — saved words list (new page, not in Stitch exports)
- [ ] Profile/Settings page — account settings
- [ ] Vue Router navigation wiring: Landing → Onboarding → Dashboard → Session → Feedback
- [ ] Pinia stores for UI state (auth mock, session mock, user profile mock)
- [ ] Design tokens: primary #4cae4f, accent-orange #FF6B35, Inter font, dark/light theming
- [ ] System-preference dark mode (follows OS setting)
- [ ] Mobile-first layout: max-width 430px, col-6 mobile / col-md-3 tablet+
- [ ] Mock/hardcoded data for all screens (fake stats, transcript, scores, words)

### Out of Scope (v1.0 — now implemented in v1.1)

- Backend / API integration → v1.1
- Firebase / Google Auth → v1.1
- Gemini / AI features → v1.1
- Real microphone / audio recording → v1.1

### Out of Scope (v1.1)

- Push notifications — v2 feature
- Desktop-optimized layout — mobile-first only
- Real pronunciation phonetic scoring — Web Speech API limitation
- E2E / unit tests — deferred post-backend stabilization

### Out of Scope (v1.2)

- Real-time feedback enhancements — separate PRD, deferred to v1.3
- Azure TTS for production-quality audio — browser speechSynthesis used in MVP
- Word-by-word pronunciation scoring — deferred (Web Speech API limitation)
- Writing skill in placement test UI (assessed via Cloud Function only)
- Weekly progress email — v2 feature

## Context

The Stitch export lives at `stitch_welcome_to_speakai(2)/stitch_welcome_to_speakai/` and contains 9 screen directories:

| Directory | Maps to |
|-----------|---------|
| `sign_in_to_speakai/` | Landing / Sign-In page |
| `welcome_to_speakai/` | Onboarding intro step |
| `quick_assessment/` | Onboarding assessment step |
| `home_dashboard/` | Dashboard |
| `active_session/` | Session screen |
| `session_feedback/` | Feedback screen |
| `upgrade_to_pro/` | Paywall modal |
| `your_progress/` | Your Progress page |
| `account_settings/` | Profile/Settings page |

Each directory contains `code.html` (Tailwind-based design) and `screen.png` (visual reference).

**Design system extracted from Stitch:**
- Primary: `#4cae4f` (green)
- Accent orange: `#FF6B35`
- Background light: `#f6f7f6` / dark: `#151d15`
- Deep slate text: `#131613`
- Font: Inter (400, 500, 600, 700, 800)
- Icons: Material Symbols Outlined
- Border radius: 0.5rem base, 1rem lg, 1.5rem xl

## Constraints

- **Tech Stack**: Quasar 2.16.0 + Vue 3 + Pinia + Vue Router — scaffold already in place, do not change framework
- **Components**: Use Quasar components (QBtn, QCard, QChatMessage, QTabs, QStepper, QList, QDialog, QLinearProgress, QSkeleton, QFab) — match Stitch layout precisely
- **Scripting**: Vue 3 Composition API with `<script setup>` only — no Options API
- **Styling**: Translate Tailwind classes from Stitch to Quasar utility classes + scoped CSS; no Tailwind dependency in the project
- **Routing**: Vue Router 4 for all navigation — no programmatic `window.location`
- **State**: Pinia for UI state only — no localStorage persistence needed
- **Build target**: PWA mode (`quasar dev -m pwa`)
- **Mobile width**: Max 430px centered layout matching Stitch viewport

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static UI only (no backend) | Validate design before building backend | — Pending |
| Quasar components over raw HTML | Framework consistency + accessibility | — Pending |
| Inter font via Google Fonts | Matches Stitch design system exactly | — Pending |
| System dark mode default | User preference respected; both themes must work | — Pending |
| Vocabulary Bank as new page | Not in Stitch exports; create from design system | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 — Phase 17 complete: endSession Cloud Function extended with per-skill scoring (8 fields), CEFR level-up detection, and mistake-pattern persistence (capped at 20); generateSessionPlan hardened to name active mistake patterns verbatim in objectives; getWeeklyReview Cloud Function added; useSessionStore extended with levelUps ref and learning-store refresh after each session; FeedbackPage level-up banner UI wired.*
