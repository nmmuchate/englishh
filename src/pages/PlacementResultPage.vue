<template>
  <q-page class="placement-result-page">

    <!-- Full-page loading overlay while calculatePlacement runs -->
    <q-inner-loading :showing="isCalculating">
      <q-spinner-dots size="64px" color="primary" />
      <p class="text-body2 text-grey-6 q-mt-md text-center">Calculating your level...</p>
    </q-inner-loading>

    <!-- Main content (shown after results loaded) -->
    <div v-if="!isCalculating" class="app-container q-pa-lg">

      <!-- Error state -->
      <q-banner v-if="calcError" class="bg-red-1 text-red-9 q-mb-lg" rounded>
        {{ calcError }}
      </q-banner>
      <template v-if="calcError">
        <q-btn
          label="Retry"
          color="primary"
          unelevated
          rounded
          no-caps
          class="full-width q-mb-sm"
          @click="runCalculatePlacement"
        />
        <q-btn
          label="Skip to Dashboard"
          flat
          no-caps
          class="full-width text-grey-6"
          @click="goToDashboard"
        />
      </template>

      <!-- Results content -->
      <template v-if="result && !calcError">

        <!-- 1. Header -->
        <p class="text-h6 text-weight-bold text-center q-mb-lg">Your English Level</p>

        <!-- 2. Overall CEFR Badge -->
        <div class="row justify-center q-mb-xl">
          <q-card
            flat
            class="cefr-badge column items-center justify-center"
            role="img"
            :aria-label="`Overall level: ${result.overallLevel} ${result.levelName}`"
          >
            <p class="text-h6 text-weight-bold q-mb-xs" style="color: var(--q-primary);">
              {{ result.overallLevel }}
            </p>
            <p class="text-caption text-grey-6 q-mb-none">{{ result.levelName }}</p>
          </q-card>
        </div>

        <!-- 3. Per-Skill Breakdown -->
        <p class="text-overline text-grey-5 q-mb-md">SKILL BREAKDOWN</p>
        <div class="q-mb-lg">
          <div
            v-for="(cefrLevel, skill) in result.skillBreakdown"
            :key="skill"
            class="row items-center q-mb-sm"
          >
            <div style="width: 90px;" class="text-body2 text-weight-bold">{{ skill }}</div>
            <div class="col q-mx-sm">
              <q-linear-progress
                :value="cefrToValue(cefrLevel)"
                color="primary"
                rounded
                style="height: 8px;"
              />
            </div>
            <q-chip
              dense
              color="primary"
              text-color="white"
              style="min-width: 36px;"
            >
              {{ cefrLevel }}
            </q-chip>
          </div>
        </div>

        <!-- 4. Strengths & Focus Areas -->
        <q-card flat class="q-pa-md q-mb-lg">
          <div class="row items-center q-mb-sm">
            <q-icon name="fitness_center" color="positive" size="20px" class="q-mr-xs" />
            <span class="text-body2">
              Strengths: {{ result.strengths?.join(', ') || '—' }}
            </span>
          </div>
          <div class="row items-center">
            <q-icon name="gps_fixed" size="20px" class="q-mr-xs" style="color: var(--accent-orange, #FF6B35);" />
            <span class="text-body2">
              Focus areas: {{ result.weaknesses?.join(', ') || '—' }}
            </span>
          </div>
        </q-card>

        <!-- 5. Personalised path message -->
        <p class="text-body2 text-grey-6 text-center q-mb-xl">
          Your personalised learning path is ready! We'll focus on your weak areas through conversations about your real interests.
        </p>

        <!-- 6. Primary CTA -->
        <q-btn
          label="Start Your Free Session"
          color="primary"
          unelevated
          rounded
          no-caps
          size="lg"
          class="full-width"
          @click="goToDashboard"
        />

        <!-- 7. Free session note -->
        <p class="text-caption text-grey-5 text-center q-mt-sm">Your first session is free!</p>

      </template>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'
import { usePlacementStore } from 'stores/placement'

const router = useRouter()
const route = useRoute()
const placementStore = usePlacementStore()

const isCalculating = ref(true)
const calcError = ref(null)
const result = ref(null)

// CEFR level → progress bar value mapping (per UI-SPEC)
function cefrToValue(level) {
  const map = { A1: 0.1, A2: 0.2, B1: 0.4, B2: 0.6, C1: 0.8, C2: 1.0 }
  return map[level] ?? 0.4
}

async function runCalculatePlacement() {
  isCalculating.value = true
  calcError.value = null
  try {
    // Get stage results from placement store (populated during onboarding flow)
    const stageResults = placementStore.stageResults ?? {}
    const fn = httpsCallable(functions, 'calculatePlacement')
    const res = await fn({ stageResults, userProfile: {} })
    result.value = res.data

    // Persist finalResult in placement store
    await placementStore.completeTest(res.data)
  } catch (err) {
    console.error('PlacementResultPage calculatePlacement failed:', err)
    calcError.value = err.message || 'Something went wrong calculating your level. Tap Retry or go to your dashboard.'
  } finally {
    isCalculating.value = false
  }
}

function goToDashboard() {
  router.push({ name: 'dashboard' })
}

onMounted(() => {
  // If placement was already calculated (passed via route state or already in store), use it
  if (placementStore.finalResult) {
    result.value = placementStore.finalResult
    isCalculating.value = false
  } else {
    runCalculatePlacement()
  }
})
</script>

<style scoped>
.placement-result-page {
  background: var(--page-bg, #fafafa);
  min-height: 100vh;
}

.app-container {
  max-width: 430px;
  margin: 0 auto;
}

/* Overall CEFR badge card */
.cefr-badge {
  width: 120px;
  height: 120px;
  border: 2px solid var(--q-primary, #4cae4f);
  border-radius: 16px;
  padding: 0;
}

/* Accent-orange CSS variable (not a Quasar named color) */
:root {
  --accent-orange: #FF6B35;
}
</style>
