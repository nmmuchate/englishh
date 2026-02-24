import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'
import { useProfileStore } from 'stores/profile'

export const useSessionStore = defineStore('session', () => {
  // State
  const isActive = ref(false)
  const durationSeconds = ref(0)
  const mistakeCount = ref(0)
  const overallScore = ref(null)
  const sessionId = ref(null)

  // Actions
  async function startSession(topic = '') {
    isActive.value = true
    durationSeconds.value = 0
    mistakeCount.value = 0
    overallScore.value = null
    sessionId.value = null

    const authStore = useAuthStore()
    const profileStore = useProfileStore()
    const docRef = await addDoc(collection(db, 'sessions'), {
      userId:    authStore.uid,
      topic:     topic,
      userLevel: profileStore.currentLevel ?? 'B1',
      createdAt: serverTimestamp()
    })
    sessionId.value = docRef.id
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
    sessionId,
    startSession,
    endSession
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot))
}
