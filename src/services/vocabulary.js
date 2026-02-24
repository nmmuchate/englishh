// src/services/vocabulary.js
// Vocabulary subcollection reads and writes.
// Path: vocabulary/{userId}/words/{wordId}

import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

/**
 * Loads all words from the vocabulary/{uid}/words subcollection.
 * Returns an array of { id, word, definition, exampleSentence, ... } objects.
 * Returns [] if the subcollection is empty.
 *
 * @param {string} uid - Firebase Auth user ID
 * @returns {Promise<Array>}
 */
export async function loadVocabularyWords(uid) {
  const wordsRef = collection(db, 'vocabulary', uid, 'words')
  const snap = await getDocs(wordsRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Saves a vocabulary word to vocabulary/{uid}/words/{autoId}.
 * Uses TRD schema fields.
 *
 * @param {string} uid - Firebase Auth user ID
 * @param {Object} wordData - { word, definition, example, sourceSessionId? }
 */
export async function saveVocabularyWord(uid, wordData) {
  const wordsRef = collection(db, 'vocabulary', uid, 'words')
  await addDoc(wordsRef, {
    word:             wordData.word,
    definition:       wordData.definition,
    exampleSentence:  wordData.example ?? wordData.exampleSentence ?? '',
    sourceSessionId:  wordData.sourceSessionId ?? null,
    timesEncountered: 1,
    savedAt:          serverTimestamp(),
    lastReviewedAt:   null
  })
}
