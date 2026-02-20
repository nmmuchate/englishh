# Phase 2: Entry Flow - Research

**Researched:** 2026-02-20
**Domain:** Quasar Framework v2 (Vue 3) — QStepper, QRadio, QBtn, layout composition, mock auth flow
**Confidence:** HIGH (verified against official Quasar docs and project source)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAND-01 | User can view landing/sign-in page matching Stitch `sign_in_to_speakai` design (logo, headline, tagline) | QPage + FullscreenLayout + scoped CSS flex column layout; CSS design tokens already in app.css |
| LAND-02 | User can tap Google Sign-In button which navigates to onboarding (mocked — no real OAuth) | useAuthStore.mockSignIn() + router.push({ name: 'onboarding' }) called from button @click; no real OAuth wiring |
| ONBD-01 | User can view 3-step onboarding wizard implemented with QStepper matching Stitch welcome/assessment designs | QStepper with v-model + flat + header-nav=false; custom progress bar inside each QStep replaces clickable header tabs |
| ONBD-02 | User can complete Assessment step (language level quiz with selectable options) | Custom radio cards: QItem tag="label" + QRadio v-model + :active binding + :deep(.q-stepper__header) display:none |
| ONBD-03 | User can complete First Session intro step (explains the app flow) | QStep with feature card layout matching welcome_to_speakai Stitch; QStepperNavigation with QBtn to advance |
| ONBD-04 | User can view Level Result step showing assessed level and proceeds to Dashboard | Final QStep shows hardcoded level badge; QBtn @click calls completeOnboarding() then router.push({ name: 'dashboard' }) |
</phase_requirements>

---

## Summary

Phase 2 builds two pages inside the existing `FullscreenLayout` (no bottom nav, no Quasar header): `LandingPage.vue` and `OnboardingPage.vue`. Both files are already scaffolded as empty stubs. The router already has named routes `landing` and `onboarding` pointing to these files under `FullscreenLayout`. No new routes or stores need to be created — `useAuthStore` already exposes `mockSignIn()` and the `isAuthenticated` ref needed to trigger navigation.

The biggest architectural decision is **how to implement the 3-step wizard**. QStepper is the correct Quasar component, but its default header (clickable step tabs at the top) must be suppressed because the Stitch design uses a custom linear progress bar instead. The solution is a two-part approach: set `header-nav="false"` on `<q-stepper>` to disable click navigation, and add `:deep(.q-stepper__header) { display: none }` in a scoped `<style>` block to visually remove the tab row. Each step then renders its own custom progress indicator (matching the "Step X of 3" bar in the quick_assessment Stitch) plus a `<q-stepper-navigation>` block for the Continue button.

The radio option cards in the Assessment step cannot be built with `QOptionGroup` because that component doesn't support the icon-in-a-colored-box + title + description layout. Instead, use `<q-item tag="label">` wrapping a `<q-radio>` — clicking anywhere on the card changes the radio value. Visual selection state (green border, light-green bg) must be applied via scoped CSS using `:class` binding on the `<q-item>` based on whether `selectedGoal === option.value`.

**Primary recommendation:** Build OnboardingPage.vue as a single-file component with `<q-stepper v-model="step" flat header-nav="false">` containing 3 `<q-step>` components. Suppress the built-in header with `:deep(.q-stepper__header) { display: none }`. Drive all navigation from QStepperNavigation buttons inside each step. Use `useRouter()` (composition API) directly in LandingPage and OnboardingPage components.

---

## Standard Stack

### Core (already in project — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| quasar | ^2.16.0 | QStepper, QBtn, QRadio, QItem, QPage | Project already uses Quasar v2 exclusively |
| vue | ^3.5.22 | Composition API (ref, computed) for step state | Already bootstrapped |
| vue-router | ^5.0.0 | `useRouter()` for post-sign-in and post-onboarding navigation | Already configured with named routes |
| pinia | ^3.0.1 | `useAuthStore` — mockSignIn(), completeOnboarding() | Auth store already scaffolded |
| @quasar/extras | ^1.16.4 | material-symbols-outlined icon set | Already configured in quasar.config.js extras |

