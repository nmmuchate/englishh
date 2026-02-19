# Phase 1: Foundation - Research

**Researched:** 2026-02-20
**Domain:** Quasar 2 / Vue 3 app shell — design tokens, dark mode, routing, Pinia stores, HTTP stripping
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Design Token Method**
- Use **both** Quasar brand config (quasar.config.js) + CSS custom properties (app.css)
  - Quasar brand config: sets primary (#4cae4f) and secondary/accent colors so QBtn, QCard, etc. auto-tint correctly
  - CSS variables in app.css: `--primary`, `--accent-orange` (#FF6B35), `--bg-light` (#f6f7f6), `--bg-dark` (#151d15), `--text-deep-slate` (#131613) for use in scoped component styles
- **Inter font**: loaded via Google Fonts CDN link in `index.html`
- **Icons**: Claude's discretion — use whichever of Material Icons (Quasar extras, already configured) vs Material Symbols CDN matches the Stitch icon set more closely
- **Border-radius / spacing scale**: Claude's discretion — use CSS variables or inline values, whichever keeps components cleanest

**Router / Auth Guard**
- **No navigation guards** — all routes freely accessible; this is a static UI demo
- **No Pinia auth enforcement** — mock auth store holds a `isAuthenticated` flag for component-level use (e.g., showing avatar), but does not gate routes
- **Entry point**: Claude's discretion — decide the most natural demo entry (root = Landing is simplest)
- **Onboarding skip**: Claude's discretion — decide whether `hasCompletedOnboarding` flag in store skips onboarding on reload

**Bottom Navigation**
- **Persistent bottom nav** on main app screens using Quasar QTabsBar or QFooter + QTabs
- **3 tabs**: Home (Dashboard), Progress (Your Progress), Profile
- **Bottom nav HIDDEN on**: Landing/Sign-in, Onboarding wizard, Active Session, Feedback screen
- **Bottom nav SHOWN on**: Dashboard, Your Progress, Vocabulary Bank, Profile/Settings, Paywall modal context
- Vocabulary Bank is reachable (e.g., from Profile or Progress) but does not get its own bottom nav tab

### Claude's Discretion
- Icon set selection (Material Icons vs Material Symbols) — pick whichever matches Stitch icons
- Border-radius and spacing variable approach — inline or variables, cleanliness wins
- App entry point behavior (root URL, onboarding skip flag)
- Bottom nav active-state indicator style (underline, color highlight, etc.)

### Deferred Ideas (OUT OF SCOPE)
- Manual dark mode toggle in UI — Phase 5 (Profile/Settings page)
- PWA install prompt / service worker customization — future enhancement
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Design token CSS variables (primary #4cae4f, accent-orange #FF6B35, Inter font, border-radius scale) are configured globally and applied to all pages | Brand config in `quasar.config.js` `framework.config.brand` + CSS vars in `src/css/app.css`; CDN `<link>` in `index.html` for Inter |
| FOUND-02 | System dark/light mode detection is implemented — app theme follows OS preference automatically | `framework.config.dark: 'auto'` in `quasar.config.js`; `body--dark` / `body--light` classes for CSS hooks; FOUC fix via inline style in `index.html` |
| FOUND-03 | Mobile-first container (max-width 430px, centered) is applied globally matching Stitch viewport | CSS class on `q-page-container` or a wrapper div in the MainLayout; `max-width: 430px; margin: 0 auto` |
| FOUND-04 | Vue Router is configured with named routes for all pages and guards mock-auth flow | Two-layout pattern in `src/router/routes.js`: `MainLayout` (with bottom nav) + `FullscreenLayout` (without); named routes for all 9 screens + Vocabulary Bank |
| FOUND-05 | Pinia stores are created for mock auth state, session state, and user profile (hardcoded mock data) | Composition-API `defineStore` pattern + `acceptHMRUpdate`; three stores: `useAuthStore`, `useSessionStore`, `useProfileStore` |
| FOUND-06 | Axios boot file is replaced/stripped — no real HTTP calls; all data is mocked inline | Replace `src/boot/axios.js` with a no-op or delete it; remove `axios` from `quasar.config.js` `boot` array |
</phase_requirements>

---

## Summary

The project scaffold is already in place: Quasar 2.18.6, Vue 3.5, Vue Router 5.0.2, Pinia 3.0.4, and @quasar/extras 1.17.0 are all installed. The existing codebase uses the default Quasar template structure (Options API, material-icons, axios boot file, single MainLayout with a side drawer). Phase 1 is primarily a reconfiguration and scaffolding task, not a greenfield setup.

The two biggest architectural decisions for this phase are: (1) the icon set — research confirms all Stitch screens exclusively use `material-symbols-outlined` (span.material-symbols-outlined); the `sym_o_` prefix is supported in @quasar/extras 1.17.0 already installed, making this an extras-swap, not a CDN dependency; (2) the layout split — pages with bottom nav and pages without bottom nav require two distinct layout components in Quasar's Vue Router structure, which is the idiomatic Quasar pattern and avoids complex conditional rendering in a single layout.

Dark mode via OS preference is a single `framework.config.dark: 'auto'` config key — Quasar handles the `prefers-color-scheme` detection automatically. The `body--dark` / `body--light` CSS classes are automatically applied by Quasar, making custom CSS theming straightforward. The only known pitfall is a flash of white on first load in PWA/dark-system mode, fixed by a CSS `color-scheme` property or inline dark background on `<html>`.

**Primary recommendation:** Swap extras from `material-icons` to `material-symbols-outlined`, set `framework.iconSet` to `material-symbols-outlined`, add `dark: 'auto'` to `framework.config`, split into two layouts (`MainLayout` with bottom nav, `FullscreenLayout` without), create three Pinia stores with composition-API setup style, and strip the axios boot file.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| quasar | 2.18.6 | Component framework + layout system | Project decision, already in use |
| @quasar/extras | 1.17.0 | Icon webfonts (material-symbols-outlined) | Ships icons without CDN dependency |
| vue | 3.5.22 | Reactivity + composition API | Project decision |
| vue-router | 5.0.2 | Hash-based routing + named routes | Project decision |
| pinia | 3.0.4 | Reactive stores for mock state | Project decision |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @quasar/app-vite | 2.1.0 | Build tooling | Dev/build only; no runtime changes needed |
| postcss + autoprefixer | already installed | CSS vendor prefixing | Configured, no changes needed |

### Not Used in This Phase (confirmed out of scope)

| Library | Status | Reason |
|---------|--------|--------|
| axios | Remove from boot array | No real HTTP calls; FOUND-06 |

**No new npm installs needed.** All required packages are already in `node_modules`.

---

## Architecture Patterns

### Recommended Project Structure After Phase 1

```
src/
├── boot/
│   └── axios.js          # STRIP: replace with empty boot or delete + remove from config
├── css/
│   └── app.css           # ADD: CSS custom properties for design tokens + body--dark/body--light
├── layouts/
│   ├── MainLayout.vue    # REWRITE: mobile container + QFooter bottom nav (3 tabs)
│   └── FullscreenLayout.vue  # NEW: no bottom nav, no header (Landing, Onboarding, Session, Feedback)
├── pages/
│   ├── LandingPage.vue       # NEW: stub (just route placeholder)
│   ├── OnboardingPage.vue    # NEW: stub
│   ├── DashboardPage.vue     # NEW: stub
│   ├── SessionPage.vue       # NEW: stub
│   ├── FeedbackPage.vue      # NEW: stub
│   ├── ProgressPage.vue      # NEW: stub
│   ├── VocabularyPage.vue    # NEW: stub
│   ├── ProfilePage.vue       # NEW: stub
│   ├── ErrorNotFound.vue     # KEEP: already exists
│   └── IndexPage.vue         # REMOVE: replaced by LandingPage
├── router/
│   ├── index.js          # KEEP: no changes needed
│   └── routes.js         # REWRITE: two-layout groups with named routes
├── stores/
│   ├── index.js          # KEEP: Pinia factory
│   ├── auth.js           # NEW: useAuthStore (isAuthenticated, hasCompletedOnboarding)
│   ├── session.js        # NEW: useSessionStore (mock session data)
│   └── profile.js        # NEW: useProfileStore (mock user data)
└── App.vue               # KEEP: minimal, already correct
index.html                # EDIT: add Inter CDN link + dark FOUC fix
quasar.config.js          # EDIT: brand colors, iconSet, dark: 'auto', swap material-icons → material-symbols-outlined
```

### Pattern 1: Two-Layout Route Splitting

**What:** Separate routes into two groups based on whether bottom navigation is visible. Each group uses a different layout component as its parent route.

**When to use:** Always in Quasar when some pages have persistent shell chrome (nav bars, footers) and others are fullscreen/immersive.

**Example:**
```javascript
// src/router/routes.js
// Source: https://quasar.dev/layout/routing-with-layouts-and-pages/

const routes = [
  // Fullscreen pages — no bottom nav, no chrome
  {
    path: '/',
    component: () => import('layouts/FullscreenLayout.vue'),
    children: [
      { path: '', name: 'landing', component: () => import('pages/LandingPage.vue') },
      { path: 'onboarding', name: 'onboarding', component: () => import('pages/OnboardingPage.vue') },
      { path: 'session', name: 'session', component: () => import('pages/SessionPage.vue') },
      { path: 'feedback', name: 'feedback', component: () => import('pages/FeedbackPage.vue') }
    ]
  },

  // Main app pages — with persistent bottom nav
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'progress', name: 'progress', component: () => import('pages/ProgressPage.vue') },
      { path: 'vocabulary', name: 'vocabulary', component: () => import('pages/VocabularyPage.vue') },
      { path: 'profile', name: 'profile', component: () => import('pages/ProfilePage.vue') }
    ]
  },

  // 404 catch-all
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
```

### Pattern 2: Quasar Brand Config + CSS Variables (Design Tokens)

**What:** Set Quasar brand colors so all `QBtn`, `QCard`, `color="primary"` etc. auto-tint. Then define your own `--` variables in `app.css` for custom component styles.

**When to use:** Always when you need both Quasar components to reflect brand AND custom scoped component CSS to use tokens.

**Example:**
```javascript
// quasar.config.js
// Source: https://quasar.dev/style/color-palette/
framework: {
  iconSet: 'material-symbols-outlined',
  config: {
    dark: 'auto',  // follows OS prefers-color-scheme
    brand: {
      primary: '#4cae4f',
      secondary: '#6c7f6d',
      accent: '#FF6B35',
      dark: '#151d15',
      positive: '#4cae4f',
      negative: '#ef4444',
      info: '#6c7f6d',
      warning: '#FF9800'
    }
  }
}
```

```css
/* src/css/app.css */
/* Source: Quasar body--dark/body--light class documentation */

:root {
  --primary: #4cae4f;
  --accent-orange: #FF6B35;
  --bg-light: #f6f7f6;
  --bg-dark: #151d15;
  --text-deep-slate: #131613;
  --radius-sm: 0.5rem;   /* rounded / DEFAULT */
  --radius-md: 1rem;     /* rounded-lg */
  --radius-lg: 1.5rem;   /* rounded-xl */
  --radius-full: 9999px; /* rounded-full */
}

/* Dark mode overrides for custom CSS (Quasar adds body--dark automatically) */
.body--dark {
  --bg-surface: var(--bg-dark);
  --text-primary: #ffffff;
}

.body--light {
  --bg-surface: #ffffff;
  --text-primary: var(--text-deep-slate);
}
```

### Pattern 3: Pinia Setup-Style Store (Composition API)

**What:** Define stores using the composition function syntax (matches Vue 3 `<script setup>` style). Each `ref` becomes state, each `computed` becomes a getter, each function becomes an action.

**When to use:** Always — this is the modern Pinia pattern; matches the project's `<script setup>` only constraint.

**Example:**
```javascript
// src/stores/auth.js
// Source: https://pinia.vuejs.org/core-concepts/
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const hasCompletedOnboarding = ref(false)

  const displayName = computed(() =>
    isAuthenticated.value ? 'Sarah Chen' : null
  )

  function signIn() {
    isAuthenticated.value = true
  }

  function signOut() {
    isAuthenticated.value = false
  }

  return { isAuthenticated, hasCompletedOnboarding, displayName, signIn, signOut }
})

// HMR support for Vite dev server
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
```

### Pattern 4: Mobile-First Container

**What:** All pages capped at 430px width, horizontally centered. Applied once in MainLayout and FullscreenLayout so individual pages never need to worry about it.

**Example:**
```vue
<!-- In both layouts — q-page-container or inner wrapper -->
<style lang="css" scoped>
.app-container {
  max-width: 430px;
  width: 100%;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
</style>
```

Alternatively, Quasar's `q-page-container` itself can be styled with `max-width: 430px; margin: 0 auto` in `app.css` since it is a global singleton in most layouts.

### Pattern 5: Bottom Nav with QRouteTab

**What:** Use `QFooter` + `QTabs` + `QRouteTab` in `MainLayout.vue`. Active tab is driven by the current route (no `v-model` needed or recommended).

**Source:** https://quasar.dev/vue-components/tabs/

**Example:**
```vue
<template>
  <q-layout view="hHh lpr fFf">
    <q-page-container class="app-page-container">
      <router-view />
    </q-page-container>

    <q-footer class="bg-white shadow-up-2">
      <q-tabs
        class="text-grey-6"
        active-color="primary"
        indicator-color="transparent"
        align="justify"
        dense
      >
        <q-route-tab
          name="dashboard"
          :to="{ name: 'dashboard' }"
          icon="sym_o_home"
          label="Home"
          no-caps
        />
        <q-route-tab
          name="progress"
          :to="{ name: 'progress' }"
          icon="sym_o_bar_chart"
          label="Progress"
          no-caps
        />
        <q-route-tab
          name="profile"
          :to="{ name: 'profile' }"
          icon="sym_o_person"
          label="Profile"
          no-caps
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>
```

**Critical:** Do NOT use `v-model` on `QTabs` when using `QRouteTab`. The active state is determined by the router, not the model.

### Pattern 6: Material Symbols Outlined in quasar.config.js

**What:** Switch from `material-icons` to `material-symbols-outlined` in extras. Set `iconSet`. Use `sym_o_` prefix when referencing icons in Quasar components.

**Example:**
```javascript
// quasar.config.js
extras: [
  'roboto-font',    // can remove (using Inter via CDN instead)
  'material-symbols-outlined'  // replaces 'material-icons'
],
framework: {
  iconSet: 'material-symbols-outlined',
  config: { ... }
}
```

In components:
```vue
<!-- Quasar component icon prop -->
<q-icon name="sym_o_home" />
<q-btn icon="sym_o_mic" />

<!-- Raw span approach (matches Stitch HTML exactly) — works alongside Quasar -->
<span class="material-symbols-outlined">home</span>
```

Both approaches work. The `sym_o_` prefix routes through Quasar's icon resolution. Raw `span.material-symbols-outlined` bypasses Quasar and uses the webfont directly.

### Anti-Patterns to Avoid

- **Removing `roboto-font` but forgetting to add Inter CDN:** Roboto is currently in extras. Once removed, no fallback font unless Inter CDN link is in `index.html` before the app loads.
- **Leaving `material-icons` in extras alongside `material-symbols-outlined`:** Both ship large font files. Pick one. Stitch uses Material Symbols Outlined exclusively — remove `material-icons`.
- **Using `v-model` with `QRouteTab`:** Do not combine. QRouteTab's active state is route-driven. v-model creates a desync between the displayed active tab and the actual URL.
- **Putting `$q.dark.set('auto')` in a component `onMounted`:** This fires after first render, causing a flash. The `framework.config.dark: 'auto'` in quasar.config.js fires at framework init — before any Vue renders.
- **Single-layout with `v-if` for bottom nav:** Works but creates coupling. The two-layout pattern is idiomatic Quasar and makes it trivial to add/remove pages from either group.
- **Using Options API in stores or components:** Project constraint is `<script setup>` only. The example-store.js in the repo uses Options API — it should be replaced with composition-style stores.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark/light mode detection | Custom `window.matchMedia` listener | `framework.config.dark: 'auto'` in quasar.config.js | Quasar handles the listener, SSR edge cases, `body--dark` class, and component dark props automatically |
| Bottom nav active state | Computed `currentTab` ref synced to `$route.name` | `QRouteTab` with `to` prop | QRouteTab tracks route automatically; exact/loose matching built in |
| Mobile centering viewport | Per-page CSS constraints | Global CSS on layout container | Layouts are the right abstraction boundary |
| Color theming for Quasar components | `style` attribute overrides on individual components | `framework.config.brand` in quasar.config.js | Brand config sets `--q-primary` etc. globally; QBtn/QCard color props read from it automatically |
| HMR for Pinia stores | Nothing | `acceptHMRUpdate` pattern | Without it, store state is lost on file save during dev |

**Key insight:** Quasar's framework config is the central control plane for theming, icons, and dark mode. Bypassing it with manual JS/CSS creates divergence between Quasar components and custom styles.

---

## Common Pitfalls

### Pitfall 1: Flash of White on Dark System

**What goes wrong:** When OS is in dark mode and `dark: 'auto'` is set, the browser briefly renders the default white background of `#app` before Quasar's JS initializes and adds `body--dark`.

**Why it happens:** JavaScript runs after HTML parsing; the Quasar framework attaches dark mode after mounting.

**How to avoid:** Add a CSS-based fix in `index.html` that detects `prefers-color-scheme` before any JS loads:
```html
<!-- index.html — inside <head>, before any other styles -->
<style>
  @media (prefers-color-scheme: dark) {
    html { background-color: #151d15; }
  }
</style>
```
This is pure CSS — zero JS required — and fires at parse time.

**Warning signs:** On dark OS, see white flash for ~100-500ms on first load of PWA.

### Pitfall 2: Existing MainLayout Must Be Fully Replaced

**What goes wrong:** The current `MainLayout.vue` uses Options API (`defineComponent`, `setup()` return object) and has a side-drawer pattern that doesn't match the mobile app design at all.

**Why it happens:** Quasar CLI scaffolds with a desktop-oriented drawer layout by default.

**How to avoid:** Replace the entire contents of `MainLayout.vue`. Do not try to patch the existing template. It also imports `EssentialLink` which should not be part of the mobile app.

**Warning signs:** Side drawer still appearing, `EssentialLink` import error, `$q.version` text visible in toolbar.

### Pitfall 3: Axios Boot File Still Active After Stripping

**What goes wrong:** Even if `axios.js` boot file is emptied, if `'axios'` remains in the `boot` array in `quasar.config.js`, Quasar still loads the file (now just an empty module). No harm, but it's dead code. If the file is deleted but `boot: ['axios']` remains, the build errors out.

**How to avoid:** BOTH steps required: (1) replace/empty `src/boot/axios.js` AND (2) remove `'axios'` from `boot: []` in `quasar.config.js`.

**Warning signs:** Build error `Cannot find module 'src/boot/axios'` if file deleted but array not updated.

### Pitfall 4: Pinia Store Called Before Pinia Initialized

**What goes wrong:** If `useAuthStore()` is called at module top level (e.g., in a utility file), Pinia may not be installed yet, causing "No active Pinia was found" error.

**Why it happens:** Pinia is installed inside the Quasar boot sequence; calling `useStore()` outside a component or boot file bypasses this.

**How to avoid:** Only call `useXxxStore()` inside `<script setup>` blocks, inside `setup()`, or inside Quasar boot files (which run after Pinia is installed).

**Warning signs:** Console error: `getActivePinia was called with no active Pinia`.

### Pitfall 5: QRouteTab `exact` vs Non-Exact Matching

**What goes wrong:** Without `exact` on `QRouteTab`, navigating to `/app/dashboard/some-child` will keep the Dashboard tab active even when you're on a child page. With `exact`, the Dashboard tab deactivates when on a child route.

**Why it happens:** Vue Router's route matching is prefix-by-default.

**How to avoid:** For top-level bottom nav tabs pointing to specific pages (not parent routes), add `exact` to each `QRouteTab`. For this app, all bottom nav destinations are leaf pages so use `exact`.

### Pitfall 6: `roboto-font` Left in Extras With Inter Via CDN

**What goes wrong:** Both fonts load. Roboto (via Quasar extras) is loaded as a webfont and may override Inter depending on Quasar's default CSS `font-family` declarations.

**How to avoid:** Remove `'roboto-font'` from `extras` in `quasar.config.js`. Set `font-family: 'Inter', sans-serif` on `body` in `app.css` to ensure Inter takes precedence. Quasar's component styles use `font-family: inherit` so body-level font cascades correctly.

---

## Code Examples

Verified patterns from official sources and installed package inspection:

### Material Symbols Outlined in quasar.config.js

```javascript
// Source: @quasar/extras 1.17.0 (installed) — material-symbols-outlined folder confirmed present
// Source: https://github.com/quasarframework/quasar/discussions/13473

// quasar.config.js
extras: [
  // 'roboto-font',  // REMOVE — using Inter CDN instead
  'material-symbols-outlined'  // replaces 'material-icons'
],
framework: {
  iconSet: 'material-symbols-outlined',
  config: {
    dark: 'auto',
    brand: {
      primary: '#4cae4f',
      secondary: '#6c7f6d',
      accent: '#FF6B35',
      dark: '#151d15',
      positive: '#4cae4f',
      negative: '#ef4444',
      info: '#6c7f6d',
      warning: '#FF9800'
    }
  }
}
```

### index.html with Inter Font + Dark FOUC Fix

```html
<!-- index.html -->
<!-- Add inside <head> -->

<!-- FOUC fix: apply dark bg before JS loads -->
<style>
  @media (prefers-color-scheme: dark) {
    html, body { background-color: #151d15; }
  }
</style>

<!-- Inter font: weights 400, 500, 600, 700, 800 — all used by Stitch -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Stripped Axios Boot File

```javascript
// src/boot/axios.js — stripped version
// Source: project requirement FOUND-06
import { defineBoot } from '#q-app/wrappers'

// Axios boot stripped — this app uses no real HTTP calls.
// All data is mocked inline in Pinia stores or component data.
export default defineBoot(() => {
  // intentionally empty
})
```

Alternative: delete the file entirely and remove `'axios'` from `quasar.config.js` `boot` array.

### Three Pinia Stores (Composition API Style)

```javascript
// src/stores/auth.js
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // state
  const isAuthenticated = ref(false)
  const hasCompletedOnboarding = ref(false)

  // getters
  const isNewUser = computed(() => !hasCompletedOnboarding.value)

  // actions
  function mockSignIn() { isAuthenticated.value = true }
  function mockSignOut() {
    isAuthenticated.value = false
    hasCompletedOnboarding.value = false
  }

  return { isAuthenticated, hasCompletedOnboarding, isNewUser, mockSignIn, mockSignOut }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
```

```javascript
// src/stores/profile.js
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  const displayName = ref('Sarah Chen')
  const level = ref('Intermediate')
  const streakDays = ref(12)
  const totalSessions = ref(47)
  const vocabularyLearned = ref(183)
  const isPro = ref(false)

  return { displayName, level, streakDays, totalSessions, vocabularyLearned, isPro }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
```

```javascript
// src/stores/session.js
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const isActive = ref(false)
  const durationSeconds = ref(0)
  const mistakeCount = ref(0)
  const overallScore = ref(null)

  function startSession() {
    isActive.value = true
    durationSeconds.value = 0
    mistakeCount.value = 0
    overallScore.value = null
  }

  function endSession(score) {
    isActive.value = false
    overallScore.value = score
  }

  return { isActive, durationSeconds, mistakeCount, overallScore, startSession, endSession }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot))
}
```

### Using Stores in script setup

```vue
<script setup>
// Source: https://pinia.vuejs.org/core-concepts/
import { useAuthStore } from 'src/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
// Destructure reactive state with storeToRefs (actions can be destructured directly)
const { isAuthenticated, hasCompletedOnboarding } = storeToRefs(authStore)
const { mockSignIn } = authStore
</script>
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Options API `defineComponent` | `<script setup>` with composition API | Project constraint; existing layouts and App.vue use old style — replace them |
| `material-icons` in extras | `material-symbols-outlined` | Stitch uses Material Symbols Outlined exclusively; @quasar/extras 1.17.0 has it |
| Side-drawer MainLayout (Quasar CLI default) | Split two-layout (MainLayout with bottom nav, FullscreenLayout) | Required for mobile app pattern |
| Axios boot file (Quasar CLI default) | Stripped/empty boot file | No backend in v1 |
| `example-store.js` Options API store | Composition-style `defineStore` | Matches script setup constraint |

