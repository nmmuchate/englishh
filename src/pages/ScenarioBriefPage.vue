<template>
  <q-page class="q-pa-lg">
    <div v-if="plan" style="max-width: 430px; margin: 0 auto;">
      <!-- Session type badge -->
      <q-chip color="primary" text-color="white" class="q-mb-md">{{ typeName }}</q-chip>

      <!-- Topic title -->
      <h2 class="text-h6 text-weight-bold q-mb-lg">{{ plan.topic }}</h2>

      <!-- Your Role section -->
      <div class="text-overline text-grey-5 q-mb-xs">YOUR ROLE</div>
      <q-card flat class="q-pa-md q-mb-md">
        <p class="text-body2" style="margin: 0;">{{ plan.role }}</p>
      </q-card>

      <!-- Context section -->
      <div class="text-overline text-grey-5 q-mb-xs">CONTEXT</div>
      <q-card flat class="q-pa-md q-mb-md">
        <p class="text-body2" style="margin: 0;">{{ plan.context }}</p>
      </q-card>

      <!-- Objectives section -->
      <div class="text-overline text-grey-5 q-mb-xs">OBJECTIVES</div>
      <q-card flat class="q-pa-md q-mb-xl">
        <div v-for="(obj, i) in plan.objectives" :key="i" class="row items-start q-mb-sm">
          <q-icon name="check_circle" color="primary" size="16px" class="q-mr-xs" aria-hidden="true" />
          <span class="text-body2">{{ obj }}</span>
        </div>
      </q-card>

      <!-- Primary CTA -->
      <q-btn
        label="Start Session"
        color="primary"
        unelevated
        rounded
        no-caps
        size="lg"
        class="full-width"
        @click="startSession"
      />

      <!-- Back link -->
      <q-btn
        flat
        no-caps
        label="Choose Different Type"
        class="full-width q-mt-sm text-grey-5"
        @click="goBack"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from 'stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const plan = computed(() => sessionStore.sessionPlan)
const typeName = computed(() => {
  const map = { 'free-talk': 'Free Talk', 'scenario': 'Scenario', 'story-builder': 'Story Builder', 'debate': 'Debate' }
  return map[sessionStore.sessionType] || 'Session'
})

onMounted(() => {
  if (!plan.value) {
    router.replace({ name: 'sessions' })
  }
})

function startSession() {
  router.push({ name: 'session' })
}

function goBack() {
  router.push({ name: 'sessions' })
}
</script>
