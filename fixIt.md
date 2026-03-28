# Fix It — Unresolved Issues

Issues I found that require your action or that are blocked and cannot be resolved automatically.

---

## PHASE 6 — Incomplete Execution (Code not applied yet)

### 1. `quasar.config.js` boot array is still empty

**File:** `quasar.config.js` line 14
**Current:** `boot: []`
**Required:** `boot: ['firebase', 'auth']`

`src/boot/firebase.js` was created but it is never loaded because the boot array was never updated. Firebase does not initialize when the app starts. **Nothing works until this is fixed.**

Fix: Edit `quasar.config.js` and change `boot: []` to `boot: ['firebase', 'auth']`.
Note: `src/boot/auth.js` also doesn't exist yet (plan 06-02 was not executed), so temporarily set `boot: ['firebase']` until 06-02 is done, then add `'auth'`.

---

### 2. `firebase.json` emulators block is missing

**File:** `firebase.json`
**Problem:** The emulators block was never added. Plan 06-01 Task 2 requires adding auth (port 9099), Firestore (port 8080), and UI (port 4000) emulator config.

Without this block, `firebase emulators:start` won't know which emulators to run and on which ports. The emulator connections in `src/boot/firebase.js` (which try to connect to localhost:9099 and localhost:8080 in dev mode) will fail.

Fix: Add this block to `firebase.json` before the closing `}`:
```json
"emulators": {
  "auth": { "port": 9099 },
  "firestore": { "port": 8080 },
  "ui": { "enabled": true, "port": 4000 },
  "singleProjectMode": true
}
```

---

### 3. `.env.example` file is missing

**Problem:** `.env.example` (the git-committed developer setup template) was never created. Only `.env.local` exists (your real credentials).
**Why it matters:** Without `.env.example`, other developers and future you won't know which env vars are required.

Fix: Create `.env.example` at the project root with these empty placeholders:
```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```

---

### 4. Plan 06-02 not executed — auth store, route guard, Google Sign-In not wired

**Files not yet created/modified:**
- `src/stores/auth.js` — still has mock implementation
- `src/services/userProfile.js` — does not exist
- `src/boot/auth.js` — does not exist
- `src/pages/LandingPage.vue` — handleSignIn still calls mock

Google Sign-In will not work. Route guards do not exist. The full plan is in `.planning/phases/06-firebase-auth/06-02-PLAN.md`.

Fix: Run `/gsd:execute-phase` and execute plan 06-02.

---

### 5. Plan 06-03 not executed — Firestore rules are dev/open, Cloud Functions not scaffolded

**Files not yet modified:**
- `firestore.rules` — still has the open dev rule `allow read, write: if request.time < timestamp.date(2026, 3, 25)` (expires 2026-03-25, exposes all data publicly until then)
- `functions/package.json` — missing `@google/genai` dependency
- `functions/index.js` — no `defineSecret` declarations, no `setGlobalOptions`

**Security risk:** Firestore is currently wide open to any authenticated user reading or writing any document.

Fix: Run `/gsd:execute-phase` and execute plan 06-03. Then run `firebase deploy --only firestore:rules`.

---

### 6. Firebase version mismatch

**Installed:** `firebase@12.9.0`
**Plan expected:** `firebase@11.x`

The plan's verification step (`npm list firebase`) checks for `firebase@11.x` but `12.9.0` is what's installed. This is unlikely to break anything (Firebase SDK is backward-compatible), but none of the plan verification steps have been run to confirm.

Action: No code change needed, but confirm the app works with v12 by running `quasar dev` after fixing issues #1 and #2 above.

---

## FIREBASE CONSOLE — Manual steps you must do (Claude cannot do these)

### 7. Enable Google Sign-In provider

**Where:** Firebase Console → Authentication → Sign-in method → Google → Enable
**Why:** Without this, `signInWithPopup` will throw `auth/operation-not-allowed`.

---

### 8. Add localhost to authorized domains

