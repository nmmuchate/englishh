---
phase: 17-progression-mistake-tracking
plan: "01"
subsystem: cloud-functions
tags: [progression, level-up, mistake-tracking, weekly-review, endSession, generateSessionPlan]
dependency_graph:
  requires: [16-01]
  provides: [per-skill-progression, level-up-detection, mistake-patterns, weekly-review-function]
  affects: [FeedbackPage.vue (level-up banner consumer), src/stores/session.js (levelUps ref)]
tech_stack:
  added: []
  patterns: [read-merge-write for Firestore object arrays, weighted-moving-average progression, CEFR level constant array, dot-notation nested field update]
key_files:
  modified:
    - functions/index.js
decisions:
  - "CEFR_LEVELS constant and nextCefrLevel() helper placed immediately after OPENAI_API_KEY definition for global reuse across all functions"
  - "toPatternKey() normalizer defined inside endSession try/catch block — derives snake_case keys from GPT mistake strings (lowercase, strip punctuation, take first 6 words, join with _, cap at 80 chars)"
  - "Per-session deduplication: each unique pattern key counted once per session (not once per GPT mention) — seenThisSession Set guards against inflated occurrence counts"
  - "Skill/mistake block wrapped in best-effort try/catch — scoring anomaly does not break session write; skillUpdates = {} and trimmedPatterns = userData.mistakePatterns on failure"
  - "max_tokens raised from 512 to 768 in endSession GPT call to accommodate 4 extra score fields in JSON response"
  - "getWeeklyReview does NOT create a Firestore session doc — returns plan only; caller uses generateSessionPlan for actual sessionId"
metrics:
  duration: "~15min"
  completed_date: "2026-04-16"
  tasks_completed: 3
  files_modified: 1
---

# Phase 17 Plan 01: Progression Backend — endSession Extension + getWeeklyReview Summary

**One-liner:** Extended `endSession` to score all 6 CEFR skills, persist mistake patterns, detect level-ups, and added `getWeeklyReview` Cloud Function that builds a review plan from the user's last-7-day active mistake patterns.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Extend endSession with per-skill scoring, level-up detection, and mistake persistence | 80e1daa |
| 2 | Update generateSessionPlan mistake-recycling prompt to name patterns in objectives | 90c7e7b |
| 3 | Add getWeeklyReview Cloud Function export | cdb9a43 |

## What Was Built

### Task 1: endSession Extension (functions/index.js lines 30-41, 198-430)

**CEFR_LEVELS constant (lines 33-41):**
- `CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']` placed after `MOZPAYMENTS_API_KEY`
- `nextCefrLevel(current)` helper handles unknown levels (→ B1) and max level (C2 stays C2)

**GPT scoring prompt updated (lines ~219-244):**
- Prompt now requests all 8 score fields: fluency, grammar, vocabulary, overall, reading, listening, speaking, writing
- Instructs GPT to infer reading/listening/speaking/writing from transcript context
- `max_tokens` raised from 512 to 768
- Fallback scores include all 8 fields

**Per-skill progression block (lines ~285-393):**
- SKILL_KEYS = ['vocabulary', 'reading', 'listening', 'grammar', 'speaking', 'writing']
- Reads `userData.placement.skills` for existing progress/level
- Weighted moving average: `newProgress = Math.round(prevProgress * 0.9 + skillScore * 0.1)`
- Level-up detected when `newProgress >= 100`: promotes to next CEFR tier, resets progress to 0
- Writes using dot-notation field paths: `placement.skills.{skill}.progress`, `placement.skills.{skill}.level`

**Mistake persistence (lines ~340-393):**
- `toPatternKey()`: lowercases, strips punctuation, takes first 6 words, joins with underscore, caps at 80 chars
- Per-session deduplication via `seenThisSession` Set
- Read-merge-write pattern (arrayUnion not suitable for object arrays)
- Caps at 20 most recently seen active patterns

**Return shape (line ~428):** `{ scores, feedback, levelUps }` — additive, non-breaking

**Users/{uid} update:** Now includes `mistakePatterns: trimmedPatterns` and spread `...skillUpdates`

### Task 2: generateSessionPlan prompt update (functions/index.js lines ~1145-1182)

- `mistakeRecycling` system prompt block now uses `topMistakes` variable and adds instruction: "you MUST name these patterns verbatim in at least one objective"
- `userPrompt` now includes `Recent mistake patterns: ${JSON.stringify(topMistakes)}` line after skill gaps
- New rule appended: "If recentMistakes are listed above, at least one of the 2-3 objectives MUST explicitly reference a mistake pattern by name"

### Task 3: getWeeklyReview (functions/index.js line 1244)

- `exports.getWeeklyReview = onCall({ region: 'africa-south1', secrets: [OPENAI_API_KEY] }, ...)`
- Reads `users/{uid}.mistakePatterns`, filters to `status === 'active'` AND `lastSeen >= 7 days ago`
- Picks top 5 by occurrences (desc)
- Edge case: 0 active patterns → returns free-form conversation plan with `sourcePatterns: []`
- GPT prompt requires each objective to name a pattern verbatim
- Returns: `{ topic, systemPrompt, initialMessage, role, context, objectives, sourcePatterns }`
- Does NOT create session doc; `sourcePatterns` array is the list of pattern strings used

## Pattern-Key Normalization Algorithm

```
toPatternKey(description):
  1. Guard: if not string → null
  2. Lowercase
  3. Strip non-alphanumeric/non-space: replace(/[^a-z0-9\s]/g, '')
  4. Trim whitespace
  5. Split on whitespace → take first 6 tokens
  6. Join with underscore
  7. Slice to 80 chars
  8. Return null if empty string after all steps
```

Examples:
- "Using 'was' instead of 'were'" → `using_was_instead_of_were`
- "Confusion between present perfect and simple past" → `confusion_between_present_perfect_and_simple`
- "Vocabulary: 'ambiguous' used incorrectly" → `vocabulary_ambiguous_used_incorrectly`

## GPT Prompt Tuning Notes

- max_tokens for endSession scoring raised from 512 → 768 to accommodate 4 extra score fields in JSON response
- The prompt explicitly states "All 8 score fields are REQUIRED. Scores are integers 0-100." to prevent partial responses
- Reading/listening/speaking/writing are flagged as "inferred from transcript" so GPT doesn't refuse to score non-tested skills
- getWeeklyReview uses temperature 0.7 (vs 0.8 for generateSessionPlan) — slightly less creative since it's recycling existing patterns, not inventing new topics

## Deploy Command

```bash
npx firebase deploy --only functions:endSession,functions:generateSessionPlan,functions:getWeeklyReview
```

Deployment is deferred to phase-level manual verification as per plan.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] functions/index.js modified (all 3 tasks in-place + append)
- [x] CEFR_LEVELS present (4 occurrences)
- [x] nextCefrLevel present (2 occurrences)
- [x] levelUps in return statement (1 match)
- [x] mistakePatterns: trimmedPatterns in update (1 match)
- [x] exports.getWeeklyReview at line 1244 (after generateSessionPlan line 1081)
- [x] sevenDaysAgoMs (2 occurrences)
- [x] sourcePatterns (3 occurrences)
- [x] Module loads: `node -e "require('./functions/index.js')"` exits 0
- [x] Export count: 12 → 13 (+1 exactly for getWeeklyReview)
- [x] Commits: 80e1daa, 90c7e7b, cdb9a43
