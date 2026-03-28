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
  const totalMinutesPracticed    = ref(0)
  // Paywall fields
  const freeSessionUsed        = ref(false)
  const subscriptionStatus     = ref('none')     // 'none' | 'active' | 'cancelled'

  // Actions
  function setProfile(data) {
    displayName.value            = data.displayName           ?? null
    currentLevel.value           = data.currentLevel          ?? null
    levelProgress.value          = data.levelProgress         ?? 0
    dailyStreak.value            = data.dailyStreak           ?? 0
    totalSessionsCompleted.value = data.totalSessionsCompleted ?? 0
    totalVocabularyWords.value   = data.totalVocabularyWords  ?? 0
    averageScore.value           = data.averageScore          ?? 0
    totalMinutesPracticed.value    = data.totalMinutesPracticed   ?? 0
    freeSessionUsed.value        = data.freeSessionUsed       ?? false
    subscriptionStatus.value     = data.subscriptionStatus    ?? 'none'
  }

  function reset() {
    displayName.value            = null
    currentLevel.value           = null
    levelProgress.value          = 0
    dailyStreak.value            = 0
    totalSessionsCompleted.value = 0
    totalVocabularyWords.value   = 0
    averageScore.value           = 0
    totalMinutesPracticed.value    = 0
    freeSessionUsed.value        = false
    subscriptionStatus.value     = 'none'
  }

  return {
    displayName,
    currentLevel,
    levelProgress,
    dailyStreak,
    totalSessionsCompleted,
    totalVocabularyWords,
    averageScore,
    totalMinutesPracticed,
    freeSessionUsed,
    subscriptionStatus,
    setProfile,
    reset
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
