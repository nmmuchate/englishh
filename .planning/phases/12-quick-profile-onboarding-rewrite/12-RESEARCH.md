# Phase 12: Quick Profile & Onboarding Rewrite — Research

**Researched:** 2026-04-07
**Domain:** Vue 3 / Quasar / Firestore — UI rewrite + Firestore writes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — No Welcome Screen:** OnboardingPage opens directly on the Quick Profile form. No "Master English by Speaking" hero, no feature cards. First screen is the placement test shell with the Quick Profile sub-step active.

**D-02 — 4 separate sub-screens, one question per screen:**
- Sub-step 1: "What do you do?" — quick-pick chips (Student / Professional / Entrepreneur / Other). If Professional, secondary picker appears same screen (Engineering, Health, Business, Education, Tech, Other).
- Sub-step 2: "What are your interests?" — multi-select chips, max 3, from: Travel, Music, Sports, Cooking, Technology, Movies/TV, Reading, Gaming, Business, Health/Fitness, Art, Nature. Plus "Other" free text.
- Sub-step 3: "Why are you learning English?" — single-select radio cards: Work / Travel / Education / Personal Growth / Immigration / Fun.
- Sub-step 4: "Have you studied English before?" — single-select radio cards: Never / A little in school / Several years / I use it daily but want to improve.
- Each sub-screen has its own Continue button. Back arrow goes to previous sub-step or exits onboarding at sub-step 1.
- Stage progress dots stay at Stage 1 of 5 (●○○○○) throughout all 4 sub-steps.

**D-03 — Keep QStepper as outer shell** with `:header-nav="false"` and existing hidden-header CSS. Replace 3 old steps (welcome/assessment/result) with 5 stage steps: profile, vocabulary, listening, grammar, speaking.

**D-04 — Progress indicator:** custom `q-linear-progress` above each step, showing stage progress ("Stage 1 of 5  20%"). Value computed as `stageIndex / 5`. Replaces old "Step X of 3" pattern.

**D-05 — QuickProfileStage.vue:** Quick Profile sub-steps extracted into a separate component at `src/pages/QuickProfileStage.vue`. OnboardingPage's `profile` QStepper step renders `<QuickProfileStage />`. Component owns `profileSubStep` ref (1–4), all form state, and emits `@complete` with collected data when sub-step 4 is confirmed. Stages 2–5 are stubbed.

**D-06 — Dual Firestore write on completion:**
1. `updateDoc(doc(db,'users',uid), { 'profile.occupation':…, 'profile.field':…, 'profile.interests':[…], 'profile.goal':…, 'profile.priorExperience':… })` — dot-notation to avoid wiping other fields.
2. `setDoc(doc(db,'placementTests',uid), { userId, startedAt: serverTimestamp(), stages: { profile: { completed: true, data: {…} } } }, { merge: true })` — initializes progressive save doc.

**D-07 — onboardingCompleted remains false.** This phase does NOT set `onboardingCompleted = true`. Auth boot redirect guard already handles mid-test users correctly (returns them to `/onboarding`).

### Claude's Discretion

- Exact copy/labels for occupation quick-picks and interest chips — follow PRD §2.2 wording exactly.
- Whether `QuickProfileStage.vue` uses a local `step` ref or receives `profileSubStep` as a prop — pick the cleanest approach (recommendation: local ref is cleaner, no prop drilling needed since the component owns all sub-step state).
- Stub content for Stages 2–5 (a simple "Coming in test stages…" message is fine).
- Linear progress bar percentage formula: `stageIndex / totalStages` where stageIndex is 1-based (Stage 1 = 20%, Stage 2 = 40%, …).

### Deferred Ideas (OUT OF SCOPE)

None captured during this discussion.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLACE-01 | User can complete Quick Profile (occupation, interests, goal, prior experience) | QuickProfileStage.vue implements all 4 sub-screens; Quasar QBtn chip + QItem/QRadio patterns directly support all question formats |
| PLACE-11 | Placement data stored in Firestore (`placementTests` collection + extended `users` doc) | Dual Firestore write (updateDoc on users + setDoc merge on placementTests) implements both schema requirements from PRD §5.2 |
</phase_requirements>

---

## Summary

