---
phase: 13-vocabulary-grammar-test
plan: "04"
subsystem: frontend-placement
tags: [placement-test, onboarding, vocabulary, grammar, vue-component, wiring]
dependency_graph:
  requires:
    - src/pages/VocabularyStage.vue (Plan 13-02)
    - src/pages/GrammarStage.vue (Plan 13-03)
    - src/stores/placement.js setStageResult (Plan 11)
  provides:
    - src/pages/OnboardingPage.vue (vocabulary + grammar stages wired)
  affects:
    - Closes PLACE-02 and PLACE-04 — stages functionally connected to placement shell
tech_stack:
  added: []
  patterns:
    - Component slot wiring via @complete / @skip event handlers
    - isSaving overlay + saveError banner wrapping async store calls
    - QStepper step advancement via step.value assignment (existing pattern)
key_files:
  created: []
  modified:
    - src/pages/OnboardingPage.vue
decisions:
  - "[13-04] handleVocabComplete/handleGrammarComplete wrapped in isSaving/saveError pattern matching handleProfileComplete for consistency"
  - "[13-04] handleVocabSkip/handleGrammarSkip are synchronous — setStageResult does its own async Firestore write internally, skip path does not need isSaving overlay"
metrics:
  duration: "~1 minute"
  completed: "2026-04-07"
  tasks_completed: 1
  files_modified: 1
---

# Phase 13 Plan 04: Vocabulary & Grammar Test — OnboardingPage Wiring Summary

**One-liner:** OnboardingPage.vue vocabulary and grammar stubs replaced with live `VocabularyStage` and `GrammarStage` components wired via `@complete`/`@skip` handlers that persist results to Firestore via `placementStore.setStageResult` and advance the QStepper.

## What Was Built

Updated `src/pages/OnboardingPage.vue` — replaced both "Coming in Phase 13" placeholder stubs:

- Imported `VocabularyStage.vue` and `GrammarStage.vue`
- Stage 2 (vocabulary q-step) now renders `<VocabularyStage @complete="handleVocabComplete" @skip="handleVocabSkip" />`
- Stage 4 (grammar q-step) now renders `<GrammarStage @complete="handleGrammarComplete" @skip="handleGrammarSkip" />`
- `handleVocabComplete(result)`: wraps `placementStore.setStageResult('vocabulary', result)` in isSaving/saveError pattern, then advances `step.value = 'listening'`
- `handleVocabSkip()`: calls `setStageResult('vocabulary', { score: 0, level: 'B1', skipped: true, answers: [] })` then advances to `'listening'`
- `handleGrammarComplete(result)`: same pattern, persists grammar result, advances `step.value = 'speaking'`
- `handleGrammarSkip()`: writes B1 default for grammar, advances to `'speaking'`
- All existing code (STAGE_INDEX map, stageProgress/stageLabel computed, isSaving/saveError refs, handleProfileComplete, handleProfileBack, listening stub, speaking stub) remains untouched

## Tasks

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Replace vocabulary and grammar stubs with real stage components | 20a7d6c | src/pages/OnboardingPage.vue |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - VocabularyStage and GrammarStage are real components calling live Cloud Functions. The listening and speaking stubs remain intentionally (Phases 14 and 15).

## Self-Check: PASSED

- src/pages/OnboardingPage.vue modified: confirmed
- import VocabularyStage: confirmed (line 90)
- import GrammarStage: confirmed (line 91)
- `<VocabularyStage` in vocabulary q-step: confirmed (line 47)
- `<GrammarStage` in grammar q-step: confirmed (line 64)
- handleVocabComplete/handleVocabSkip: confirmed (lines 162, 176)
- handleGrammarComplete/handleGrammarSkip: confirmed (lines 181, 195)
- setStageResult('vocabulary'): confirmed (lines 166, 177)
- setStageResult('grammar'): confirmed (lines 185, 196)
- step.value = 'listening': confirmed (lines 167, 178)
- step.value = 'speaking': confirmed (lines 186, 197)
- "Coming in Phase 13": 0 occurrences (stubs removed)
- STAGE_INDEX untouched: confirmed (lines 101, 110)
- commit 20a7d6c: confirmed
