# Phase 6: Firebase Auth & Infrastructure - Research

**Researched:** 2026-02-23
**Domain:** Firebase JS SDK v10, Firebase Auth, Firestore, Cloud Functions, Quasar boot system, Vue Router navigation guards
**Confidence:** HIGH (core patterns verified via official docs and Quasar docs; LOW for one area noted below)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Firebase SDK initialized via `src/boot/firebase.js` with env vars from `.env`/`.env.local` | Boot file pattern + Quasar env var handling documented in §Architecture Patterns |
| INFRA-02 | Firestore security rules from TRD deployed | Rules are already partially in `firestore.rules`; TRD rules need to replace current open rules; deployment via `firebase deploy --only firestore:rules` |
| INFRA-03 | Cloud Functions project scaffolded in `functions/` with Node.js 18, firebase-admin, @google/generative-ai | `functions/` already scaffolded with Node 24 (18 is deprecated); `@google/generative-ai` is deprecated — use `@google/genai` instead; documented in §State of the Art |
| AUTH-01 | Real Google Sign-In via Firebase Auth replaces mock sign-in in `LandingPage.vue` | signInWithPopup pattern documented; `handleSignIn()` replacement pattern in §Code Examples |
| AUTH-02 | Firestore `users/{userId}` document created on first sign-in with TRD schema | getDoc existence check + setDoc without merge pattern in §Code Examples |
| AUTH-03 | Auth state persists across page refreshes | Firebase Auth SDK handles token refresh automatically; persistence mode documented |
| AUTH-04 | Route guard redirects unauthenticated to `/`; authenticated + `onboardingCompleted==false` to `/onboarding` | beforeEach guard pattern with promise-wrapped auth check in §Code Examples |
| AUTH-05 | `useAuthStore` reflects real Firebase Auth state replacing mock values | Pinia store replacement pattern with `onAuthStateChanged` in §Code Examples |
</phase_requirements>

---

## Summary

This phase wires Firebase into an existing Quasar 2 + Vue 3 + Pinia app. The codebase already has a `functions/` directory scaffolded (Node 24, firebase-admin 13, firebase-functions 7), a `firebase.json` with Firestore and Functions config, and an open-dev `firestore.rules`. The front-end has no Firebase SDK installed yet — `firebase` package is absent from `package.json`.

The critical integration points are: (1) a `src/boot/firebase.js` that initializes the SDK and exports `auth`, `db` instances; (2) replacing the mock `useAuthStore` to subscribe to `onAuthStateChanged`; (3) a `src/boot/firebase-auth.js` (or inline in the firebase boot) that registers a `router.beforeEach` guard using a promise-wrapped auth check; and (4) a Firestore `createUserProfile` function called once on first sign-in. The existing `LandingPage.vue` only needs its `handleSignIn()` function replaced — the template/UI must not change.

Two important deviations from the requirements spec: (a) Node.js 18 is decommissioned for Cloud Functions as of October 2025 — the existing scaffold already uses Node 24 which is correct and should remain; (b) `@google/generative-ai` is deprecated as of November 2025 — use `@google/genai` for all Gemini integration.

**Primary recommendation:** Initialize Firebase in a single `src/boot/firebase.js` that exports `{ app, auth, db }`; subscribe to `onAuthStateChanged` inside a `src/boot/auth.js` that also registers the router guard; use the promise-wrapper pattern to resolve the race condition between router guards and async auth initialization.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase` | ^11.x (latest: ~12.9.0) | Firebase JS SDK — Auth, Firestore, Functions clients | Official Google SDK; modular tree-shaking |
| `firebase-admin` | ^13.6.0 (already in functions/) | Firebase Admin SDK for Cloud Functions | Already present; official server-side SDK |
| `firebase-functions` | ^7.0.0 (already in functions/) | Cloud Functions v2 triggers and configuration | Already present; v2 API required |
| `@google/genai` | ^1.x | Google Gemini API client | Replaces deprecated `@google/generative-ai`; GA as of 2025 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase-tools` (CLI) | global | Deploy rules, functions, emulators | Deploy-time only; not in package.json |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `firebase` (modular) | VueFire | VueFire adds composable bindings but adds bundle weight; not needed for this phase's auth-only scope |
| `signInWithPopup` | `signInWithRedirect` | Redirect is smoother on mobile/PWA but requires `getRedirectResult()` on app load and has known issues with installed PWAs; popup is simpler and reliable for this app |
| `@google/genai` | `@google/generative-ai` | Legacy package deprecated Nov 2025; no access to new features |

