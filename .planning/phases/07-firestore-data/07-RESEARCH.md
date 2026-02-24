# Phase 7: Firestore Data Layer - Research

**Researched:** 2026-02-24
**Domain:** Firebase Firestore Web SDK v12 — data layer, offline persistence, Pinia store integration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | `useProfileStore` reads user document from Firestore `users/{userId}` on auth — replaces all hardcoded mock data (streak, level, session count, vocab count) | `fetchUserProfile` service already exists in Phase 6; store needs reactive fields wired to Firestore data, triggered from `boot/auth.js` `onAuthStateChanged` |
| DATA-02 | DashboardPage displays real stats (`dailyStreak`, `totalSessionsCompleted`, `totalVocabularyWords`) from Firestore user document | `useProfileStore` must expose these exact field names; DashboardPage already imports `useProfileStore`, rename binding sites |
| DATA-03 | Onboarding completion writes initial user document to Firestore (`currentLevel`, `levelProgress: 0`, `onboardingCompleted: true`, `createdAt`, `freeSessionUsed: false`) | `createUserProfile` in Phase 6 already writes on first sign-in with all fields; `handleComplete` in OnboardingPage must also call `updateDoc` to set `onboardingCompleted: true` since the profile already exists by the time onboarding finishes |
| DATA-04 | ProgressPage reads real user progress (`levelProgress`, `averageScore`, `totalHoursPracticed`, `currentLevel`) from Firestore | Same `useProfileStore` as DATA-01; ProgressPage currently has no store import — needs wiring |
| DATA-05 | VocabularyPage reads words from `vocabulary/{userId}/words` subcollection in Firestore — replaces hardcoded word array | New `useVocabularyStore` with `getDocs` on subcollection, triggered after auth; or a dedicated service function |
| DATA-06 | User can save a word to vocabulary bank from FeedbackPage — writes to `vocabulary/{userId}/words/{wordId}` in Firestore | `addDoc` or `setDoc` to `vocabulary/{uid}/words/{autoId}` with TRD schema; FeedbackPage vocabulary tab needs a "Save" button/action |
| DATA-07 | Firestore offline persistence is enabled via `enableIndexedDbPersistence()` — dashboard data is viewable offline from cache | `enableIndexedDbPersistence` is **deprecated** in firebase v12; replacement is `initializeFirestore` + `persistentLocalCache`; must replace `getFirestore()` in `boot/firebase.js` |
| DATA-08 | `useSessionStore` syncs active session metadata to Firestore `sessions/{sessionId}` document (topic, userId, userLevel, createdAt) | `addDoc` to `sessions` collection in `startSession`; store the returned doc ref for subsequent updates |
</phase_requirements>

---

## Summary

Phase 7 removes all mock/hardcoded data and wires every Pinia store and page to real Firestore reads and writes. The Firebase SDK is already initialized (`boot/firebase.js`) and the `userProfile` service already provides `fetchUserProfile` and `createUserProfile`. What remains is: (1) expanding `useProfileStore` to hold and expose real Firestore fields, (2) triggering that load from `boot/auth.js` after auth resolves, (3) creating a vocabulary store and service, (4) adding a `startSession` Firestore write in `useSessionStore`, (5) updating OnboardingPage's `handleComplete` to write `onboardingCompleted: true`, and (6) enabling offline persistence properly using the non-deprecated API.

The most important technical decision is the **offline persistence migration**. The TRD specifies `enableIndexedDbPersistence()` but this function is formally `@deprecated` in the installed firebase@12.9.0 SDK (confirmed in the TypeScript type definitions at `node_modules/@firebase/firestore/dist/index.d.ts` line 671). The replacement requires switching from `getFirestore(app)` to `initializeFirestore(app, { localCache: persistentLocalCache() })` in `boot/firebase.js`. This is a one-line change but must happen before `connectFirestoreEmulator` is called — order matters.

The second key decision is **architecture for profile data flow**: Phase 6 already calls `fetchUserProfile(uid)` inside `boot/auth.js` and passes `onboardingCompleted` to `useAuthStore`. Phase 7 must extend that flow so the full profile data (streak, level, stats) also flows into `useProfileStore`. The cleanest approach is to expand `useProfileStore` with reactive `ref` fields and call a `setProfile(data)` action from `boot/auth.js` after the `fetchUserProfile` resolves — following the exact same pattern already used for `useAuthStore.setUser()`.

