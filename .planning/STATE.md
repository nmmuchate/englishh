# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Every screen matches the Stitch designs pixel-for-pixel so the UI feels production-ready on mobile before any backend is wired up.
**Current focus:** Milestone v1.1 backend — Firebase Auth, Firestore, Cloud Functions, Web Speech API, MozPayments

## Current Position

Phase: 10-payments-cron → COMPLETE (3/3 plans done)
Plan: 10-03 complete
Status: Phase 10 complete — deleteOldTranscripts + updateWeeklyLeaderboard cron functions + createdAt Firestore index
Last activity: 2026-03-06 — 10-03 complete: daily transcript cleanup cron + weekly leaderboard archival cron + Firestore index

Progress: [██████████] 100%  (Phase 10: 3/3 plans done)

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 13 (4 + 2 + 1 + 2 + 4)
- Average duration: ~12min/plan

**v1.1 Velocity:**
- Total plans completed: 12 (06-01, 06-02, 06-03, 07-01, 07-02, 07-03, 08-01, 09-01, 09-02, 10-01, 10-02, 10-03)
- Average duration: ~6min/plan
- 10-01: 2min (2 tasks, 1 file)
- 10-02: 5min (2 tasks, 2 files)
- 10-03: 5min (2 tasks, 2 files)

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
- [Phase 07-01]: persistentSingleTabManager chosen over persistentMultipleTabManager — this is a mobile PWA, not a multi-tab desktop app
- [Phase 07-01]: startSession() made async and awaited in SessionPage.vue onMounted to ensure sessionId is set before timer starts
- [07-02]: updateDoc used (not setDoc) in OnboardingPage — users/{userId} doc already exists from createUserProfile on sign-in; setDoc without merge:true would wipe all fields
- [07-02]: Top-level import approach for firebase/firestore in OnboardingPage — cleaner than dynamic import, boot/firebase.js is initialized before onboarding page mounts
- [07-03]: saveWord() reloads full word list after write — simpler than optimistic push, acceptable for vocabulary bank (low frequency operation)
- [07-03]: Optional fields (phonetic, pos, difficulty) guarded with v-if in VocabularyPage — Firestore schema does not store these; display slots preserved for future enriched data
- [07-03]: FeedbackPage static vocabWords array retained — Phase 9 replaces it with real session scoring data; DATA-06 only requires save action to exist
- [Phase 08-02]: httpsCallable created at module level; paywall gate returns signal from store; SpeechRecognition in onMounted; showTextInput defaults to !speechAvailable
- [Phase 10-payments-cron]: onSchedule region passed directly in options object (not setGlobalOptions) — known CJS bug
- [Phase 10-payments-cron]: deleteOldTranscripts uses FieldValue.delete() in 500-doc batches — preserves all session fields except transcript
- [Phase 10-payments-cron]: updateWeeklyLeaderboard computes nextWeekId inline with +7 days rather than calling getWeekId() — avoids date ambiguity at Monday midnight

### v1.1 Decisions

- [v1.1-Init]: TRD at /TRD.md is the authoritative spec for all backend implementation — no research phase needed
- [v1.1-Init]: UI/design must NOT change — only add backend logic to existing components
- [v1.1-Init]: Firebase MCP server to be used for Firestore operations and deployment
- [v1.1-Init]: Cloud Functions in Node.js 18, Gemini 1.5 Flash model
- [v1.1-Init]: MozPayments primary payment gateway; Stripe test mode for development
- [v1.1-Init]: Web Speech API (SpeechRecognition) for voice — text fallback for non-Chrome browsers
- [v1.1-Init]: All API keys in .env / .env.local — never hardcoded
- [06-01]: firebase@12.9.0 used (plan expected 11.x — v12 compatible, no API changes needed)
- [06-01]: Firebase singleton pattern — initializeApp() once in boot file, { auth, db } exported for all consumers
- [06-01]: Vite static env var access via process.env.FIREBASE_X dot notation — dynamic access not replaced at build time
- [06-01]: Emulator guard via if (process.env.DEV) — prevents production Firestore access during dev
- [06-02]: getCurrentUser() one-shot Promise wraps onAuthStateChanged to fix router guard race condition on hard refresh
- [06-02]: isLoading starts true and flips false after first onAuthStateChanged emission — no premature redirect decisions
- [06-02]: onboarding NOT in PUBLIC_ROUTES — unauthenticated users still redirect to landing; authenticated+incomplete go to onboarding
- [06-02]: signInWithPopup called synchronously (no await before it) inside signInWithGoogle to prevent mobile popup blocking
- [06-02]: Boot order firebase→auth enforced — auth boot imports { auth } from boot/firebase which must initialize first
- [06-03]: @google/genai replaces deprecated @google/generative-ai — GA version as of Nov 2025
- [06-03]: node:24 preserved in functions/package.json — Node 18 decommissioned for Cloud Functions Oct 2025
- [06-03]: functions/index.js uses CommonJS (require) not ESM import — Cloud Functions v2 with Node 24 defaults to CJS
- [06-03]: hasActiveSubscription() reads users doc via get() call — single rule function handles subscription gating
- [06-03]: Leaderboard and subscriptions write-locked to false (client side) — only Admin SDK can write
- [08-01]: GoogleGenAI instantiated inside handler body — GEMINI_API_KEY.value() only resolves during function invocation, not at module init
- [08-01]: Functions region africa-south1 matches Firestore database location — reduces cross-region latency
- [08-01]: Admin SDK FieldValue.arrayUnion used for transcript append (not web SDK) — functions run server-side with Admin credentials
- [08-01]: Subscription gate reads users/{uid}.subscriptionStatus via Admin SDK get() — session 2+ requires 'active' status
- [08-01]: JSON parse fallback in sendMessage prevents crash if Gemini response format is unexpected
- [08-02]: httpsCallable references created at module level (outside store) — functions boot export available at import time, unlike GEMINI_API_KEY which requires invocation context
- [08-02]: Paywall gate in session store startSession() returns { paywallRequired } signal — component opens PaywallDialog on true
- [08-02]: SpeechRecognition instantiated in onMounted — avoids SSR issues and ensures window is ready
- [08-02]: showTextInput defaults to !speechAvailable — text input shown immediately on non-Chrome browsers