Phase 12 is a pure UI rewrite plus two Firestore writes — no Cloud Functions, no routing changes, no scoring logic. The current `OnboardingPage.vue` (444 lines, 3 QStepper steps: welcome/assessment/result) is replaced with a 5-stage QStepper shell, and a new `QuickProfileStage.vue` component implements the 4-screen Quick Profile flow.

All the Quasar patterns needed already exist in the codebase: `QItem tag="label" + QRadio` for radio cards (Phase 2 pattern), `q-linear-progress` for the stage bar (existing in OnboardingPage), and `updateDoc` + `serverTimestamp()` imports already in OnboardingPage. The key new pattern is chip-based multi/single selection for sub-steps 1 and 2, using `QBtn` with flat/outline toggle to represent selection state.

The Firestore data model is fully defined in PRD §5.2: `users/{uid}.profile` (5 fields via dot-notation updateDoc) and `placementTests/{uid}` (initialized with setDoc+merge). The placement store's `saveStageResult` already implements progressive merge writes — on Quick Profile completion, the component calls `placementStore.setStageResult('profile', data)` which handles the `placementTests` write, while the `users/{uid}.profile` update is done with a direct `updateDoc` call in the completion handler.

**Primary recommendation:** Create `QuickProfileStage.vue` with a local `profileSubStep` ref (1–4), emit `@complete` with form data to `OnboardingPage.vue`, which then executes both Firestore writes and advances the QStepper to `vocabulary`.

---

## Standard Stack

### Core (already in project — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Quasar Framework | 2.x | QStepper, QBtn, QItem, QRadio, q-linear-progress | Established design system throughout app |
| Vue 3 Composition API | 3.x | ref, computed, defineEmits, defineProps | All components use Composition API |
| Pinia | 2.x | usePlacementStore, useProfileStore, useAuthStore | All stores Pinia-based from Phase 11 |
| Firebase Firestore | 12.9.0 | updateDoc, setDoc, doc, serverTimestamp | Already in project, imports confirmed in OnboardingPage |

### No New Installs Required

This phase adds zero new dependencies. All stack is established in Phases 2, 7, 11.

---

## Architecture Patterns

### Recommended Project Structure (changes only)

```
src/pages/
├── OnboardingPage.vue       # REWRITE — 5-stage QStepper shell
└── QuickProfileStage.vue    # NEW — Quick Profile sub-steps 1–4
```

### Pattern 1: QStepper Hidden-Header Shell (existing pattern, adapted)

**What:** QStepper with `:header-nav="false"` + `:deep(.q-stepper__header) { display:none }` hides the built-in tab row. Direct ref assignment drives navigation (`step.value = 'vocabulary'`).

**When to use:** All 5 placement stages.

**Existing code (OnboardingPage.vue lines 3-9):**
```html
<q-stepper
  v-model="step"
  flat
  :header-nav="false"
  animated
  class="onboarding-stepper"
>
```

```css
:deep(.q-stepper__header) { display: none; }
:deep(.q-stepper__step-inner) { padding: 0; }
```

**Stage name values:** `'profile'`, `'vocabulary'`, `'listening'`, `'grammar'`, `'speaking'`

### Pattern 2: Stage Progress Bar (adapted from existing)

**What:** `q-linear-progress` showing which of 5 stages is active. Value = `stageIndex / 5`.

**Existing pattern (OnboardingPage.vue line 91):**
```html
<q-linear-progress :value="0.66" color="primary" rounded style="height: 8px; border-radius: var(--radius-full);" />
```

**New pattern for 5-stage bar:**
```html
<!-- In OnboardingPage.vue, above each q-step -->
<div class="q-px-lg q-pb-md">
  <div class="row justify-between items-center q-mb-sm">
    <span class="text-overline text-weight-bold" style="letter-spacing: 0.08em;">Placement Test</span>
    <span class="text-caption text-primary text-weight-bold">Stage {{ stageIndex }} of 5</span>
  </div>
  <q-linear-progress :value="stageIndex / 5" color="primary" rounded style="height: 8px; border-radius: var(--radius-full);" />
</div>
```

Where `stageIndex` is a computed: `profile=1, vocabulary=2, listening=3, grammar=4, speaking=5`.

