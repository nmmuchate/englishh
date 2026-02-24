// src/stores/vocabulary.js
// Vocabulary store — loads from and writes to Firestore vocabulary subcollection.

import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from 'stores/auth'
import { loadVocabularyWords, saveVocabularyWord } from 'src/services/vocabulary'

export const useVocabularyStore = defineStore('vocabulary', () => {
  const words     = ref([])
  const isLoading = ref(false)

  async function loadWords() {
    const authStore = useAuthStore()
    if (!authStore.uid) return
    isLoading.value = true
    try {
      words.value = await loadVocabularyWords(authStore.uid)
    } finally {
      isLoading.value = false
    }
  }

  async function saveWord(wordData) {
    const authStore = useAuthStore()
    if (!authStore.uid) return
    await saveVocabularyWord(authStore.uid, wordData)
    // Re-load to reflect the new word in the list
    await loadWords()
  }

  function reset() {
    words.value = []
    isLoading.value = false
  }

  return { words, isLoading, loadWords, saveWord, reset }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVocabularyStore, import.meta.hot))
}
