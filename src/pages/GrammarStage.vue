<template>
  <div class="grammar-stage q-pa-md">

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
        <span class="text-caption text-grey-6">Grammar</span>
        <span class="text-caption text-primary text-weight-bold">{{ progressLabel }}</span>
      </div>
      <q-linear-progress
        :value="progressValue"
        color="primary"
        rounded
        class="q-mb-lg"
        style="height: 6px;"
      />

      <!-- Question card -->
      <q-card flat class="q-mb-lg" style="background: transparent;">
        <q-card-section class="q-pa-none">

          <!-- Error-spot question layout -->
          <template v-if="currentQuestion.kind === 'error-spot'">
            <p class="text-overline text-grey-5 q-mb-xs">SPOT THE ERROR</p>
            <p class="text-subtitle1 text-weight-medium q-mb-md" style="line-height: 1.7;">
              <template v-for="(part, i) in splitSentence(currentQuestion)" :key="i">
                <span
                  v-if="i === 1"
                  :class="showFeedback ? (lastAnswerCorrect ? 'text-positive' : 'text-negative text-strike') : 'text-negative bg-red-1'"
                  style="padding: 2px 4px; border-radius: 4px; font-weight: 600;"
                >{{ part }}</span>
                <span v-else>{{ part }}</span>
              </template>
            </p>
            <q-input
              v-model="userInput"
              label="Type the correction"
              outlined
              rounded
              class="q-mb-md"
              :disable="showFeedback"
              @keyup.enter="handleCheck"
            />
            <!-- Feedback message -->
            <div v-if="showFeedback" class="q-mb-md">
              <p v-if="lastAnswerCorrect" class="text-positive text-weight-medium">Correct!</p>
              <p v-else class="text-negative text-weight-medium">
                The correct answer is: <strong>{{ currentQuestion.correction }}</strong>
              </p>
              <p v-if="!lastAnswerCorrect" class="text-caption text-grey-6">{{ currentQuestion.explanation }}</p>
            </div>
          </template>

          <!-- Sentence-completion question layout -->
          <template v-else-if="currentQuestion.kind === 'sentence-completion'">
            <p class="text-overline text-grey-5 q-mb-xs">COMPLETE THE SENTENCE</p>
            <p class="text-subtitle1 text-weight-medium q-mb-md" style="line-height: 1.7;">
              {{ currentQuestion.stem }}
            </p>
            <q-input
              v-model="userInput"
              label="Fill in the blank"
              outlined
              rounded
              class="q-mb-md"
              :disable="showFeedback"
              @keyup.enter="handleCheck"
            />
            <div v-if="showFeedback" class="q-mb-md">
              <p v-if="lastAnswerCorrect" class="text-positive text-weight-medium">Correct!</p>
              <p v-else class="text-negative text-weight-medium">
                The correct answer is: <strong>{{ currentQuestion.answer }}</strong>
              </p>
            </div>
          </template>

        </q-card-section>
      </q-card>

      <!-- Check / Next buttons -->
      <q-btn
        v-if="!showFeedback"
        label="Check"
        color="primary"
        unelevated
        rounded
        no-caps
        class="full-width"
        :disable="!userInput.trim()"
        @click="handleCheck"
      />
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
const questions = ref([])   // flat array of all questions (error-spot + sentence-completion)

const adaptiveLevel = ref(placementStore.adaptiveLevel || 'B1')
const consecutiveCorrect = ref(0)
const consecutiveWrong = ref(0)

const allQuestions = computed(() => questions.value)
const currentIndex = ref(0)
const currentQuestion = computed(() => allQuestions.value[currentIndex.value] ?? null)
const answers = ref([])   // { id, correct } pushed on each answer

const userInput = ref('')
const showFeedback = ref(false)
const lastAnswerCorrect = ref(false)

async function fetchQuestions() {
  isLoading.value = true
  loadError.value = null
  try {
    const fn = httpsCallable(functions, 'generateTestQuestions')
    const userProfile = authStore.profile ?? {}
    const result = await fn({ type: 'grammar', level: adaptiveLevel.value, userProfile })
    questions.value = result.data.questions
  } catch (err) {
    console.error('GrammarStage fetchQuestions failed:', err)
    loadError.value = err.message || 'Failed to load questions. Please retry.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchQuestions()
})

function splitSentence(q) {
  const idx = q.sentence.indexOf(q.errorWord)
  if (idx === -1) return [q.sentence, '', '']
  return [
    q.sentence.slice(0, idx),
    q.errorWord,
    q.sentence.slice(idx + q.errorWord.length)
  ]
}

function handleCheck() {
  if (showFeedback.value || !userInput.value.trim()) return
  const q = currentQuestion.value
  let isCorrect = false

  if (q.kind === 'error-spot') {
    isCorrect = userInput.value.trim().toLowerCase() === q.correction.toLowerCase()
  } else if (q.kind === 'sentence-completion') {
    isCorrect = userInput.value.trim().toLowerCase() === q.answer.toLowerCase()
  }

  lastAnswerCorrect.value = isCorrect
  showFeedback.value = true
  answers.value.push({ id: q.id, correct: isCorrect })

  // Adaptive difficulty (identical to VocabularyStage)
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
  userInput.value = ''
  lastAnswerCorrect.value = false
  if (currentIndex.value < allQuestions.value.length - 1) {
    currentIndex.value++
  } else {
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
</script>

<style scoped>
.grammar-stage {
  min-height: 50vh;
}
</style>