**Installation (front-end):**
```bash
npm install firebase
```

**Installation (Cloud Functions — already present, add Gemini):**
```bash
cd functions && npm install @google/genai
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── boot/
│   ├── firebase.js        # Firebase SDK init — exports { app, auth, db }
│   └── auth.js            # onAuthStateChanged listener + router guard registration
├── stores/
│   └── auth.js            # Replace mock with real Firebase Auth state
└── services/
    └── userProfile.js     # createUserProfile() — Firestore write on first sign-in

functions/
├── index.js               # Cloud Function exports (scaffold only this phase)
└── package.json           # Already present; add @google/genai
```

### Pattern 1: Firebase Boot File (SDK Initialization)

**What:** Single boot file initializes Firebase app and exports service instances. Other files import from this file, never call `initializeApp()` again.
**When to use:** Always. One `initializeApp()` call per app lifetime.

```javascript
// src/boot/firebase.js
// Source: https://firebase.google.com/docs/web/setup
import { defineBoot } from '#q-app/wrappers'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY,
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.FIREBASE_PROJECT_ID,
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.FIREBASE_APP_ID
}

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

// Connect emulators in development
// Source: https://firebase.google.com/docs/emulator-suite/connect_auth
if (process.env.DEV) {
  const { connectAuthEmulator }      = await import('firebase/auth')
  const { connectFirestoreEmulator } = await import('firebase/firestore')
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
}

export { app, auth, db }

export default defineBoot(() => {
  // Firebase is initialized by module-level code above.
  // Boot function intentionally empty — exports are what matters.
})
```

**Note on env vars:** Quasar with `@quasar/app-vite` loads `.env` and `.env.local` files automatically. Variables are accessed via `process.env.VARIABLE_NAME` without a prefix requirement. The `.env.local` file (git-ignored) is the correct location for Firebase API keys.

**.env.local format:**
```
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
```

### Pattern 2: Auth Boot File (State Listener + Router Guard)

**What:** Separate boot file subscribes to Firebase auth state and registers `router.beforeEach` guard. Runs after `firebase.js` boot file.
**When to use:** This pattern resolves the race condition — the guard awaits `getCurrentUser()` (a promise that resolves on first auth state emission) before allowing navigation.

```javascript
// src/boot/auth.js
// Source: https://gaute.dev/dev-blog/vue-router-firebase-auth
import { defineBoot } from '#q-app/wrappers'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'

// Wraps onAuthStateChanged in a one-time Promise.
// Resolves with current user (or null) as soon as Firebase
// emits the initial auth state — avoids the undefined-user race condition.
function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => { unsubscribe(); resolve(user) },
      reject
    )
  })
}

export default defineBoot(({ router }) => {
  // Subscribe Pinia store to auth state changes (persists for app lifetime)
  onAuthStateChanged(auth, (user) => {
    const authStore = useAuthStore()
    authStore.setUser(user)
  })

  // Route guard — async so it can await the initial auth state
  router.beforeEach(async (to) => {
    const isPublicRoute = to.name === 'landing'

    // Await the initial auth state before checking
    const user = await getCurrentUser()

    if (!user && !isPublicRoute) {
      // Unauthenticated — redirect to landing
      return { name: 'landing' }
    }

    if (user && to.name === 'landing') {
      // Already authenticated — skip landing page
      // Onboarding check handled after profile is loaded
      return { name: 'dashboard' }
    }
  })
})
```

**quasar.config.js boot array order matters:**
```javascript
boot: ['firebase', 'auth']  // firebase MUST be first
```

### Pattern 3: Pinia Auth Store (Real Firebase State)

**What:** Replace mock store with real Firebase Auth user state. The store is populated by the `auth.js` boot file via `setUser()`.

