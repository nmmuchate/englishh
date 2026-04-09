<template>
  <div class="listening-stage q-pa-md">

    <!-- Loading skeleton (same as VocabularyStage) -->
    <template v-if="isLoading">
      <q-skeleton type="rect" height="8px" class="q-mb-md" />
      <q-skeleton type="rect" height="80px" class="q-mb-sm" />
      <q-skeleton type="rect" height="48px" class="q-mb-sm" v-for="i in 3" :key="i" />
    </template>

    <!-- Error state (same as VocabularyStage) -->
    <template v-else-if="loadError">
      <q-banner class="bg-red-1 text-red-9 q-mb-md" rounded>
        {{ loadError }}
      </q-banner>
      <q-btn label="Retry" color="primary" unelevated rounded no-caps class="full-width" @click="fetchTasks" />
      <q-btn label="Skip this stage" flat no-caps class="full-width q-mt-sm text-grey-6" @click="$emit('skip')" />
    </template>

    <!-- Main task flow -->
    <template v-else-if="currentTask">

      <!-- Progress bar -->
      <div class="row justify-between items-center q-mb-xs">
        <span class="text-caption text-grey-6">Listening</span>
        <span class="text-caption text-primary text-weight-bold">{{ progressLabel }}</span>
      </div>
      <q-linear-progress :value="progressValue" color="primary" rounded class="q-mb-lg" style="height: 6px;" />

      <!-- Task type label -->
      <p class="text-overline text-grey-5 q-mb-xs">
        {{ currentTask.kind === 'sentence' ? 'LISTEN TO THE SENTENCE' : currentTask.kind === 'dialogue' ? 'LISTEN TO THE DIALOGUE' : 'LISTEN TO THE PASSAGE' }}
      </p>

      <!-- Audio player -->
      <ListeningPlayer
        :text="currentTask.prompt"
        :max-replays="1"
        :disabled="showFeedback"
        @played="handleAudioPlayed"
      />

      <!-- Question (shown after audio played at least once) -->
      <q-card v-if="hasPlayedCurrent" flat class="q-mb-lg q-mt-md" style="background: transparent;">
        <q-card-section class="q-pa-none">
          <p class="text-subtitle1 text-weight-medium q-mb-md" style="line-height: 1.5;">
            {{ currentTask.question }}
          </p>
          <!-- Answer options -->
          <div class="column q-gutter-sm">
            <q-btn
              v-for="(option, idx) in currentTask.options"
              :key="idx"
              :label="option"
              unelevated
              rounded
              no-caps
              class="full-width text-left"
              :class="{
                'bg-primary text-white': showFeedback && idx === currentTask.correctIndex,
                'bg-red-1 text-red-9': showFeedback && idx === selectedOptionIndex && idx !== currentTask.correctIndex,
                'bg-grey-2': !showFeedback && idx !== selectedOptionIndex,
                'bg-primary-light': !showFeedback && idx === selectedOptionIndex
              }"
              :style="{ justifyContent: 'flex-start', padding: '12px 16px' }"
              @click="handleAnswer(idx)"
              :disable="showFeedback"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Hint to play audio first (shown before audio played) -->
      <p v-if="!hasPlayedCurrent && !showFeedback" class="text-center text-body2 text-grey-5 q-mt-lg">
        Tap Play to hear the audio before answering
      </p>

      <!-- Next button (visible after selection) -->
      <q-btn
        v-if="showFeedback"
        :label="currentTaskIndex < tasks.length - 1 ? 'Next Task' : 'See Results'"
        color="primary"
        unelevated
        rounded
        no-caps
        class="full-width q-mt-md"
        @click="handleNext"
      />

      <!-- Skip link -->
      <div class="text-center q-mt-md">
        <q-btn label="Skip this stage" flat no-caps size="sm" class="text-grey-5" @click="$emit('skip')" />
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'
import { usePlacementStore } from 'stores/placement'
import { useAuthStore } from 'stores/auth'
import ListeningPlayer from './ListeningPlayer.vue'

const emit = defineEmits(['complete', 'skip'])

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const placementStore = usePlacementStore()
const authStore = useAuthStore()

const isLoading = ref(true)
const loadError = ref(null)
const tasks = ref([])
const currentTaskIndex = ref(0)
const currentTask = computed(() => tasks.value[currentTaskIndex.value] ?? null)
const answers = ref([])
const selectedOptionIndex = ref(null)
const showFeedback = ref(false)
const hasPlayedCurrent = ref(false) // CRITICAL: gates answer selection until audio played

const adaptiveLevel = ref(placementStore.adaptiveLevel || 'B1')
const consecutiveCorrect = ref(0)
const consecutiveWrong = ref(0)

async function fetchTasks() {
  isLoading.value = true
  loadError.value = null
  try {
    const fn = httpsCallable(functions, 'generateTestQuestions')
    const userProfile = authStore.profile ?? {}
    const result = await fn({ type: 'listening', level: adaptiveLevel.value, userProfile })
    tasks.value = result.data.tasks
  } catch (err) {
    console.error('ListeningStage fetchTasks failed:', err)
    loadError.value = err.message || 'Failed to load listening tasks. Please retry.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchTasks()
})

function handleAudioPlayed() {
  hasPlayedCurrent.value = true
}

function handleAnswer(optionIndex) {
  if (showFeedback.value || !hasPlayedCurrent.value) return
  selectedOptionIndex.value = optionIndex
  showFeedback.value = true
  const isCorrect = optionIndex === currentTask.value.correctIndex
  answers.value.push({ id: currentTask.value.id, correct: isCorrect })
  // Adaptive difficulty — identical to VocabularyStage
  if (isCorrect) {
    consecutiveCorrect.value++
    consecutiveWrong.value = 0
    if (consecutiveCorrect.value >= 2) {
      const idx = CEFR_ORDER.indexOf(adaptiveLevel.value)
      if (idx < CEFR_ORDER.length - 1) adaptiveLevel.value = CEFR_ORDER[idx + 1]
      consecutiveCorrect.value = 0
    }
  } else {
    consecutiveWrong.value++
    consecutiveCorrect.value = 0
    if (consecutiveWrong.value >= 2) {
      const idx = CEFR_ORDER.indexOf(adaptiveLevel.value)
      if (idx > 0) adaptiveLevel.value = CEFR_ORDER[idx - 1]
      consecutiveWrong.value = 0
    }
  }
}

function handleNext() {
  showFeedback.value = false
  selectedOptionIndex.value = null
  hasPlayedCurrent.value = false // reset audio gate for next task
  if (currentTaskIndex.value < tasks.value.length - 1) {
    currentTaskIndex.value++
  } else {
    const total = answers.value.length
    const correct = answers.value.filter(a => a.correct).length
    const score = total > 0 ? Math.round((correct / total) * 100) : 0
    emit('complete', { score, level: adaptiveLevel.value, answers: answers.value })
  }
}

const progressValue = computed(() => tasks.value.length > 0 ? currentTaskIndex.value / tasks.value.length : 0)
const progressLabel = computed(() => `${currentTaskIndex.value + 1} / ${tasks.value.length}`)
</script>

<style scoped>
.listening-stage {
  min-height: 50vh;
}
.bg-primary-light {
  background: rgba(76, 174, 79, 0.12);
}
</style>
