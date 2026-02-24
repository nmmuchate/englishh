// src/boot/firebase.js
// Firebase SDK initialization — exports { app, auth, db } for use across the codebase.
// All other files must import from this file; never call initializeApp() elsewhere.
// Source patterns: https://firebase.google.com/docs/web/setup

import { defineBoot } from '#q-app/wrappers'
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// IMPORTANT: Access env vars via static dot notation only.
// Quasar/Vite replaces process.env.X at build time via static analysis.
// Dynamic access (process.env['X'] or destructuring) does NOT get replaced.
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

// Connect to local Firebase emulators in development.
// Prevents accidental reads/writes to production Firestore during dev.
// Auth emulator: localhost:9099 | Firestore emulator: localhost:8080
if (process.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
}

export { app, auth, db }

// Boot function is intentionally empty — Firebase is initialized by the
// module-level code above. Exports are what matter.
export default defineBoot(() => {})