### Pattern 3: Radio Cards (existing pattern, reuse in QuickProfileStage sub-steps 3 & 4)

**What:** `QItem tag="label"` + `QRadio` creates full-card clickable radio buttons with custom styling.

**Existing code (OnboardingPage.vue lines 106-127):**
```html
<q-item
  v-for="option in options"
  :key="option.value"
  tag="label"
  clickable
  class="option-card q-mb-md"
  :class="{ 'option-card--selected': selectedValue === option.value }"
>
  <q-item-section>
    <q-item-label class="text-weight-semibold">{{ option.label }}</q-item-label>
  </q-item-section>
  <q-item-section side>
    <q-radio v-model="selectedValue" :val="option.value" color="primary" />
  </q-item-section>
</q-item>
```

**Use for:** Sub-step 3 (goal/why) and sub-step 4 (prior experience).

### Pattern 4: QBtn Chip Toggle (for sub-steps 1 and 2)

**What:** `QBtn` with flat/outline toggling via `:outline="selected"` or `:color` binding represents chip selection state.

**New pattern (no existing precedent, but consistent with design tokens):**
```html
<!-- Single-select chips (sub-step 1) -->
<div class="row q-gutter-sm q-mb-md">
  <q-btn
    v-for="opt in occupationOptions"
    :key="opt.value"
    :label="opt.label"
    :color="occupation === opt.value ? 'primary' : 'grey-3'"
    :text-color="occupation === opt.value ? 'white' : 'grey-8'"
    unelevated
    no-caps
    rounded
    @click="occupation = opt.value"
  />
</div>

<!-- Multi-select chips (sub-step 2, max 3) -->
<q-btn
  v-for="interest in interestOptions"
  :key="interest"
  :label="interest"
  :color="interests.includes(interest) ? 'primary' : 'grey-3'"
  :text-color="interests.includes(interest) ? 'white' : 'grey-8'"
  unelevated
  no-caps
  rounded
  @click="toggleInterest(interest)"
  :disable="!interests.includes(interest) && interests.length >= 3"
/>
```

### Pattern 5: QuickProfileStage Component Interface

**What:** Self-contained component owns all Quick Profile state; emits `complete` event with data payload.

**Component interface:**
```javascript
// QuickProfileStage.vue
const emit = defineEmits(['complete'])

// Internal state (not props — cleaner, no prop drilling)
const profileSubStep = ref(1)  // 1-4
const occupation = ref(null)
const occupationField = ref(null)  // only if occupation === 'professional'
const interests = ref([])          // max 3
const otherInterest = ref('')
const goal = ref(null)
const priorExperience = ref(null)

function handleContinue() {
  if (profileSubStep.value < 4) {
    profileSubStep.value++
  } else {
    emit('complete', {
      occupation: occupation.value,
      field: occupationField.value,
      interests: interests.value,
      goal: goal.value,
      priorExperience: priorExperience.value
    })
  }
}

function handleBack() {
  if (profileSubStep.value > 1) {
    profileSubStep.value--
  }
  // If sub-step 1, parent handles back (router.back() or no-op)
}
```

**OnboardingPage usage:**
```html
<q-step name="profile" title="Quick Profile">
  <!-- stage progress bar here (stageIndex=1) -->
  <QuickProfileStage @complete="handleProfileComplete" @back="handleProfileBack" />
</q-step>
```

### Pattern 6: Dual Firestore Write on Profile Completion

**What:** On `@complete` from QuickProfileStage, OnboardingPage runs two Firestore writes then advances stepper.

```javascript
// OnboardingPage.vue
import { usePlacementStore } from 'stores/placement'
import { useAuthStore } from 'stores/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

const placementStore = usePlacementStore()
const authStore = useAuthStore()

async function handleProfileComplete(profileData) {
  const uid = authStore.uid

  // Write 1: extend users/{uid}.profile using dot-notation (Phase 7 pattern — avoids wiping sibling fields)
  await updateDoc(doc(db, 'users', uid), {
    'profile.occupation':      profileData.occupation,
    'profile.field':           profileData.field ?? null,
    'profile.interests':       profileData.interests,
    'profile.goal':            profileData.goal,
    'profile.priorExperience': profileData.priorExperience,
  })

  // Write 2: initialize placementTests/{uid} via placement store (D-05 progressive save)
  // placementStore.setStageResult handles setDoc(..., { merge: true }) to placementTests collection
  // but we also need startedAt on first write — call saveStageResult directly with extra fields:
  await placementStore.saveStageResult('profile', {
    completed: true,
    data: profileData,
  })
  // Also write userId + startedAt (one-time initialization)
  // Option A: do it in a separate setDoc call here
  // Option B: extend saveStageResult in placement store to accept top-level fields
  // Recommendation: separate setDoc call with merge:true in handleProfileComplete

  // Advance to next stage
  step.value = 'vocabulary'
}
```

