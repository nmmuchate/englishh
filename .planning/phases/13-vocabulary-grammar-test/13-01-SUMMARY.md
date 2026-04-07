---
phase: 13-vocabulary-grammar-test
plan: "01"
subsystem: cloud-functions
tags: [placement-test, ai-generation, openai, cloud-functions]
dependency_graph:
  requires:
    - functions/index.js (existing OpenAI + onCall pattern)
    - OPENAI_API_KEY secret (declared in Phase 6)
  provides:
    - exports.generateTestQuestions (callable by VocabularyStage and GrammarStage)
  affects:
    - Plans 13-02, 13-03 (consume this function via httpsCallable)
tech_stack:
  added: []
  patterns:
    - onCall with region africa-south1 and OPENAI_API_KEY secret (existing pattern)
    - OpenAI instantiated inside handler body (existing pattern)
    - response_format json_object (existing pattern)
    - HttpsError for validation and parse failure (existing pattern)
key_files:
  created: []
  modified:
    - functions/index.js
decisions:
  - "[13-01] generateTestQuestions uses separate OpenAI calls per type (vocabulary vs grammar) — allows independent max_tokens tuning (1500 vs 1200) and independent prompt engineering per test type"
  - "[13-01] JSON parse failure throws HttpsError('internal') — client components can show a retry prompt rather than crashing with an unhandled parse error"
  - "[13-01] userProfile passed to prompt as JSON.stringify context hint — enables topic personalisation without adding complexity to the schema"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-07"
  tasks_completed: 1
  files_modified: 1
---

# Phase 13 Plan 01: Vocabulary & Grammar Test — generateTestQuestions Cloud Function Summary

**One-liner:** `generateTestQuestions` onCall Cloud Function using GPT-4o-mini to generate adaptive vocabulary MCQ + reading passage and grammar error-spot + sentence-completion question sets.

## What Was Built

Added a new `exports.generateTestQuestions` Cloud Function to `functions/index.js` (lines 626–769). The function:

- Accepts `{ type, level, userProfile }` via onCall
- Validates auth and type (`'vocabulary'` | `'grammar'`)
- For `type='vocabulary'`: generates 6 MCQ questions + 1 reading passage with 2 comprehension questions via GPT-4o-mini (1500 max_tokens)
- For `type='grammar'`: generates 4 error-spot questions + 2 sentence-completion questions via GPT-4o-mini (1200 max_tokens)
- Returns the parsed JSON object matching the exact contract shape that VocabularyStage and GrammarStage components will consume
- Throws `HttpsError('invalid-argument')` for invalid type and `HttpsError('internal')` on JSON parse failure

## Tasks

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add generateTestQuestions Cloud Function | 9c5b294 | functions/index.js |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - this is a pure Cloud Function implementation with no UI rendering stubs.

## Self-Check: PASSED

- functions/index.js modified: confirmed (grep returns line 629)
- exports.generateTestQuestions export: confirmed (returns `function` via node require)
- commit 9c5b294: confirmed
