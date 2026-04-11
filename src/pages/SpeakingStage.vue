<template>
  <div class="speaking-stage q-pa-md">

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <q-skeleton type="rect" height="8px" class="q-mb-md" />
      <q-skeleton type="rect" height="80px" class="q-mb-sm" />
      <q-skeleton type="rect" height="48px" />
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
        @click="fetchPrompt"
      />
      <q-btn
        label="Skip this stage"
        flat
        no-caps
        class="full-width q-mt-sm text-grey-6"
        @click="$emit('skip')"
      />
    </template>

    <!-- Main conversation flow -->
    <template v-else>

      <!-- Progress bar -->
      <div class="row justify-between items-center q-mb-xs">
        <span class="text-caption text-grey-6">Speaking</span>
        <span class="text-caption text-primary text-weight-bold">Exchange {{ currentExchange }} of {{ totalExchanges }}</span>
      </div>
      <q-linear-progress
        :value="progressValue"
        color="primary"
        rounded
        class="q-mb-lg"
        style="height: 6px;"
        aria-label="Stage progress"
      />

      <!-- AI prompt card (first exchange instruction) -->
      <q-card v-if="exchanges.length === 0" flat class="q-mb-lg" style="background: transparent;">
        <q-card-section class="q-pa-none">
          <p class="text-overline text-grey-5 q-mb-xs">SPEAKING TASK</p>
          <p class="text-subtitle1 text-weight-bold q-mb-xs" style="line-height: 1.5;">
            {{ aiPrompt }}
          </p>
          <p class="text-caption text-grey-5">Tap the mic to record your response, or type below.</p>
        </q-card-section>
      </q-card>

      <!-- Exchange bubbles -->
      <div v-if="exchanges.length > 0" class="column q-gutter-sm q-mb-lg">
        <template v-for="(ex, idx) in exchanges" :key="idx">
          <!-- AI bubble -->
          <div class="row items-end q-gutter-sm">
            <div class="exchange-bubble exchange-bubble--ai text-body2">
              {{ ex.aiText }}
            </div>
          </div>
          <!-- User bubble -->
          <div v-if="ex.userText" class="row items-end justify-end q-gutter-sm">
            <div class="exchange-bubble exchange-bubble--user text-body2">
              {{ ex.userText }}
            </div>
          </div>
        </template>

        <!-- AI response loading -->
        <div v-if="isAiResponding" class="row items-end q-gutter-sm">
          <div class="exchange-bubble exchange-bubble--ai text-body2 text-grey-5">
            <q-spinner-dots size="20px" color="primary" />
          </div>
        </div>
      </div>

      <!-- Interim transcript (live preview while recording) -->
      <p v-if="interimText" class="text-body2 text-grey-5 text-center q-mb-sm">
        {{ interimText }}...
      </p>

      <!-- Mic button (centered) — shown when speech is available and not in text mode -->
      <div v-if="speechAvailable && !showTextInput" class="column items-center q-mb-lg">
        <q-btn
          round
          unelevated
          :color="isRecording ? 'negative' : 'primary'"
          :icon="isRecording ? 'stop' : 'mic'"
          size="lg"
          class="mic-btn"
          :class="{ 'mic-btn--recording': isRecording }"
          :aria-label="isRecording ? 'Recording — tap to stop' : 'Tap to speak'"
          :disable="isAiResponding || isSaving"
          @click="toggleMic"
        />
        <p class="text-caption text-grey-5 q-mt-sm">
          {{ isRecording ? 'Recording — tap to stop' : 'Tap to speak' }}
        </p>
      </div>

      <!-- Text fallback input -->
      <div v-if="showTextInput" class="q-mb-lg">
        <q-input
          v-model="textInput"
          label="Type your response"
          outlined
          rounded
          class="q-mb-sm"
          :disable="isAiResponding || isSaving"
          :input-attrs="{ 'aria-label': 'Write your response' }"
          @keyup.enter="submitTextResponse"
        />
        <q-btn
          label="Send"
          color="primary"
          unelevated
          rounded
          no-caps
          class="full-width"
          :disable="!textInput.trim() || isAiResponding || isSaving"
          @click="submitTextResponse"
        />
      </div>

      <!-- Toggle text/mic for speech-unavailable fallback -->
      <div v-if="!speechAvailable" class="text-center q-mb-sm">
        <q-btn
          :label="showTextInput ? 'Hide keyboard' : 'Type instead'"
          flat
          no-caps
          size="sm"
          class="text-grey-5"
          @click="showTextInput = !showTextInput"
        />
      </div>

      <!-- Submit Speaking button (appears after final exchange) -->
      <q-btn
        v-if="allExchangesDone && !isSaving"
        label="Submit Speaking"
        color="primary"
        unelevated
        rounded
        no-caps
        class="full-width q-mt-md"
        @click="submitSpeaking"
      />

      <!-- Saving overlay -->
      <div v-if="isSaving" class="column items-center q-mt-md">
        <q-spinner-dots size="32px" color="primary" />
        <p class="text-caption text-grey-5 q-mt-sm">Evaluating your speaking...</p>
      </div>

      <!-- Save error -->
      <q-banner v-if="saveError" class="bg-red-1 text-red-9 q-mt-md" rounded>
        {{ saveError }}
      </q-banner>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'
import { usePlacementStore } from 'stores/placement'
import { useAuthStore } from 'stores/auth'

const emit = defineEmits(['complete', 'skip'])

const placementStore = usePlacementStore()
const authStore = useAuthStore()

// Speech availability check (Phase 8 decision [08-02])
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const speechAvailable = !!SpeechRecognition
let recognition = null

