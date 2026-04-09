# Phase 14: Listening Test - Research

**Researched:** 2026-04-09
**Domain:** Browser Web Speech Synthesis API, Vue 3 component design, adaptive placement test integration
**Confidence:** HIGH

## Summary

Phase 14 adds the Listening test stage (Stage 3 of 5) to the placement test shell. The implementation is purely frontend — no new Cloud Function is needed for question generation because the `generateTestQuestions` function must be extended to support `type='listening'`, returning 3 structured task objects (sentence, dialogue, monologue) that include prompt text for TTS playback and multiple-choice answer options.

The browser `window.speechSynthesis` API is the designated TTS engine (Azure TTS deferred to v1.3 per project decision in REQUIREMENTS.md Out of Scope). The API is synchronous to initiate and event-driven for completion. Its key quirks — Android Chrome cutting off long utterances, iOS requiring user gesture, cross-browser voice availability variability — must be handled in the `ListeningPlayer.vue` component.

The ListeningPlayer component encapsulates TTS playback state and exposes a `play` / `replay` interface. The parent `ListeningStage.vue` orchestrates the 3-task flow, answer capture, and emits `complete` / `skip` to `OnboardingPage.vue` using the identical contract established by `VocabularyStage` and `GrammarStage`.

**Primary recommendation:** Build `ListeningStage.vue` + `ListeningPlayer.vue` following the VocabularyStage/GrammarStage pattern exactly; extend `generateTestQuestions` Cloud Function to support `type='listening'`; wire into OnboardingPage replacing the Phase 14 stub.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLACE-03 | User can take Listening test with browser TTS audio (3 tasks, adaptive difficulty) | window.speechSynthesis API confirmed available in all target browsers; 3-task structure defined in PRD §2.4.1; adaptive difficulty uses same CEFR_ORDER pattern from Phase 13 stages |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| window.speechSynthesis | Browser native | TTS playback of listening prompts | Mandated by project decision (REQUIREMENTS.md Out of Scope: Azure TTS deferred) |
| SpeechSynthesisUtterance | Browser native | Wraps text + voice config for speak() | Required companion to speechSynthesis |
| Vue 3 Composition API | Already in project | Component logic | All components in project use `<script setup>` |
| Quasar (QBtn, QCard, QLinearProgress, QSkeleton, QBanner) | Already in project | UI components | Design system token — no raw HTML equivalents |
| firebase/functions httpsCallable | Already in project | Call generateTestQuestions | Matches VocabularyStage / GrammarStage pattern exactly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| usePlacementStore | Local store | Read adaptiveLevel, call setStageResult | Same pattern as VocabularyStage |
| useAuthStore | Local store | Read profile for userProfile param | Same pattern as VocabularyStage |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| window.speechSynthesis | Azure TTS (cloud) | Azure requires API key + network; browser TTS is zero-cost, zero-latency, works offline — deferred explicitly to v1.3 |
| window.speechSynthesis | HTMLAudioElement + pre-generated audio | Requires Cloud Storage, audio files per question — impractical with dynamic AI-generated prompts |

**Installation:** No new packages required. Everything is already installed.

**Version verification:** No npm packages to verify — only browser-native APIs are used.

## Architecture Patterns

### Recommended Project Structure
```
src/pages/
├── ListeningStage.vue    # Stage orchestrator — 3-task flow, answer capture, emit complete/skip
├── ListeningPlayer.vue   # TTS player component — play/replay, playback state, error handling
```

These files follow the same directory convention as `VocabularyStage.vue` and `GrammarStage.vue`.

