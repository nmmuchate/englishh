# Phase 12: Quick Profile & Onboarding Rewrite — Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current 3-step mock wizard in `OnboardingPage.vue` with:
1. **Quick Profile form** — 4 sub-screens collecting occupation/field, interests, goal, and prior experience, writing to `users/{uid}.profile` and initializing `placementTests/{uid}`
2. **Placement test shell** — OnboardingPage becomes the multi-stage wrapper for all 5 placement test stages, using adapted QStepper with a custom linear progress bar

No new Cloud Functions, no routing changes, no scoring logic — pure UI + Firestore writes.

Requirements in scope: PLACE-01, PLACE-11

</domain>

<decisions>
## Implementation Decisions

### A. Welcome Screen
- **D-01:** Remove the current Welcome screen entirely. OnboardingPage opens directly on the Quick Profile form (Stage 1). No "Master English by Speaking" hero, no feature cards. First screen is the placement test shell with the Quick Profile sub-step active.

### B. Quick Profile Layout
- **D-02:** 4 separate sub-screens, one question per screen. A `profileSubStep` ref (1–4) advances through:
  - Sub-step 1: "What do you do?" — quick-pick chips: Student / Professional / Entrepreneur / Other. If Professional is selected, a "What field?" secondary picker appears on the same screen (Engineering, Health, Business, Education, Tech, Other).
  - Sub-step 2: "What are your interests?" — multi-select chips, max 3. Options: Travel, Music, Sports, Cooking, Technology, Movies/TV, Reading, Gaming, Business, Health/Fitness, Art, Nature. Plus "Other" free text.
  - Sub-step 3: "Why are you learning English?" — single-select radio cards: Work / Travel / Education / Personal Growth / Immigration / Fun.
  - Sub-step 4: "Have you studied English before?" — single-select radio cards: Never / A little in school / Several years / I use it daily but want to improve.
- Each sub-screen has its own Continue button. Back arrow returns to the previous sub-step (or exits onboarding if on sub-step 1).
- Stage progress dots remain at Stage 1 of 5 (●○○○○) throughout all 4 sub-steps — sub-step count is NOT shown in the dots.

### C. Shell Architecture
- **D-03:** Keep QStepper as the outer shell — adapted with `:header-nav="false"` and the existing hidden-header pattern. Replace the old 3 steps (`welcome`, `assessment`, `result`) with 5 stage steps: `profile`, `vocabulary`, `listening`, `grammar`, `speaking`.
- **D-04:** Progress indicator: custom linear bar above each step showing stage progress (e.g., "Stage 1 of 5  20% ████░░░░░░░░░░░░░░"). Uses `q-linear-progress` with value computed from current stage index / 5. Replaces the old "Step X of 3" pattern.
- **D-05:** Quick Profile sub-steps extracted into a separate **`QuickProfileStage.vue`** component (not inline v-if in OnboardingPage). OnboardingPage's `profile` QStepper step renders `<QuickProfileStage />`. This component owns `profileSubStep` ref (1–4), the form state, and emits `@complete` with the collected data when sub-step 4 is confirmed.
- Stages 2–5 (`vocabulary`, `listening`, `grammar`, `speaking`) are stubbed in this phase — each QStepper step renders a placeholder that Phases 13–15 will fill.

### D. Firestore Writes
- **D-06:** On Quick Profile completion, write **both** Firestore documents:
  1. `updateDoc(doc(db,'users',uid), { 'profile.occupation':…, 'profile.field':…, 'profile.interests':[…], 'profile.goal':…, 'profile.priorExperience':… })` — dot-notation to avoid wiping other `users/{uid}` fields (Phase 7 pattern)
  2. `setDoc(doc(db,'placementTests',uid), { userId, startedAt: serverTimestamp(), stages: { profile: { completed: true, data: {…} } } }, { merge: true })` — initializes the progressive save doc (D-05 from Phase 11)
- **D-07:** `onboardingCompleted` remains `false` until `calculatePlacement` completes in Phase 15. This phase does NOT set `onboardingCompleted = true`. Auth boot's redirect guard (`auth.js`) already handles this correctly — users mid-test are returned to `/onboarding` on refresh.

### Claude's Discretion
- Exact copy/labels for the occupation quick-picks and interest chips — follow PRD §2.2 wording exactly
- Whether `QuickProfileStage.vue` uses a local `step` ref or receives `profileSubStep` as a prop — Claude picks the cleanest approach
- Stub content for Stages 2–5 placeholder screens (a simple "Coming in test stages…" message or a loading indicator is fine)
- Linear progress bar percentage formula: `stageIndex / totalStages` where stageIndex is 1-based (Stage 1 = 20%, Stage 2 = 40%, …)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PRD
- `SpeakAI-Onboarding-Immersion-PRD.md` §2.2 — Stage 1 Quick Profile screen flow (exact field names, quick-pick options, interest chip options)
- `SpeakAI-Onboarding-Immersion-PRD.md` §5.2 — `users/{uid}.profile` and `placementTests/{uid}` Firestore schemas

### Requirements
- `.planning/REQUIREMENTS.md` — PLACE-01, PLACE-11

### Existing files to read before modifying
- `src/pages/OnboardingPage.vue` — current 444-line QStepper implementation (to be rewritten)
- `src/boot/auth.js` — onboardingCompleted guard and setPlacement call (must not break)
- `src/stores/placement.js` — placement store created in Phase 11 (read-only in this phase)
- `src/stores/profile.js` — setProfile pattern for reference

### Prior phase decisions
- Phase 7 decision: use `updateDoc` (not `setDoc`) on existing `users/{uid}` doc — prevents wiping sibling fields
- Phase 11 D-05: progressive saves to `placementTests/{uid}` use `setDoc(..., { merge: true })`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Patterns
- `q-linear-progress` with `rounded` style — already used in current OnboardingPage for the "Step X of 3" bar; reuse the same visual pattern for the stage bar
- `QItem tag="label" + QRadio` — established radio card pattern from Phase 2 (assessment step uses it now); reuse for sub-steps 3 and 4
- `q-btn` chips for quick-picks — use `QBtn` with `outline`/`flat` toggle pattern (consistent with existing design tokens)
- `updateDoc` + `serverTimestamp()` — already imported in current OnboardingPage.vue; keep same imports

### Files to Create
- `src/pages/QuickProfileStage.vue` — NEW component for Quick Profile sub-steps (owned by this phase)

### Files to Modify
- `src/pages/OnboardingPage.vue` — full rewrite: remove 3 old steps, add 5-stage QStepper shell, render `<QuickProfileStage />` in profile step

### Files NOT to Touch
- `src/boot/auth.js` — already correct; onboardingCompleted guard works as-is
- `src/stores/placement.js`, `src/stores/profile.js` — data layer done in Phase 11
- `src/router/routes.js` — no routing changes needed

</code_context>

<deferred>
## Deferred Ideas

None captured during this discussion.

</deferred>