**Deprecated/outdated in this project:**
- `src/stores/example-store.js`: Uses Options API store pattern. Must be deleted and replaced with composition-style stores.
- `src/pages/IndexPage.vue`: Will be superseded by `LandingPage.vue` once routes are configured. Can be deleted after route update.
- `MainLayout.vue` (current): Entire file content is wrong for mobile app; replace completely.

---

## Claude's Discretion Recommendations

These are areas left to Claude's judgment per CONTEXT.md.

### Icon Set: Use Material Symbols Outlined (not Material Icons)

**Recommendation:** Switch to `material-symbols-outlined`.

**Evidence:** All 9 Stitch screens use `span.material-symbols-outlined` exclusively. No `material-icons` usage found in any Stitch HTML. The @quasar/extras 1.17.0 package (already installed) includes `material-symbols-outlined` as a webfont. Icons used in the Stitch bottom nav are `home`, `bar_chart`, `person` — all available in Material Symbols Outlined with the `sym_o_` prefix.

### Border-Radius Scale: Use CSS Variables in app.css

**Recommendation:** Define 4 CSS variables, use them in scoped component styles.

**Evidence:** 8 of 9 Stitch screens share the same borderRadius config: `DEFAULT: 0.5rem`, `lg: 1rem`, `xl: 1.5rem`, `full: 9999px`. The sign-in screen uses a larger scale (1rem / 2rem / 3rem) but is an outlier. Map the consensus scale to:
```css
--radius-sm: 0.5rem;   /* most cards, inputs */
--radius-md: 1rem;     /* prominent cards */
--radius-lg: 1.5rem;   /* modal sheets */
--radius-full: 9999px; /* pills, avatars */
```
The sign-in screen's larger radii can be applied inline for that specific component in Phase 2.

