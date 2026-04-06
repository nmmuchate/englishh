# Phase 11: Stores & Firestore Schema — Research

**Researched:** 2026-04-06
**Domain:** Pinia Setup Stores, Firestore schema extension, Node.js Admin SDK seed script
**Confidence:** HIGH

## Summary

Phase 11 is a pure data-layer phase: two new Pinia stores, an extension to the existing `useProfileStore`, a Firestore schema extension on `users/{uid}`, and a seed script for the `scenarioLibrary` collection. No UI, no Cloud Functions, no routing.

All patterns are well-established in the codebase. The existing `profile.js` and `session.js` stores are the definitive models — Setup Store pattern, `acceptHMRUpdate`, `ref(null)` declarations, try/catch async actions. The `auth.js` boot file already calls `profileStore.setProfile(data)` on auth state change, so v1.2 fields slot in there cleanly.

The `scenarioLibrary` seed script uses the Firebase Admin SDK already installed in `functions/` (firebase-admin@^13.6.0). No new dependencies are required anywhere. The entire phase is additive — nothing is deleted or replaced.

**Primary recommendation:** Follow `profile.js` exactly for `usePlacementStore` and `useLearningStore`. Extend `setProfile()` with the 4 new top-level fields. Write the seed script as a standalone Node.js CJS module that requires `firebase-admin` and writes idempotently.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Extend `useProfileStore.setProfile()` to include the new v1.2 fields (`profile`, `placement`, `mistakePatterns`, `sessionTypesCompleted`). Consistent with existing one-read-on-auth pattern. The new stores (`placement.js`, `learning.js`) receive their initial data via setters called from auth flow, not via independent Firestore reads.
- **D-02:** Seed the full library in this phase — 5-10 templates per supported field/interest for all 4 session types (Scenario, Free Talk, Story Builder, Debate). Do not defer seeding to Phase 16.
- **D-03:** Seeding mechanism: Node.js Admin SDK script in `functions/scripts/seed-scenario-library.js`. Idempotent (checks if doc exists before writing), version-controlled, run once via `node functions/scripts/seed-scenario-library.js`.
- **D-04:** Minimum coverage for seed: fields = Engineering, Health, Business, Technology, Student; interests = Travel, Gaming, Cooking, Sports, Music. At least one template per (field × session-type) combination in scope.
- **D-05:** Progressive save — `usePlacementStore` writes completed stage results to `placementTests/{uid}` in Firestore immediately after each stage is confirmed, not in a batch at the end. This satisfies the skip/resume requirement (PLACE-12).

### Claude's Discretion

- How `usePlacementStore` and `useLearningStore` are structured internally (state shape, action names) — follow existing Setup Store pattern from `session.js` / `profile.js`.
- Whether to use a `loadPlacement(data)` vs `setPlacement(data)` naming convention — Claude picks the most consistent name.
- Exact Firestore security rules for `scenarioLibrary` (read-only for authenticated users, write-locked to admin).

### Deferred Ideas (OUT OF SCOPE)

- No UI, no Cloud Functions, no routing changes in this phase.
- Seeding of scenarioLibrary is NOT deferred to Phase 16 (D-02 locks it to Phase 11).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-v12-01 | `placement.js` Pinia store manages placement test state (currentStage, stageResults, adaptiveLevel, finalResult) | PRD §6.4 defines exact state shape; profile.js/session.js define the Setup Store pattern to follow |
| INFRA-v12-02 | `learning.js` Pinia store manages learning path (recommendedSession, skillProgress, mistakePatterns, weeklyGoal) | PRD §6.4 defines exact state shape; same pattern as INFRA-v12-01 |
| INFRA-v12-03 | `scenarioLibrary` Firestore collection stores scenario templates (pre-generated per field/interest) | PRD §5.2 defines exact document schema; Admin SDK already available in functions/ |
| INFRA-v12-04 | `users/{uid}` extended with profile, placement, mistakePatterns, sessionTypesCompleted fields | PRD §5.2 defines exact JSON; auth.js boot already calls setProfile() — just extend it |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pinia | already installed (Quasar project) | State management for placement + learning stores | Project standard — all existing stores use it |
| firebase/firestore | already installed (firebase@^12.9.0) | Client-side Firestore reads/writes in stores | Project standard — db exported from boot/firebase.js |
| firebase-admin | ^13.6.0 (in functions/package.json) | Admin SDK for seed script | Already installed in functions/ — no new install needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vue (ref, computed) | already installed | Reactive store state | Used in all existing stores — follow same pattern |