**Critical detail on `placementTests/{uid}` initialization:** The placement store's `saveStageResult` only writes `{ stages: { [stageKey]: {...} } }`. The `userId` and `startedAt` fields from D-06 are NOT written by `saveStageResult`. The planner must add a separate `setDoc` call with `{ userId, startedAt: serverTimestamp() }` + `{ merge: true }` before or combined with the profile stage write. One approach: combine into a single `setDoc` call:

```javascript
await setDoc(doc(db, 'placementTests', uid), {
  userId,
  startedAt: serverTimestamp(),
  stages: { profile: { completed: true, data: profileData } }
}, { merge: true })
```

This satisfies D-06 exactly and is idempotent on refresh.

### Anti-Patterns to Avoid

- **setDoc without merge on users/{uid}:** Would wipe existing fields (dailyStreak, subscriptionStatus, etc.). Always use `updateDoc` or `setDoc(..., { merge: true })` on user doc. This is the Phase 7 established pattern.
- **Setting onboardingCompleted: true in this phase:** D-07 explicitly prohibits this. The auth guard already redirects mid-test users to `/onboarding`.
- **Inline Quick Profile JSX in OnboardingPage:** D-05 mandates extraction to `QuickProfileStage.vue`. Inline `v-if` chains would make OnboardingPage unmaintainable.
- **Passing profileSubStep as prop from OnboardingPage:** Unnecessary coupling. Let QuickProfileStage own its own sub-step state internally.
- **Chip disable logic error:** When max 3 interests are selected, `:disable` must NOT disable already-selected chips (user must be able to deselect). Guard: `:disable="!interests.includes(interest) && interests.length >= 3"`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Radio card selection | Custom div + click handlers | `QItem tag="label" + QRadio` | Already in OnboardingPage; handles keyboard, a11y, click-anywhere activation |
| Progress bar | Custom CSS div | `q-linear-progress` | Already used; `rounded` + `color="primary"` matches design |
| Chip toggle buttons | Custom CSS toggle | `QBtn` with conditional `color` prop | Consistent with design tokens; Quasar handles active/disabled state |
| Stepper navigation | Custom step stack | QStepper with ref assignment | Already established pattern (Phase 2 decision) |
| Firestore merge writes | Manual field merging | `updateDoc` (dot-notation) + `setDoc(..., {merge:true})` | Prevents field clobbering; both patterns already imported |

---

## Common Pitfalls

### Pitfall 1: The Professional Field Sub-Picker Visibility

**What goes wrong:** The secondary "What field?" picker on sub-step 1 is conditionally shown. Forgetting to clear `occupationField` when user switches back from Professional to another occupation leaves stale data in the emitted payload.

**How to avoid:** Watch `occupation` and reset `occupationField` when occupation changes away from Professional:
```javascript
watch(occupation, (newVal) => {
  if (newVal !== 'professional') occupationField.value = null
})
```

**Warning signs:** `profile.field` written to Firestore when occupation is 'Student'.

### Pitfall 2: Continue Button Enabled Before Required Fields Are Set

**What goes wrong:** Continue is enabled before the user selects a value (especially sub-step 1 where no default is set). User taps Continue, null is emitted.

**How to avoid:** Disable Continue button with computed canContinue:
```javascript
const canContinue = computed(() => {
  if (profileSubStep.value === 1) return !!occupation.value && (occupation.value !== 'professional' || !!occupationField.value)
  if (profileSubStep.value === 2) return interests.value.length >= 1
  if (profileSubStep.value === 3) return !!goal.value
  if (profileSubStep.value === 4) return !!priorExperience.value
  return false
})
```