### Quasar Components Required for This Phase

| Component | Registration | Purpose |
|-----------|-------------|---------|
| QStepper | Auto (Quasar tree-shakes) | 3-step wizard container |
| QStep | Auto | Individual wizard step |
| QStepperNavigation | Auto | Next/Continue button container within each step |
| QBtn | Auto | All CTAs: Sign in with Google, Continue, Get Started, Start Learning |
| QItem | Auto | Wrapper for radio option cards (tag="label") |
| QItemSection | Auto | Icon column, text column, radio column inside radio card |
| QItemLabel | Auto | Title and subtitle text inside radio card |
| QRadio | Auto | Radio input inside each option card |
| QPage | Auto | Root component for both pages |
| QLinearProgress | Auto | "Step X of 3" progress bar in Assessment and Level Result steps |

**Installation:** No new packages needed. All components are auto-imported from Quasar v2.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| QStepper | Hand-rolled div tabs + v-show | QStepper handles animated transitions, keep-alive, accessible tab indexing — custom would need re-implementing all of this |
| Custom radio cards (QItem + QRadio) | QOptionGroup | QOptionGroup supports only label text, no icon+description layout |
| QLinearProgress | Custom div progress bar | QLinearProgress is a single line, already styled to primary color |
| useRouter() in component | Store-level router.push | Simpler — no IoC pattern needed since navigation happens in component @click handlers, not store actions |

---

## Architecture Patterns

### Recommended Project Structure

The phase touches only these files (all already exist):

```
src/
├── pages/
│   ├── LandingPage.vue      # REPLACE stub — full sign_in_to_speakai layout
│   └── OnboardingPage.vue   # REPLACE stub — 3-step QStepper wizard
├── stores/
│   └── auth.js              # ADD completeOnboarding() action only
└── css/
    └── app.css              # No changes needed — tokens already defined
```

No new files. No new routes. No new stores. Phase 1 already established the scaffold.

### Pattern 1: LandingPage Layout (Flex Column, Centered, Fullscreen)

**What:** Full-height flex column centered vertically; no Quasar header/footer — uses FullscreenLayout.
**When to use:** Sign-in screen, splash screens — any screen without bottom nav.

```vue
<!-- Source: Stitch sign_in_to_speakai + Quasar QPage/QBtn docs -->
<template>
  <q-page class="column items-center justify-between" style="min-height: 100vh; padding: 0;">
    <!-- Top bar -->
    <div class="row full-width items-center justify-center q-pa-md">
      <span class="text-h6 text-weight-bold">SpeakAI</span>
    </div>

    <!-- Hero section — grows to fill space -->
    <div class="col column items-center justify-center q-px-lg q-pb-lg">
      <!-- Logo circle -->
      <div class="logo-circle q-mb-xl">
        <q-icon name="sym_o_graphic_eq" size="64px" color="white" />
      </div>

      <h1 class="text-h4 text-weight-bold text-center q-mb-sm">Welcome to SpeakAI</h1>
      <p class="text-body1 text-grey-7 text-center" style="max-width: 280px;">
        Master English with real-time AI feedback and personalized practice.
      </p>

      <!-- Google Sign-In button — pill shape, full width -->
      <q-btn
        class="full-width q-mt-xl sign-in-btn"
        rounded
        unelevated
        no-caps
        color="primary"
        @click="handleSignIn"
      >
        <!-- Google SVG icon in white circle -->
        <div class="google-icon-wrapper">...</div>
        <span>Sign in with Google</span>
      </q-btn>

      <!-- Decorative soundwave placeholder -->
      <div class="soundwave-placeholder q-mt-lg full-width" />
    </div>

    <!-- Footer TOS links -->
    <div class="q-pa-lg q-pt-none text-center">
      <p class="text-caption text-grey-5">
        By continuing, you agree to SpeakAI's
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
      </p>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleSignIn() {
  authStore.mockSignIn()
  router.push({ name: 'onboarding' })
}
</script>

<style scoped>
.logo-circle {
  width: 128px;
  height: 128px;
  background-color: var(--primary);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(76, 174, 79, 0.25);
}

.sign-in-btn {
  height: 56px; /* Tailwind h-14 equivalent */
}

.soundwave-placeholder {
  height: 120px;
  background: linear-gradient(180deg, rgba(76,174,79,0.08) 0%, transparent 100%);
  border-radius: var(--radius-md);
  border: 1px solid rgba(76,174,79,0.1);
}
</style>
```