### Pattern 1: ListeningPlayer encapsulates all speechSynthesis state
**What:** `ListeningPlayer.vue` owns the `SpeechSynthesisUtterance` and all playback state (`isPlaying`, `hasPlayed`, `replayCount`). It exposes play/replay state to the parent via `defineEmits` / `defineProps` rather than exposing the utterance object directly.
**When to use:** Whenever TTS needs to be isolated from question logic to keep `ListeningStage.vue` readable.
**Example:**
```javascript
// ListeningPlayer.vue — script setup
const props = defineProps({
  text: { type: String, required: true },
  maxReplays: { type: Number, default: 1 }
})
const emit = defineEmits(['played', 'ended'])

const isPlaying = ref(false)
const playCount = ref(0)

function play() {
  if (isPlaying.value) return
  const utterance = new SpeechSynthesisUtterance(props.text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9    // slightly slower — helps comprehension
  utterance.onstart = () => { isPlaying.value = true }
  utterance.onend = () => {
    isPlaying.value = false
    playCount.value++
    emit('ended')
  }
  utterance.onerror = () => { isPlaying.value = false }
  window.speechSynthesis.cancel()  // cancel any in-progress utterance first
  window.speechSynthesis.speak(utterance)
  emit('played')
}

const canReplay = computed(() => !isPlaying.value && playCount.value > 0 && playCount.value <= props.maxReplays)
```

### Pattern 2: 3-task sequential flow in ListeningStage
**What:** `ListeningStage.vue` holds an array of 3 task objects from `generateTestQuestions`. It iterates through them sequentially: user plays audio, selects answer, taps "Next", then proceeds to next task. After task 3 completes, it emits `complete`.
**When to use:** This mirrors the `currentIndex` + `allQuestions` pattern from `VocabularyStage`.

```javascript
// ListeningStage.vue — script setup skeleton
const tasks = ref([])          // 3 task objects from generateTestQuestions
const currentTaskIndex = ref(0)
const currentTask = computed(() => tasks.value[currentTaskIndex.value] ?? null)
const answers = ref([])        // { id, correct } per task
const selectedOptionIndex = ref(null)
const showFeedback = ref(false)
const hasPlayedCurrent = ref(false)  // gate: can't answer until audio played

function handleAnswer(optionIdx) {
  if (showFeedback.value || !hasPlayedCurrent.value) return
  selectedOptionIndex.value = optionIdx
  showFeedback.value = true
  const isCorrect = optionIdx === currentTask.value.correctIndex
  answers.value.push({ id: currentTask.value.id, correct: isCorrect })
  // adaptive difficulty (same CEFR_ORDER pattern)
}

function handleNext() {
  showFeedback.value = false
  selectedOptionIndex.value = null
  hasPlayedCurrent.value = false

  if (currentTaskIndex.value < tasks.value.length - 1) {
    currentTaskIndex.value++
  } else {
    const total = answers.value.length
    const correct = answers.value.filter(a => a.correct).length
    const score = total > 0 ? Math.round((correct / total) * 100) : 0
    emit('complete', { score, level: adaptiveLevel.value, answers: answers.value })
  }
}
```

### Pattern 3: Extending generateTestQuestions for listening type
**What:** The Cloud Function currently validates `type` against `['vocabulary', 'grammar']` and throws on anything else. A new `else if (type === 'listening')` branch must be added returning 3 task objects.
**When to use:** Required — without this, the Cloud Function throws `invalid-argument` when the stage calls it.

```javascript
// functions/index.js — extend the type validation guard
if (!['vocabulary', 'grammar', 'listening'].includes(type)) {
  throw new HttpsError('invalid-argument', 'type must be vocabulary, grammar, or listening')
}

// New listening branch — gpt-4o-mini generates 3 tasks
// Return structure:
{
  "type": "listening",
  "level": "B1",
  "tasks": [
    {
      "id": "l1",
      "kind": "sentence",              // Task 1 — single sentence (A1-A2)
      "prompt": "She takes the bus to work every day.",
      "options": ["She takes the bus...", "She takes the train...", "She took the bus..."],
      "correctIndex": 0,
      "cefrLevel": "A2"
    },
    {
      "id": "l2",
      "kind": "dialogue",              // Task 2 — short dialogue (B1-B2)
      "prompt": "Sarah: Did you finish the report? Tom: Not yet, I need one more hour.",
      "questions": [
        {
          "id": "l2q1",
          "question": "What does Tom need to do?",
          "options": ["Finish the report", "Start the report", "Submit the report", "Review the report"],
          "correctIndex": 0
        }
      ]
    },
    {
      "id": "l3",
      "kind": "monologue",             // Task 3 — narrative (B2-C2)
      "prompt": "The industrial revolution transformed...",
      "questions": [
        {
          "id": "l3q1",
          "question": "...",
          "options": [...],
          "correctIndex": 0
        }
      ]
    }
  ]
}
```

