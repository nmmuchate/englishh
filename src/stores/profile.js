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
  // v1.2 fields
  const profile               = ref(null)        // { occupation, field, interests, goal, priorExperience }
  const placement             = ref(null)        // { overallLevel, skills, strengths, weaknesses, confidence, testedAt }
  const mistakePatterns       = ref([])          // array of { pattern, occurrences, lastSeen, corrections, status }
  const sessionTypesCompleted = ref({ freeTalk: 0, scenario: 0, storyBuilder: 0, debate: 0, review: 0 })

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
    profile.value               = data.profile             ?? null
    placement.value             = data.placement           ?? null
    mistakePatterns.value       = data.mistakePatterns     ?? []
    sessionTypesCompleted.value = data.sessionTypesCompleted ?? { freeTalk: 0, scenario: 0, storyBuilder: 0, debate: 0, review: 0 }
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
    profile.value               = null
    placement.value             = null
    mistakePatterns.value       = []
    sessionTypesCompleted.value = { freeTalk: 0, scenario: 0, storyBuilder: 0, debate: 0, review: 0 }
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
    profile,
    placement,
    mistakePatterns,
    sessionTypesCompleted,
    setProfile,
    reset
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