**Primary recommendation:** Wire stores through the existing `boot/auth.js` onAuthStateChanged subscriber, use `getDoc`/`updateDoc`/`addDoc` for imperative writes, use `initializeFirestore` + `persistentLocalCache` (not deprecated `enableIndexedDbPersistence`) for offline support.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/firestore | ^12.9.0 (installed) | Firestore reads, writes, offline persistence | Already installed; modular tree-shakeable API |
| pinia | ^3.0.1 (installed) | Reactive state stores for all data | Already used for auth store pattern |
| vue | ^3.5.22 (installed) | Reactivity primitives (`ref`, `computed`, `watch`) | Composition API — works in Pinia setup stores |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| firebase/firestore `increment` | built-in | Atomic counter updates for `totalSessionsCompleted`, `totalVocabularyWords` | Every stat increment to prevent lost updates on concurrent writes |
| firebase/firestore `serverTimestamp` | built-in | Server-side timestamps for `createdAt`, `updatedAt`, `savedAt` | All timestamp fields — avoids client clock drift |
| firebase/firestore `writeBatch` | built-in | Atomic multi-document writes | Only needed if DATA-08 must also update `users/{uid}` stats on session start (defer to Phase 9) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual `getDoc` in stores | VueFire `useDocument()`/`useCollection()` | VueFire adds real-time subscriptions automatically but is an additional dependency not in the TRD; manual `getDoc` is simpler and sufficient for this phase |
| `onSnapshot` real-time listeners | One-time `getDoc` | `onSnapshot` keeps data live but adds unsubscribe lifecycle complexity in Pinia stores; `getDoc` on auth + on demand is sufficient for MVP |
| `addDoc` for vocab words | `setDoc` with custom ID | `addDoc` auto-generates ID which is fine for vocabulary; `setDoc` needed if deduplication by word is required (out of scope for this phase) |

**Installation:** No new packages needed — firebase@12.9.0 already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── boot/
│   ├── firebase.js         # CHANGE: getFirestore → initializeFirestore + persistentLocalCache
│   └── auth.js             # CHANGE: also call profileStore.setProfile() after fetchUserProfile
├── stores/
│   ├── profile.js          # REPLACE: mock refs → real Firestore refs + setProfile() action
│   ├── session.js          # CHANGE: add sessionId ref + Firestore write in startSession()
│   └── vocabulary.js       # NEW: holds words array, loadWords(), saveWord() actions
├── services/
│   ├── userProfile.js      # EXISTING: fetchUserProfile, createUserProfile (no changes needed)
│   └── vocabulary.js       # NEW: loadVocabularyWords(uid), saveVocabularyWord(uid, wordData)
└── pages/
    ├── OnboardingPage.vue  # CHANGE: handleComplete() writes onboardingCompleted: true to Firestore
    ├── DashboardPage.vue   # CHANGE: bind to profile store's real field names
    ├── ProgressPage.vue    # CHANGE: import useProfileStore, bind real fields
    ├── VocabularyPage.vue  # CHANGE: import useVocabularyStore, replace hardcoded array
    └── FeedbackPage.vue    # CHANGE: vocabulary tab gets "Save" button wired to saveWord()
```

### Pattern 1: Offline Persistence — `initializeFirestore` replaces `getFirestore`

**What:** `enableIndexedDbPersistence()` is deprecated in firebase v12. The modern API configures persistence at initialization time via `initializeFirestore()`.

**When to use:** Any app needing offline cache. Must be called ONCE, before `connectFirestoreEmulator`.

**Example:**
```javascript
// Source: firebase.google.com/docs/firestore/manage-data/enable-offline
// + confirmed in node_modules/@firebase/firestore/dist/index.d.ts line 1539
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore'

// REPLACE: const db = getFirestore(app)
// WITH:
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(undefined)  // single-tab for PWA
  })
})