### Pattern 4: OnboardingPage wiring (identical to Phases 13-02/13-03)
**What:** Replace the listening stub in OnboardingPage.vue with `<ListeningStage @complete="handleListeningComplete" @skip="handleListeningSkip" />`. The handlers call `placementStore.setStageResult('listening', result)` then `step.value = 'grammar'`.

**Emit contract (ListeningStage — must match VocabularyStage/GrammarStage):**
```javascript
emit('complete', { score: number, level: string, answers: [{ id, correct }] })
emit('skip')
```

### Anti-Patterns to Avoid
- **Calling `speak()` without `cancel()` first:** If a previous utterance is still running, the new one queues silently. Always call `window.speechSynthesis.cancel()` before `speak()`.
- **Creating the utterance before user gesture on iOS:** Safari requires `speak()` to be called inside a user event handler (`@click`). Do NOT auto-play on mount.
- **Using `onpause`/`onresume` for state tracking:** These events are unreliable across browsers. Use `onstart` and `onend` only.
- **Allowing answer selection before audio plays:** Users must hear the prompt first. Gate `handleAnswer` with `hasPlayedCurrent` guard — same principle as `showFeedback` double-tap guard in GrammarStage.
- **Long utterances on Android Chrome:** Chrome on Android cancels utterances longer than ~200 characters. For Task 2 (dialogue) and Task 3 (monologue), keep prompts under 150 characters OR use the `chunked speak` pattern (split on sentence boundaries, chain `onend`). Prompt in the generateTestQuestions system instruction: "Keep all prompts under 150 characters."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Voice selection | Custom voice picker | utterance.lang = 'en-US' (browser default) | Default English voice is always available; voice selection adds UI complexity with no test value |
| Utterance queue management | Custom queue | cancel() + speak() pattern | speechSynthesis queue is unreliable — always cancel then speak fresh |
| TTS availability check | Complex feature detection | `'speechSynthesis' in window` — show graceful fallback text if false | Simple guard; project already uses this pattern for SpeechRecognition |

**Key insight:** The browser speechSynthesis API is intentionally simple. The pitfalls are all around timing and mobile quirks — not around missing features.

## Common Pitfalls

### Pitfall 1: Android Chrome utterance truncation
**What goes wrong:** Chrome on Android silently cancels any utterance longer than ~200 characters mid-sentence, leaving isPlaying stuck at true.
**Why it happens:** Known Chromium bug — long utterances time out in the TTS service.
**How to avoid:** Constrain prompts in the Cloud Function prompt to under 150 characters. Add `utterance.onerror` handler that resets `isPlaying`.
**Warning signs:** TTS stops mid-sentence on mobile; `onend` never fires.

### Pitfall 2: iOS Safari requires user gesture
**What goes wrong:** Calling `window.speechSynthesis.speak()` on page mount (not in a click handler) silently fails on iOS Safari.
**Why it happens:** Mobile Safari blocks audio autoplay without user gesture.
**How to avoid:** Always call `speak()` inside a `@click` handler. The Play button click IS the user gesture. Never call `speak()` in `onMounted`.
**Warning signs:** No audio on iOS; no errors logged.

### Pitfall 3: `isPlaying` stuck on true after navigation
**What goes wrong:** User navigates away mid-utterance; next stage mounts with speechSynthesis still running, causing audio bleed into the next stage.
**Why it happens:** `SpeechSynthesisUtterance.onend` fires but the component is already unmounted.
**How to avoid:** Call `window.speechSynthesis.cancel()` in `onUnmounted()` in `ListeningPlayer.vue`.
**Warning signs:** Audio continues playing after stage advances.

