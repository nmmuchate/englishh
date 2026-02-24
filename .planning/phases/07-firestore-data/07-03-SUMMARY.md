---
phase: 07-firestore-data
plan: "03"
subsystem: vocabulary-data-layer
tags: [firestore, vocabulary, pinia, vue]
dependency_graph:
  requires: [07-01]
  provides: [vocabulary-service, vocabulary-store, vocabulary-firestore-bindings]
  affects: [VocabularyPage, FeedbackPage]
tech_stack:
  added: []
  patterns: [firestore-subcollection-read-write, pinia-store-wraps-service, onMounted-load-pattern]
key_files:
  created:
    - src/services/vocabulary.js
    - src/stores/vocabulary.js
  modified:
    - src/pages/VocabularyPage.vue
    - src/pages/FeedbackPage.vue
decisions:
  - "Firestore subcollection path vocabulary/{uid}/words used — keeps per-user data isolated under vocabulary top-level collection per TRD schema"
  - "saveWord() reloads full word list after write — simpler than optimistic push, acceptable for vocabulary bank (low frequency operation)"
  - "Optional fields (phonetic, pos, difficulty) guarded with v-if in VocabularyPage — Firestore schema does not store these; display slots preserved for future enriched data"
  - "FeedbackPage static vocabWords array retained — Phase 9 replaces it with real session scoring data; DATA-06 only requires the save action to exist now"
metrics:
  duration: "~2 min"
  completed: "2026-02-24"
  tasks_completed: 2
  files_changed: 4
---

# Phase 07 Plan 03: Vocabulary Data Layer Summary

Vocabulary Firestore data layer: subcollection service + Pinia store wiring VocabularyPage to read real words and FeedbackPage to save words to Firestore.

## What Was Built

### Task 1: Vocabulary service and store (c97e888)

**src/services/vocabulary.js** — New file providing two Firestore operations against the `vocabulary/{uid}/words` subcollection:
- `loadVocabularyWords(uid)` — `getDocs` returning `[{ id, ...data }]` array
- `saveVocabularyWord(uid, wordData)` — `addDoc` with TRD schema fields (`word`, `definition`, `exampleSentence`, `sourceSessionId`, `timesEncountered`, `savedAt`, `lastReviewedAt`)

**src/stores/vocabulary.js** — New Pinia store (`useVocabularyStore`) wrapping the service:
- `words` ref (array), `isLoading` ref (boolean)
- `loadWords()` — gets uid from `useAuthStore`, calls `loadVocabularyWords`, guards on missing uid
- `saveWord(wordData)` — calls `saveVocabularyWord` then reloads list
- `reset()` — clears state for sign-out
- HMR update registered

### Task 2: VocabularyPage + FeedbackPage wiring (a9213d9)

**src/pages/VocabularyPage.vue** — Replaced hardcoded 8-word array with Firestore data:
- `onMounted` calls `vocabStore.loadWords()`
- `v-for` iterates `vocabStore.words` (from Firestore)
- Stats row shows `{{ profileStore.totalVocabularyWords }} words learned` (from profile store, not hardcoded 183)
- Empty state div shown when `vocabStore.words.length === 0 && !vocabStore.isLoading`
- Optional fields guarded: `v-if="word.phonetic"`, `v-if="word.pos"`, `v-if="word.difficulty"`
- Example uses `word.example ?? word.exampleSentence ?? ''` to handle both field names

**src/pages/FeedbackPage.vue** — Added vocabulary save capability:
- Imports `useVocabularyStore` and creates `vocabStore` instance
- `saveWordToBank(word)` async function calls `vocabStore.saveWord({ word: word.term, definition, example })`
- "Add to Bank" QBtn (flat, dense, no-caps, bookmark icon) added to each word card in vocabulary tab

## Decisions Made

| Decision | Rationale |
|---|---|
| Reload list after saveWord() | Simpler than optimistic push; vocabulary bank is low-frequency writes |
| v-if guards for phonetic/pos/difficulty | Firestore schema omits these; display slots preserved for future enriched data |
| FeedbackPage keeps static vocabWords | Phase 9 replaces with real session data; this plan only adds save affordance |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

### Files exist
- [x] src/services/vocabulary.js
- [x] src/stores/vocabulary.js
- [x] src/pages/VocabularyPage.vue (modified)
- [x] src/pages/FeedbackPage.vue (modified)

### Commits exist
- [x] c97e888 — feat(07-03): create vocabulary service and store
- [x] a9213d9 — feat(07-03): wire VocabularyPage to Firestore store + add save button in FeedbackPage

### Must-haves satisfied
- [x] VocabularyPage renders `vocabStore.words` not hardcoded array
- [x] "Add to Bank" button calls `saveWord()` in FeedbackPage vocabulary tab
- [x] Empty state shown when subcollection is empty
- [x] Words count reads from `profileStore.totalVocabularyWords`

## Self-Check: PASSED