// Emulator connection AFTER initializeFirestore — order is required
if (process.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
```

**Why single-tab:** This is a mobile PWA. `persistentMultipleTabManager` is for multi-tab desktop web apps. `persistentSingleTabManager` is the correct choice.

### Pattern 2: Store Population from Auth Boot

**What:** Profile data flows from Firestore → `useProfileStore` via the existing `boot/auth.js` onAuthStateChanged subscriber. Follows the same pattern as `setUser` + `setOnboardingCompleted` in Phase 6.

**Example:**
```javascript
// src/boot/auth.js — extend the existing onAuthStateChanged subscriber
import { useProfileStore } from 'stores/profile'  // add this import

onAuthStateChanged(auth, async (user) => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()   // add
  authStore.setUser(user)

  if (user) {
    const profile = await fetchUserProfile(user.uid)
    if (profile) {
      authStore.setOnboardingCompleted(profile.onboardingCompleted ?? false)
      profileStore.setProfile(profile)   // add — populates all stats
    }
  } else {
    profileStore.reset()   // clear on sign-out
  }
})
```

### Pattern 3: Expanded `useProfileStore` — Real Fields

**What:** Replace mock `ref` values with real Firestore field names. The `setProfile(data)` action takes the raw Firestore document data.

**Example:**
```javascript
// src/stores/profile.js — replaces the existing mock store
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  // Fields matching TRD users/{userId} schema
  const displayName           = ref(null)
  const currentLevel          = ref(null)       // 'B1', 'B2', etc.
  const levelProgress         = ref(0)          // 0-100
  const dailyStreak           = ref(0)
  const totalSessionsCompleted = ref(0)
  const totalVocabularyWords  = ref(0)
  const averageScore          = ref(0)
  const totalHoursPracticed   = ref(0)          // stored as minutes in Firestore

  function setProfile(data) {
    displayName.value            = data.displayName          ?? null
    currentLevel.value           = data.currentLevel         ?? null
    levelProgress.value          = data.levelProgress        ?? 0
    dailyStreak.value            = data.dailyStreak          ?? 0
    totalSessionsCompleted.value = data.totalSessionsCompleted ?? 0
    totalVocabularyWords.value   = data.totalVocabularyWords ?? 0
    averageScore.value           = data.averageScore         ?? 0
    totalHoursPracticed.value    = data.totalHoursPracticed  ?? 0
  }

  function reset() {
    displayName.value = null
    currentLevel.value = null
    levelProgress.value = 0
    dailyStreak.value = 0
    totalSessionsCompleted.value = 0
    totalVocabularyWords.value = 0
    averageScore.value = 0
    totalHoursPracticed.value = 0
  }

  return {
    displayName, currentLevel, levelProgress, dailyStreak,
    totalSessionsCompleted, totalVocabularyWords, averageScore, totalHoursPracticed,
    setProfile, reset
  }
})
```

### Pattern 4: Onboarding Completion Write

**What:** `handleComplete` in OnboardingPage currently only calls `authStore.completeOnboarding()` (local state). It must also write `onboardingCompleted: true` to Firestore.

**Critical detail:** `createUserProfile` (called during `signInWithGoogle`) already writes the initial profile with `onboardingCompleted: false`. So `handleComplete` must use `updateDoc` (not `setDoc`) to flip the flag.

**Example:**
```javascript
// src/pages/OnboardingPage.vue — handleComplete()
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'

async function handleComplete() {
  const authStore = useAuthStore()
  const userRef = doc(db, 'users', authStore.uid)
  await updateDoc(userRef, {
    onboardingCompleted: true,
    currentLevel: 'B1',         // TRD DATA-03 specifies this
    levelProgress: 0,
    freeSessionUsed: false,
    updatedAt: serverTimestamp()
  })
  authStore.completeOnboarding()   // keep local state in sync
  router.push({ name: 'dashboard' })
}
```

### Pattern 5: Vocabulary Subcollection — Read and Write

**What:** `vocabulary/{userId}/words` is a subcollection. Path for reference: `collection(db, 'vocabulary', uid, 'words')`.

**Read all words:**
```javascript
// src/services/vocabulary.js
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