### Pattern 2: QStepper Without Visible Header (Custom Progress Bar)

**What:** QStepper with `flat` and `header-nav="false"` props; header tab row hidden via `:deep()` CSS; each QStep renders its own progress bar and navigation.
**When to use:** Any wizard where the Stitch design uses a custom linear progress indicator instead of clickable step tabs.

```vue
<!-- Source: Quasar docs https://quasar.dev/vue-components/stepper + verified CSS class names -->
<template>
  <q-page>
    <q-stepper
      v-model="step"
      flat
      :header-nav="false"
      animated
      class="onboarding-stepper full-width"
    >
      <!-- Step 1: First Session intro -->
      <q-step name="welcome" title="First Session" :done="step !== 'welcome'">
        <!-- Custom progress bar replaces default header -->
        <div class="q-px-md q-pt-md q-pb-sm">
          <div class="row justify-between items-center q-mb-sm">
            <span class="text-caption text-weight-semibold text-uppercase">Onboarding Progress</span>
            <span class="text-caption text-primary text-weight-bold">Step 1 of 3</span>
          </div>
          <q-linear-progress :value="0.33" color="primary" rounded style="height: 8px;" />
        </div>
        <!-- Step content here -->
        <q-stepper-navigation>
          <q-btn
            label="Get Started"
            color="primary"
            class="full-width step-cta"
            no-caps
            unelevated
            style="border-radius: var(--radius-md);"
            @click="$refs.stepper.next()"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Assessment -->
      <q-step name="assessment" title="Assessment" :done="step === 'result'">
        <!-- Step 2 content -->
        <q-stepper-navigation>
          <q-btn label="Continue" color="primary" class="full-width step-cta" no-caps unelevated
            style="border-radius: var(--radius-md);"
            @click="$refs.stepper.next()" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 3: Level Result -->
      <q-step name="result" title="Level Result">
        <!-- Step 3 content -->
        <q-stepper-navigation>
          <q-btn label="Start Learning" color="primary" class="full-width step-cta" no-caps unelevated
            style="border-radius: var(--radius-md);"
            @click="completeOnboarding" />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const step = ref('welcome')
const router = useRouter()
const authStore = useAuthStore()

function completeOnboarding() {
  authStore.completeOnboarding()
  router.push({ name: 'dashboard' })
}
</script>

<style scoped>
/* Hide the built-in stepper header tab row entirely */
:deep(.q-stepper__header) {
  display: none;
}

/* Remove default stepper card shadow/border since we're using flat */
:deep(.q-stepper) {
  background: transparent;
}

.step-cta {
  height: 56px; /* h-14 equivalent */
}
</style>
```

**Key insight on `$refs.stepper.next()`:** Template refs in Vue 3 Composition API require `const stepper = ref(null)` and `ref="stepper"` on the QStepper element, then call `stepper.value.next()`. Alternatively, since `v-model` controls the active step, you can increment by setting `step.value = 'assessment'` directly.

### Pattern 3: Radio Option Cards (QItem + QRadio)

**What:** Selectable cards with icon, title, subtitle, and a radio input. Clicking anywhere on the card selects it. Visual state (green border, light-green background) driven by `:class` binding.
**When to use:** The Assessment step's goal-selection UI.