```javascript
// src/stores/auth.js
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { auth } from 'boot/firebase'
import { createUserProfile } from 'src/services/userProfile'

export const useAuthStore = defineStore('auth', () => {
  // State
  const uid              = ref(null)
  const email            = ref(null)
  const displayName      = ref(null)
  const photoURL         = ref(null)
  const onboardingCompleted = ref(false)
  const isLoading        = ref(true)  // true until first onAuthStateChanged fires

  // Getters
  const isAuthenticated = computed(() => uid.value !== null)

  // Called by auth.js boot file on every onAuthStateChanged emission
  function setUser(firebaseUser) {
    if (firebaseUser) {
      uid.value         = firebaseUser.uid
      email.value       = firebaseUser.email
      displayName.value = firebaseUser.displayName
      photoURL.value    = firebaseUser.photoURL
    } else {
      uid.value         = null
      email.value       = null
      displayName.value = null
      photoURL.value    = null
    }
    isLoading.value = false
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result   = await signInWithPopup(auth, provider)
    // Create Firestore profile on first sign-in
    await createUserProfile(result.user)
  }

  async function signOutUser() {
    await signOut(auth)
  }

  return {
    uid, email, displayName, photoURL, onboardingCompleted, isLoading,
    isAuthenticated,
    setUser, signInWithGoogle, signOutUser
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
```

### Pattern 4: First-Time User Firestore Document

**What:** Check if user doc exists; create it with TRD schema on first sign-in only.
**When to use:** Called inside `signInWithGoogle()` after successful authentication.

```javascript
// src/services/userProfile.js
// Source: https://modularfirebase.web.app/common-use-cases/firestore/
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

export async function createUserProfile(firebaseUser) {
  const userRef = doc(db, 'users', firebaseUser.uid)
  const snap    = await getDoc(userRef)

  if (snap.exists()) {
    // Profile already exists — don't overwrite
    return
  }

  // First sign-in — create with TRD schema (merge: false is default)
  await setDoc(userRef, {
    email:                  firebaseUser.email,
    displayName:            firebaseUser.displayName,
    photoURL:               firebaseUser.photoURL,
    currentLevel:           'B1',
    levelProgress:          0,
    dailyStreak:            0,
    lastSessionDate:        null,
    totalVocabularyWords:   0,
    totalHoursPracticed:    0,
    totalSessionsCompleted: 0,
    averageScore:           0,
    onboardingCompleted:    false,
    freeSessionUsed:        false,
    subscriptionStatus:     'none',
    subscriptionExpiresAt:  null,
    createdAt:              serverTimestamp(),
    updatedAt:              serverTimestamp()
  })
}
```

### Pattern 5: LandingPage.vue Sign-In Replacement

**What:** Replace `authStore.mockSignIn()` call with real Google sign-in. Template does NOT change.

```javascript
// src/pages/LandingPage.vue <script setup> replacement
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const router    = useRouter()
const authStore = useAuthStore()

async function handleSignIn() {
  await authStore.signInWithGoogle()
  // Router guard will handle redirect based on onboardingCompleted
  // but we also push explicitly for first-time users
  router.push({ name: 'onboarding' })
}
```

### Pattern 6: Cloud Functions Scaffold (Node 24 + defineSecret)

**What:** The existing `functions/index.js` scaffold remains. Add `@google/genai` dependency and set up secret parameters for Phase 8 (AI conversation). This phase only scaffolds.

```javascript
// functions/index.js (scaffold — no active functions this phase)
const { setGlobalOptions } = require('firebase-functions')
const { defineSecret }     = require('firebase-functions/params')

setGlobalOptions({ maxInstances: 10, region: 'africa-south1' })

// Secrets declared here — set values via: firebase functions:secrets:set GEMINI_API_KEY
const geminiApiKey = defineSecret('GEMINI_API_KEY')

// Functions implementing these secrets will be added in Phase 8
// exports.myFunction = onCall({ secrets: [geminiApiKey] }, async (request) => { ... })
```

### Pattern 7: Firestore Security Rules Deployment

**What:** Replace the permissive dev rules with TRD production rules. Deploy via Firebase CLI.

