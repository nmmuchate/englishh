<template>
  <q-page class="onboarding-page column">
    <!-- Stage progress bar (D-04) — ABOVE the stepper, visible on every stage -->
    <div class="q-px-lg q-pt-lg q-pb-md">
      <div class="row justify-between items-center q-mb-sm">
        <span class="text-overline text-weight-bold" style="letter-spacing: 0.08em;">
          Placement Test
        </span>
        <span class="text-caption text-primary text-weight-bold">{{ stageLabel }}</span>
      </div>
      <q-linear-progress
        :value="stageProgress"
        color="primary"
        rounded
        style="height: 8px; border-radius: var(--radius-full, 999px);"
      />
    </div>

    <!-- Inline error banner (saveError) -->
    <q-banner v-if="saveError" class="bg-red-1 text-red-9 q-mx-lg q-mb-md" rounded>
      {{ saveError }}
    </q-banner>

    <!-- Saving overlay -->
    <q-inner-loading :showing="isSaving">
      <q-spinner-dots size="48px" color="primary" />
    </q-inner-loading>

    <!-- 5-stage QStepper shell (D-03) — header hidden via :header-nav=false + scoped CSS -->
    <q-stepper
      v-model="step"
      flat
      :header-nav="false"
      animated
      class="onboarding-stepper col"
    >
      <!-- Stage 1: Quick Profile (D-05) -->
      <q-step name="profile" title="Quick Profile" :done="step !== 'profile'">
        <QuickProfileStage
          @complete="handleProfileComplete"
          @back="handleProfileBack"
        />
      </q-step>

      <!-- Stage 2: Vocabulary -->
      <q-step name="vocabulary" title="Vocabulary &amp; Reading">
        <VocabularyStage
          @complete="handleVocabComplete"
          @skip="handleVocabSkip"
        />
      </q-step>

      <!-- Stage 3: Listening -->
      <q-step name="listening" title="Listening">
        <ListeningStage
          @complete="handleListeningComplete"
          @skip="handleListeningSkip"
        />
      </q-step>

      <!-- Stage 4: Grammar -->
      <q-step name="grammar" title="Grammar">
        <GrammarStage
          @complete="handleGrammarComplete"
          @skip="handleGrammarSkip"
        />
      </q-step>

      <!-- Stage 5a: Speaking -->
      <q-step name="speaking" title="Speaking">
        <SpeakingStage
          @complete="handleSpeakingComplete"
          @skip="handleSpeakingSkip"
        />
      </q-step>

      <!-- Stage 5b: Writing -->
      <q-step name="writing" title="Writing">
        <WritingStage
          @complete="handleWritingComplete"
          @skip="handleWritingSkip"
        />
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'
import { useAuthStore } from 'stores/auth'
import { usePlacementStore } from 'stores/placement'
import QuickProfileStage from './QuickProfileStage.vue'
import VocabularyStage from './VocabularyStage.vue'
import GrammarStage from './GrammarStage.vue'
import ListeningStage from './ListeningStage.vue'
import SpeakingStage from './SpeakingStage.vue'
import WritingStage from './WritingStage.vue'

const router = useRouter()
const authStore = useAuthStore()
const placementStore = usePlacementStore()

// Current stage step name — drives QStepper v-model
const step = ref('profile')

// Stage index map (Pitfall 4 — never compute from string parsing)
const STAGE_INDEX = {
  profile:    1,
  vocabulary: 2,
  listening:  3,
  grammar:    4,
  speaking:   5,
  writing:    6
}
const TOTAL_STAGES = 6

const stageIndex = computed(() => STAGE_INDEX[step.value] ?? 1)
const stageProgress = computed(() => stageIndex.value / TOTAL_STAGES)
const stageLabel = computed(() => `Stage ${stageIndex.value} of ${TOTAL_STAGES}`)

const isSaving = ref(false)
const saveError = ref(null)