```vue
<!-- Source: Quasar docs https://quasar.dev/vue-components/list-and-list-items (tag="label" pattern) -->
<template>
  <div class="q-px-md q-pb-md">
    <q-item
      v-for="option in goalOptions"
      :key="option.value"
      tag="label"
      clickable
      class="option-card q-mb-md"
      :class="{
        'option-card--selected': selectedGoal === option.value
      }"
    >
      <!-- Icon box -->
      <q-item-section avatar>
        <div
          class="option-icon"
          :class="{ 'option-icon--selected': selectedGoal === option.value }"
        >
          <q-icon :name="option.icon" size="24px" />
        </div>
      </q-item-section>

      <!-- Text -->
      <q-item-section>
        <q-item-label class="text-weight-semibold">{{ option.title }}</q-item-label>
        <q-item-label caption>{{ option.desc }}</q-item-label>
      </q-item-section>

      <!-- Radio input -->
      <q-item-section side>
        <q-radio v-model="selectedGoal" :val="option.value" color="primary" />
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const selectedGoal = ref('career')

const goalOptions = [
  { value: 'career', title: 'Career growth', desc: 'Advance in your professional field', icon: 'sym_o_work' },
  { value: 'travel', title: 'Travel', desc: 'Communicate easily on your trips', icon: 'sym_o_flight_takeoff' },
  { value: 'education', title: 'Education', desc: 'Succeed in your academic studies', icon: 'sym_o_school' },
  { value: 'fun', title: 'Just for fun', desc: 'Enjoy movies and books in English', icon: 'sym_o_sentiment_satisfied' }
]
</script>

<style scoped>
.option-card {
  border: 2px solid #e5e7eb;  /* gray-100 equivalent */
  border-radius: var(--radius-md);
  padding: 20px;
  transition: border-color 0.2s, background-color 0.2s;
}

.option-card--selected {
  border-color: var(--primary);
  background-color: rgba(76, 174, 79, 0.05);
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background-color: #f9fafb;  /* gray-50 */
  color: #4b5563;             /* gray-600 */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.option-icon--selected {
  background-color: var(--primary);
  color: white;
}
</style>
```

### Pattern 4: Mock Sign-In Flow (LandingPage → Onboarding)

**What:** Button @click calls store action then imperative router.push — no guards, no redirects.
**When to use:** All navigation in this phase (no real auth involved).

```javascript
// In LandingPage.vue <script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleSignIn() {
  authStore.mockSignIn()              // sets isAuthenticated = true
  router.push({ name: 'onboarding' }) // immediately navigates — no await needed
}

// In OnboardingPage.vue — completeOnboarding() at end of stepper
function completeOnboarding() {
  authStore.completeOnboarding()      // sets hasCompletedOnboarding = true (add this action)
  router.push({ name: 'dashboard' })
}
```

**auth.js addition needed:** `completeOnboarding()` action that sets `hasCompletedOnboarding.value = true`. The existing store does not expose this as an action yet — only the raw ref.

### Pattern 5: Feature Cards (welcome_to_speakai)

**What:** Simple read-only cards with icon + title + description. Not interactive — no Quasar interactive component needed.

