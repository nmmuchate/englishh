# Phase 16: Session Types & Personalisation — Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 16 delivers three things:
1. **SessionTypeSelectPage** (`/sessions`) — 4 session type cards with CEFR lock states; user picks a type, generateSessionPlan is called, spinner shows, then navigates to brief
2. **ScenarioBriefPage** (`/session/brief`) — AI-generated pre-session brief (role, context, objectives) with a "Start Session" CTA; sessionId already live when user lands here
3. **generateSessionPlan Cloud Function** — replaces `startConversation`; takes type + user profile + skill gaps + session history → returns `{ sessionId, topic, initialMessage, systemPrompt }` and creates the Firestore session doc

Also includes a minimal **DashboardPage update**: FAB route changes from `/session` to `/sessions`.

Scope does NOT include: scenario library seeding, progression tracking, mistake pattern recycling (Phase 17), or any changes to SessionPage.vue chat UI.

</domain>

<decisions>
## Implementation Decisions

### D-01: Dashboard → Session Entry
- The existing "Start Session" FAB on `DashboardPage.vue` routes to `/sessions` (SessionTypeSelectPage) instead of `/session` directly.
- This is the only Dashboard change in this phase — no recommended session card, no other additions.
- Users always go through type selection before starting a session.

### D-02: Lock State Presentation
- Locked session types (Story Builder, Debate for A1–A2 users) render as **fully visible but grayed cards**.
- Visual treatment: reduced opacity (`opacity: 0.5` or similar), lock icon overlay in top-right corner, subtitle text "B1+" or "Available at B1" below the type name.
- Tapping a locked card shows a brief message (QNotify/snackbar): e.g. "Story Builder unlocks at B1".
- Unlock logic from ROADMAP/PRD: A1–A2 → Free Talk + Scenario only; B1+ → all 4 types.
- CEFR level read from `placementStore.finalResult.overallLevel` (or `profileStore.currentLevel`).

### D-03: generateSessionPlan Integration
- `generateSessionPlan` **replaces** `startConversation` entirely.
- It is a single onCall Cloud Function that:
  - Takes: `{ type, userProfile, skillGaps, sessionHistory }`
  - Builds personalised system prompt (per PRD §5.3 prompt architecture)
  - Creates the Firestore session doc (equivalent to what startConversation did)
  - Returns: `{ sessionId, topic, initialMessage, systemPrompt }`
- `session.js` store: rename/replace `startConversationFn` with `generateSessionPlanFn`; update `startSession(type)` to accept a `type` argument and pass profile/skill data.
- `sendMessage` and `endSession` Cloud Functions are **unchanged** — only session creation changes.
- `functions/index.js`: keep `startConversation` export for backwards compatibility (or remove if no other callers exist — check before removing).

### D-04: ScenarioBriefPage Content
- `generateSessionPlan` is called on **SessionTypeSelectPage**, immediately when the user taps a session type card.
- Flow: tap type card → loading spinner on SessionTypeSelectPage → navigate to ScenarioBriefPage with the plan data → user taps "Start Session" → navigate to SessionPage (sessionId already in session store).
- **No second API call on Start** — sessionId is already live in the session store when brief is shown.
- Plan data passed via session store (not router params) so SessionPage can read it directly.
- Brief displays: scenario title/topic (from `topic`), the user's role, context, and 2-3 objectives. These come from the `generateSessionPlan` response.
- Loading state: `q-inner-loading` with spinner on SessionTypeSelectPage while plan generates (same pattern as PlacementResultPage).

### Claude's Discretion
- Icon choice per session type (e.g. chat bubble for Free Talk, briefcase for Scenario, book for Story Builder, gavel for Debate)
- Exact card layout within SessionTypeSelectPage (2×2 grid vs vertical list — 2×2 grid recommended for 430px)
- Error handling if `generateSessionPlan` fails on type selection — toast + stay on page, allow retry
- Whether to store `sessionPlan` in session store as a new ref or pass it inline

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PRD
- `SpeakAI-Onboarding-Immersion-PRD.md` §3.2 — Session types table (4 types, duration, CEFR skills targeted, unlock logic)
- `SpeakAI-Onboarding-Immersion-PRD.md` §3.3 — Personalisation engine (3 data sources: profile, skill gaps, session history)
- `SpeakAI-Onboarding-Immersion-PRD.md` §5.3 — AI prompt architecture for generateSessionPlan (exact prompt structure with example)
- `SpeakAI-Onboarding-Immersion-PRD.md` §6.1 — New pages list (SessionTypeSelectPage route, ScenarioBriefPage route)
- `SpeakAI-Onboarding-Immersion-PRD.md` §6.3 — New components (SessionTypeCard.vue, ScenarioBriefCard.vue)