### App Entry Point: Root = Landing (no redirect)

**Recommendation:** Map `path: '/'` directly to `LandingPage`. No redirect needed.

**Evidence:** Hash routing means the root hash is `#/`. Mapping root to Landing is the simplest path and the most natural demo entry point. No router logic required.

### Onboarding Skip Flag: Keep in Store, Inactive in Phase 1

**Recommendation:** Include `hasCompletedOnboarding` as a `ref(false)` in `useAuthStore`. Do NOT implement skip logic in Phase 1. Phase 2 (Landing/Onboarding) will implement the actual flow.

**Evidence:** Phase 1 only creates stub page components for routing verification. Skip behavior requires the onboarding page to exist first.

### Bottom Nav Active State: Color + Icon Highlight (no underline)

**Recommendation:** Use Quasar `QTabs` `active-color="primary"` (green highlight on active icon/label) with `indicator-color="transparent"` (no underline indicator). This matches the Stitch dashboard design where the active tab item changes color.

**Evidence:** Stitch home_dashboard bottom nav shows: `<span class="material-symbols-outlined filled">home</span>` for the active tab (note `filled` class) vs outlined for inactive. The filled vs outlined visual is achieved via `font-variation-settings: 'FILL' 1` on the active icon. In Quasar's QRouteTab, an active-color gives the same visual hierarchy. The `filled` icon variant can be done inline on the active tab if needed.

