# Phase 17: Progression & Mistake Tracking — Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 17 wires up the backend progression loop:
1. **Per-skill progress updates** — after every session, `endSession` updates `users/{uid}.placement.skills` (all 6 skills: vocabulary, reading, listening, grammar, speaking, writing) based on GPT-scored session performance
2. **Level-up detection** — when a skill's rolling 10-session average meets the next-level threshold, `endSession` increments that skill's level in Firestore and returns a `levelUps` array so the frontend can display a banner on FeedbackPage
3. **Mistake persistence** — grammar mistakes and vocabulary gaps from each session are extracted and persisted to `users/{uid}.mistakePatterns`, incrementing occurrence counts for repeated patterns
4. **Mistake recycling in generateSessionPlan** — ensure the existing function explicitly incorporates active mistake patterns into the AI prompt (not just passing them as context but naming them in session objectives)
5. **`getWeeklyReview` Cloud Function** — new onCall CF deployed to `africa-south1` that reads the user's mistake patterns from the past 7 days and returns a structured review session plan

Scope does NOT include: UI for triggering weekly review (Phase 19), ProgressPage per-skill charts (Phase 19), MistakePatternCard component (Phase 19), or any changes to SessionPage.vue chat UI.

</domain>

<decisions>
## Implementation Decisions

### D-01: Per-Skill Scoring — Extend GPT Prompt
- Change `endSession`'s GPT scoring prompt to return all 6 CEFR skills instead of 4 aggregate scores.
- New response format:
  ```json
  {
    "scores": {
      "fluency": N,
      "grammar": N,
      "vocabulary": N,
      "overall": N,
      "reading": N,
      "listening": N,
      "speaking": N,
      "writing": N
    },
    "feedback": {
      "pronunciationIssues": [],
      "grammarMistakes": [],
      "vocabularySuggestions": []
    }
  }
  ```
- `reading`, `listening`, `speaking`, `writing` are inferred from the transcript (AI judges whether the user responded accurately to reading/listening cues, and speaking fluency vs writing clarity).
- The existing `scores.fluency`, `scores.grammar`, `scores.vocabulary`, `scores.overall` fields must remain in the response for backwards compatibility (FeedbackPage consumes them).

### D-02: Per-Skill Progress Update in endSession
- After scoring, `endSession` reads `users/{uid}.placement.skills` from Firestore.
- For each of the 6 skills, compute new `progress` value:
  - Read the last 10 session scores for that skill from `sessions/{sessionId}` or compute a rolling average from the current stored progress + new session score.
  - Simple approach: weighted moving average — `newProgress = Math.round(oldProgress * 0.9 + sessionScore * 0.1)` where sessionScore is 0-100.
  - `progress` is clamped to 0–100.
- Level-up check: if `newProgress >= 100` for a skill, increment the CEFR level for that skill (`A1→A2→B1→B2→C1→C2`) and reset `progress` to 0.
- All 6 skill updates are written in a single `update` call to `users/{uid}` alongside the existing stat updates (merge with the existing parallel `Promise.all`).

### D-03: Level-Up Event — FeedbackPage Banner
- `endSession` returns a `levelUps` array in its response: `levelUps: [{ skill, from, to }]` (empty array if no level-ups occurred).
- `useSessionStore` stores `levelUps` in a new `levelUps` ref after `endSession` resolves.
- `FeedbackPage.vue` reads `sessionStore.levelUps` on mount. If non-empty, displays a banner at the top of the page: e.g. "Your Grammar just leveled up to B1!" styled with the primary green color.
- Banner uses existing design system: `QBanner` or a styled `div` with `background: var(--q-primary)` and white text. No new component needed.
- `levelUps` is reset when the next session starts (in `startSession()`).

