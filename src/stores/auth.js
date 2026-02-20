import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const hasCompletedOnboarding = ref(false)

  // Getters
  const isNewUser = computed(() => !hasCompletedOnboarding.value)

  // Actions — mock only, no real auth
  function mockSignIn() {
    isAuthenticated.value = true
  }

  function mockSignOut() {
    isAuthenticated.value = false
    hasCompletedOnboarding.value = false
  }

  return {
    isAuthenticated,
    hasCompletedOnboarding,
    isNewUser,
    mockSignIn,
    mockSignOut
  }
})

// HMR support — required for Vite dev server hot reload without losing store state
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