**Installation:** No new dependencies required for any deliverable in this phase.

---

## Architecture Patterns

### Recommended Project Structure

New files to create:
```
src/stores/
├── placement.js      # NEW — usePlacementStore
├── learning.js       # NEW — useLearningStore
├── profile.js        # EXTEND — add v1.2 fields to setProfile()
└── index.js          # ADD — export new stores in barrel

functions/scripts/
└── seed-scenario-library.js   # NEW — Admin SDK one-shot seed script
```

New Firestore collections/documents:
```
users/{uid}                            # EXTEND — add profile, placement, mistakePatterns, sessionTypesCompleted
placementTests/{uid}                   # NEW — progressive stage saves (written by usePlacementStore actions)
scenarioLibrary/{levelId}/             # NEW — subcollection parent
  scenarios/{scenarioId}               # NEW — scenario templates
```

### Pattern 1: Setup Store (from profile.js — authoritative template)

**What:** `defineStore('name', () => { refs + actions + return })` with `acceptHMRUpdate` at bottom.
**When to use:** All stores in this project. Never use Options API stores.
**Example:**
```javascript
// Source: src/stores/profile.js (existing)
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  const currentLevel = ref(null)         // declare all state as refs
  const levelProgress = ref(0)

  function setProfile(data) {
    currentLevel.value = data.currentLevel ?? null
    levelProgress.value = data.levelProgress ?? 0
  }

  function reset() {
    currentLevel.value = null
    levelProgress.value = 0
  }

  return { currentLevel, levelProgress, setProfile, reset }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
```

### Pattern 2: Async Store Action with Firestore Write (from session.js)

**What:** try/catch with console.error fallback. Firestore `db` imported from `boot/firebase`.
**When to use:** Any store action that reads or writes Firestore.
**Example:**
```javascript
// Source: src/stores/session.js (existing)
import { doc, setDoc } from 'firebase/firestore'
import { db } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'   // to get uid

async function saveStageResult(stageKey, data) {
  const authStore = useAuthStore()
  const uid = authStore.uid
  if (!uid) return
  try {
    await setDoc(
      doc(db, 'placementTests', uid),
      { stages: { [stageKey]: data } },
      { merge: true }            // progressive save — do NOT overwrite whole doc
    )
  } catch (err) {
    console.error('saveStageResult error:', err)
  }
}
```

### Pattern 3: Extending setProfile() for v1.2 Fields

**What:** Add new field assignments in `setProfile()` and matching `reset()` lines. Add new `ref()` declarations at the top.
**When to use:** Any time the Firestore `users/{uid}` schema grows.
**Example:**
```javascript
// Extension to src/stores/profile.js
const profile             = ref(null)          // v1.2 — occupation, field, interests, goal, priorExperience
const placement           = ref(null)          // v1.2 — overallLevel + skillBreakdown
const mistakePatterns     = ref([])            // v1.2 — array of pattern objects
const sessionTypesCompleted = ref({            // v1.2 — per-type counters
  freeTalk: 0, scenario: 0, storyBuilder: 0, debate: 0, review: 0
})

// Inside setProfile(data):
profile.value               = data.profile             ?? null
placement.value             = data.placement           ?? null
mistakePatterns.value       = data.mistakePatterns     ?? []
sessionTypesCompleted.value = data.sessionTypesCompleted ?? {
  freeTalk: 0, scenario: 0, storyBuilder: 0, debate: 0, review: 0
}

// Inside reset():
profile.value               = null
placement.value             = null
mistakePatterns.value       = []
sessionTypesCompleted.value = { freeTalk: 0, scenario: 0, storyBuilder: 0, debate: 0, review: 0 }
```

### Pattern 4: Admin SDK Seed Script (CJS)