### Pitfall 4: Task 2 dialogue prompt structure
**What goes wrong:** The dialogue prompt contains multiple speakers ("Sarah: ... Tom: ...") which TTS reads including the speaker names, sounding unnatural.
**Why it happens:** TTS has no concept of speaker turns.
**How to avoid:** In the Cloud Function prompt, instruct GPT to write dialogue as narrative ("A woman asks about the deadline. A man says he needs more time.") OR keep speaker names short and natural ("Alex: ... Sam: ..."). Document this constraint in the system prompt.
**Warning signs:** TTS reads "colon" or says "Sarah colon".

### Pitfall 5: generateTestQuestions type guard
**What goes wrong:** The current Cloud Function throws `invalid-argument` for any type not in `['vocabulary', 'grammar']`, including 'listening'. The ListeningStage fetch will fail immediately.
**Why it happens:** The type guard was scoped to only Phase 13 types.
**How to avoid:** Add 'listening' to the allowed types array AND add the listening branch before deploying the new stage. This is a blocking dependency — Plan 14-01 must update the function.
**Warning signs:** Stage shows `loadError` immediately after mount.

## Code Examples

Verified patterns from the project codebase:

### speechSynthesis basic usage (browser-native API)
```javascript
// Source: MDN Web Speech API — confirmed browser-native, no import needed
function speak(text) {
  if (!('speechSynthesis' in window)) return  // graceful fallback guard
  window.speechSynthesis.cancel()             // clear queue first (Pitfall 1)
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  utterance.onstart = () => { isPlaying.value = true }
  utterance.onend   = () => { isPlaying.value = false; playCount.value++ }
  utterance.onerror = () => { isPlaying.value = false }
  window.speechSynthesis.speak(utterance)
}
```

### onUnmounted cancel (Pitfall 3 prevention)
```javascript
// Source: Project pattern — mirrors SpeechRecognition cleanup in SessionPage.vue
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.speechSynthesis.cancel()
})
```

### Fetching listening questions (mirrors VocabularyStage pattern exactly)
```javascript
// Source: VocabularyStage.vue (project codebase)
async function fetchTasks() {
  isLoading.value = true
  loadError.value = null
  try {
    const fn = httpsCallable(functions, 'generateTestQuestions')
    const userProfile = authStore.profile ?? {}
    const result = await fn({ type: 'listening', level: adaptiveLevel.value, userProfile })
    tasks.value = result.data.tasks  // flat array of 3 task objects
  } catch (err) {
    console.error('ListeningStage fetchTasks failed:', err)
    loadError.value = err.message || 'Failed to load questions. Please retry.'
  } finally {
    isLoading.value = false
  }
}
```

### Adaptive difficulty (identical to VocabularyStage / GrammarStage)
```javascript
// Source: VocabularyStage.vue and GrammarStage.vue (project codebase)
const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
// 2 correct → level up; 2 wrong → level down; same logic, copy verbatim
```