**Where:** Firebase Console → Authentication → Settings → Authorized domains → Add domain → `localhost`
**Why:** Firebase blocks OAuth redirects to domains not on the whitelist. The app will fail Google sign-in locally without this.

---

### 9. Firebase CLI not linked to project

**Problem:** `firebase deploy` commands (needed for Firestore rules in plan 06-03) require the CLI to be authenticated and linked to your project. `.firebaserc` exists but it is unknown if `firebase login` has been run in this environment.

Fix: Run these two commands in the project root:
```
firebase login
firebase use --add
```
Select your Firebase project and name the alias `default`.

---

### 10. Gemini API key not set as Firebase Secret

**Required for:** Phase 8 (AI conversation engine)
**Where to get it:** https://aistudio.google.com → API Keys
**How to set it:**
```
firebase functions:secrets:set GEMINI_API_KEY
```
This must be done before deploying any Cloud Function that uses Gemini. Without it, Phase 8 Cloud Functions will fail at runtime with a missing secret error.

---

### 11. MozPayments API key not set as Firebase Secret

**Required for:** Phase 10 (payments)
**How to set it:**
```
firebase functions:secrets:set MOZPAYMENTS_API_KEY
```
MozPayments is a niche gateway. If it proves unavailable or too complex, Stripe is the documented fallback in the TRD.

---

### 12. Firebase Blaze (pay-as-you-go) plan must be enabled

**Required for:** Cloud Functions deployment (Phase 8+)
**Where:** Firebase Console → Project Settings → Usage and billing → Modify plan
**Why:** Free Spark plan does not allow Cloud Functions to make outbound network calls (required for Gemini API). Blaze plan is required even if you stay within free tier limits.

---

## FUTURE PHASES — Known risks ahead

### 13. Node.js 24 support for Cloud Functions — unverified

`functions/package.json` specifies `"node": "24"`. Firebase Cloud Functions runtime support for Node 24 has not been confirmed. Firebase typically supports LTS versions (Node 20 and 22 are confirmed as of early 2026). If deployment fails with a runtime error, downgrade to `"node": "22"` in `functions/package.json`.

---

### 14. Phases 7–10 plans are not yet written

The plans for phases 7, 8, 9, and 10 are listed in the roadmap but have `TBD` status — no PLAN.md files exist for them. Each phase needs `/gsd:plan-phase` run before execution.

| Phase | Plans needed |
|-------|-------------|
| 7 — Firestore Data Layer | 07-01, 07-02, 07-03 |
| 8 — AI Conversation Engine | 08-01, 08-02, 08-03 |
| 9 — Session Scoring | 09-01, 09-02 |
| 10 — Payments & Cron Jobs | 10-01, 10-02, 10-03 |

---

### 15. Web Speech API works only on Chrome/Edge

The TRD and Phase 8 plan specify a text-input fallback for non-Chrome browsers, but the fallback UI is not yet designed. Safari and Firefox do not support `SpeechRecognition`. If your target users are on iOS Safari this is a significant gap — iOS does not allow third-party browsers to use the WebKit engine, so Chrome on iOS also won't have Speech API access.

---

### 16. `axios` is a dead dependency

`axios` is in `package.json` and `src/boot/axios.js` exists from the v1.0 scaffold, but it is never used (all API calls go through Firebase SDK). It's harmless but adds bundle weight. Can be removed with `npm uninstall axios` and deleting `src/boot/axios.js`.

---

## Priority Order

1. Fix `quasar.config.js` boot array (issue #1) — app is broken without this
2. Add emulators to `firebase.json` (issue #2) — needed for local dev
3. Create `.env.example` (issue #3) — quick housekeeping
4. Firebase Console: enable Google Sign-In + add localhost domain (issues #7, #8)
5. Execute plan 06-02 (issue #4) — auth flow
6. Execute plan 06-03 + deploy rules (issue #5) — security
7. Verify Firebase CLI linked (issue #9)
8. Get Gemini API key and set as secret (issue #10) — needed before Phase 8
