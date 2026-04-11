---
phase: 15
plan: 01
subsystem: placement-test
tags: [speaking, writing, placement-result, cloud-functions, speech-recognition]
dependency_graph:
  requires:
    - 14-02 (ListeningStage wired into OnboardingPage)
    - placement.js store (stageResults, adaptiveLevel, completeTest)
  provides:
    - SpeakingStage.vue (Web Speech API mic input + text fallback + exchange bubbles)
    - WritingStage.vue (textarea with 20-char gate + submit)
    - PlacementResultPage.vue (CEFR badge + skill breakdown + CTA)
    - evaluateSpeakingTest Cloud Function (GPT-4o-mini speaking scorer)
    - calculatePlacement Cloud Function (weighted CEFR aggregator + Firestore persist)
  affects:
    - OnboardingPage.vue (stage 5 stub replaced; TOTAL_STAGES 5→6)
    - routes.js (/placement-result route added)
tech_stack:
  added:
    - Web Speech API (SpeechRecognition) in SpeakingStage (same pattern as SessionPage)
  patterns:
    - Stage component emit contract: complete(result) / skip — identical to VocabularyStage, GrammarStage, ListeningStage
    - calcPlacement-then-navigate: OnboardingPage sets stageResult then router.push to placement-result; PlacementResultPage calls Cloud Function on mount
    - Text fallback: showTextInput defaults to !speechAvailable (Phase 8 pattern [08-02])
key_files:
  created:
    - src/pages/SpeakingStage.vue
    - src/pages/WritingStage.vue
    - src/pages/PlacementResultPage.vue
    - .planning/phases/15-speaking-writing-placement-results/15-01-PLAN.md
  modified:
    - functions/index.js (evaluateSpeakingTest + calculatePlacement appended)
    - src/pages/OnboardingPage.vue (stage 5 stub replaced; stage 6 writing added; handlers added)
    - src/router/routes.js (/placement-result route added)
decisions:
  - "[15-01] SpeakingStage uses hardcoded prompt pool + follow-up questions — avoids extra Cloud Function call for prompt generation; evaluateSpeakingTest scores the exchanges"
  - "[15-01] WritingStage uses client-side word-count heuristic for level estimation — calculatePlacement does final weighted aggregation server-side"
  - "[15-01] OnboardingPage navigates to /placement-result after writing complete — PlacementResultPage owns the calculatePlacement call to keep onboarding lightweight"
  - "[15-01] TOTAL_STAGES updated from 5 to 6 — speaking and writing are now separate named steps in QStepper"
  - "[15-01] calculatePlacement persists to both placementTests/{uid}.finalResult and users/{uid}.placement for quick read access"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-11"
  tasks_completed: 5
  files_created: 3
  files_modified: 3
---

# Phase 15 Plan 01: Speaking, Writing & Placement Results Summary

**One-liner:** SpeakingStage (Web Speech API + text fallback + exchange bubbles), WritingStage (textarea with 20-char gate), PlacementResultPage (CEFR badge + skill breakdown), evaluateSpeakingTest + calculatePlacement Cloud Functions, wired into OnboardingPage stage 5/6 and /placement-result route.

## What Was Built

All 5 tasks executed successfully, completing the final two placement test stages and the results display:

1. **evaluateSpeakingTest Cloud Function** — GPT-4o-mini scores speaking exchanges (score/level/fluency/vocabulary/grammar/feedback). Non-empty exchanges guard, instantiates OpenAI inside handler body (Phase 8 pattern).

2. **calculatePlacement Cloud Function** — Equal-weighted (20% each) CEFR numeric average across 5 skill stages; persists finalResult to `placementTests/{uid}` and `users/{uid}.placement`. Strengths/weaknesses derived by sorting skillBreakdown by numeric CEFR value. Don't-throw on persist failure — still returns result to client.

3. **SpeakingStage.vue** — 3-exchange mini-conversation. Web Speech API with interim transcript preview; text input fallback when `SpeechRecognition` unavailable (Phase 8 pattern [08-02]). Exchange bubbles: user (primary green, rounded-br-none) and AI (grey-2/grey-9, rounded-bl-none). Pulsing mic ring via CSS keyframe animation. Calls `evaluateSpeakingTest` on submit. Aborts recognition on unmount.

4. **WritingStage.vue** — Random writing prompt from pool. `q-input` with `autogrow`, `counter`, `outlined rounded`. Submit disabled until `responseLength >= 20`. Client-side word-count heuristic for level estimate (server-side calculatePlacement does final aggregation).

5. **PlacementResultPage.vue** — Fullscreen page (no bottom nav). `q-inner-loading` spinner while calculating. Overall CEFR badge (120×120px, 2px primary border, border-radius 16px, `role="img"`). Per-skill breakdown rows with `q-linear-progress` (cefrToValue map: A1→0.1 … C2→1.0) and `q-chip` CEFR labels. Strengths (fitness_center/positive) and focus areas (gps_fixed/accent-orange). CTA to dashboard. Skips calculation if `placementStore.finalResult` already set.

6. **OnboardingPage.vue updated** — Stage 5 stub replaced with `<SpeakingStage>` and new stage 6 `<WritingStage>`. `STAGE_INDEX` extended with writing:6. `TOTAL_STAGES` updated to 6. Handlers: `handleSpeakingComplete` → step='writing'; `handleWritingComplete` → `router.push({ name: 'placement-result' })`.

7. **routes.js updated** — `/placement-result` route added under FullscreenLayout (no bottom nav, matches onboarding context).

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all data flows are wired. SpeakingStage uses hardcoded follow-up responses (not GPT-generated) but this is intentional for the placement test context; the full session GPT conversation happens in SessionPage. WritingStage uses client-side level heuristic which is intentional as the server-side calculatePlacement does final aggregation.

## Self-Check: PASSED

Files exist:
- src/pages/SpeakingStage.vue — FOUND
- src/pages/WritingStage.vue — FOUND
- src/pages/PlacementResultPage.vue — FOUND

Commits exist:
- 22b8f4f — evaluateSpeakingTest and calculatePlacement Cloud Functions
- 0e5ef4d — SpeakingStage.vue
- fcd2318 — WritingStage.vue
- a6405d9 — PlacementResultPage.vue
- 45ac89b — OnboardingPage wiring + routes.js