---

## Open Questions

1. **Vocabulary Bank route placement**
   - What we know: Vocabulary Bank has bottom nav visible but no bottom nav tab. It's reachable from Profile or Progress.
   - What's unclear: Should it be under `/app/vocabulary` (in MainLayout) or needs its own path? Per the layout split above, it belongs in MainLayout since bottom nav is shown.
   - Recommendation: Place under `/app/vocabulary` in the MainLayout children group. The stub page just needs to exist for routing. Navigation to it will be wired in Phase 5.

2. **Quasar `dark: 'auto'` config key confirmed via docs but not directly via Context7**
   - What we know: Multiple official Quasar docs pages confirm `framework.config.dark: 'auto'` as valid configuration. The Dark Plugin page confirms `Dark.set('auto')` and `$q.dark.set('auto')` trigger system-preference detection.
   - What's unclear: Whether `dark: 'auto'` in `quasar.config.js` `framework.config` is exactly equivalent to calling `$q.dark.set('auto')` at boot time, or if a boot file call is also needed.
   - Recommendation: Set `dark: 'auto'` in `quasar.config.js`. This is the declarative approach and fires at framework init. The Dark Plugin docs confirm this is equivalent to calling `Dark.set('auto')`. No boot file call needed.

3. **`QTabsBar` vs `QFooter + QTabs`**
   - What we know: CONTEXT.md mentions "QTabsBar or QFooter + QTabs". `QTabsBar` is not a documented Quasar 2 component (it may refer to `QTabs` inside `QFooter`).
   - What's unclear: Whether `QTabsBar` is a renamed component or a typo.
   - Recommendation: Use `QFooter` + `QTabs` + `QRouteTab`. This is the documented Quasar 2 pattern. No `QTabsBar` component appears in Quasar 2 docs.

