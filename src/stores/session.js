import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  // State
  const isActive = ref(false)
  const durationSeconds = ref(0)
  const mistakeCount = ref(0)
  const overallScore = ref(null)

  // Actions
  function startSession() {
    isActive.value = true
    durationSeconds.value = 0
    mistakeCount.value = 0
    overallScore.value = null
  }

  function endSession(score) {
    isActive.value = false
    overallScore.value = score ?? 0
  }

  return {
    isActive,
    durationSeconds,
    mistakeCount,
    overallScore,
    startSession,
    endSession
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot))
}