async function handleProfileComplete(profileData) {
  const uid = authStore.uid
  if (!uid) {
    console.error('handleProfileComplete: no authenticated uid')
    return
  }
  isSaving.value = true
  saveError.value = null
  try {
    // Write 1 (D-06): users/{uid}.profile via dot-notation updateDoc
    // Phase 7 pattern — never use setDoc without merge on user doc
    await updateDoc(doc(db, 'users', uid), {
      'profile.occupation':      profileData.occupation,
      'profile.field':           profileData.field ?? null,
      'profile.interests':       profileData.interests,
      'profile.goal':            profileData.goal,
      'profile.priorExperience': profileData.priorExperience
    })

    // Write 2 (D-06): placementTests/{uid} via setDoc merge
    // Initializes userId + startedAt only — setStageResult (below) handles stages.profile
    await setDoc(doc(db, 'placementTests', uid), {
      userId: uid,
      startedAt: serverTimestamp()
    }, { merge: true })

    // Sync placement store in-memory state AND write stages.profile to Firestore
    // setStageResult does a setDoc merge on placementTests/{uid}.stages.{key} internally
    placementStore.setStageResult('profile', { completed: true, data: profileData })

    // Advance QStepper to vocabulary stub
    step.value = 'vocabulary'
  } catch (err) {
    console.error('handleProfileComplete failed:', err)
    saveError.value = err.message || 'Failed to save profile. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function handleProfileBack() {
  // D-02: sub-step 1 back exits onboarding. Cleanest UX is route to landing.
  router.push({ name: 'landing' })
}

async function handleVocabComplete(result) {
  isSaving.value = true
  saveError.value = null
  try {
    placementStore.setStageResult('vocabulary', result)
    step.value = 'listening'
  } catch (err) {
    console.error('handleVocabComplete failed:', err)
    saveError.value = err.message || 'Failed to save vocabulary results. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function handleVocabSkip() {
  placementStore.setStageResult('vocabulary', { score: 0, level: 'B1', skipped: true, answers: [] })
  step.value = 'listening'
}

async function handleListeningComplete(result) {
  isSaving.value = true
  saveError.value = null
  try {
    placementStore.setStageResult('listening', result)
    step.value = 'grammar'
  } catch (err) {
    console.error('handleListeningComplete failed:', err)
    saveError.value = err.message || 'Failed to save listening results. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function handleListeningSkip() {
  placementStore.setStageResult('listening', { score: 0, level: 'B1', skipped: true, answers: [] })
  step.value = 'grammar'
}

async function handleGrammarComplete(result) {
  isSaving.value = true
  saveError.value = null
  try {
    placementStore.setStageResult('grammar', result)
    step.value = 'speaking'
  } catch (err) {
    console.error('handleGrammarComplete failed:', err)
    saveError.value = err.message || 'Failed to save grammar results. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function handleGrammarSkip() {
  placementStore.setStageResult('grammar', { score: 0, level: 'B1', skipped: true, answers: [] })
  step.value = 'speaking'
}

async function handleSpeakingComplete(result) {
  isSaving.value = true
  saveError.value = null
  try {
    placementStore.setStageResult('speaking', result)
    step.value = 'writing'
  } catch (err) {
    console.error('handleSpeakingComplete failed:', err)
    saveError.value = err.message || 'Failed to save speaking results. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function handleSpeakingSkip() {
  placementStore.setStageResult('speaking', { score: 0, level: 'B1', skipped: true, answers: [] })
  step.value = 'writing'
}

async function handleWritingComplete(result) {
  isSaving.value = true
  saveError.value = null
  try {
    placementStore.setStageResult('writing', result)
    // All stages done — navigate to placement result page
    // calculatePlacement Cloud Function is called by PlacementResultPage on mount
    router.push({ name: 'placement-result' })
  } catch (err) {
    console.error('handleWritingComplete failed:', err)
    saveError.value = err.message || 'Failed to save writing results. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function handleWritingSkip() {
  placementStore.setStageResult('writing', { score: 0, level: 'B1', skipped: true, answers: [] })
  router.push({ name: 'placement-result' })
}
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: var(--page-bg, #fafafa);
}

.onboarding-stepper {
  background: transparent;
}

/* D-03 hidden-header pattern — preserved from Phase 2 decision [02-02] */
:deep(.q-stepper__header) {
  display: none;
}

:deep(.q-stepper__step-inner) {
  padding: 0;
}

:deep(.q-stepper__nav) {
  display: none;
}
</style>
