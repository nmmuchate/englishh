---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to plan
stopped_at: Completed Phase 16 (all plans done) — ready to plan Phase 17
last_updated: "2026-04-14T21:55:03.431Z"
progress:
  total_phases: 19
  completed_phases: 16
  total_plans: 41
  completed_plans: 41
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-06)

**Core value:** Every screen matches the Stitch designs pixel-for-pixel so the UI feels production-ready on mobile before any backend is wired up.
**Current focus:** Phase 17 — progression-mistake-tracking

## Current Position

Phase: 17 (progression-mistake-tracking) — READY TO PLAN
Plan: 0 of 2

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
- [Phase 11-stores-firestore-schema]: setPlacement/setLearning naming follows setProfile convention; D-05 progressive save with setDoc merge:true
- [Phase 12-quick-profile-onboarding-rewrite]: QuickProfileStage.vue uses local profileSubStep ref (1-4) — no prop drilling, cleaner encapsulation (D-05)
- [Phase 12]: STAGE_INDEX constant map for stage-to-index lookup — prevents off-by-one Pitfall 4 from research
- [Phase 12]: handleProfileBack routes to landing — D-02: back from sub-step 1 exits onboarding entirely
- [Phase 12]: placementStore.setStageResult called after setDoc merge to avoid double-write on stages.profile
- [Phase 13-vocabulary-grammar-test]: [13-01] generateTestQuestions uses separate OpenAI calls per type — allows independent max_tokens and prompt engineering per test type
- [Phase 13-vocabulary-grammar-test]: [13-02] VocabularyStage.vue progressLabel shows currentIndex+1 / total for 1-based human-readable counter; isPassageSection computed gates passage header display; showFeedback guard prevents double-tap on answer options
- [Phase 13]: [13-03] splitSentence splits sentence around errorWord into 3-part array for template v-for highlighting; handleCheck guard prevents double-submit; userInput reset to '' in handleNext per question
- [Phase 13-vocabulary-grammar-test]: [13-04] handleVocabComplete/handleGrammarComplete wrapped in isSaving/saveError pattern; handleVocabSkip/handleGrammarSkip synchronous since setStageResult handles Firestore write internally
- [Phase 14-listening-test]: Grammar branch changed from bare else to else if (type=grammar) to allow explicit listening else branch
- [Phase 14-listening-test]: ListeningPlayer play() always calls cancel() before speak() to clear in-progress utterances
- [Phase 14-listening-test]: Dialogue prompts written as narrative in Cloud Function system prompt — avoids TTS reading speaker name+colon artifacts
- [Phase 14-listening-test]: hasPlayedCurrent resets in handleNext so each task requires its own audio playback; Question card uses v-if on hasPlayedCurrent; ListeningStage emit contract matches VocabularyStage/GrammarStage exactly
- [Phase 15-01]: SpeakingStage uses hardcoded prompt pool + follow-up questions + evaluateSpeakingTest Cloud Function; WritingStage uses client-side word-count heuristic; calculatePlacement does final CEFR aggregation server-side
- [Phase 15-01]: OnboardingPage navigates to /placement-result after writing complete; PlacementResultPage calls calculatePlacement on mount to keep onboarding lightweight
- [Phase 15-01]: TOTAL_STAGES updated from 5 to 6 — speaking and writing are separate named steps in QStepper
- [Phase 15-01]: calculatePlacement persists to both placementTests/{uid}.finalResult and users/{uid}.placement for quick read access; don't-throw on persist failure — still returns result to client
- [Phase 15]: [15-02] Architecture validated: evaluateSpeakingTest in SpeakingStage and calculatePlacement in PlacementResultPage — distributed pattern is correct and equivalent to plan spec
- [Phase 16-session-types-personalisation]: generateSessionPlanFn replaces startConversationFn in session store; startConversation export preserved in index.js for backward compatibility
- [Phase 16-session-types-personalisation]: Dynamic import of useLearningStore and usePlacementStore inside startSession() to avoid circular dependency at module init time; sessionPlan ref stores full plan for ScenarioBriefPage

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

### v1.2 Context

- PRD reference: /SpeakAI-Onboarding-Immersion-PRD.md
- AI model upgrade: GPT-4o-mini for test question generation and evaluation (replaces Gemini for placement functions)
- Browser TTS: window.speechSynthesis used for Listening test audio (Azure TTS deferred to v1.3)
- Placement test: 5 stages (Quick Profile → Vocabulary/Reading → Listening → Grammar → Speaking/Writing)
- Session types: 4 types — Free Talk, Scenario, Story Builder, Debate; gated by CEFR level
- Free tier gate: 1 free session; placement test always free; retake once per 30 days
- New Cloud Functions: generateTestQuestions, evaluateSpeakingTest, calculatePlacement, generateSessionPlan, getWeeklyReview

## Session Continuity

Last session: 2026-04-14T21:55:03.431Z
Stopped at: Phase 16 fully complete. Resumed session, committed 16-02-SUMMARY.md, marked Phase 16 done in ROADMAP. Ready to /gsd:plan-phase 17.
