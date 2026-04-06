import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useLearningStore = defineStore('learning', () => {
  // { type, scenarioId, title, reason } or null — computed at runtime by Cloud Function
  const recommendedSession = ref(null)
  // Mirrors placement.skills shape: { vocabulary: { level, progress }, ... } or null
  const skillProgress      = ref(null)
  // Array of { pattern, occurrences, lastSeen, corrections, status }
  const mistakePatterns    = ref([])
  // Weekly session goal tracking
  const weeklyGoal         = ref({ sessionsTarget: 5, sessionsCompleted: 0 })

  /**
   * Load learning state from Firestore user doc data.
   * Called from auth.js after profileStore.setProfile().
   */
  function setLearning(data) {
    skillProgress.value      = data.placement?.skills ?? null
    mistakePatterns.value    = data.mistakePatterns ?? []
    weeklyGoal.value         = data.weeklyGoal ?? { sessionsTarget: 5, sessionsCompleted: 0 }
    recommendedSession.value = null  // computed at runtime by Cloud Function, not stored in user doc
  }

  /** Reset all state to initial values (called on sign-out). */
  function reset() {
    recommendedSession.value = null
    skillProgress.value      = null
    mistakePatterns.value    = []
    weeklyGoal.value         = { sessionsTarget: 5, sessionsCompleted: 0 }
  }

  return {
    recommendedSession,
    skillProgress,
    mistakePatterns,
    weeklyGoal,
    setLearning,
    reset
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLearningStore, import.meta.hot))
}
