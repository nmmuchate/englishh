# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Every screen matches the Stitch designs pixel-for-pixel so the UI feels production-ready on mobile before any backend is wired up.
**Current focus:** Milestone v1.1 backend — Firebase Auth, Firestore, Cloud Functions, Web Speech API, MozPayments

## Current Position

Phase: Not started (Phase 6 is next)
Plan: —
Status: Defining requirements — Milestone v1.1 backend started
Last activity: 2026-02-23 — Milestone v1.1 backend initialized

Progress: [░░░░░░░░░░] 0%  (5 phases: 6, 7, 8, 9, 10)

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 13 (4 + 2 + 1 + 2 + 4)
- Average duration: ~12min/plan

**v1.1 Velocity:**
- Total plans completed: 0
- Average duration: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Static UI only — no backend, no real auth, no real audio; all data is hardcoded mock
- [Init]: Quasar components (QBtn, QCard, QChatMessage, QStepper, QTabs, QDialog, QFab) used throughout — no raw HTML equivalents
- [Init]: Tailwind classes in Stitch exports must be translated to Quasar utility classes + scoped CSS; no Tailwind dependency added
- [Init]: Vocabulary Bank page (VOCAB-01, VOCAB-02) has no Stitch source — build from design system tokens
- [01-02]: Two-layout pattern adopted — FullscreenLayout (/) for immersive screens, MainLayout (/app) for nav-bearing screens
- [01-02]: Bottom nav has 3 tabs only (Home/Progress/Profile); Vocabulary Bank accessible via /app/vocabulary but has no nav tab
- [01-02]: QRouteTab uses exact prop for leaf route matching; no v-model on QTabs to avoid route desync
- [02-01]: Google icon rendered as inline SVG in a white-circle wrapper div inside QBtn slot — not via Quasar icon prop — for correct pill-button layout matching Stitch design
- [02-01]: QBtn with rounded + unelevated + no-caps + color=primary is the design-system pill button pattern
- [02-02]: QStepper navigation via direct ref assignment (step.value = 'next') — simpler than QStepper API methods
- [02-02]: Radio cards use QItem tag='label' + QRadio (not QOptionGroup) — enables full custom border/background per card
- [02-02]: QStepper header hidden via :header-nav='false' + :deep(.q-stepper__header) { display:none } — two-layer approach
- [03-01]: QFab positioned with position:fixed + bottom:80px to clear ~56px bottom nav; no sub-actions needed for simple FAB
- [03-01]: Pure-CSS bar chart using flex + dynamic :style height percentage — no external chart library needed for 7-bar mock data
- [03-01]: Streak shown in two places (orange header badge + stats card) to match Stitch home_dashboard exactly
- [04-01]: useSessionStore().startSession() / endSession(82) called in SessionPage.vue — no real backend; store holds overallScore for FeedbackPage to consume
- [04-01]: Live timer implemented as setInterval every 1000ms in onMounted, cleared in onUnmounted — no external time library
- [04-02]: CSS conic-gradient rings driven by reactive refs and setInterval tweening over 800ms with ease-out cubic — no SVG, cross-browser
- [04-02]: QTabPanels background forced transparent (!important) to inherit page dark bg (Quasar applies white default)
- [05-01]: PaywallDialog implemented as QDialog with persistent prop; Go Pro chip in DashboardPage triggers dialog via ref
- [05-02]: ProgressPage SVG fluency chart uses viewBox with polyline points computed from mock score array
- [05-03]: VocabularyPage badge variant pattern uses CSS class suffix --A1/--A2/--B1/--B2 driven by dynamic :class binding
- [05-04]: ProfilePage avatar uses green initials circle (SC) matching DashboardPage pattern — no external image
- [05-04]: QToggle local refs only (notificationsEnabled, darkModeOverride, soundEffects) — no Pinia persistence for transient UI prefs

### v1.1 Decisions

- [v1.1-Init]: TRD at /TRD.md is the authoritative spec for all backend implementation — no research phase needed
- [v1.1-Init]: UI/design must NOT change — only add backend logic to existing components
- [v1.1-Init]: Firebase MCP server to be used for Firestore operations and deployment
- [v1.1-Init]: Cloud Functions in Node.js 18, Gemini 1.5 Flash model
- [v1.1-Init]: MozPayments primary payment gateway; Stripe test mode for development
- [v1.1-Init]: Web Speech API (SpeechRecognition) for voice — text fallback for non-Chrome browsers
- [v1.1-Init]: All API keys in .env / .env.local — never hardcoded

### Pending Todos

None yet.

### Blockers/Concerns

- Firebase project must be created and Blaze plan enabled before Phase 6 execution
- API keys required before execution: Gemini API key (aistudio.google.com), MozPayments API key

## Session Continuity

Last session: 2026-02-23
Stopped at: Milestone v1.1 backend initialized. REQUIREMENTS.md, ROADMAP.md, PROJECT.md, STATE.md updated. Ready for Phase 6 planning.
Resume file: None
