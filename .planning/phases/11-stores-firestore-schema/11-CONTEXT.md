# Phase 11: Stores & Firestore Schema — Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the complete v1.2 data layer: two new Pinia stores (`placement.js`, `learning.js`), extend `useProfileStore` with v1.2 user fields, extend the `users/{uid}` Firestore schema, create the `scenarioLibrary` Firestore collection, and seed it with templates covering all 4 session types across all supported field/interest categories.

No UI, no Cloud Functions, no routing changes in this phase — pure data layer.

</domain>

<decisions>
## Implementation Decisions

### Profile Store Integration
- **D-01:** Claude's discretion — extend `useProfileStore.setProfile()` to include the new v1.2 fields (`profile`, `placement`, `mistakePatterns`, `sessionTypesCompleted`). Consistent with existing one-read-on-auth pattern. The new stores (`placement.js`, `learning.js`) receive their initial data via setters called from auth flow, not via independent Firestore reads.

### Scenario Library Seeding
- **D-02:** Seed the full library in this phase — 5-10 templates per supported field/interest for all 4 session types (Scenario, Free Talk, Story Builder, Debate). Do not defer seeding to Phase 16.
- **D-03:** Seeding mechanism: Node.js Admin SDK script in `functions/scripts/seed-scenario-library.js`. Idempotent (checks if doc exists before writing), version-controlled, run once via `node functions/scripts/seed-scenario-library.js`.
- **D-04:** Minimum coverage for seed: fields = Engineering, Health, Business, Technology, Student; interests = Travel, Gaming, Cooking, Sports, Music. At least one template per (field × session-type) combination in scope.

### Placement Store Persistence
- **D-05:** Progressive save — `usePlacementStore` writes completed stage results to `placementTests/{uid}` in Firestore immediately after each stage is confirmed, not in a batch at the end. This satisfies the skip/resume requirement (PLACE-12).

### Claude's Discretion
- How `usePlacementStore` and `useLearningStore` are structured internally (state shape, action names) — follow existing Setup Store pattern from `session.js` / `profile.js`.
- Whether to use a `loadPlacement(data)` vs `setPlacement(data)` naming convention — Claude picks the most consistent name.
- Exact Firestore security rules for `scenarioLibrary` (read-only for authenticated users, write-locked to admin).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PRD
- `SpeakAI-Onboarding-Immersion-PRD.md` §5.2 — New Firestore Collections/Fields (exact schema for `users/{uid}`, `placementTests/{uid}`, `scenarioLibrary/{levelId}/scenarios/{scenarioId}`)
- `SpeakAI-Onboarding-Immersion-PRD.md` §6.4 — New Stores (`placement.js` and `learning.js` state shapes)

### Requirements
- `.planning/REQUIREMENTS.md` — INFRA-v12-01 through INFRA-v12-04

### Existing Stores (patterns to follow)
- `src/stores/profile.js` — setProfile pattern, ref declarations, acceptHMRUpdate
- `src/stores/session.js` — async actions, error handling pattern
- `src/stores/index.js` — barrel export pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/profile.js`: `setProfile(data)` action — extend this to include v1.2 fields rather than writing a new loader
- `src/stores/session.js`: Async action pattern with try/catch — reuse for any store async operations
- `src/stores/index.js`: Barrel export — add new stores here

### Established Patterns
- All stores use **Setup Store** pattern (`defineStore('name', () => { ... })`) — not Options API
- All stores export `acceptHMRUpdate` at bottom
- Refs are declared with `const field = ref(null)` then returned in the object
- Actions that talk to Firestore/Functions use try/catch with `console.error` fallback

### Integration Points
- `src/boot/firebase.js` exports `{ auth, db }` — new stores import `db` for Firestore reads/writes
- Auth boot (`src/boot/auth.js`) calls `profileStore.setProfile(data)` after Firestore user doc read — this is where v1.2 field loading should be added
- `functions/` directory — seed script goes in `functions/scripts/seed-scenario-library.js` using Admin SDK (`firebase-admin` already installed)

</code_context>

<specifics>
## Specific References

- Seed script location: `functions/scripts/seed-scenario-library.js`
- Scenario document path: `scenarioLibrary/{levelId}/scenarios/{scenarioId}` where `levelId` is a CEFR level string (e.g., `B1`)
- Minimum seed fields per scenario: `title`, `type` (freeTalk|scenario|storyBuilder|debate), `targetLevel`, `targetSkills[]`, `grammarFocus[]`, `relevantFields[]`, `relevantInterests[]`, `systemPrompt`, `aiRole`, `userRole`, `objectives[]`, `successCriteria`

</specifics>
