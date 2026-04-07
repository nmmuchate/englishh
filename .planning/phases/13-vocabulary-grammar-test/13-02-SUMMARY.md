---
phase: 13-vocabulary-grammar-test
plan: "02"
subsystem: frontend-placement
tags: [placement-test, adaptive, vocabulary, reading, vue-component]
dependency_graph:
  requires:
    - functions/index.js exports.generateTestQuestions (Plan 13-01)
    - src/stores/placement.js (adaptiveLevel ref)
    - src/stores/auth.js (profile for userProfile context)
    - src/boot/firebase.js (functions export for httpsCallable)
  provides:
    - src/pages/VocabularyStage.vue (adaptive vocabulary + reading test stage component)
  affects:
    - Plan 13-04 (OnboardingPage slots in VocabularyStage replacing stub)
tech_stack:
  added: []
  patterns:
    - httpsCallable pattern from boot/firebase functions export (existing pattern)
    - script setup + Vue 3 Composition API (existing pattern)
    - QLinearProgress progress bar, QCard question container, QSkeleton loading state
    - QBanner error state with retry, QBtn answer options
key_files:
  created:
    - src/pages/VocabularyStage.vue
  modified: []
decisions:
  - "[13-02] progressLabel shows currentIndex+1 / total to give 1-based human-readable counter"
  - "[13-02] isPassageSection computed gates passage header display — only shown when currentIndex reaches first passage question"
  - "[13-02] showFeedback guard prevents double-tap on answer options before handleNext resets state"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-07"
  tasks_completed: 1
  files_modified: 1
---

# Phase 13 Plan 02: Vocabulary & Grammar Test — VocabularyStage.vue Summary

**One-liner:** `VocabularyStage.vue` adaptive placement component calling `generateTestQuestions` for MCQ + reading passage questions with 2-correct-up / 2-wrong-down CEFR difficulty engine and `@complete` emit.

## What Was Built

Created `src/pages/VocabularyStage.vue` (241 lines) — a fully self-contained Vocabulary & Reading placement test stage. The component:

- Calls `generateTestQuestions({ type: 'vocabulary', level, userProfile })` via `httpsCallable` on mount
- Renders 6 MCQ questions first, then a reading passage header + 2-3 comprehension questions sequentially
- Implements adaptive CEFR difficulty: 2 consecutive correct answers bumps `adaptiveLevel` up one step (max C2); 2 consecutive wrong answers drops it one step (min A1); counters reset on every answer
- Shows `QLinearProgress` bar with `currentIndex / total` fraction and human-readable `N / total` label
- Shows `QSkeleton` placeholders (progress bar + question card + 4 option buttons) while fetching
- Shows `QBanner` error with Retry button and Skip link if the Cloud Function call fails
- After all questions answered: computes `score` (percentage correct), emits `@complete` with `{ score, level, answers }`
- Emits `@skip` from both error state and bottom skip link

## Tasks

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create VocabularyStage.vue with adaptive MCQ + reading passage flow | 8a9dd96 | src/pages/VocabularyStage.vue |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - VocabularyStage.vue calls the real Cloud Function and renders real data. No hardcoded mock data used.

## Self-Check: PASSED

- src/pages/VocabularyStage.vue exists: confirmed (241 lines)
- httpsCallable import: confirmed (line 120)
- generateTestQuestions call: confirmed (line 158)
- CEFR_ORDER defined and used: confirmed (lines 127, 190-200)
- consecutiveCorrect/consecutiveWrong: confirmed (4+ lines each)
- emit('complete'): confirmed (line 216, in handleNext)
- emit('skip'): confirmed (lines 30, 109)
- isPassageSection computed + template usage: confirmed
- q-skeleton loading state: confirmed (lines 6-8)
- commit 8a9dd96: confirmed