```vue
<!-- Source: Stitch welcome_to_speakai Tailwind → Quasar CSS translation -->
<div class="feature-card q-pa-md row items-center no-wrap q-mb-md">
  <div class="feature-icon-box q-mr-md">
    <q-icon name="sym_o_record_voice_over" size="24px" color="primary" />
  </div>
  <div>
    <p class="text-weight-bold q-mb-xs">Real-time Feedback</p>
    <p class="text-caption text-grey-7">Instant corrections to improve your accent and grammar.</p>
  </div>
</div>

<style scoped>
.feature-card {
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid #f9fafb;
  box-shadow: 0 4px 6px rgba(0,0,0,0.04);
}
.feature-icon-box {
  width: 48px;
  height: 48px;
  background: rgba(76, 174, 79, 0.1);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

### Anti-Patterns to Avoid

- **Using QOptionGroup for the Assessment step:** QOptionGroup renders a flat label list; it cannot render icon-in-box + two-line text per row. Always use individual QItem + QRadio.
- **Putting router.push inside the Pinia store action:** The store's `mockSignIn()` should only set state. Navigation belongs in the component. `useRouter()` called inside a setup store works when called inside a component setup() context, but the current auth store is initialized at module scope. Keep router calls in components.
- **Using `::v-deep` (old syntax):** Vue 3 requires `:deep(.q-stepper__header)` — the double-colon `::v-deep` syntax is deprecated and will warn in Vue 3.
- **Setting step to 1/2/3 with numbers as v-model value:** QStepper v-model must match the `name` prop on each QStep (string or number literal that matches). If using string names like `'welcome'`, `'assessment'`, `'result'`, the v-model ref must hold those strings.
- **Relying on QStepper's built-in header dots for progress feedback:** The Stitch designs use a thin linear bar + "Step X of 3" text label. Suppress the dots header and build the custom bar inside each QStep's content.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Step transition animations | Custom CSS transitions + v-show | QStepper `animated` prop | QStepper handles aria-live, transition timing, keep-alive automatically |
| Radio group binding | `@click` handlers updating refs manually | `v-model` on QRadio + `val` prop | QRadio handles keyboard navigation, ARIA checked state, name grouping |
| Progress bar | `<div style="width: X%">` | `<q-linear-progress :value="0.66" />` | Handles ARIA progressbar role, color theming, animation |
| Button loading state | Spinner + disabled logic | QBtn `:loading` prop | Built-in spinner, automatic disabled state during loading |

**Key insight:** Quasar provides the interactive behavior layer — focus on CSS/layout customization, not re-implementing interaction patterns.

---

## Common Pitfalls

### Pitfall 1: QStepper Header Remains Clickable

**What goes wrong:** Setting `header-nav="false"` disables the click handler and pointer cursor, but the header tabs are still visible and take up vertical space, confusing users.
**Why it happens:** `header-nav` disables navigation, not rendering. The header always renders by default.
**How to avoid:** Add `:deep(.q-stepper__header) { display: none }` in a `<style scoped>` block alongside the `header-nav="false"` prop. Both are required.
**Warning signs:** You see a row of numbered circles at the top of the page that don't match the Stitch design.

### Pitfall 2: Scoped Style Can't Target Child Component Internals

**What goes wrong:** `.q-stepper__header { display: none }` in `<style scoped>` has no effect.
**Why it happens:** Scoped styles add a data attribute (`data-v-XXXX`) to elements in the current component's template, but `.q-stepper__header` is rendered inside QStepper's own template — it won't have the attribute.
**How to avoid:** Use `:deep(.q-stepper__header)` (Vue 3 syntax). This correctly pierces the scoped boundary.
**Warning signs:** CSS rule exists in DevTools but computed styles show it not applied.

### Pitfall 3: QStep `name` Prop Type Mismatch

**What goes wrong:** `v-model="step"` with `step = ref(1)` (number) but QStep has `name="welcome"` (string) — stepper shows no active step.
**Why it happens:** QStepper compares v-model value to `name` with strict equality. String `"1"` !== number `1`.
**How to avoid:** Be consistent — either all string names or all numbers. For this phase, use string names that match the step content: `'welcome'`, `'assessment'`, `'result'`.
**Warning signs:** All steps appear inactive on mount; the first step content is not shown.

### Pitfall 4: QBtn `rounded` vs `round` Confusion

**What goes wrong:** Using `round` prop instead of `rounded` on the Sign-In button creates a small circular button, not a pill-shaped full-width button.
**Why it happens:** `round` = perfectly circular (equal width/height). `rounded` = rounded corners on rectangular button (matches Tailwind's `rounded-full` on a wide button).
**How to avoid:** For pill buttons: use `rounded` + `full-width` class + scoped height. For icon-only circular buttons: use `round`.
**Warning signs:** The Sign-In button appears tiny and circular instead of spanning the full width.

### Pitfall 5: Missing `completeOnboarding()` Action

**What goes wrong:** Calling `authStore.completeOnboarding()` in OnboardingPage throws "authStore.completeOnboarding is not a function".
**Why it happens:** The existing `auth.js` store only has `mockSignIn()` and `mockSignOut()`. There is no action that sets `hasCompletedOnboarding.value = true` and exposes it.
**How to avoid:** Add `completeOnboarding()` to the store and include it in the `return` object before using it in OnboardingPage.
**Warning signs:** Runtime error on clicking "Start Learning" in the Level Result step.

### Pitfall 6: Radio Card Visual State Not Updating

**What goes wrong:** Clicking an option card does not visually highlight (no green border).
**Why it happens:** The CSS class `:class="{ 'option-card--selected': selectedGoal === option.value }"` is correct, but if the `<q-item>` renders the radio in a scoped slot, the dynamic class binding on the outer element works fine — the issue is usually that `selectedGoal` wasn't initialized to match one of the option values, so nothing appears selected on mount.
**How to avoid:** Always initialize `selectedGoal` to the first option's value: `const selectedGoal = ref('career')`.
**Warning signs:** No card appears highlighted on first render; clicking a card makes none of them highlight.

### Pitfall 7: Google SVG Icon Inside QBtn

**What goes wrong:** Placing a raw `<svg>` tag inside `<q-btn>` content slot causes the SVG to be styled by QBtn's internal icon sizing rules and appear misaligned.
**Why it happens:** QBtn applies icon styling via CSS to direct `q-icon` children. Raw SVG bypasses this.
**How to avoid:** Wrap the Google SVG in a separate `<div>` with explicit styling (white circle, fixed size), then place that div inside the button's default slot alongside the label text. Do not use the QBtn `icon` prop for this — that prop expects a Material icon name string.
**Warning signs:** SVG appears too large, too small, or colored incorrectly.

---

## Code Examples

Verified patterns from official sources and project analysis:

### Complete Mock Sign-In Handler

```javascript
// Source: auth.js store (project) + Vue Router composition API
// In LandingPage.vue <script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleSignIn() {
  authStore.mockSignIn()               // isAuthenticated.value = true
  router.push({ name: 'onboarding' })  // named route — matches routes.js
}
```

### auth.js Addition: completeOnboarding() Action

```javascript
// Add to existing useAuthStore in src/stores/auth.js
function completeOnboarding() {
  hasCompletedOnboarding.value = true
}

