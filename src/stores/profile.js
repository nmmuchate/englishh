import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  // Reactive refs matching exact TRD Firestore field names (users/{userId})
  const displayName            = ref(null)
  const currentLevel           = ref(null)       // 'B1', 'B2', etc.
  const levelProgress          = ref(0)          // 0-100
  const dailyStreak            = ref(0)
  const totalSessionsCompleted = ref(0)
  const totalVocabularyWords   = ref(0)
  const averageScore           = ref(0)
  const totalHoursPracticed    = ref(0)

  // Actions
  function setProfile(data) {
    displayName.value            = data.displayName           ?? null
    currentLevel.value           = data.currentLevel          ?? null
    levelProgress.value          = data.levelProgress         ?? 0
    dailyStreak.value            = data.dailyStreak           ?? 0
    totalSessionsCompleted.value = data.totalSessionsCompleted ?? 0
    totalVocabularyWords.value   = data.totalVocabularyWords  ?? 0
    averageScore.value           = data.averageScore          ?? 0
    totalHoursPracticed.value    = data.totalHoursPracticed   ?? 0
  }

  function reset() {
    displayName.value            = null
    currentLevel.value           = null
    levelProgress.value          = 0
    dailyStreak.value            = 0
    totalSessionsCompleted.value = 0
    totalVocabularyWords.value   = 0
    averageScore.value           = 0
    totalHoursPracticed.value    = 0
  }

  return {
    displayName,
    currentLevel,
    levelProgress,
    dailyStreak,
    totalSessionsCompleted,
    totalVocabularyWords,
    averageScore,
    totalHoursPracticed,
    setProfile,
    reset
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
