import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'

export const usePlacementStore = defineStore('placement', () => {
  // State — current stage of the placement test
  const currentStage  = ref('profile')  // 'profile'|'vocabulary'|'listening'|'grammar'|'speaking'|'complete'
  // Stage results keyed by stage name, e.g. { vocabulary: { score, level, ... } }
  const stageResults  = ref({})
  // Running CEFR estimate updated after each scored stage
  const adaptiveLevel = ref('B1')
  // True after finalResult is set
  const isComplete    = ref(false)
  // { overallLevel, skillBreakdown, strengths, weaknesses, confidence } or null
  const finalResult   = ref(null)

  // Stage order for advancing currentStage
  const STAGE_ORDER = ['profile', 'vocabulary', 'listening', 'grammar', 'speaking', 'complete']

  // Actions

  /**
   * Load placement state from Firestore user doc data.
   * Called from auth.js after profileStore.setProfile().
   */
  function setPlacement(data) {
    finalResult.value   = data.placement ?? null
    isComplete.value    = data.placement != null
    adaptiveLevel.value = data.placement?.overallLevel ?? 'B1'
    stageResults.value  = {}  // stage results live in placementTests collection, not user doc
    currentStage.value  = data.placement ? 'complete' : 'profile'
  }

  /**
   * Set a single stage result, advance currentStage, update adaptiveLevel,
   * and persist to Firestore immediately (D-05 progressive save).
   */
  function setStageResult(stageKey, result) {
    stageResults.value[stageKey] = result
    adaptiveLevel.value = result.level ?? adaptiveLevel.value

    // Advance to next stage
    const idx = STAGE_ORDER.indexOf(stageKey)
    if (idx !== -1 && idx + 1 < STAGE_ORDER.length) {
      currentStage.value = STAGE_ORDER[idx + 1]
    }

    // Persist immediately (D-05)
    saveStageResult(stageKey, result)
  }

  /**
   * Async: persist a single stage result to placementTests/{uid} with merge:true.
   * Implements D-05 progressive save — never overwrites sibling stages.
   */
  async function saveStageResult(stageKey, data) {
    const authStore = useAuthStore()
    const uid = authStore.uid
    if (!uid) return
    try {
      await setDoc(
        doc(db, 'placementTests', uid),
        { stages: { [stageKey]: { ...data, completed: true } } },
        { merge: true }
      )
    } catch (err) {
      console.error('saveStageResult error:', err)
    }
  }

  /**
   * Mark the placement test complete with the final computed result.
   * Persists completedAt + finalResult to placementTests/{uid}.
   */
  async function completeTest(result) {
    finalResult.value  = result
    isComplete.value   = true
    currentStage.value = 'complete'

    const authStore = useAuthStore()
    const uid = authStore.uid
    if (!uid) return
    try {
      await setDoc(
        doc(db, 'placementTests', uid),
        { completedAt: serverTimestamp(), finalResult: result },
        { merge: true }
      )
    } catch (err) {
      console.error('completeTest error:', err)
    }
  }

  /** Reset all state to initial values (called on sign-out). */
  function reset() {
    currentStage.value  = 'profile'
    stageResults.value  = {}
    adaptiveLevel.value = 'B1'
    isComplete.value    = false
    finalResult.value   = null
  }

  return {
    currentStage,
    stageResults,
    adaptiveLevel,
    isComplete,
    finalResult,
    setPlacement,
    setStageResult,
    saveStageResult,
    completeTest,
    reset
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlacementStore, import.meta.hot))
}
