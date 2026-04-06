---
phase: 11-stores-firestore-schema
plan: "01"
subsystem: stores
tags: [pinia, firestore, stores, v1.2, placement, learning]
dependency_graph:
  requires: []
  provides: [usePlacementStore, useLearningStore, useProfileStore-v12, firestore-rules-placementTests-scenarioLibrary]
  affects: [src/stores/placement.js, src/stores/learning.js, src/stores/profile.js, src/boot/auth.js, firestore.rules]
tech_stack:
  added: []
  patterns: [Pinia Setup Store, acceptHMRUpdate, setDoc-merge-true, progressive-save-D05]
key_files:
  created:
    - src/stores/placement.js
    - src/stores/learning.js
  modified:
    - src/stores/profile.js
    - src/boot/auth.js
    - firestore.rules
decisions:
  - "setPlacement/setLearning naming follows setProfile convention — 'set' prefix is project standard for loading Firestore data into stores"
  - "D-05 progressive save: saveStageResult uses setDoc with merge:true — never overwrites sibling stages"
  - "STAGE_ORDER array in placement.js drives currentStage advancement — avoids hardcoded index math"
  - "placementStore/learningStore instantiated inside onAuthStateChanged callback (not at module level) — consistent with existing profileStore pattern"
metrics:
  duration: 2min
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_changed: 5
---

# Phase 11 Plan 01: Stores & Firestore Schema Summary

**One-liner:** Two new Pinia stores (placement.js, learning.js) with Setup Store pattern + progressive Firestore saves, profile store extended with 4 v1.2 fields, auth boot wired for all stores, Firestore rules added for placementTests and scenarioLibrary.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create placement.js and learning.js Pinia stores | 1ba72de | src/stores/placement.js, src/stores/learning.js |
| 2 | Extend profile store, wire auth boot, update Firestore rules | bb70d72 | src/stores/profile.js, src/boot/auth.js, firestore.rules |

## What Was Built

### src/stores/placement.js (NEW)
- `usePlacementStore` with 5 refs: `currentStage`, `stageResults`, `adaptiveLevel`, `isComplete`, `finalResult`
- `setPlacement(data)` — loads from Firestore user doc, defaults `currentStage` to 'profile' if no prior placement
- `setStageResult(stageKey, result)` — updates local state, advances stage, calls `saveStageResult` immediately
- `saveStageResult(stageKey, data)` — async: `setDoc(..., { merge: true })` to `placementTests/{uid}` (D-05 progressive save)
- `completeTest(result)` — sets finalResult, writes `completedAt + serverTimestamp()` to Firestore
- `reset()` — clears all state on sign-out

### src/stores/learning.js (NEW)
- `useLearningStore` with 4 refs: `recommendedSession`, `skillProgress`, `mistakePatterns`, `weeklyGoal`
- `setLearning(data)` — loads `skillProgress` from `data.placement?.skills`, `mistakePatterns` from user doc
- `reset()` — clears all state on sign-out

### src/stores/profile.js (EXTENDED)
- Added 4 v1.2 refs: `profile`, `placement`, `mistakePatterns`, `sessionTypesCompleted`
- `setProfile()` now assigns all 4 new fields with `??` defaults
- `reset()` now resets all 4 new fields
- All 4 new refs included in return object

### src/boot/auth.js (EXTENDED)
- Imports `usePlacementStore` and `useLearningStore`
- On sign-in: calls `setPlacement(profile)` and `setLearning(profile)` after `setProfile(profile)`
- On sign-out: calls `placementStore.reset()` and `learningStore.reset()` after `profileStore.reset()`

### firestore.rules (EXTENDED)
- `placementTests/{userId}`: owner read/create/update, delete forbidden
- `scenarioLibrary/{levelId}/scenarios/{scenarioId}`: any authenticated user can read, write locked to Admin SDK

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — these are pure data-layer stores with no UI rendering. `recommendedSession` is intentionally `null` (computed at runtime by Cloud Function, not stored — per plan spec).

## Self-Check: PASSED