**What:** Standalone Node.js CJS script using `firebase-admin`. Must be idempotent (check before write). Must be runnable with `node functions/scripts/seed-scenario-library.js` from repo root or functions/.
**When to use:** One-shot Firestore seeding outside of deployed functions.
**Example:**
```javascript
// functions/scripts/seed-scenario-library.js
const admin = require('firebase-admin')

// Admin SDK auto-detects GOOGLE_APPLICATION_CREDENTIALS or ADC
if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

const scenarios = [ /* ... array of scenario objects ... */ ]

async function seed() {
  for (const scenario of scenarios) {
    const ref = db
      .collection('scenarioLibrary')
      .doc(scenario.targetLevel)
      .collection('scenarios')
      .doc(scenario.id)
    const snap = await ref.get()
    if (snap.exists) {
      console.log(`SKIP ${scenario.id} — already exists`)
      continue
    }
    await ref.set(scenario)
    console.log(`WROTE ${scenario.id}`)
  }
}

seed().then(() => { console.log('Seed complete'); process.exit(0) })
      .catch(err => { console.error(err); process.exit(1) })
```

### Pattern 5: Barrel Export in src/stores/index.js

The existing `index.js` is Quasar's Pinia bootstrap wrapper (createPinia) — it does NOT re-export individual stores. New stores do not need to be registered there. They are imported directly:
```javascript
import { usePlacementStore } from 'stores/placement'
import { useLearningStore } from 'stores/learning'
```
No change to `src/stores/index.js` is needed.

### Anti-Patterns to Avoid

- **Options API stores:** All existing stores use Setup Store syntax. Never use `{ state: () => ({}) }` Options form.
- **Independent Firestore reads in new stores:** New stores receive data from `setPlacement(data)` / `setLearning(data)` called from auth flow, not from their own `onSnapshot` or `getDoc`. (D-01 locks this.)
- **Batch-end Firestore write in usePlacementStore:** Stage results MUST be written after each individual stage confirmation, not batched at the end. (D-05 locks this — progressive save for PLACE-12 skip/resume support.)
- **setDoc without merge on placementTests:** Progressive writes use `setDoc(..., { merge: true })` — never overwrite the whole document on each stage save.
- **Hardcoded Firebase project ID in seed script:** Let Admin SDK infer project from Application Default Credentials (ADC) or `GOOGLE_APPLICATION_CREDENTIALS` env var.

---

## Exact Firestore Schemas (from PRD §5.2)

### users/{uid} — v1.2 Extension Fields

```json
{
  "profile": {
    "occupation": "string",
    "field": "string (Engineering|Health|Business|Technology|Student|Other)",
    "interests": ["string"],
    "goal": "string (Work|Travel|Education|Personal Growth|Immigration|Fun)",
    "priorExperience": "string"
  },
  "placement": {
    "overallLevel": "string (A1|A2|B1|B2|C1|C2)",
    "skills": {
      "vocabulary": { "level": "string", "progress": "number 0-100" },
      "reading":    { "level": "string", "progress": "number 0-100" },
      "listening":  { "level": "string", "progress": "number 0-100" },
      "grammar":    { "level": "string", "progress": "number 0-100" },
      "speaking":   { "level": "string", "progress": "number 0-100" },
      "writing":    { "level": "string", "progress": "number 0-100" }
    },
    "strengths": ["string"],
    "weaknesses": ["string"],
    "confidence": "number 0-1",
    "testedAt": "ISO 8601 timestamp"
  },
  "mistakePatterns": [
    {
      "pattern": "string (snake_case key e.g. present_perfect_vs_simple_past)",
      "occurrences": "number",
      "lastSeen": "YYYY-MM-DD",
      "corrections": "number",
      "status": "string (active|resolved)"
    }
  ],
  "sessionTypesCompleted": {
    "freeTalk": "number",
    "scenario": "number",
    "storyBuilder": "number",
    "debate": "number",
    "review": "number"
  }
}
```

### placementTests/{uid} — Progressive Stage Doc

```json
{
  "userId": "string",
  "startedAt": "Firestore Timestamp",
  "completedAt": "Firestore Timestamp|null",
  "stages": {
    "profile":    { "completed": "boolean", "data": {} },
    "vocabulary": { "completed": "boolean", "questions": [], "score": "number", "level": "string" },
    "reading":    { "completed": "boolean", "passage": "string", "answers": [], "score": "number", "level": "string" },
    "listening":  { "completed": "boolean", "tasks": [], "score": "number", "level": "string" },
    "grammar":    { "completed": "boolean", "questions": [], "score": "number", "level": "string" },
    "speaking":   { "completed": "boolean", "transcript": [], "analysis": {}, "level": "string" },
    "writing":    { "completed": "boolean", "prompt": "string", "response": "string", "analysis": {}, "level": "string" }
  },
  "finalResult": {
    "overallLevel": "string",
    "skillBreakdown": {}
  }
}
```