**Warning signs:** Firestore writes with null fields.

### Pitfall 3: Interests Max-3 Deselect Race

**What goes wrong:** When exactly 3 interests are selected, all un-selected chips are disabled. If the user tries to swap one, they must first deselect then select — but if toggle logic uses `includes()` check incorrectly, it may prevent deselection.

**How to avoid:** `toggleInterest` must always allow deselection regardless of count:
```javascript
function toggleInterest(interest) {
  const idx = interests.value.indexOf(interest)
  if (idx !== -1) {
    interests.value.splice(idx, 1)  // always allow deselect
  } else if (interests.value.length < 3) {
    interests.value.push(interest)
  }
}
```

### Pitfall 4: Stage Progress Bar Shows Wrong Index

**What goes wrong:** If the stage progress bar value is computed from `step.value` string rather than a numeric map, the computation may break or return incorrect percentages.

**How to avoid:** Use a computed map:
```javascript
const STAGE_INDEX = { profile: 1, vocabulary: 2, listening: 3, grammar: 4, speaking: 5 }
const stageProgressValue = computed(() => STAGE_INDEX[step.value] / 5)
```

### Pitfall 5: handleComplete from Old OnboardingPage Must Be Removed

**What goes wrong:** The existing `handleComplete` function sets `onboardingCompleted: true` and calls `authStore.completeOnboarding()`. If this function survives the rewrite, a test user could accidentally complete onboarding prematurely.

**How to avoid:** The `handleComplete` function is removed entirely during the rewrite. Only the new `handleProfileComplete` (which does NOT set onboardingCompleted) is added.

---

## Code Examples

### Existing Imports to Reuse (OnboardingPage.vue lines 207-209)
```javascript
// Already in OnboardingPage — keep these
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'
```

**Add these new imports:**
```javascript
import { setDoc } from 'firebase/firestore'
import { usePlacementStore } from 'stores/placement'
import QuickProfileStage from './QuickProfileStage.vue'
```

### Stub Template for Stages 2–5
```html
<q-step name="vocabulary" title="Vocabulary & Reading">
  <!-- Stage progress bar: stageIndex=2 -->
  <div class="column items-center justify-center q-pa-xl text-center" style="min-height: 60vh;">
    <q-icon name="sym_o_menu_book" size="64px" color="grey-4" class="q-mb-md" />
    <p class="text-h6 text-grey-6">Vocabulary & Reading</p>
    <p class="text-body2 text-grey-5">Coming in Phase 13</p>
  </div>
</q-step>
```

