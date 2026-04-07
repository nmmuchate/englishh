<template>
  <div class="vocabulary-stage q-pa-md">

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <q-skeleton type="rect" height="8px" class="q-mb-md" />
      <q-skeleton type="rect" height="120px" class="q-mb-sm" />
      <q-skeleton type="rect" height="48px" class="q-mb-sm" v-for="i in 4" :key="i" />
    </template>

    <!-- Error state -->
    <template v-else-if="loadError">
      <q-banner class="bg-red-1 text-red-9 q-mb-md" rounded>
        {{ loadError }}
      </q-banner>
      <q-btn
        label="Retry"
        color="primary"
        unelevated
        rounded
        no-caps
        class="full-width"
        @click="fetchQuestions"
      />
      <q-btn
        label="Skip this stage"
        flat
        no-caps
        class="full-width q-mt-sm text-grey-6"
        @click="$emit('skip')"
      />
    </template>

    <!-- Main question flow -->
    <template v-else-if="currentQuestion">

      <!-- Progress bar -->
      <div class="row justify-between items-center q-mb-xs">
        <span class="text-caption text-grey-6">Vocabulary &amp; Reading</span>
        <span class="text-caption text-primary text-weight-bold">{{ progressLabel }}</span>
      </div>
      <q-linear-progress
        :value="progressValue"
        color="primary"
        rounded
        class="q-mb-lg"
        style="height: 6px;"
      />

      <!-- Reading passage header (shown above first passage question only) -->
      <div v-if="isPassageSection && currentIndex === questions.length" class="q-mb-md">
        <p class="text-overline text-grey-5 q-mb-xs">READ THE PASSAGE</p>
        <q-card flat bordered class="q-pa-md q-mb-md">
          <p class="text-body2" style="line-height: 1.7;">{{ passage.text }}</p>
        </q-card>
        <p class="text-overline text-grey-5 q-mb-xs">COMPREHENSION QUESTIONS</p>
      </div>

      <!-- Question card -->
      <q-card flat class="q-mb-lg" style="background: transparent;">
        <q-card-section class="q-pa-none">
          <p class="text-subtitle1 text-weight-medium q-mb-md" style="line-height: 1.5;">
            {{ currentQuestion.sentence || currentQuestion.question }}
          </p>
          <!-- Answer options -->
          <div class="column q-gutter-sm">
            <q-btn
              v-for="(option, idx) in currentQuestion.options"
              :key="idx"
              :label="option"
              unelevated
              rounded
              no-caps
              class="full-width text-left"
              :class="{
                'bg-primary text-white': showFeedback && idx === currentQuestion.correctIndex,
                'bg-red-1 text-red-9': showFeedback && idx === selectedOptionIndex && idx !== currentQuestion.correctIndex,
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

      <!-- Next / Continue button (visible after selection) -->
      <q-btn
        v-if="showFeedback"
        :label="currentIndex < allQuestions.length - 1 ? 'Next Question' : 'See Results'"
        color="primary"
        unelevated
        rounded
        no-caps
        class="full-width"
        @click="handleNext"
      />

      <!-- Skip link -->
      <div class="text-center q-mt-md">
        <q-btn
          label="Skip this stage"
          flat
          no-caps
          size="sm"
          class="text-grey-5"
          @click="$emit('skip')"
        />
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

const emit = defineEmits(['complete', 'skip'])

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const placementStore = usePlacementStore()
const authStore = useAuthStore()

const isLoading = ref(true)
const loadError = ref(null)
const questions = ref([])       // flat array: all MCQ questions
const passage = ref(null)       // { text, questions[] } or null
const passageQuestions = ref([]) // passage.questions flattened for iteration

const adaptiveLevel = ref(placementStore.adaptiveLevel || 'B1')
const consecutiveCorrect = ref(0)
const consecutiveWrong = ref(0)

// Flat list of all question IDs in order: MCQ first, then passage questions
const allQuestions = computed(() => [
  ...questions.value,
  ...(passageQuestions.value)
])
const currentIndex = ref(0)           // index into allQuestions
const currentQuestion = computed(() => allQuestions.value[currentIndex.value] ?? null)
const answers = ref([])               // { id, correct } pushed on each answer

const selectedOptionIndex = ref(null) // null = no selection yet
const showFeedback = ref(false)       // true after user selects an option

async function fetchQuestions() {
  isLoading.value = true
  loadError.value = null
  try {
    const fn = httpsCallable(functions, 'generateTestQuestions')
    const userProfile = authStore.profile ?? {}
    const result = await fn({ type: 'vocabulary', level: adaptiveLevel.value, userProfile })
    questions.value = result.data.questions        // MCQ array
    passage.value = result.data.passage            // passage object
    passageQuestions.value = result.data.passage?.questions ?? []
  } catch (err) {
    console.error('VocabularyStage fetchQuestions failed:', err)
    loadError.value = err.message || 'Failed to load questions. Please retry.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchQuestions()
})

function handleAnswer(optionIndex) {
  if (showFeedback.value) return   // prevent double-tap
  selectedOptionIndex.value = optionIndex
  showFeedback.value = true

  const q = currentQuestion.value
  const isCorrect = optionIndex === q.correctIndex
  answers.value.push({ id: q.id, correct: isCorrect })

  // Adaptive difficulty counters
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

  if (currentIndex.value < allQuestions.value.length - 1) {
    currentIndex.value++
  } else {
    // All questions answered — compute score and emit complete
    const totalAnswered = answers.value.length
    const totalCorrect = answers.value.filter(a => a.correct).length
    const score = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
    emit('complete', { score, level: adaptiveLevel.value, answers: answers.value })
  }
}

const progressValue = computed(() =>
  allQuestions.value.length > 0
    ? currentIndex.value / allQuestions.value.length
    : 0
)
const progressLabel = computed(() =>
  `${currentIndex.value + 1} / ${allQuestions.value.length}`
)

const isPassageSection = computed(() =>
  currentIndex.value >= questions.value.length && passage.value !== null
)
</script>

<style scoped>
.vocabulary-stage {
  min-height: 50vh;
}
.bg-primary-light {
  background: rgba(76, 174, 79, 0.12);
}
</style>