```bash
# Deploy only Firestore rules (not functions)
firebase deploy --only firestore:rules
```

The `firestore.rules` file content must be replaced with the exact TRD rules provided in the requirements (see §Code Examples — Firestore Rules).

### Anti-Patterns to Avoid

- **Calling `initializeApp()` multiple times:** Will throw `"Firebase App named '[DEFAULT]' already exists"`. Always import `{ auth, db }` from `boot/firebase.js`, never call `initializeApp()` in stores or components.
- **Using `auth.currentUser` synchronously in guards:** Returns `null` before SDK has initialized. Always use the promise-wrapper `getCurrentUser()` pattern.
- **Registering `router.beforeEach` in the wrong boot file order:** `firebase.js` must be listed before `auth.js` in `quasar.config.js boot: []` array.
- **Using `signInWithRedirect` without `getRedirectResult` on app load:** If redirect is chosen over popup, `getRedirectResult(auth)` must be called on every page load to capture the result. For this app, popup is simpler.
- **Storing Firebase user object in Pinia directly:** Firebase user objects are not plain-serializable. Extract only the needed fields (uid, email, displayName, photoURL).
- **Using `setDoc` with `{ merge: true }` for first-time creation:** Silently succeeds even if document exists, could overwrite fields from another source. Use `getDoc` check + `setDoc` without merge for deterministic first-time creation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token refresh | Manual JWT refresh logic | Firebase Auth SDK | SDK handles token refresh, expiry, and re-authentication automatically |
| Auth persistence across refreshes | LocalStorage session save/restore | Firebase Auth SDK (default persistence is LOCAL) | SDK persists auth state in IndexedDB automatically |
| Google OAuth flow | Custom OAuth 2.0 implementation | `signInWithPopup` + `GoogleAuthProvider` | OAuth PKCE, nonce, token exchange handled by SDK |
| Server timestamps | `new Date()` in client code | `serverTimestamp()` from Firestore | Client clocks are unreliable; server timestamps are authoritative |
| Secure secret storage (functions) | Environment variables in `functions/.env` | `defineSecret()` + Firebase Secret Manager | Secrets Manager encrypts at rest; env file approach is less secure |

**Key insight:** Firebase Auth SDK manages the entire OAuth lifecycle and token storage. Any custom auth state management risks security holes or stale state bugs.

---

## Common Pitfalls

### Pitfall 1: Router Guard Fires Before Auth State is Known