### setDoc Call for placementTests Initialization
```javascript
// In OnboardingPage.vue handleProfileComplete
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'

await setDoc(doc(db, 'placementTests', uid), {
  userId: uid,
  startedAt: serverTimestamp(),
  stages: {
    profile: { completed: true, data: profileData }
  }
}, { merge: true })
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3-step wizard (welcome/assessment/result) | 5-stage placement test shell | Phase 12 | OnboardingPage rewrites; old 3 steps fully replaced |
| Mock B1 assignment | Real Quick Profile data → Firestore | Phase 12 | `users/{uid}.profile` and `placementTests/{uid}` now have real data |
| handleComplete sets onboardingCompleted:true | onboardingCompleted stays false until Phase 15 | Phase 12 | Auth guard works correctly across all mid-test refreshes |

**Removed in this phase:**
- `welcome` QStepper step (D-01)
- `assessment` QStepper step
- `result` QStepper step
- `handleComplete` function (sets onboardingCompleted — replaced by D-07 approach)
- `features` array, `goalOptions` array, `selectedGoal` ref — all stale data

---

## Open Questions

1. **Where does `@back` from QuickProfileStage sub-step 1 route?**
   - What we know: Back on sub-step 1 should exit onboarding. Context says "exits onboarding if on sub-step 1".
   - What's unclear: Should it call `router.back()` (goes to landing) or sign the user out? For a user who just signed in via Google, router.back() lands on the landing page but auth state is still active — auth guard immediately redirects them back to /onboarding.
   - Recommendation: Planner should treat sub-step 1 back as a no-op (no back arrow shown on sub-step 1), or emit a `@back` event that OnboardingPage handles by calling `router.push({ name: 'landing' })`. The cleanest UX is to hide the back button on sub-step 1 entirely — the user just signed in and has no meaningful "back" destination.

2. **Does `placementStore.setStageResult` need to be called in addition to the direct setDoc?**
   - What we know: `setStageResult` in placement.js calls `saveStageResult` which writes `{ stages: { profile: {...} } }` with merge. It also updates `currentStage` to `'vocabulary'` and `stageResults` in memory.
   - What's unclear: Whether OnboardingPage should call `placementStore.setStageResult('profile', data)` (to keep the Pinia store in sync) OR do the Firestore write manually and skip the store.
   - Recommendation: Call `placementStore.setStageResult('profile', data)` to keep Pinia store current (so `currentStage` advances to `'vocabulary'`), AND also do the `userId + startedAt` setDoc for the initialization fields that saveStageResult doesn't write. This means two writes but both use `merge:true` — idempotent.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is a pure UI rewrite with Firestore writes. All external dependencies (Firebase SDK, Quasar) are already installed and confirmed working in Phases 7–11.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — project has no test runner configured (out of scope per REQUIREMENTS.md) |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

Per REQUIREMENTS.md: "E2E / unit tests — Deferred until backend is stable". No test infrastructure exists in this project.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLACE-01 | Quick Profile form collects 4 fields; all required before Continue | manual-only | N/A — no test framework | N/A |
| PLACE-11 | Completion writes to users/{uid}.profile and placementTests/{uid} | manual-only | N/A — no test framework | N/A |

**Manual verification steps (used in plan's verification tasks):**
1. Sign in as a new user → OnboardingPage opens directly on Quick Profile (no welcome screen).
2. Sub-step 1: Continue disabled until occupation selected. Selecting Professional shows field picker on same screen.
3. Sub-step 2: Interest chips toggle; 4th chip is disabled when 3 selected; deselection re-enables others.
4. Sub-step 3: Radio cards for goal; Continue enabled after any selection.
5. Sub-step 4: Radio cards for prior experience; tapping Continue triggers dual Firestore write and advances to Stage 2 (stub).
6. Firestore console: `users/{uid}.profile` has all 5 fields; `placementTests/{uid}` has `userId`, `startedAt`, `stages.profile.completed: true`.
7. Refresh mid-test: auth guard returns user to `/onboarding`; stage indicator shows Stage 2 (vocabulary stub).
8. `onboardingCompleted` field in Firestore remains `false` throughout.

### Wave 0 Gaps

None — no test framework to configure. All verification is manual (consistent with project's testing strategy).

---

## Sources

### Primary (HIGH confidence)

- `src/pages/OnboardingPage.vue` — Full 444-line current implementation read directly; all existing patterns confirmed
- `src/stores/placement.js` — Full placement store read; `saveStageResult`, `setStageResult`, `STAGE_ORDER` confirmed
- `src/stores/profile.js` — Profile store read; `profile` ref and `setProfile` pattern confirmed
- `src/boot/auth.js` — Auth boot read; route guard logic, `onboardingCompleted` flag usage confirmed
- `SpeakAI-Onboarding-Immersion-PRD.md §2.2` — Quick Profile screen flow, exact field names and options confirmed
- `SpeakAI-Onboarding-Immersion-PRD.md §5.2` — Firestore schemas for `users/{uid}.profile` and `placementTests/{uid}` confirmed
- `.planning/phases/12-quick-profile-onboarding-rewrite/12-CONTEXT.md` — All locked decisions D-01 through D-07 confirmed

### Secondary (MEDIUM confidence)

- Quasar QStepper `:header-nav="false"` pattern — verified in current OnboardingPage.vue (lines 6, 267)
- Phase 7 `updateDoc` dot-notation pattern — confirmed in STATE.md decision log `[07-02]`
- Phase 11 D-05 `setDoc merge:true` progressive save — confirmed in placement.js `saveStageResult`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, versions confirmed
- Architecture patterns: HIGH — all patterns sourced from existing codebase files read directly
- Firestore writes: HIGH — schema confirmed from PRD §5.2 + existing store code
- Pitfalls: HIGH — sourced from reading actual implementation code and spotting concrete risk areas

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable domain — Quasar/Vue/Firestore APIs stable)
