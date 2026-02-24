// src/boot/auth.js
// Subscribes to Firebase Auth state and registers the router navigation guard.
// MUST be listed AFTER 'firebase' in quasar.config.js boot array.
//
// The getCurrentUser() wrapper resolves the router guard race condition:
// on hard page refresh, auth.currentUser is null until SDK initializes.
// The guard awaits getCurrentUser() to get the real initial state.

import { defineBoot } from '#q-app/wrappers'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'
import { fetchUserProfile } from 'src/services/userProfile'

// Routes that do NOT require authentication.
// 'onboarding' is semi-public: authenticated users without completed onboarding land here.
const PUBLIC_ROUTES = ['landing']

// Wraps onAuthStateChanged in a one-time Promise.
// Resolves with the current Firebase user (or null) after the first auth state emission.
// This is the standard pattern to avoid the race condition where router.beforeEach
// fires before the Firebase SDK has emitted the initial auth state.
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
  // ── Persistent auth state subscriber ─────────────────────────────────────
  // This listener fires for the lifetime of the app (sign-in, sign-out, token refresh).
  // It keeps useAuthStore in sync with the real Firebase Auth state.
  onAuthStateChanged(auth, async (user) => {
    const authStore = useAuthStore()
    authStore.setUser(user)

    // After sign-in, fetch the Firestore profile to load onboardingCompleted.
    // On sign-out (user is null), setUser(null) already reset onboardingCompleted to false.
    if (user) {
      const profile = await fetchUserProfile(user.uid)
      if (profile) {
        authStore.setOnboardingCompleted(profile.onboardingCompleted ?? false)
      }
    }
  })

  // ── Route guard ──────────────────────────────────────────────────────────
  // Runs before every navigation. Awaits the initial auth state to avoid
  // redirecting authenticated users to landing on hard refresh.
  router.beforeEach(async (to) => {
    const isPublicRoute = PUBLIC_ROUTES.includes(to.name)

    // Resolve the current user (waits for Firebase SDK initialization on first call).
    const user = await getCurrentUser()

    // ① Unauthenticated user trying to access a protected route → send to landing
    if (!user && !isPublicRoute) {
      return { name: 'landing' }
    }

    // ② Authenticated user hitting landing → skip to appropriate destination
    if (user && to.name === 'landing') {
      const authStore = useAuthStore()
      // isLoading may still be true if the Firestore profile fetch hasn't completed.
      // In that case, default to onboarding (safer than dashboard for incomplete profiles).
      if (authStore.onboardingCompleted) {
        return { name: 'dashboard' }
      } else {
        return { name: 'onboarding' }
      }
    }

    // ③ Authenticated user without completed onboarding trying to access non-onboarding routes
    // Excludes onboarding itself to avoid infinite redirect loop.
    if (user && to.name !== 'onboarding' && !isPublicRoute) {
      const authStore = useAuthStore()
      if (!authStore.onboardingCompleted) {
        return { name: 'onboarding' }
      }
    }

    // All other cases: allow navigation
  })
})
