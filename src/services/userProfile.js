// src/services/userProfile.js
// Firestore user document management.
// createUserProfile: safe to call on every sign-in — getDoc check prevents overwrites.
// fetchUserProfile: reads existing profile to load onboardingCompleted and other fields.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

/**
 * Creates a Firestore users/{userId} document for first-time sign-in.
 * Checks for existing document first — never overwrites an existing profile.
 * Uses TRD schema (all fields from Technical Requirements Document).
 *
 * @param {import('firebase/auth').User} firebaseUser - Firebase Auth user object
 */
export async function createUserProfile(firebaseUser) {
  const userRef = doc(db, 'users', firebaseUser.uid)
  const snap    = await getDoc(userRef)

  if (snap.exists()) {
    // Profile already exists — this is a returning user, do not overwrite.
    return
  }

  // First sign-in — create document with full TRD schema.
  // setDoc without { merge: true } creates a new document (default behavior).
  await setDoc(userRef, {
    email:                  firebaseUser.email,
    displayName:            firebaseUser.displayName,
    photoURL:               firebaseUser.photoURL,
    currentLevel:           'B1',
    levelProgress:          0,
    dailyStreak:            0,
    lastSessionDate:        null,
    totalVocabularyWords:   0,
    totalMinutesPracticed:  0,
    totalSessionsCompleted: 0,
    averageScore:           0,
    onboardingCompleted:    false,
    freeSessionUsed:        false,
    subscriptionStatus:     'none',
    subscriptionExpiresAt:  null,
    createdAt:              serverTimestamp(),
    updatedAt:              serverTimestamp()
  })
}

/**
 * Fetches the Firestore user profile for the given uid.
 * Returns the document data or null if the document does not exist.
 *
 * @param {string} uid - Firebase Auth user ID
 * @returns {Object|null} Firestore document data or null
 */
export async function fetchUserProfile(uid) {
  const userRef = doc(db, 'users', uid)
  const snap    = await getDoc(userRef)
  return snap.exists() ? snap.data() : null
}