### D-04: Mistake Persistence
- In `endSession`, after scoring, read `feedback.grammarMistakes` and `feedback.vocabularySuggestions` from the GPT response.
- For each mistake/suggestion, derive a `pattern` key (e.g., `present_perfect_vs_simple_past`, `vocabulary:ambiguous`). Pattern key is a snake_case string extracted from the mistake description using a simple normalizer (replace spaces with underscores, lowercase).
- Update `users/{uid}.mistakePatterns` array in Firestore:
  - If a pattern with the same key exists: `occurrences++`, update `lastSeen`
  - If the pattern key is new: add entry `{ pattern, occurrences: 1, lastSeen: now, corrections: 0, status: 'active' }`
- Use Firestore `arrayUnion` is not suitable for object arrays — read the existing array, merge in code, then write back with `update`.
- Limit persisted patterns to the 20 most recently seen active patterns (trim oldest on write to prevent unbounded growth).
- `corrections` is incremented separately: `getWeeklyReview` (and future session feedback) can increment it when the user demonstrates correct usage. Not incremented by `endSession`.
- Resolution: when `corrections >= occurrences`, set `status: 'resolved'` (handled in future — not in Phase 17, since corrections tracking requires additional logic not in scope).

### D-05: Mistake Recycling in generateSessionPlan
- The current implementation already passes `recentMistakes` as an array of pattern strings. This is sufficient — the PRD §5.3 prompt architecture already instructs the AI to name mistake patterns in session objectives.
- Verify that the `generateSessionPlan` system prompt template (in `functions/index.js`) includes the `[Mistake recycling]` section from PRD §5.3. If it does not explicitly name patterns in the objectives, update the prompt to inject them.
- No structural change to `generateSessionPlan`'s interface is needed.

### D-06: getWeeklyReview Cloud Function
- New `exports.getWeeklyReview = onCall({ region: 'africa-south1', secrets: [OPENAI_API_KEY] }, ...)` in `functions/index.js`.
- Input: `{ uid }` (or reads from `request.auth.uid`)
- Logic:
  1. Read `users/{uid}.mistakePatterns` — filter to those with `lastSeen` within the past 7 days AND `status === 'active'`
  2. Pass the top 5 patterns (by occurrences, desc) to GPT-4o-mini
  3. GPT returns a review session plan: `{ topic, systemPrompt, initialMessage, role, context, objectives }` structured the same as `generateSessionPlan`'s output
  4. Does NOT create a Firestore session doc — calling `startSession()` via `generateSessionPlan` is still needed to get a `sessionId`. `getWeeklyReview` only returns the plan.
- No UI entry point in Phase 17 — the function is deployed and callable but the trigger button is Phase 19's responsibility.

### D-07: No Changes to endSession Return Shape (Breaking Change Guard)
- `endSession` already returns `{ scores, feedback }`. Phase 17 adds `levelUps` to this return object.
- The existing FeedbackPage destructures `scores` and `feedback` only — adding `levelUps` is additive and non-breaking.
- `useSessionStore.endSession()` already destructures `result.data.scores` and `result.data.feedback` — extend to also set `levelUps.value = result.data.levelUps ?? []`.

