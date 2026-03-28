import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'
import { useProfileStore } from 'stores/profile'

// Callable references — created once at module level (no secret dependency)
const startConversationFn = httpsCallable(functions, 'startConversation')
const sendMessageFn = httpsCallable(functions, 'sendMessage')
const endSessionFn = httpsCallable(functions, 'endSession')

export const useSessionStore = defineStore('session', () => {
  // State — existing
  const isActive = ref(false)
  const durationSeconds = ref(0)
  const mistakeCount = ref(0)
  const overallScore = ref(null)
  const sessionId = ref(null)
  // State — new for Phase 8
  const topic = ref('')
  const transcript = ref([])    // array of { speaker: 'user'|'ai', text: string }
  const isSending = ref(false)  // prevents double-sends during Gemini call
  const scores = ref(null)   // { fluency, grammar, vocabulary, overall } — set by endSession

  async function startSession() {
    isActive.value = true
    durationSeconds.value = 0
    mistakeCount.value = 0
    overallScore.value = null
    sessionId.value = null
    topic.value = ''
    transcript.value = []
    isSending.value = false

    const profileStore = useProfileStore()

    // Paywall gate — return signal if blocked (caller handles dialog)
    if (profileStore.freeSessionUsed && profileStore.subscriptionStatus !== 'active') {
      isActive.value = false
      return { paywallRequired: true }
    }

    try {
      const result = await startConversationFn({
        userLevel: profileStore.currentLevel ?? 'B1',
        sessionNumber: profileStore.totalSessionsCompleted + 1
      })
      // result.data = { sessionId, topic, initialMessage }
      sessionId.value = result.data.sessionId
      topic.value = result.data.topic

      // Add initial AI message to transcript
      transcript.value.push({ speaker: 'ai', text: result.data.initialMessage })
    } catch (err) {
      console.error('startSession error:', err)
      isActive.value = false
      return { paywallRequired: false, error: err.message }
    }

    return { paywallRequired: false }
  }

  async function sendMessage(userText) {
    if (!userText || !userText.trim() || isSending.value) return
    isSending.value = true

    // Add user message to transcript immediately (optimistic)
    transcript.value.push({ speaker: 'user', text: userText.trim() })

    if (!sessionId.value) {
      console.error('sendMessage: no sessionId — startSession did not complete')
      isSending.value = false
      return
    }

    try {
      const profileStore = useProfileStore()
      const result = await sendMessageFn({
        sessionId: sessionId.value,
        userMessage: userText.trim(),
        conversationHistory: transcript.value.slice(-10),
        userLevel: profileStore.currentLevel ?? 'B1',
        topic: topic.value
      })
      // result.data = { aiResponse, mistakes, newVocabulary }
      transcript.value.push({ speaker: 'ai', text: result.data.aiResponse })
      mistakeCount.value += (result.data.mistakes?.length ?? 0)
    } catch (err) {
      // Fallback message on error
      transcript.value.push({ speaker: 'ai', text: "That's interesting! Tell me more about that." })
      console.error('sendMessage error:', err)
    } finally {
      isSending.value = false
    }
  }

  async function endSession() {
    isActive.value = false
    try {
      const result = await endSessionFn({
        sessionId: sessionId.value,
        finalTranscript: transcript.value,
        durationSeconds: durationSeconds.value
      })
      // result.data = { scores: { fluency, grammar, vocabulary, overall }, feedback }
      scores.value = result.data.scores
      overallScore.value = result.data.scores?.overall ?? 0
    } catch (err) {
      console.error('endSession error:', err)
      overallScore.value = 0
      scores.value = null
    }
  }

  return {
    isActive, durationSeconds, mistakeCount, overallScore, sessionId,
    topic, transcript, isSending, scores,
    startSession, sendMessage, endSession
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot))
}