**What goes wrong:** On hard page refresh, `router.beforeEach` fires while `auth.currentUser` is still `null` (SDK hasn't initialized). Guard incorrectly redirects authenticated users to landing.
**Why it happens:** Firebase Auth initializes asynchronously. `auth.currentUser` is `null` until the first `onAuthStateChanged` emission.
**How to avoid:** Always wrap the auth check in `getCurrentUser()` — a Promise that resolves after the first `onAuthStateChanged` fires. The guard `await`s this promise before making redirect decisions.
**Warning signs:** App works after navigating but not on hard refresh/F5.

### Pitfall 2: Multiple Firebase App Instances

**What goes wrong:** `FirebaseError: Firebase App named '[DEFAULT]' already exists` in console, or stale auth state.
**Why it happens:** `initializeApp()` called more than once — common in HMR dev reloads or if firebase config is imported in multiple places.
**How to avoid:** Call `initializeApp()` only in `src/boot/firebase.js`. All other files import `{ auth, db }` from that file. Do NOT call `initializeApp()` in stores, components, or router files.
**Warning signs:** Error in console; auth operations fail silently.

### Pitfall 3: Quasar boot: [] Array Order

**What goes wrong:** `auth.js` boot file imports `{ auth }` from `boot/firebase.js`, but `firebase.js` hasn't executed yet — `auth` is `undefined`.
**Why it happens:** Quasar executes boot files in the order listed in `quasar.config.js`.
**How to avoid:** Always list `'firebase'` before `'auth'` in the `boot: []` array.
**Warning signs:** `TypeError: Cannot read properties of undefined` on `auth`.

### Pitfall 4: signInWithPopup Blocked on Mobile

**What goes wrong:** Google sign-in popup is blocked by mobile browsers (especially in PWA installed mode or older iOS Safari).
**Why it happens:** Browsers block popups not triggered directly by a user gesture; any async delay between click and `signInWithPopup()` call causes blocking.
**How to avoid:** Call `signInWithPopup()` synchronously in the click handler — not after any `await`. Do not add any async logic before the popup call.
**Warning signs:** Sign-in works on desktop but silently fails on mobile.

### Pitfall 5: Firestore Rules Blocking First-Time User Creation

**What goes wrong:** `createUserProfile()` fails with permission-denied even though TRD rules allow `create` for authenticated owners.
**Why it happens:** The `create` rule requires `request.auth.uid == userId`. If the Firestore write uses the wrong path (e.g., `users/wrongId`) or the rules haven't been deployed, it fails silently.
**How to avoid:** Always use `firebaseUser.uid` as the document ID. Deploy rules before testing. Test rules locally with emulator.
**Warning signs:** First sign-in appears to succeed but no Firestore document is created; subsequent sign-ins appear broken.

### Pitfall 6: Node.js Version Mismatch in Functions

**What goes wrong:** `firebase deploy --only functions` fails with "Node.js 18 is no longer supported."
**Why it happens:** The requirement spec says Node.js 18, but Node 18 was decommissioned for Cloud Functions in October 2025.
**How to avoid:** The existing `functions/package.json` already uses `"node": "24"` — keep it. Do NOT downgrade to 18.
**Warning signs:** Deployment error mentioning deprecated runtime.

### Pitfall 7: process.env Variables Undefined at Runtime

**What goes wrong:** `firebaseConfig.apiKey` is `undefined`; Firebase throws `FirebaseError: apiKey not set`.
**Why it happens:** Quasar replaces `process.env.X` at build time via static analysis. Dynamic access (`process.env['X']` or destructuring) does not get replaced.
**How to avoid:** Always access env vars with static dot notation: `process.env.FIREBASE_API_KEY`. Never destructure `process.env`.
**Warning signs:** Works in dev but fails in production build; or `undefined` visible in browser devtools.

---

## Code Examples

### Complete Firestore Security Rules (from TRD)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return request.auth.uid == userId; }
    function hasActiveSubscription() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.subscriptionStatus == 'active';
    }
    match /users/{userId} {
      allow read:   if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false;
    }
    match /sessions/{sessionId} {
      allow read:   if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid
                      && (request.resource.data.sessionNumber == 1 || hasActiveSubscription());
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if false;
    }
    match /vocabulary/{userId}/words/{wordId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    match /leaderboard/{weekId}/users/{userId} {
      allow read:  if isAuthenticated();
      allow write: if false;
    }
    match /subscriptions/{userId} {
      allow read:  if isAuthenticated() && isOwner(userId);
      allow write: if false;
    }
    match /system_config/{doc} {
      allow read:  if true;
      allow write: if false;
    }
  }
}
```

### Google Sign-In (signInWithPopup)

```javascript
// Source: https://firebase.google.com/docs/auth/web/google-signin
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from 'boot/firebase'

const provider = new GoogleAuthProvider()
const result   = await signInWithPopup(auth, provider)
const user     = result.user
// user.uid, user.email, user.displayName, user.photoURL
```

### Check and Create User Profile

```javascript
// Source: https://modularfirebase.web.app/common-use-cases/firestore/
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

const userRef = doc(db, 'users', user.uid)
const snap    = await getDoc(userRef)

if (!snap.exists()) {
  await setDoc(userRef, {
    email: user.email,
    displayName: user.displayName,
    // ... full TRD schema
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  // Note: setDoc without { merge: true } is the default — creates new doc
}
```

### Auth State Observer (Pinia)

```javascript
// Source: https://github.com/vuejs/pinia/discussions/1053
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from 'boot/firebase'

// In boot/auth.js — called once at app startup
onAuthStateChanged(auth, (user) => {
  const authStore = useAuthStore()
  authStore.setUser(user)  // sets all fields + isLoading = false
})
```

### Promise-Wrapped getCurrentUser (Router Guard)

```javascript
// Source: https://gaute.dev/dev-blog/vue-router-firebase-auth
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from 'boot/firebase'

function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => { unsubscribe(); resolve(user) },
      reject
    )
  })
}