// Add to return object:
return {
  isAuthenticated,
  hasCompletedOnboarding,
  isNewUser,
  mockSignIn,
  mockSignOut,
  completeOnboarding  // <-- new
}
```

### QStepper v-model + next() via Template Ref

```vue
<!-- Source: Quasar QStepper API — programmatic navigation -->
<template>
  <q-stepper v-model="step" ref="stepperRef" flat :header-nav="false" animated>
    <q-step name="welcome" title="First Session">
      <!-- content -->
      <q-stepper-navigation>
        <q-btn @click="stepperRef.next()" label="Get Started" color="primary" />
      </q-stepper-navigation>
    </q-step>
    <!-- ... -->
  </q-stepper>
</template>

<script setup>
import { ref } from 'vue'
const step = ref('welcome')
const stepperRef = ref(null)
// stepperRef.value.next() or stepperRef.value.goTo('assessment')
</script>
```

**Alternative (direct v-model mutation):** Instead of `stepperRef.next()`, directly assign: `step.value = 'assessment'`. Both work; the template ref approach is more declarative.

### Hiding QStepper Header (Deep CSS)

```vue
<!-- Source: GitHub Discussion #16654 + Vue 3 :deep() docs -->
<style scoped>
/* Completely remove the tab/dot header row — we use a custom progress bar */
:deep(.q-stepper__header) {
  display: none;
}

/* Optional: remove default stepper padding to control layout ourselves */
:deep(.q-stepper__step-inner) {
  padding: 0;
}
</style>
```

### QLinearProgress as "Step X of 3" Progress Bar

```vue
<!-- Source: Quasar QLinearProgress docs + Stitch quick_assessment design -->
<!-- Step 2 of 3 = value 0.66; Step 3 of 3 = value 1.0; Step 1 of 3 = value 0.33 -->
<div class="q-px-lg q-pt-md q-pb-sm">
  <div class="row justify-between items-center q-mb-sm">
    <span class="text-overline text-weight-bold">Onboarding Progress</span>
    <span class="text-caption text-primary text-weight-bold">Step 2 of 3</span>
  </div>
  <q-linear-progress
    :value="0.66"
    color="primary"
    rounded
    style="height: 8px; border-radius: var(--radius-full);"
  />