### Requirements
- `.planning/REQUIREMENTS.md` — SESSION-01 through SESSION-08

### Existing files to read before modifying
- `src/stores/session.js` — current startConversation/sendMessage/endSession implementation (startConversation is being replaced)
- `src/stores/learning.js` — `skillProgress`, `mistakePatterns`, `recommendedSession` — these feed generateSessionPlan
- `src/stores/profile.js` — `currentLevel`, `profile` fields (occupation, field, interests, goal) — these feed generateSessionPlan
- `src/stores/placement.js` — `finalResult.overallLevel` — used for CEFR lock state check
- `src/pages/DashboardPage.vue` — FAB needs route change from `session` → `sessions`
- `src/router/routes.js` — add `/sessions` and `/session/brief` routes under FullscreenLayout
- `functions/index.js` — add `generateSessionPlan`, review if `startConversation` can be removed

### Prior phase decisions
- Phase 1 D-01: FullscreenLayout (`/`) for immersive screens (session, onboarding, placement) — SessionTypeSelectPage and ScenarioBriefPage belong here too
- Phase 8: `httpsCallable` references created at module level in session.js; same pattern for `generateSessionPlanFn`
- Phase 8: `africa-south1` region for all Cloud Functions
- Phase 8: `OPENAI_API_KEY` secret pattern for functions using AI (generateSessionPlan uses GPT-4o-mini)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/PlacementResultPage.vue` — `q-inner-loading` + spinner pattern for async Cloud Function call on page load — reuse for loading state while generateSessionPlan runs
- `src/pages/SpeakingStage.vue` — `httpsCallable` inline call pattern with try/catch/isSaving/saveError — reference for SessionTypeSelectPage's generateSessionPlan call
- `src/pages/OnboardingPage.vue` — QStepper step navigation pattern; not reused here but reference for stage-based navigation
- `src/stores/learning.js` — `skillProgress`, `mistakePatterns` already populated from Firestore on login — pass directly to generateSessionPlan

### Established Patterns
- `q-inner-loading` with `q-spinner-dots size="64px" color="primary"` — loading overlay (Phase 15 pattern)
- `QCard flat` with `border-radius: 16px` — card style (consistent with placement result cards)
- `QBtn unelevated rounded no-caps color="primary"` — primary CTA button
- `QNotify` / `$q.notify` for toast messages — use for locked type tap feedback
- FullscreenLayout routes have no bottom nav — correct for pre-session immersive screens

### Integration Points
- `src/router/routes.js`: add two routes to FullscreenLayout children:
  ```js
  { path: 'sessions', name: 'sessions', component: () => import('pages/SessionTypeSelectPage.vue') }
  { path: 'session/brief', name: 'session-brief', component: () => import('pages/ScenarioBriefPage.vue') }
  ```
- `src/pages/DashboardPage.vue`: change FAB route from `{ name: 'session' }` to `{ name: 'sessions' }`
- `session.js` store: `startSession(type)` calls `generateSessionPlanFn({ type, userProfile, skillGaps, sessionHistory })` — existing `sendMessage` and `endSession` unchanged
- `functions/index.js`: `exports.generateSessionPlan = onCall(...)` — add after `calculatePlacement`

</code_context>

<specifics>
## Specific Ideas

- PRD §5.3 has a concrete compiled prompt example for a B1 engineer doing a Scenario session — the generateSessionPlan Cloud Function should produce prompts in this exact format
- The `[Base persona] + [User context] + [Skill focus] + [Mistake recycling] + [Session type rules]` structure from PRD §5.3 is the implementation spec for the system prompt builder
- Session type icons suggested in PRD §6.3 (`SessionTypeCard.vue`) — follow the PRD component spec for card structure

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-session-types-personalisation*
*Context gathered: 2026-04-11*