router.beforeEach(async (to) => {
  const publicRoutes = ['landing']
  const user = await getCurrentUser()

  if (!user && !publicRoutes.includes(to.name)) {
    return { name: 'landing' }
  }

  if (user && to.name === 'landing') {
    return { name: 'dashboard' }
  }

  // Onboarding guard: fetch profile to check onboardingCompleted
  // (or store the flag in useAuthStore after fetching profile)
  if (user && to.name !== 'onboarding') {
    const authStore = useAuthStore()
    if (!authStore.onboardingCompleted) {
      return { name: 'onboarding' }
    }
  }
})
```

### Emulator Connections

```javascript
// Source: https://firebase.google.com/docs/emulator-suite/connect_auth
// Source: https://firebase.google.com/docs/emulator-suite/connect_firestore
import { connectAuthEmulator }      from 'firebase/auth'
import { connectFirestoreEmulator } from 'firebase/firestore'

if (process.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099')   // Auth emulator default port
  connectFirestoreEmulator(db, 'localhost', 8080)      // Firestore emulator default port
}
```

### defineSecret in Cloud Functions v2

```javascript
// functions/index.js
const { defineSecret } = require('firebase-functions/params')

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY')

// Set value via CLI: firebase functions:secrets:set GEMINI_API_KEY
// Access in function: GEMINI_API_KEY.value()
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase SDK v8 (namespaced `firebase.auth()`) | Firebase SDK v10+ (modular `getAuth()`, `signInWithPopup()`) | 2021 (v9) | Tree-shaking; smaller bundles; different import syntax |
| `functions.config()` for Cloud Functions secrets | `defineSecret()` / Firebase Secret Manager | 2022 (Functions v2) | Secrets encrypted at rest; better security posture |
| `@google/generative-ai` npm package | `@google/genai` npm package | Nov 2025 | Legacy deprecated; new package required for GA features |
| Node.js 18 for Cloud Functions | Node.js 20/22/24 | Oct 2025 (18 decommissioned) | Node 18 will be rejected at deploy time |
| `firebase.initializeApp()` global | `initializeApp()` + `getApp()` modular | 2021 (v9) | Must pass app instance to `getAuth(app)`, `getFirestore(app)` |

**Deprecated/outdated:**
- `@google/generative-ai`: Deprecated November 30, 2025. Use `@google/genai` instead.
- Node.js 18 Cloud Functions runtime: Decommissioned October 2025. The existing `functions/package.json` already uses Node 24 — do not change it.
- `functions.config()`: Replaced by `defineSecret()` / `defineParam()` in v2 Functions. `firebase.json` already has `"disallowLegacyRuntimeConfig": true`.
- `signInWithRedirect` (for this app): Still valid but requires `getRedirectResult()` on every app load. Popup is simpler for this use case.

---

## Open Questions

1. **`onboardingCompleted` flag source in router guard**
   - What we know: The router guard must redirect `user && onboardingCompleted==false` to `/onboarding`. The flag lives in Firestore `users/{uid}.onboardingCompleted`.
   - What's unclear: The router guard runs before the Pinia store has loaded the Firestore profile. Options: (a) fetch the Firestore doc inside the guard directly, (b) load profile in the `auth.js` boot after sign-in, (c) store `onboardingCompleted` in the Firebase Auth custom claims.
   - Recommendation: Option (b) — after `onAuthStateChanged` confirms a user, fetch the Firestore profile and store `onboardingCompleted` in `useAuthStore`. The guard then reads from the store. This adds ~1 Firestore read per app start but avoids custom claims complexity. The `isLoading` flag prevents premature guard evaluation.

2. **Emulator configuration for local development**
   - What we know: `firebase.json` does not have an `emulators` config block yet. Auth emulator runs on port 9099, Firestore on 8080.
   - What's unclear: Whether the team wants emulators configured this phase or left for later.
   - Recommendation: Add emulators block to `firebase.json` and connect in boot file conditionally on `process.env.DEV`. This is low-cost and prevents accidental dev writes to production Firestore.