### scenarioLibrary/{levelId}/scenarios/{scenarioId} — Scenario Template

```json
{
  "title": "string",
  "type": "string (freeTalk|scenario|storyBuilder|debate)",
  "targetLevel": "string (A1|A2|B1|B2|C1|C2)",
  "targetSkills": ["string"],
  "grammarFocus": ["string"],
  "relevantFields": ["string"],
  "relevantInterests": ["string"],
  "systemPrompt": "string (may contain {{userName}} placeholder)",
  "aiRole": "string",
  "userRole": "string",
  "objectives": ["string"],
  "successCriteria": "string"
}
```

---

## Exact Store State Shapes (from PRD §6.4)

### usePlacementStore (placement.js)

```javascript
const currentStage   = ref('profile')   // 'profile'|'vocabulary'|'listening'|'grammar'|'speaking'|'complete'
const stageResults   = ref({})          // keyed by stage name, e.g. { vocabulary: { score, level, ... } }
const adaptiveLevel  = ref('B1')        // running estimate updated after each scored stage
const isComplete     = ref(false)       // true after finalResult is set
const finalResult    = ref(null)        // { overallLevel, skillBreakdown, strengths, weaknesses, confidence }
```

### useLearningStore (learning.js)

```javascript
const recommendedSession  = ref(null)   // PRD uses 'recommendedSessionType'+'recommendedScenario' — collapse to one object
const skillProgress       = ref(null)   // mirrors placement.skills shape: { vocabulary: { level, progress }, ... }
const mistakePatterns     = ref([])     // array of pattern objects (mirrors users/{uid}.mistakePatterns)
const weeklyGoal          = ref({ sessionsTarget: 5, sessionsCompleted: 0 })
```