### Claude's Discretion
- Exact CEFR level progression sequence string array (`['A1','A2','B1','B2','C1','C2']`)
- Pattern key normalization algorithm (how to derive snake_case key from GPT's mistake description string)
- Whether to debounce multiple identical mistakes within a single session before persisting (e.g., if grammar mistake fires 3x in one session, count as 1 occurrence or 3)
- Visual styling of the level-up banner on FeedbackPage (exact colors, icon, animation)
- Error handling if `endSession`'s skill update fails (session score still returns, skills update best-effort)

</decisions>

<specifics>
## Specific Ideas

- PRD §3.6.2 defines the exact `placement.skills` shape: `{ level: "B1", progress: 65 }` per skill — `endSession` must write to `users/{uid}.placement.skills.{skill}.progress` and `users/{uid}.placement.skills.{skill}.level`
- PRD §3.6.3 defines the mistakePatterns array shape — use it verbatim as the Firestore schema
- PRD §5.3 defines the `[Mistake recycling]` section of the generateSessionPlan prompt — verify this is already in functions/index.js; if not, insert it

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PRD — Progression & Mistakes
- `SpeakAI-Onboarding-Immersion-PRD.md` §3.6.1 — Level-up criteria (rolling 10-session window, per-skill thresholds)
- `SpeakAI-Onboarding-Immersion-PRD.md` §3.6.2 — Skill-specific progression schema (`placement.skills` shape, progress 0–100, level field)
- `SpeakAI-Onboarding-Immersion-PRD.md` §3.6.3 — Mistake pattern tracking (mistakePatterns array schema, resolved logic)
- `SpeakAI-Onboarding-Immersion-PRD.md` §5.3 — AI prompt architecture for generateSessionPlan (mistake recycling section)

### PRD — Cloud Functions
- `SpeakAI-Onboarding-Immersion-PRD.md` §5.1 — getWeeklyReview function definition
- `SpeakAI-Onboarding-Immersion-PRD.md` §5.2 — Firestore schema for `users/{uid}.placement.skills` and `users/{uid}.mistakePatterns`

### Requirements
- `.planning/REQUIREMENTS.md` — PROG-v12-01 through PROG-v12-05

### Existing files to read before modifying
- `functions/index.js` lines 189–365 — `endSession` implementation (scoring prompt, Firestore writes, return shape)
- `functions/index.js` lines 963+ — `generateSessionPlan` implementation (verify [Mistake recycling] section in prompt)
- `src/stores/session.js` — `endSession()` action, `levelUps` ref needs to be added, destructuring of `result.data`
- `src/stores/learning.js` — `mistakePatterns` ref and `setLearning()` action (needs to reload after endSession updates Firestore)
- `src/pages/FeedbackPage.vue` — where level-up banner must be inserted
- `src/stores/placement.js` — `finalResult.skills` shape (reference for what the update writes to)

### Prior phase decisions
- Phase 8: `africa-south1` region for all Cloud Functions
- Phase 8: `OPENAI_API_KEY` secret — same pattern for getWeeklyReview
- Phase 16 D-03: `generateSessionPlan` replaces `startConversation`; `sendMessage` and `endSession` unchanged — Phase 17 extends `endSession` only

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `functions/index.js` endSession (lines 189–365): Existing Firestore parallel write pattern (`Promise.all([sessionRef.update, userDoc.update, leaderboard.set])`) — extend the `users/{uid}` update to include skill progress fields
- `src/pages/FeedbackPage.vue`: Level-up banner inserts at top of page — check existing layout for correct insertion point
- `src/stores/session.js`: `levelUps` ref must be added alongside existing `scores` and `sessionPlan` refs

### Established Patterns
- Firestore writes in `endSession` use `admin.firestore().doc('users/${uid}').update({...})` with field paths like `totalSessionsCompleted`, `averageScore` — use dot-notation field paths for nested skill updates: `placement.skills.grammar.progress`
- Error handling: `try/catch` around GPT calls with fallback scores — skill update should follow the same pattern (best-effort, non-fatal if scoring fails)
- `useSessionStore` Setup Store with `ref()` declarations and `acceptHMRUpdate` — extend by adding `levelUps = ref([])` and resetting in `startSession()`

### Integration Points
- `endSession` in `functions/index.js`: extend GPT prompt → parse 8-score response → compute new skill progress → check level-ups → write to Firestore → return `{ scores, feedback, levelUps }`
- `useSessionStore.endSession()` in `src/stores/session.js`: set `levelUps.value = result.data.levelUps ?? []`
- `FeedbackPage.vue`: read `sessionStore.levelUps` on mount, render banner if non-empty
- `getWeeklyReview`: new export in `functions/index.js` after `generateSessionPlan`

</code_context>

<deferred>
## Deferred Ideas

- `corrections` increment logic (marking mistakes resolved) — requires tracking when AI corrects a user's specific mistake during a session; deferred to v1.3 real-time feedback work
- Weekly review UI entry point (Review button on Dashboard/SessionTypeSelectPage) — Phase 19
- ProgressPage per-skill trend charts and MistakePatternCard — Phase 19
- Pro gate on weekly review session — Phase 18

</deferred>

---

*Phase: 17-progression-mistake-tracking*
*Context gathered: 2026-04-15*