3. **`firebase.json` missing `.firebaserc`**
   - What we know: No `.firebaserc` file exists in the repo. Firebase CLI needs this to know which Firebase project to deploy to.
   - What's unclear: The project ID is set in `firebase.json` (`firestore.database: "(default)"`), but `firebase deploy` typically requires `.firebaserc` with `projects.default`.
   - Recommendation: Run `firebase use --add` to create `.firebaserc` pointing to the production Firebase project. This is a one-time setup step before any deployment can work. Add `.firebaserc` to git (it's not secret).

4. **`storageBucket` and `messagingSenderId` env vars**
   - What we know: TRD INFRA-01 lists `apiKey`, `authDomain`, `projectId`, `appId`. The full Firebase config also includes `storageBucket` and `messagingSenderId`.
   - What's unclear: Whether the phase should include the full config or only the 4 specified fields.
   - Recommendation: Include all 6 standard Firebase config fields. Missing `storageBucket` would break Storage (later phases); missing `messagingSenderId` breaks messaging. Cost is zero.

---

## Sources

### Primary (HIGH confidence)
- [Firebase Web Setup Docs](https://firebase.google.com/docs/web/setup) — `initializeApp`, `getFirestore`, `getAuth` modular import pattern
- [Firebase Auth Emulator Docs](https://firebase.google.com/docs/emulator-suite/connect_auth) — `connectAuthEmulator` import and usage
- [Firebase Firestore Emulator Docs](https://firebase.google.com/docs/emulator-suite/connect_firestore) — `connectFirestoreEmulator` import and usage
- [Modular Firebase Docs Site](https://modularfirebase.web.app/common-use-cases/firestore/) — `getDoc`, `setDoc`, `serverTimestamp` patterns
- [Quasar Boot Files Docs](https://quasar.dev/quasar-cli-vite/boot-files) — `defineBoot`, async boot, router injection
- [Quasar process.env Docs](https://quasar.dev/quasar-cli-vite/handling-process-env/) — `.env.local` loading, `process.env` access pattern
- [Quasar env variables Discussion #15847](https://github.com/quasarframework/quasar/discussions/15847) — Confirmed: use `process.env`, not `import.meta.env`
- [Gemini API Libraries Docs](https://ai.google.dev/gemini-api/docs/libraries) — `@google/genai` is the current GA package; `@google/generative-ai` is deprecated
- [Pinia Discussion #1053](https://github.com/vuejs/pinia/discussions/1053) — `onAuthStateChanged` with Pinia store pattern

### Secondary (MEDIUM confidence)
- [Vue Router + Firebase Auth Guard — Gaute Meek Olsen](https://gaute.dev/dev-blog/vue-router-firebase-auth) — `getCurrentUser()` promise-wrapper pattern; verified against Vue Router docs async guard behavior
- [Firebase signInWithRedirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices) — Confirmed redirect has PWA installed-mode issues; popup is safer choice
- [Quasar boot + Firebase auth discussion #8891](https://github.com/quasarframework/quasar/discussions/8891) — Boot file approach for auth initialization confirmed working

### Tertiary (LOW confidence)
- WebSearch results about Node 18 deprecation — confirmed by Firebase Cloud Functions release notes (cross-referenced)
- `functions/package.json` already uses Node 24 — observed directly in codebase, consistent with Firebase deprecation timeline

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Firebase SDK versions confirmed via npm; Gemini deprecation confirmed via official Google AI docs
- Boot file pattern: HIGH — Verified against Quasar official docs and Firebase official docs
- Auth store pattern: HIGH — Verified against Pinia discussion and Vue 3 Composition API patterns
- Router guard pattern: HIGH — Verified against Vue Router docs and Firebase community reference implementation
- Env vars: MEDIUM — Quasar docs confirm `process.env` approach and `.env.local` loading; exact behavior with prefix-less vars confirmed by maintainer discussion but not a dedicated docs page
- Cloud Functions scaffold: HIGH — Existing `functions/` scaffold examined directly; `defineSecret` pattern from official docs
- Node.js version: HIGH — Node 18 decommission confirmed; existing package.json already on Node 24

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (Firebase SDK is stable; Quasar boot system is stable)