export async function loadVocabularyWords(uid) {
  const wordsRef = collection(db, 'vocabulary', uid, 'words')
  const snap = await getDocs(wordsRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function saveVocabularyWord(uid, wordData) {
  const wordsRef = collection(db, 'vocabulary', uid, 'words')
  await addDoc(wordsRef, {
    word:             wordData.word,
    definition:       wordData.definition,
    exampleSentence:  wordData.exampleSentence ?? wordData.example ?? '',
    sourceSessionId:  wordData.sourceSessionId ?? null,
    timesEncountered: 1,
    savedAt:          serverTimestamp(),
    lastReviewedAt:   null
  })
}
```

**Write via `addDoc`:** `addDoc` auto-generates the `{wordId}` — correct for vocabulary entries where we don't have a meaningful natural key.

### Pattern 6: Session Firestore Write (DATA-08)

**What:** `useSessionStore.startSession()` must write a document to `sessions/{autoId}` with the metadata fields specified by DATA-08. Store the returned `DocumentReference` for later updates.

**Example:**
```javascript
// src/stores/session.js — extend startSession
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'
import { useProfileStore } from 'stores/profile'

const sessionDocRef = ref(null)  // holds DocumentReference for later updates

async function startSession(topic = '') {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  isActive.value = true
  durationSeconds.value = 0
  mistakeCount.value = 0
  overallScore.value = null

  // Write session metadata to Firestore
  sessionDocRef.value = await addDoc(collection(db, 'sessions'), {
    userId:    authStore.uid,
    topic:     topic,
    userLevel: profileStore.currentLevel ?? 'B1',
    createdAt: serverTimestamp()
  })
}
```

**Note:** DATA-08 only specifies `topic, userId, userLevel, createdAt`. Additional session fields (`transcript`, `mistakes`, `scores`) are written by Phase 9 (session scoring). Keep the DATA-08 write minimal.

### Anti-Patterns to Avoid

- **Calling `enableIndexedDbPersistence()` directly:** It still runs but is deprecated; will be removed in a future major release. Use `initializeFirestore` + `persistentLocalCache` instead.
- **Calling `initializeFirestore()` after `getFirestore()`:** Cannot call both for the same app instance. Pick one. Switch `boot/firebase.js` from `getFirestore` to `initializeFirestore` — this is the only place `db` is created.
- **Reading Firestore data inside Vue components:** Put all Firestore reads in stores or services. Components bind to store state only. Keeps components testable and avoids duplicate listeners.
- **Using `setDoc` without `{ merge: true }` on an existing user document:** Would overwrite all fields including stats written by other operations. Use `updateDoc` for partial updates, `setDoc` only for new document creation.
- **Not unsetting store state on sign-out:** `profileStore.reset()` must be called in the `onAuthStateChanged` null branch, or previous user data bleeds into new sessions.
- **Calling `addDoc` for vocabulary before checking auth:** Firestore security rules deny writes if `request.auth` is null. Always check `authStore.uid` before any write.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic counter updates | Read-modify-write cycles for `totalSessions++` | `increment(1)` from firebase/firestore | Race conditions on concurrent writes; serverside is atomic |
| Offline cache | Custom IndexedDB wrapper | `persistentLocalCache()` via `initializeFirestore` | Firebase handles cache invalidation, TTL, sync on reconnect |
| Subcollection path construction | String concatenation for paths | `collection(db, 'vocabulary', uid, 'words')` varargs | Type-safe, validated by SDK; avoids path separator bugs |
| Auth-gated data loading | Manual `if (auth.currentUser)` checks in components | Load in `boot/auth.js` `onAuthStateChanged` | Already handles all auth state transitions including token refresh |
| Server timestamps | `new Date()` or `Date.now()` for Firestore fields | `serverTimestamp()` | Client clocks drift; server timestamp is authoritative |

**Key insight:** Every Firestore operation that touches shared counters (`totalSessionsCompleted`, `totalVocabularyWords`) MUST use `increment()`. Client-side read-modify-write on counters is a race condition that corrupts data silently under concurrent use.

---

## Common Pitfalls

### Pitfall 1: `getFirestore` vs `initializeFirestore` — Cannot Coexist for Same App

**What goes wrong:** If `getFirestore(app)` is called first (as in current `boot/firebase.js`), then calling `initializeFirestore(app, settings)` throws: "Firestore has already been initialized. You cannot call `initializeFirestore()` with different options than what it was originally called with."

**Why it happens:** Firebase SDK enforces a single Firestore instance per app. `initializeFirestore` must be the FIRST Firestore initialization call if you use it.

**How to avoid:** In `boot/firebase.js`, replace the single line `const db = getFirestore(app)` with `const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) }) })`. This is the ONLY change needed to `boot/firebase.js`.

**Warning signs:** "Firestore has already been initialized" error in console on app start.

### Pitfall 2: `handleComplete` in OnboardingPage Writes to Already-Existing Profile

**What goes wrong:** `createUserProfile` in `signInWithGoogle` already ran and created `users/{uid}`. If `handleComplete` calls `setDoc(userRef, {...})` without `{ merge: true }`, it overwrites the entire document, wiping `email`, `displayName`, `photoURL`, `subscriptionStatus`, and all stats written since sign-in.

**Why it happens:** The onboarding step happens AFTER sign-in, so the user document already exists.

**How to avoid:** Use `updateDoc(userRef, { onboardingCompleted: true, currentLevel: 'B1', levelProgress: 0, freeSessionUsed: false, updatedAt: serverTimestamp() })`. Never use bare `setDoc` on the users document post sign-in.

**Warning signs:** User profile shows only onboarding fields after completing onboarding; `email` and `displayName` are gone.

### Pitfall 3: DashboardPage Field Name Mismatch

**What goes wrong:** Current `DashboardPage.vue` references `profile.streakDays`, `profile.totalSessions`, `profile.vocabularyLearned` (the old mock field names). New `useProfileStore` will have `dailyStreak`, `totalSessionsCompleted`, `totalVocabularyWords` (TRD field names).

**Why it happens:** The mock store used informal names; the TRD uses the exact Firestore document field names.

**How to avoid:** When rewriting `useProfileStore`, either (a) add compatibility computed properties matching the old names, or (b) update all binding sites in DashboardPage at the same time as the store change. Option (b) is cleaner. Prior decision: "UI must NOT change — only add backend logic to existing components." The UI labels don't change; only the `profile.X` bindings in `<script setup>` change.

**Warning signs:** Dashboard shows `undefined` or `NaN` for stats after connecting to Firestore.

### Pitfall 4: `startSession` Firestore Write May Break Without Await

**What goes wrong:** If `startSession` is `async` but the UI navigates to the session page immediately without awaiting the Firestore write, and then a crash occurs before the document is created, the session is lost.

**Why it happens:** Navigation is not awaited with the Firestore write.

**How to avoid:** `await` the `addDoc` call inside `startSession`, OR make the UI aware it's async. For this phase, the simplest approach is to make `startSession` async and `await` it at the call site. The TRD specifies this write must succeed.

### Pitfall 5: Emulator Not Receiving `initializeFirestore` Calls

**What goes wrong:** `connectFirestoreEmulator(db, 'localhost', 8080)` must be called AFTER `initializeFirestore` returns `db`, and BEFORE any Firestore operations. This is already correctly ordered in `boot/firebase.js` as long as `initializeFirestore` replaces `getFirestore` in place.

**Why it happens:** Boot file module-level code runs top to bottom; order matters.

**How to avoid:** Keep `connectFirestoreEmulator` call in the same `if (process.env.DEV)` block in `boot/firebase.js`, unchanged from current. Only replace the `const db = getFirestore(app)` line.

### Pitfall 6: Vocabulary Store Not Loaded on App Re-Entry

**What goes wrong:** User signs in, goes directly to VocabularyPage — vocabulary is empty because the store hasn't loaded. Or user refreshes — same.

**Why it happens:** If vocabulary data is only loaded when `VocabularyPage` mounts, it only works for that navigation session.

**How to avoid:** Two valid approaches: (A) Load vocabulary lazily in VocabularyPage's `onMounted` using the store's `loadWords` action — simple and sufficient for MVP. (B) Load in `boot/auth.js` alongside profile — eager but adds latency to auth. **Recommendation:** Option A (lazy load in VocabularyPage) — consistent with how VocabularyPage will always be the only consumer.

---

## Code Examples

Verified patterns from the installed firebase@12.9.0 SDK TypeScript types:

### Offline Persistence Setup (DATA-07)
```javascript
// Source: firebase.google.com/docs/firestore/manage-data/enable-offline
// Verified: node_modules/@firebase/firestore/dist/index.d.ts lines 1539, 2164, 2188
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, connectFirestoreEmulator } from 'firebase/firestore'

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(undefined)
  })
})