**Naming decision (Claude's discretion):** Use `setPlacement(data)` and `setLearning(data)` — consistent with `setProfile(data)` in `profile.js`. The "set" prefix is the project convention for loading Firestore data into a store.

---

## Seed Coverage Matrix (D-04)

Minimum required: at least one template per (field × session-type) combination.

| Field / Interest | Scenario | FreeTalk | StoryBuilder | Debate |
|-----------------|----------|----------|--------------|--------|
| Engineering | B1 — Explain outage to manager | B1 — Talk about your project | B2 — Lost engineer in Tokyo | B2 — Remote work debate |
| Health | B1 — Explain diagnosis to patient | A2 — Daily health routine | B1 — Hospital story | B2 — Universal healthcare |
| Business | B1 — Negotiate deadline with client | B1 — Discuss weekend plans | B1 — Startup founder story | B2 — Entrepreneur vs employee |
| Technology | B1 — Demo a product to investor | B1 — Your favourite app | B1 — AI replaces jobs story | B2 — AI: friend or foe |
| Student | A2 — Ask professor for extension | A2 — Describe your campus | A2 — Study abroad adventure | B1 — Social media impact |
| Travel (interest) | B1 — Check in at airport | A2 — Favourite travel memory | B1 — Lost tourist story | B2 — Tourism harms culture |
| Gaming (interest) | B1 — Explain your favourite game | A2 — Describe last gaming session | B1 — Gamer in a fantasy world | B1 — Video games: good or bad |
| Cooking (interest) | A2 — Order food at restaurant | A2 — Describe favourite meal | A2 — Mystery ingredient challenge | B1 — Fast food vs home cooking |
| Sports (interest) | B1 — Interview after a match | A2 — Favourite sport memory | B1 — Underdog team story | B1 — Sports salaries debate |
| Music (interest) | B1 — Describe your music taste | A2 — Talk about a song you love | B1 — Band on tour story | B1 — Music streaming vs buying |

**Total minimum templates:** 40 (10 categories × 4 session types). The PRD requests 5-10 per field/interest combination — plan for 1 definitive template per cell (expandable later).

Each `scenarioId` should follow the pattern: `{field-kebab}-{type}-{level}` e.g. `engineering-scenario-b1`, `travel-freetalk-a2`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent writes | Custom version tracking | `snap.exists` check before `ref.set()` | Admin SDK `get()` is free, simple, reliable |
| Firestore merge update | Manual field-by-field update | `setDoc(..., { merge: true })` | Built-in partial update — prevents overwriting sibling fields |
| Auth UID in store actions | Storing uid in placement/learning store | `useAuthStore().uid` inside the action | Single source of truth — uid already in authStore |
| Store barrel export | Modifying index.js | Direct named import from file | Existing stores are imported directly — no registry needed |

---

## Common Pitfalls

### Pitfall 1: setDoc without merge overwrites sibling fields
**What goes wrong:** `setDoc(doc(db, 'placementTests', uid), { stages: { vocabulary: {...} } })` without `{ merge: true }` will erase any previously saved stages.
**Why it happens:** Firestore `setDoc` default is full overwrite, not patch.
**How to avoid:** Always use `setDoc(..., { merge: true })` for progressive stage saves. Never use `updateDoc` for nested maps that may not yet exist (it fails if the parent document doesn't exist yet).
**Warning signs:** Stage 2 data disappears after Stage 3 save.

### Pitfall 2: Admin SDK initialized before project ID is known
**What goes wrong:** `admin.initializeApp()` succeeds but `db.collection(...)` calls fail with "project not set" error when running seed script locally without ADC or `GOOGLE_APPLICATION_CREDENTIALS`.
**Why it happens:** Admin SDK in a script context (not Cloud Functions) needs explicit credentials.
**How to avoid:** Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path, or run `firebase login` and rely on Application Default Credentials. Document this as a one-line prerequisite in the script's header comment.
**Warning signs:** `Error: Could not load the default credentials` when running the script.

### Pitfall 3: Seed script creates duplicate documents on re-run
**What goes wrong:** Running the script twice doubles all scenario templates.
**Why it happens:** Missing idempotency check.
**How to avoid:** Every write is preceded by `const snap = await ref.get(); if (snap.exists) { continue }` (D-03 locks this pattern).
**Warning signs:** Collection grows on each script execution.

### Pitfall 4: New store refs not returned from Setup Store
**What goes wrong:** `placement.value` is undefined in components even though the ref is declared.
**Why it happens:** Forgot to include the ref in the `return {}` object at the bottom of the store function.
**How to avoid:** Every `const x = ref(...)` declared in the store body MUST appear in the return object.
**Warning signs:** Pinia devtools shows store but properties are missing; template renders `undefined`.

### Pitfall 5: Calling setPlacement / setLearning before auth state is ready
**What goes wrong:** New stores have null state even after sign-in.
**Why it happens:** `profileStore.setProfile()` is called from `onAuthStateChanged` in `auth.js`, but new stores are called separately and the data may not be present in the Firestore doc yet (no placement completed yet).
**How to avoid:** Guard all setPlacement/setLearning calls with null checks on the incoming data. Default gracefully: `placement.value = data.placement ?? null`. Components consuming placement store check for `finalResult !== null` before rendering results.
**Warning signs:** `Cannot read properties of null` in template on first sign-in.

### Pitfall 6: scenarioId collisions across levels
**What goes wrong:** Two scenarios at different levels share the same `scenarioId` but live in different `levelId` sub-paths — no collision in Firestore paths but causes confusion in client queries.
**How to avoid:** Include `targetLevel` in the ID itself: `engineering-scenario-b1`. This makes each document path globally unambiguous.

---

## Integration Points

### auth.js — Where to Hook setPlacement / setLearning

`src/boot/auth.js` currently calls `profileStore.setProfile(profile)` after fetching the user doc. The new stores should be loaded in the same callback, after `setProfile`:

```javascript
// Addition to auth.js onAuthStateChanged callback (after profileStore.setProfile)
import { usePlacementStore } from 'stores/placement'
import { useLearningStore } from 'stores/learning'

// Inside onAuthStateChanged, after setProfile:
const placementStore = usePlacementStore()
const learningStore = useLearningStore()
placementStore.setPlacement(profile)    // reads profile.placement + profile.stageResults etc.
learningStore.setLearning(profile)      // reads profile.placement.skills, profile.mistakePatterns
```

This preserves the one-read-on-auth pattern (D-01) — no additional Firestore reads.

### useAuthStore — Getting uid in Store Actions

Store actions that write to Firestore need the user's uid. Pattern from session.js:
```javascript
import { useAuthStore } from 'stores/auth'
// Inside action:
const authStore = useAuthStore()
const uid = authStore.uid
if (!uid) return
```

---

## Firestore Security Rules — scenarioLibrary

Claude's discretion is given for these rules. Recommended approach consistent with existing rule patterns:

```javascript
// Add to firestore.rules after system_config block:
match /scenarioLibrary/{levelId}/scenarios/{scenarioId} {
  allow read:  if isAuthenticated();   // any signed-in user can read scenarios
  allow write: if false;               // write-locked to Admin SDK (seed script + future functions)
}

match /placementTests/{userId} {
  allow read:  if isAuthenticated() && isOwner(userId);
  allow create: if isAuthenticated() && isOwner(userId);
  allow update: if isAuthenticated() && isOwner(userId);  // allows progressive saves
  allow delete: if false;
}
```

This follows the existing pattern: admin-written collections are `write: false` from clients (leaderboard, subscriptions); user-owned data follows `isOwner()`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| firebase-admin | Seed script | Yes | ^13.6.0 (functions/package.json) | — |
| node (in functions/) | Seed script runtime | Yes | 24 (engines field in functions/package.json) | — |
| Google Application Default Credentials / GOOGLE_APPLICATION_CREDENTIALS | Seed script local run | Assumed (developer machine) | — | Set GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON |
| Firebase Firestore (live project) | Seed script target | Assumed (v1.1 already deployed) | — | Firebase Emulator as fallback for local testing |

**Missing dependencies with no fallback:** None — all required tooling is present.

**Missing dependencies with fallback:**
- ADC for local seed script run: fallback is service account key file via `GOOGLE_APPLICATION_CREDENTIALS`.

---

## Validation Architecture

> nyquist_validation not found in .planning/config.json — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — project has no test framework installed as of Phase 10 |
| Config file | None |
| Quick run command | N/A (no framework) |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-v12-01 | `usePlacementStore` is importable and exposes `currentStage`, `stageResults`, `adaptiveLevel`, `finalResult` | smoke (manual import check) | N/A — no test framework | No framework |
| INFRA-v12-02 | `useLearningStore` is importable and exposes `recommendedSession`, `skillProgress`, `mistakePatterns`, `weeklyGoal` | smoke (manual import check) | N/A | No framework |
| INFRA-v12-03 | `scenarioLibrary` collection seeded | manual Firestore console check | `node functions/scripts/seed-scenario-library.js` | Script to be created |
| INFRA-v12-04 | `users/{uid}` contains v1.2 fields | manual Firestore console check after sign-in | N/A (requires live auth) | No test |

### Wave 0 Gaps
No test framework exists in this project (deferred per REQUIREMENTS.md "E2E / unit tests deferred until backend is stable"). Manual verification approach applies:

- Store exports can be smoke-tested by importing in a one-off script or browser devtools
- Seed script output is verified by inspecting Firestore console after running it
- Profile store extension is verified by signing in and checking Pinia devtools

*(Framework install not required for this phase — consistent with project decision to defer testing.)*

---

## Sources

### Primary (HIGH confidence)
- `src/stores/profile.js` — definitive Setup Store pattern (read directly)
- `src/stores/session.js` — definitive async action + try/catch pattern (read directly)
- `src/boot/auth.js` — definitive auth hook / setProfile call site (read directly)
- `SpeakAI-Onboarding-Immersion-PRD.md §5.2` — exact Firestore schemas (read directly)
- `SpeakAI-Onboarding-Immersion-PRD.md §6.4` — exact store state shapes (read directly)
- `functions/package.json` — confirms firebase-admin@^13.6.0 available, Node 24 (read directly)
- `firestore.rules` — existing rule patterns for new rules design (read directly)
- `.planning/phases/11-stores-firestore-schema/11-CONTEXT.md` — all locked decisions (read directly)

### Secondary (MEDIUM confidence)
- Firebase Admin SDK Node.js documentation — `setDoc` with merge, `get()` existence check patterns are stable API surface, consistent with existing code in functions/index.js

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed from package.json files
- Architecture: HIGH — existing codebase provides exact templates; no external research required
- Pitfalls: HIGH — derived from reading actual code (auth.js, userProfile.js, session.js) and PRD schema definitions
- Seed coverage matrix: HIGH — derived directly from D-04 constraints and PRD §3.4

**Research date:** 2026-04-06
**Valid until:** 2026-06-06 (stable domain — Pinia Setup Store API and Firestore Admin SDK are mature APIs with no expected breaking changes)
