// src/stores/auth.js
// Real Firebase Auth store — replaces mock implementation.
// State is populated by src/boot/auth.js via setUser() on every onAuthStateChanged emission.
// NEVER import useAuthStore in boot/firebase.js — circular dependency risk.

import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { auth } from 'boot/firebase'
import { createUserProfile } from 'src/services/userProfile'

export const useAuthStore = defineStore('auth', () => {
  // ── State ────────────────────────────────────────────────────────────────
  const uid               = ref(null)
  const email             = ref(null)
  const displayName       = ref(null)
  const photoURL          = ref(null)
  const onboardingCompleted = ref(false)
  // isLoading starts true — stays true until first onAuthStateChanged fires.
  // Router guard checks this to avoid premature redirect decisions.
  const isLoading         = ref(true)

  // ── Getters ──────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => uid.value !== null)

  // ── Actions ──────────────────────────────────────────────────────────────

  // Called by src/boot/auth.js on every onAuthStateChanged emission (including null on sign-out).
  // Also called after fetchUserProfile resolves to set onboardingCompleted.
  function setUser(firebaseUser) {
    if (firebaseUser) {
      uid.value           = firebaseUser.uid
      email.value         = firebaseUser.email
      displayName.value   = firebaseUser.displayName
      photoURL.value      = firebaseUser.photoURL
    } else {
      uid.value           = null
      email.value         = null
      displayName.value   = null
      photoURL.value      = null
      onboardingCompleted.value = false
    }
    isLoading.value = false
  }

  // Called by src/boot/auth.js after setUser to load the Firestore onboardingCompleted flag.
  function setOnboardingCompleted(value) {
    onboardingCompleted.value = value
  }

  // CRITICAL: signInWithPopup MUST be called synchronously from the click handler.
  // No await before it — mobile browsers block popups opened after any async delay.
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    // signInWithPopup is synchronous (the popup opens immediately on click).
    // The returned promise resolves when the user completes sign-in.
    const result = await signInWithPopup(auth, provider)
    // Create Firestore profile on first sign-in (getDoc check inside — safe to call every time).
    await createUserProfile(result.user)
    // onAuthStateChanged in boot/auth.js will fire and call setUser + fetchUserProfile.
    // No manual state update needed here.
  }

  async function signOutUser() {
    await signOut(auth)
    // setUser(null) will be called by onAuthStateChanged in boot/auth.js
  }

  // Legacy compatibility: v1.0 components used completeOnboarding() and hasCompletedOnboarding.
  // Map these to the new names so no template changes are needed.
  function completeOnboarding() {
    onboardingCompleted.value = true
  }
  const hasCompletedOnboarding = computed(() => onboardingCompleted.value)

  return {
    // State
    uid,
    email,
    displayName,
    photoURL,
    onboardingCompleted,
    isLoading,
    // Getters
    isAuthenticated,
    hasCompletedOnboarding,
    // Actions
    setUser,
    setOnboardingCompleted,
    signInWithGoogle,
    signOutUser,
    // Legacy alias
    completeOnboarding
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
