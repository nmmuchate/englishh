# SpeakAI — English Conversation Practice App

## What This Is

A Quasar/Vue 3 PWA for English conversation practice. v1.0 delivered a complete pixel-perfect static UI. v1.1 wires a Firebase backend — real auth, Firestore data, Gemini-powered AI conversations, Web Speech API voice input, MozPayments subscriptions, and Cloud Functions — transforming the static prototype into a production-ready app.

## Core Value

Every screen matches the Stitch designs pixel-for-pixel so the UI feels production-ready on mobile before any backend is wired up.

## Current Milestone: v1.1 backend

**Goal:** Wire the existing static Quasar frontend to a real Firebase backend — replacing all mock data with Firestore, Google Sign-In with Firebase Auth, conversation bubbles with Gemini API, mic button with Web Speech API, and paywall with MozPayments.

**Target features:**
- Firebase Auth (real Google Sign-In, route guards, user docs)
- Firestore data layer (all 5 collections, offline persistence, stores connected)
- Web Speech API voice input + text fallback
- Cloud Functions: startConversation, sendMessage, endSession (Gemini AI)
- Cloud Functions: createSubscription, handlePaymentWebhook (MozPayments)
- Cloud Functions: deleteOldTranscripts, updateWeeklyLeaderboard (scheduled)
- Firestore security rules + .env configuration

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

---
*Last updated: 2026-02-23 — v1.1 backend milestone started*
