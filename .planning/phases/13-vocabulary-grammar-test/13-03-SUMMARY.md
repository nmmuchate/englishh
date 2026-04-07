---
phase: 13-vocabulary-grammar-test
plan: "03"
subsystem: frontend-placement
tags: [placement-test, adaptive, grammar, error-spot, sentence-completion, vue-component]
dependency_graph:
  requires:
    - functions/index.js exports.generateTestQuestions (Plan 13-01)
    - src/stores/placement.js (adaptiveLevel ref)
    - src/stores/auth.js (profile for userProfile context)
    - src/boot/firebase.js (functions export for httpsCallable)
  provides:
    - src/pages/GrammarStage.vue (adaptive grammar placement test stage component)
  affects:
    - Plan 13-04 (OnboardingPage slots in GrammarStage)
tech_stack:
  added: []
  patterns:
    - httpsCallable pattern from boot/firebase functions export (existing pattern)
    - script setup + Vue 3 Composition API (existing pattern)
    - QLinearProgress progress bar, QCard question container, QSkeleton loading state
    - QBanner error state with retry, QInput for typed answers
    - splitSentence helper for errorWord highlighting using template v-for
key_files:
  created:
    - src/pages/GrammarStage.vue
  modified: []
decisions:
  - "[13-03] splitSentence splits sentence string around errorWord to produce 3-part array [before, errorWord, after] — enables v-for loop in template to wrap only the middle part in a highlight span"
  - "[13-03] handleCheck guard prevents double-submit (showFeedback check + empty input check) — mirrors VocabularyStage showFeedback guard"
  - "[13-03] userInput reset to '' in handleNext — ensures each new question starts with an empty input field"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-07"
  tasks_completed: 1
  files_modified: 1
---

# Phase 13 Plan 03: Vocabulary & Grammar Test — GrammarStage.vue Summary

**One-liner:** `GrammarStage.vue` adaptive placement component calling `generateTestQuestions` for error-spot (word highlighting + correction input) and sentence-completion (fill-in-the-blank input) questions with identical 2-correct-up / 2-wrong-down CEFR difficulty engine and `@complete` emit.

## What Was Built

Created `src/pages/GrammarStage.vue` (276 lines) — a fully self-contained Grammar placement test stage. The component:

- Calls `generateTestQuestions({ type: 'grammar', level, userProfile })` via `httpsCallable` on mount
- Renders error-spot questions with the errorWord highlighted using a `splitSentence()` helper that splits the sentence into [before, errorWord, after] parts and wraps the middle part in a colored span
- Renders sentence-completion questions showing the stem with a fill-in-the-blank input
- Both question types use a `QInput` for typed answers, a "Check" button that evaluates the answer, and inline feedback showing correct/incorrect status
- Implements adaptive CEFR difficulty identical to VocabularyStage: 2 consecutive correct answers bumps `adaptiveLevel` up one step (max C2); 2 consecutive wrong answers drops it one step (min A1); counters reset on every answer
- Shows `QLinearProgress` bar with `currentIndex / total` fraction and human-readable `N / total` label
- Shows `QSkeleton` placeholders (progress bar + question card + 4 skeleton rows) while fetching
- Shows `QBanner` error with Retry button and Skip link if the Cloud Function call fails
- After all questions answered: computes `score` (percentage correct), emits `@complete` with `{ score, level, answers }`
- Emits `@skip` from both error state and bottom skip link

## Tasks

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create GrammarStage.vue with error-spot and sentence-completion flow | 787109f | src/pages/GrammarStage.vue |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - GrammarStage.vue calls the real Cloud Function and renders real data. No hardcoded mock data used.

## Self-Check: PASSED

- src/pages/GrammarStage.vue exists: confirmed (276 lines)
- httpsCallable import: confirmed (line 154)
- generateTestQuestions call with type='grammar': confirmed (line 187)
- CEFR_ORDER defined and used: confirmed (lines 161, 232-243)
- consecutiveCorrect/consecutiveWrong: confirmed (10+ lines each)
- handleCheck function: confirmed (line 213)
- splitSentence function: confirmed (line 203, template line 58)
- error-spot template: confirmed (line 55)
- sentence-completion template: confirmed (line 87)
- emit('complete'): confirmed (line 258, in handleNext)
- emit('skip'): confirmed (lines 30, 141)
- adaptiveLevel usage count: 7 (>= 4 requirement met)
- commit 787109f: confirmed