---

## Sources

### Primary (HIGH confidence)

- @quasar/extras 1.17.0 `node_modules` — confirmed `material-symbols-outlined` folder present with CSS and webfont
- quasar 2.18.6 `node_modules` — confirmed `icon-set/material-symbols-outlined.js` present
- https://quasar.dev/quasar-plugins/dark/ — `dark: 'auto'` config + `body--dark` class + `$q.dark.set('auto')`
- https://quasar.dev/style/color-palette/ — `framework.config.brand` structure + `--q-primary` CSS variable names
- https://quasar.dev/vue-components/tabs/ — `QRouteTab` + `to` prop + no-v-model guidance
- https://quasar.dev/layout/routing-with-layouts-and-pages/ — two-layout pattern with nested routes
- https://pinia.vuejs.org/core-concepts/ — setup store pattern, storeToRefs, acceptHMRUpdate

### Secondary (MEDIUM confidence)

- https://github.com/quasarframework/quasar/discussions/13473 — Material Symbols Outlined in Quasar, `sym_o_` prefix, extras string confirmed
- https://github.com/quasarframework/quasar/discussions/15233 — dark mode FOUC fix via inline CSS in index.html

### Tertiary (LOW confidence)

- Stitch HTML files (project source) — color tokens, border-radius scale, icon usage extracted directly from code; LOW only because Stitch is a code generation tool and its config may not perfectly reflect the final design intent, but cross-references with PROJECT.md confirmed.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from installed node_modules
- Architecture (two layouts): HIGH — official Quasar docs confirm this pattern
- Design tokens (brand config + CSS vars): HIGH — official Quasar color palette docs
- Dark mode (`dark: 'auto'`): HIGH — confirmed in official Dark Plugin docs
- Icon set (material-symbols-outlined): HIGH — confirmed in @quasar/extras 1.17.0 + Quasar discussions
- Pinia stores (composition style): HIGH — confirmed in official Pinia docs
- Pitfalls: MEDIUM — combination of official docs + community discussions

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (Quasar 2.x stable — unlikely to change in 30 days)