if (process.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
```

### Read User Profile (DATA-01)
```javascript
// Source: firebase.google.com/docs/firestore/query-data/get-data
// Verified: index.d.ts line 1355
import { doc, getDoc } from 'firebase/firestore'
import { db } from 'boot/firebase'

const snap = await getDoc(doc(db, 'users', uid))
return snap.exists() ? snap.data() : null
// Already implemented in src/services/userProfile.js fetchUserProfile()
```

### Update User Document (DATA-03)
```javascript
// Source: firebase.google.com/docs/firestore/manage-data/add-data
// Verified: index.d.ts line 374 (updateDoc), 1465 (increment), serverTimestamp
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

await updateDoc(doc(db, 'users', uid), {
  onboardingCompleted: true,
  currentLevel: 'B1',
  levelProgress: 0,
  freeSessionUsed: false,
  updatedAt: serverTimestamp()
})
```

### Read Vocabulary Subcollection (DATA-05)
```javascript
// Source: firebase.google.com/docs/firestore/query-data/get-data
// Verified: index.d.ts line 260 (collection overloads), 1382 (getDocs)
import { collection, getDocs } from 'firebase/firestore'
import { db } from 'boot/firebase'

const wordsRef = collection(db, 'vocabulary', uid, 'words')
const snap = await getDocs(wordsRef)
const words = snap.docs.map(d => ({ id: d.id, ...d.data() }))
```

### Write Vocabulary Word (DATA-06)
```javascript
// Source: firebase.google.com/docs/firestore/manage-data/add-data
// Verified: index.d.ts line 21 (addDoc), serverTimestamp
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

await addDoc(collection(db, 'vocabulary', uid, 'words'), {
  word: wordData.word,
  definition: wordData.definition,
  exampleSentence: wordData.example ?? '',
  sourceSessionId: sessionId ?? null,
  timesEncountered: 1,
  savedAt: serverTimestamp(),
  lastReviewedAt: null
})
```

### Write Session Document (DATA-08)
```javascript
// Source: firebase.google.com/docs/firestore/manage-data/add-data
// Verified: index.d.ts line 21 (addDoc)
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

const sessionDocRef = await addDoc(collection(db, 'sessions'), {
  userId:    uid,
  topic:     topic,
  userLevel: currentLevel,
  createdAt: serverTimestamp()
})
// Store sessionDocRef.id for later updates (Phase 9)
```

### Atomic Stats Update Pattern (for reference — used in Phase 9)
```javascript
// Source: firebase.blog/posts/2019/03/increment-server-side-cloud-firestore/
// Verified: index.d.ts line 1465 (increment)
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

// Atomic — safe from race conditions
await updateDoc(doc(db, 'users', uid), {
  totalSessionsCompleted: increment(1),
  updatedAt: serverTimestamp()
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `enableIndexedDbPersistence(db)` | `initializeFirestore(app, { localCache: persistentLocalCache() })` | firebase v9.11+ | Must change `boot/firebase.js`; deprecated function will be removed in future major |
| `getFirestore(app)` | `initializeFirestore(app, settings)` when persistence needed | firebase v9.11+ | Cannot call both for same app; pick one |
| Namespaced SDK (`firebase.firestore()`) | Modular SDK (`import { getDoc } from 'firebase/firestore'`) | firebase v9.0 | Already using modular SDK — no change |
| `enableMultiTabIndexedDbPersistence()` | `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` | firebase v9.11+ | Also deprecated; use `persistentSingleTabManager` for PWA |

**Deprecated/outdated:**
- `enableIndexedDbPersistence()`: Deprecated, `@deprecated` tag in index.d.ts line 671. "This function will be removed in a future major release." Still functional in v12 but must not be used in new code.
- `enableMultiTabIndexedDbPersistence()`: Also deprecated (index.d.ts line 698). Same replacement.
- Mock store data: The entire body of current `src/stores/profile.js` (mock Sarah Chen data) is removed in this phase.

---

## Open Questions

1. **`startSession` call site — where is it triggered?**
   - What we know: `useSessionStore` has `startSession()` and `endSession(score)`. `SessionPage.vue` presumably calls these.
   - What's unclear: The exact wiring in `SessionPage.vue` — not read during research. Need to check if `startSession` already receives a `topic` param or if topic comes from somewhere else.
   - Recommendation: Read `SessionPage.vue` during planning. If topic isn't passed, default to `''` for now (Phase 8 will provide AI-assigned topics).

2. **FeedbackPage "Save word" UX — button placement**
   - What we know: DATA-06 requires a save action from FeedbackPage vocabulary tab. The tab shows a list of `vocabWords` cards. No save button exists in current markup.
   - What's unclear: Whether to add a save button to each card, or a "Save all" button. Prior decision: "UI must NOT change." Adding a button is adding backend logic to an existing component, which is within scope.
   - Recommendation: Add a small save icon button (e.g., `sym_o_bookmark`) to each vocabulary word card. Style it to match existing card design. This is minimal UI addition, not a design change.

3. **VocabularyPage word count stat — "183 words learned" is hardcoded**
   - What we know: The stat row shows `183 words learned` hardcoded. The real count is `useProfileStore().totalVocabularyWords`.
   - What's unclear: Whether this should also read from the vocabulary subcollection length or from the `users/{uid}.totalVocabularyWords` counter.
   - Recommendation: Use `useProfileStore().totalVocabularyWords` (the Firestore user doc counter) — consistent with DATA-02 and avoids an extra subcollection `count()` query. Update `totalVocabularyWords` via `increment(1)` whenever a word is saved (DATA-06).

---

## Sources

### Primary (HIGH confidence)
- `node_modules/@firebase/firestore/dist/index.d.ts` — TypeScript type definitions for installed firebase@12.9.0; confirmed `enableIndexedDbPersistence` `@deprecated` at line 671; confirmed `initializeFirestore`, `persistentLocalCache`, `persistentSingleTabManager` exports; confirmed all CRUD function signatures
- `firebase.google.com/docs/firestore/manage-data/enable-offline` — Official offline persistence docs; `initializeFirestore` + `persistentLocalCache` pattern
- `firebase.google.com/docs/firestore/manage-data/add-data` — Official write docs; `setDoc`, `updateDoc`, `addDoc`, `increment`, `serverTimestamp`
- `firebase.google.com/docs/firestore/query-data/get-data` — Official read docs; `getDoc`, `getDocs`, `collection` subcollection path

### Secondary (MEDIUM confidence)
- `docs.cloud.google.com/firestore/docs/manage-data/enable-offline` — Confirmed `persistentSingleTabManager(undefined)` syntax for single-tab PWA
- `github.com/firebase/firebase-js-sdk/issues/7347` — Performance context: new persistence API is 20x slower than deprecated one for cache queries; acceptable trade-off given deprecation
- `src/services/userProfile.js` (codebase) — Existing `fetchUserProfile` and `createUserProfile` implementation; confirmed Phase 6 already provides the read/initial-write infrastructure
- `src/boot/auth.js` (codebase) — Confirmed `onAuthStateChanged` subscriber pattern and extension points for profile store wiring

### Tertiary (LOW confidence)
- None — all key claims verified with installed SDK types or official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — firebase@12.9.0 already installed; all function signatures verified in TypeScript definitions
- Architecture: HIGH — follows Phase 6 patterns exactly; `boot/auth.js` extension point confirmed in code
- Offline persistence API: HIGH — deprecation confirmed in installed SDK types at line 671; replacement API confirmed in types and official docs
- Pitfalls: HIGH — verified against actual codebase (field name mismatch, `updateDoc` vs `setDoc` for existing doc)
- Open questions: MEDIUM — SessionPage.vue not inspected; FeedbackPage UX is a minor design decision

**Research date:** 2026-02-24
**Valid until:** 2026-05-24 (stable Firebase release; check if firebase major version bumps before then)
