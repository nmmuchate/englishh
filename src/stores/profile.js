import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  // Mock user data — Sarah Chen, the Stitch design persona
  const displayName = ref('Sarah Chen')
  const level = ref('Intermediate')
  const streakDays = ref(12)
  const totalSessions = ref(47)
  const vocabularyLearned = ref(183)
  const isPro = ref(false)

  return {
    displayName,
    level,
    streakDays,
    totalSessions,
    vocabularyLearned,
    isPro
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