### OnboardingPage handler (mirrors handleVocabComplete exactly)
```javascript
// Source: OnboardingPage.vue (project codebase — handleVocabComplete pattern)
async function handleListeningComplete(result) {
  isSaving.value = true
  saveError.value = null
  try {
    placementStore.setStageResult('listening', result)
    step.value = 'grammar'
  } catch (err) {
    saveError.value = err.message || 'Failed to save listening results. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function handleListeningSkip() {
  placementStore.setStageResult('listening', { score: 0, level: 'B1', skipped: true, answers: [] })
  step.value = 'grammar'
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Azure TTS (cloud API) | window.speechSynthesis (browser native) | v1.2 decision | Zero cost, zero latency, offline-capable; lower voice quality |
| Pre-recorded audio files | Dynamic TTS from AI-generated prompts | v1.2 design | No audio storage needed; prompts can vary per user profile |

**Deprecated/outdated:**
- None for this phase — this is the first TTS implementation in the project.

## Open Questions

1. **Task 2 dialogue: single or multiple utterances?**
   - What we know: Task 2 is a dialogue between two speakers. TTS cannot simulate two voices.
   - What's unclear: Should the prompt be read as one combined utterance, or split into two consecutive utterances with different voices?
   - Recommendation: Use single utterance with narrative framing ("A manager asks her team...") to avoid speaker-label artifacts. Document in Cloud Function system prompt. This is the simpler path — implement as single utterance in Plan 14-01.

2. **speechSynthesis availability fallback**
   - What we know: `'speechSynthesis' in window` is false only in very old browsers and Node. The app targets Chrome/mobile PWA.
   - What's unclear: PRD says "browser TTS for MVP" but does not specify a fallback if TTS is unavailable.
   - Recommendation: Show a graceful message ("Audio not available in this browser — skip this stage?") with a Skip button. Mirror the SpeechRecognition fallback pattern from Phase 8 (`showTextInput defaults to !speechAvailable`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| window.speechSynthesis | ListeningPlayer.vue | Browser-native (not testable in Node) | N/A | Show "Audio unavailable" + Skip button |
| generateTestQuestions (Cloud Function) | ListeningStage.vue | Already deployed (Phase 13) | Current | Retry + Skip buttons (same as VocabularyStage) |
| firebase/functions | ListeningStage.vue | Already installed | firebase@12.9.0 | — |
| Quasar components | ListeningStage/Player | Already installed | Quasar v2 | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** `window.speechSynthesis` — guarded by `'speechSynthesis' in window` check.

## Validation Architecture

workflow.nyquist_validation is not set to false — treating as enabled.

No automated test framework is configured in this project (no jest.config, no vitest.config, no pytest.ini detected). All verification is manual UI walkthrough.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — manual verification only |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLACE-03 | 3 listening tasks with play button triggering TTS | manual | N/A | N/A |
| PLACE-03 | Replay button works at least once | manual | N/A | N/A |
| PLACE-03 | Answer submission advances to next task | manual | N/A | N/A |
| PLACE-03 | ListeningPlayer.vue exposes play/replay interface | manual | N/A | N/A |

### Wave 0 Gaps
None — no test framework exists in this project; all verification is manual.

## Project Constraints (from CLAUDE.md)

CLAUDE.md does not exist in this project. No additional project-level directives apply.

However, the following constraints are extracted from the accumulated decisions in STATE.md and apply with the same authority:

- Static UI only approach is superseded by v1.2 — real Firestore and Cloud Functions are the standard.
- Quasar components (QBtn, QCard, QLinearProgress, QSkeleton, QBanner, QInnerLoading) must be used — no raw HTML equivalents.
- No Tailwind dependency — translate any Stitch classes to Quasar utilities + scoped CSS.
- All API keys via env vars / Firebase secrets — never hardcoded.
- Firebase singleton pattern — import `{ functions }` from `boot/firebase`, never call `getFunctions()` again.
- `httpsCallable` references created at module level (outside handlers) — consistent with [08-02] decision.
- `setStageResult` used for progressive Firestore save — no direct `setDoc` from stage components.
- `isSaving`/`saveError` pattern in OnboardingPage handlers — preserved from Phase 12/13.
- `STAGE_INDEX` map already maps `listening: 3` — progress bar works automatically without changes.

## Sources

### Primary (HIGH confidence)
- Project codebase (VocabularyStage.vue, GrammarStage.vue, OnboardingPage.vue) — established patterns verified by reading source
- Project codebase (functions/index.js lines 625-763) — generateTestQuestions structure verified
- Project codebase (src/stores/placement.js) — setStageResult interface verified
- SpeakAI-Onboarding-Immersion-PRD.md §2.4 — listening stage structure (3 tasks, task types, scoring)
- STATE.md decisions log — project conventions and constraints

### Secondary (MEDIUM confidence)
- MDN Web Speech API documentation (speechSynthesis, SpeechSynthesisUtterance) — well-established API, browser-native, no version concerns
- Phase 8 [08-02] decision (SpeechRecognition in onMounted / showTextInput fallback) — analogous TTS availability pattern

### Tertiary (LOW confidence)
- Android Chrome long utterance truncation (~200 char limit) — widely reported community pattern, not officially documented with specific character count; treat as heuristic, not guarantee

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new installs
- Architecture: HIGH — directly mirrors Phase 13 patterns verified in source code
- Pitfalls: MEDIUM — speechSynthesis quirks are community-verified; the Android truncation limit is LOW confidence on exact character count
- Cloud Function extension: HIGH — type guard location verified in source, pattern is clear

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable APIs — no breaking changes expected)