### Pending Todos

None yet.

### Blockers/Concerns

- Firebase project must be created and Blaze plan enabled before Phase 6 execution
- API keys required before execution: Gemini API key (aistudio.google.com), MozPayments API key

### v1.1 Phase 9 Decisions

- [09-01]: endSession uses fallback scores (70/70/70/70) if Gemini JSON parse fails — prevents broken FeedbackPage
- [09-01]: handleBack skips Cloud Function — back button = session abandon, not scored completion
- [09-01]: isEndingSession loading guard never resets to false — component navigates away before reset would matter
- [09-01]: Leaderboard updated via Admin SDK set(..., {merge:true}) — bypasses Firestore security rules that block client writes
- [09-01]: Rolling 10-session window average formula: ((prevAvg * min(prevTotal, 9)) + newScore) / min(newTotal, 10)
- [09-02]: pronPct maps to s.fluency — no separate pronunciation score in MVP; fluency is closest analog
- [09-02]: Vocabulary deduplicated by word field in FeedbackPage — sendMessage can emit same word across multiple turns
- [09-02]: Null guard on session.sessionId falls back to overallScore ?? 0 — prevents crash on direct navigation

### v1.1 Phase 10 Decisions

- [10-01]: handlePaymentWebhook uses onRequest (not onCall) — MozPayments server cannot send Firebase auth tokens required by onCall
- [10-01]: externalSubscriptionId stored in subscriptions/{userId} doc during createSubscription — webhook queries this field to reverse-lookup userId from MozPayments subscriptionId
- [10-01]: Unknown subscriptionId in webhook returns 200 (not 4xx) to prevent MozPayments retry loops
- [10-01]: rawBody fallback (req.rawBody || Buffer.from(JSON.stringify(req.body))) allows emulator testing but is NOT production-safe for HMAC — documented in code comment
- [10-01]: MozPayments API hostname api.mozpayments.co.mz and path /v1/checkout assumed from TRD spec — flagged in code for validation when real credentials are available
- [10-02]: selectedPlan 'monthly' maps to mpesa, 'annual' maps to emola — matches MozPayments payment method enum
- [10-02]: On createSubscription error, dialog stays open for user retry — no auto-close on failure
- [10-02]: Go Pro chip v-if checks !== 'active' — chip visible for 'none' and 'pending' states
- [10-03]: onSchedule region passed directly in options object (not setGlobalOptions) — known CJS bug where setGlobalOptions does not apply to onSchedule
- [10-03]: deleteOldTranscripts uses FieldValue.delete() in 500-doc batches — preserves all session fields except transcript
- [10-03]: updateWeeklyLeaderboard computes nextWeekId inline with +7 days rather than calling getWeekId() — avoids date ambiguity at Monday midnight
- [10-03]: onSchedule try/catch re-throws error — Cloud Scheduler retries on throw, desired for transient Firestore failures

## Session Continuity

Last session: 2026-03-28
Stopped at: Session resumed — Phase 09 still at human verification gate. Awaiting human to run `npx quasar dev` and confirm FeedbackPage shows real Gemini scores. After confirmation, write 09-02-SUMMARY.md and run /gsd:complete-milestone.