</div>
```

### Quasar Brand Colors (Already Configured)

```javascript
// From quasar.config.js — these are already registered as Quasar brand colors
// Use color="primary" on any Quasar component to get #4cae4f
brand: {
  primary: '#4cae4f',   // Main green — Sign-In button, step indicator, radio highlight
  secondary: '#6c7f6d', // Muted green for body text
  accent: '#FF6B35',    // Orange accent (not used in Phase 2)
}
// CSS var --q-primary: #4cae4f is also available in scoped styles
```

### Hero Illustration (welcome_to_speakai)

```vue
<!-- Quasar translation of the Stitch person + connecting line + robot illustration -->
<!-- No external image needed — built from QIcon + CSS only -->
<div class="hero-illustration row items-center justify-center q-py-xl">
  <!-- Person circle -->
  <div class="hero-circle bg-primary row items-center justify-center">
    <q-icon name="sym_o_person" size="48px" color="white" />
  </div>

  <!-- Connecting pulse line -->
  <div class="hero-line" />

  <!-- AI robot rounded box -->
  <div class="hero-robot row items-center justify-center">
    <q-icon name="sym_o_smart_toy" size="48px" color="primary" />
  </div>
</div>

<style scoped>
.hero-illustration {
  background: #e8f5e9; /* Stitch light-green bg */
  border-radius: var(--radius-md);
  min-height: 200px;
}
.hero-circle {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-full);
}
.hero-line {
  width: 64px;
  height: 4px;
  background: rgba(76, 174, 79, 0.3);
  border-radius: var(--radius-full);
  animation: pulse 2s infinite;
}
.hero-robot {
  width: 96px;
  height: 96px;
  background: white;
  border-radius: var(--radius-lg);
  border: 2px solid rgba(76, 174, 79, 0.2);
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
</style>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `::v-deep .foo` (Vue 2 scoped deep) | `:deep(.foo)` (Vue 3) | Vue 3.x | Scoped style overrides of Quasar internals MUST use the new syntax |
| `$refs.stepper.next()` via Options API | `const stepperRef = ref(null)` then `stepperRef.value.next()` | Vue 3 Composition API | Template refs are plain refs in composition API — no `this.$refs` |
| `v-deep` inside Options API style blocks | `:deep()` pseudo-class | Vue 3 + Vue Loader 3 | Old syntax logs deprecation warnings |

**Deprecated/outdated:**
- `::v-deep selector`: Deprecated in Vue 3; replaced by `:deep(selector)`.
- Pinia options store `this.router`: Only works in options-style stores. Setup stores must use `useRouter()` from vue-router.

---

## Stitch → Quasar Translation Reference

| Tailwind Class | Quasar Equivalent | Notes |
|----------------|-------------------|-------|
| `rounded-full` on wide button | `rounded` prop on QBtn | Creates pill; `round` creates circle |
| `h-14` (56px height) | `style="height: 56px"` or `padding="16px 24px"` | No direct Quasar height prop for QBtn |
| `w-full` | `full-width` CSS class or `class="full-width"` | Quasar global helper class |
| `bg-primary` | `color="primary"` prop | Quasar brand token = #4cae4f |
| `text-white` | `text-color="white"` prop on QBtn | Automatic on filled buttons |
| `rounded-xl` button | No `rounded` + `style="border-radius: var(--radius-md)"` | Quasar `rounded` = full pill; custom border-radius for partial rounding |
| `gap-4` in flex | `class="q-gutter-md"` | Quasar gutter helper class |
| `space-y-4` | `q-mt-md` on each child or wrap in `q-gutter-y-md` | Quasar vertical gutter |
| `font-extrabold` | `class="text-weight-bold"` | Inter 800 via custom CSS if needed |
| `text-[32px]` | `style="font-size: 32px;"` or `class="text-h4"` (24px) | For exact 32px, use inline style |
| `tracking-tight` | No direct Quasar class; use `style="letter-spacing: -0.02em;"` | Apply via scoped CSS |
| `bg-primary/5` | `style="background: rgba(76,174,79,0.05)"` | Quasar doesn't have opacity modifiers |
| `border-2 border-primary` | Scoped CSS `.option-card--selected { border: 2px solid var(--primary) }` | Dynamic border via CSS class |
| `has-[:checked]` CSS selector | `:class="{ selected: model === val }"` Vue binding | Vue handles this declaratively |

---

## Open Questions

1. **QStep `name` prop type: string vs number for v-model**
   - What we know: QStepper v-model value must strictly equal QStep `name` prop
   - What's unclear: Whether numbers or strings perform better for keep-alive filtering
   - Recommendation: Use descriptive string names (`'welcome'`, `'assessment'`, `'result'`) for clarity; initialize v-model ref as `ref('welcome')`

2. **QStepper `animated` prop + content height jank**
   - What we know: `animated` enables transitions between steps; QStepper may animate height changes
   - What's unclear: Whether height animation causes visual jank on mobile PWA with variable-height step content
   - Recommendation: Start with `animated` enabled; if height jank is visible during testing, remove the prop — the wizard still functions correctly without it

3. **Level Result step design (no Stitch source)**
   - What we know: Requirement ONBD-04 says "show assessed level badge + Start Learning button"
   - What's unclear: Exact visual design — no Stitch file provided for this step
   - Recommendation: Use a simple design consistent with the assessment step: centered badge showing "Intermediate" in a green pill, celebratory text, and a primary QBtn "Start Learning". No research needed — design from design tokens.

---

## Sources

### Primary (HIGH confidence)
- `C:/Users/User/Documents/GitHub/englishh/src/stores/auth.js` — Verified existing mockSignIn() API
- `C:/Users/User/Documents/GitHub/englishh/src/router/routes.js` — Verified named routes `landing`, `onboarding`, `dashboard`
- `C:/Users/User/Documents/GitHub/englishh/quasar.config.js` — Verified brand colors, icon set, Quasar v2 config
- `C:/Users/User/Documents/GitHub/englishh/src/css/app.css` — Verified CSS design tokens
- Quasar official docs (quasar.dev/vue-components/stepper) — QStepper props: flat, header-nav, animated, contracted, v-model, navigation slot
- Quasar GitHub source (quasarframework/quasar/blob/dev/ui/src/components/stepper/QStepper.js) — Confirmed props: flat, bordered, headerNav, contracted, headerClass
- Quasar official docs (quasar.dev/style/other-helper-classes) — Confirmed: `full-width`, `rounded-borders`, `hidden` helper classes

### Secondary (MEDIUM confidence)
- Quasar GitHub Issue #7284 — Confirmed: `header-nav="false"` on QStepper disables header click navigation; fixed in v1.12.11, applies to v2
- Quasar GitHub Discussion #16654 — Confirmed: `.q-stepper__header` and `.q-stepper__content` are the CSS class names for targeting stepper internals
- Vue.js SFC CSS Features docs (vuejs.org/api/sfc-css-features) — Confirmed: `:deep()` is the Vue 3 deep selector syntax replacing `::v-deep`
- Quasar GitHub Discussion #15468 — Confirmed: `useRouter()` from vue-router works in Composition API setup stores and components

### Tertiary (LOW confidence)
- Quasar GitHub Issue #5428 — Indicates no built-in "hide step from header" prop exists (workaround: CSS `:deep()`)
- Quasar GitHub Issue #1716 — Historical context: feature request to disable header nav, eventually addressed via `header-nav` prop

---

## Metadata

**Confidence breakdown:**
- QStepper API (flat, header-nav, v-model, navigation slot): HIGH — verified via official docs and GitHub source
- QRadio + QItem tag="label" pattern: HIGH — verified via official Quasar docs
- CSS :deep() for scoped style overrides: HIGH — verified via Vue 3 official docs
- Radio card scoped CSS approach: HIGH — standard Vue 3 pattern, CSS class bindings are idiomatic
- Level Result step visual design: LOW — no Stitch source file provided, recommended approach is design-system-consistent but not Stitch-verified
- QStepper animation height jank on mobile: LOW — theoretical concern, needs runtime testing

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (Quasar v2 + Vue 3 stable APIs — 30-day window)