// Stage state
const isLoading = ref(false)
const loadError = ref(null)
const isSaving = ref(false)
const saveError = ref(null)

// Conversation state
const aiPrompt = ref('')
const exchanges = ref([])  // [{ aiText, userText }]
const isRecording = ref(false)
const isAiResponding = ref(false)
const interimText = ref('')
const textInput = ref('')
const showTextInput = ref(!speechAvailable)

// Exchange count (3-4 exchanges)
const totalExchanges = ref(3)
const currentExchange = computed(() => Math.min(exchanges.value.length + 1, totalExchanges.value))
const progressValue = computed(() => exchanges.value.length / totalExchanges.value)
const allExchangesDone = computed(() => exchanges.value.length >= totalExchanges.value && exchanges.value[exchanges.value.length - 1]?.userText)

// Generate initial speaking prompt via generateTestQuestions (speaking type uses vocabulary-style for now)
// The AI prompt is hardcoded per-session to avoid extra Cloud Function call
const SPEAKING_PROMPTS = [
  'Tell me about your daily routine. What do you do in the morning?',
  'Describe your favorite place. Why do you like it?',
  'Talk about your job or studies. What do you find challenging?',
  'Tell me about a recent trip or activity you enjoyed.',
  'What are your plans for the future? What would you like to achieve?'
]

async function fetchPrompt() {
  isLoading.value = true
  loadError.value = null
  try {
    // Pick a random prompt
    const idx = Math.floor(Math.random() * SPEAKING_PROMPTS.length)
    aiPrompt.value = SPEAKING_PROMPTS[idx]
    // Start conversation with the AI prompt as first exchange
    exchanges.value = [{ aiText: aiPrompt.value, userText: '' }]
  } catch (err) {
    loadError.value = 'Failed to load speaking prompt. Tap Retry or skip this stage.'
  } finally {
    isLoading.value = false
  }
}

// Initialize speech recognition
function initRecognition() {
  if (!speechAvailable) return
  recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = false
  recognition.interimResults = true

  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1]
    interimText.value = lastResult[0].transcript
    if (lastResult.isFinal) {
      isRecording.value = false
      const text = lastResult[0].transcript.trim()
      interimText.value = ''
      if (text) handleUserResponse(text)
    }
  }
  recognition.onend = () => {
    isRecording.value = false
  }
  recognition.onerror = (e) => {
    isRecording.value = false
    interimText.value = ''
    console.error('SpeakingStage SpeechRecognition error:', e.error)
  }
}

function toggleMic() {
  if (isAiResponding.value || isSaving.value) return
  if (isRecording.value) {
    recognition.stop()
    isRecording.value = false
  } else {
    recognition.start()
    isRecording.value = true
  }
}

function submitTextResponse() {
  const text = textInput.value.trim()
  if (!text || isAiResponding.value || isSaving.value) return
  textInput.value = ''
  handleUserResponse(text)
}

async function handleUserResponse(userText) {
  // Fill in user text on the last exchange
  const lastIdx = exchanges.value.length - 1
  if (exchanges.value[lastIdx]) {
    exchanges.value[lastIdx].userText = userText
  }

  // If we have more exchanges to do, generate next AI response
  if (exchanges.value.length < totalExchanges.value) {
    isAiResponding.value = true
    try {
      // Simple follow-up questions based on exchange count
      const FOLLOW_UPS = [
        'Interesting! Can you tell me more about that?',
        'That\'s great. How does that make you feel?',
        'What would you say is the most important thing about that?'
      ]
      const followUpIdx = Math.min(exchanges.value.length - 1, FOLLOW_UPS.length - 1)
      const aiText = FOLLOW_UPS[followUpIdx]
      exchanges.value.push({ aiText, userText: '' })
    } finally {
      isAiResponding.value = false
    }
  }
}

async function submitSpeaking() {
  if (isSaving.value) return
  isSaving.value = true
  saveError.value = null

  try {
    const fn = httpsCallable(functions, 'evaluateSpeakingTest')
    const completedExchanges = exchanges.value.filter(e => e.userText)
    const result = await fn({
      exchanges: completedExchanges,
      level: placementStore.adaptiveLevel || 'B1'
    })
    emit('complete', {
      score: result.data.score ?? 0,
      level: result.data.level ?? 'B1',
      answers: completedExchanges.map((e, i) => ({ id: `s${i + 1}`, userText: e.userText }))
    })
  } catch (err) {
    console.error('SpeakingStage submitSpeaking failed:', err)
    saveError.value = err.message || 'Failed to submit speaking. Please try again.'
    isSaving.value = false
  }
}

onMounted(() => {
  initRecognition()
  fetchPrompt()
})

onUnmounted(() => {
  if (recognition) {
    recognition.abort()
    recognition = null
  }
})
</script>

<style scoped>
.speaking-stage {
  min-height: 50vh;
}

/* Exchange bubbles */
.exchange-bubble {
  padding: 8px 16px;
  border-radius: 16px;
  max-width: 85%;
  word-break: break-word;
}

.exchange-bubble--ai {
  background: var(--q-grey-2, #f5f5f5);
  border-radius: 16px 16px 16px 4px;
  align-self: flex-start;
}

.body--dark .exchange-bubble--ai {
  background: rgba(255, 255, 255, 0.08);
}

.exchange-bubble--user {
  background: var(--q-primary, #4cae4f);
  color: #ffffff;
  border-radius: 16px 16px 4px 16px;
  align-self: flex-end;
}

/* Mic button */
.mic-btn {
  width: 56px !important;
  height: 56px !important;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.mic-btn--recording {
  animation: pulse-ring 1.2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(76, 174, 79, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(76, 174, 79, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 174, 79, 0); }
}
</style>
