<template>
  <div class="writing-stage q-pa-md">

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <q-skeleton type="rect" height="8px" class="q-mb-md" />
      <q-skeleton type="rect" height="120px" class="q-mb-sm" />
      <q-skeleton type="rect" height="160px" class="q-mb-sm" />
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

    <!-- Main writing flow -->
    <template v-else>

      <!-- Progress bar -->
      <div class="row justify-between items-center q-mb-xs">
        <span class="text-caption text-grey-6">Writing</span>
        <span class="text-caption text-primary text-weight-bold">Writing — 1 of 1</span>
      </div>
      <q-linear-progress
        :value="responseLength >= MIN_CHARS ? 1 : responseLength / MIN_CHARS"
        color="primary"
        rounded
        class="q-mb-lg"
        style="height: 6px;"
        aria-label="Stage progress"
      />

      <!-- Prompt card -->
      <q-card flat bordered class="q-pa-md q-mb-lg">
        <p class="text-overline text-grey-5 q-mb-xs">WRITING TASK</p>
        <p class="text-subtitle1 text-weight-bold q-mb-none" style="line-height: 1.5;">
          {{ writingPrompt }}
        </p>
      </q-card>

      <!-- Textarea -->
      <q-input
        v-model="userResponse"
        type="textarea"
        label="Write your response here..."
        outlined
        rounded
        autogrow
        counter
        class="q-mb-xs"
        :disable="isSubmitting"
        :input-attrs="{ 'aria-label': 'Write your response', minlength: MIN_CHARS }"
      />
      <p class="text-caption text-grey-5 q-mt-xs q-mb-lg">Aim for 2-3 sentences</p>

      <!-- Submit button -->
      <q-btn
        label="Submit Response"
        color="primary"
        unelevated
        rounded
        no-caps
        class="full-width q-mt-md"
        :disable="responseLength < MIN_CHARS || isSubmitting"
        @click="submitWriting"
      />

      <!-- Submitting overlay -->
      <div v-if="isSubmitting" class="column items-center q-mt-md">
        <q-spinner-dots size="32px" color="primary" />
        <p class="text-caption text-grey-5 q-mt-sm">Submitting your response...</p>
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
import { ref, computed, onMounted } from 'vue'
import { usePlacementStore } from 'stores/placement'

const emit = defineEmits(['complete', 'skip'])

const placementStore = usePlacementStore()

const MIN_CHARS = 20

// Stage state
const isLoading = ref(false)
const loadError = ref(null)
const isSubmitting = ref(false)
const saveError = ref(null)

// Writing prompt content
const writingPrompt = ref('')
const userResponse = ref('')

const responseLength = computed(() => userResponse.value.trim().length)

// Writing prompts pool (no extra Cloud Function call needed — GPT evaluation happens separately)
const WRITING_PROMPTS = [
  'Write 2-3 sentences describing a typical day in your life. What do you enjoy most about your routine?',
  'Describe a challenge you have faced recently and how you handled it. What did you learn from the experience?',
  'Write about a place that is important to you. Why is it meaningful to you?',
  'Describe your ideal job or career. What skills do you need to achieve it?',
  'Write about a skill or hobby you would like to learn. How would you go about learning it?'
]

function fetchPrompt() {
  isLoading.value = true
  loadError.value = null
  try {
    const idx = Math.floor(Math.random() * WRITING_PROMPTS.length)
    writingPrompt.value = WRITING_PROMPTS[idx]
  } catch (err) {
    loadError.value = 'Failed to load writing prompt. Tap Retry or skip this stage.'
  } finally {
    isLoading.value = false
  }
}

async function submitWriting() {
  if (responseLength.value < MIN_CHARS || isSubmitting.value) return
  isSubmitting.value = true
  saveError.value = null

  try {
    // Writing is scored server-side via calculatePlacement (no separate evaluation Cloud Function)
    // Emit result with text content and estimated level based on response length/complexity
    const text = userResponse.value.trim()
    const wordCount = text.split(/\s+/).length

    // Simple client-side heuristic: longer responses indicate higher proficiency
    let level = placementStore.adaptiveLevel || 'B1'
    if (wordCount >= 80) level = 'B2'
    else if (wordCount >= 50) level = 'B1'
    else if (wordCount >= 30) level = 'A2'

    emit('complete', {
      score: Math.min(100, Math.round((wordCount / 60) * 80)),
      level,
      text,
      answers: [{ id: 'w1', response: text }]
    })
  } catch (err) {
    console.error('WritingStage submitWriting failed:', err)
    saveError.value = err.message || 'Failed to submit. Please try again.'
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchPrompt()
})
</script>

<style scoped>
.writing-stage {
  min-height: 50vh;
}
</style>
