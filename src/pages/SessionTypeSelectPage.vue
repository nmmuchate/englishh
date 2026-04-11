<template>
  <q-page class="q-pa-md">
    <div style="max-width: 430px; margin: 0 auto;">
      <!-- Heading -->
      <h2 class="text-h6 text-weight-bold q-mb-xs">Choose Your Session</h2>
      <p class="text-body2 text-grey-6 q-mb-lg">Select the type of English practice you want today.</p>

      <!-- Session type grid -->
      <div class="row q-col-gutter-sm q-mb-xl">
        <div v-for="st in SESSION_TYPES" :key="st.type" class="col-6">
          <div v-if="isLocked(st)" @click="handleLockedTap(st)">
            <SessionTypeCard
              :type="st.type"
              :icon="st.icon"
              :name="st.name"
              :description="st.description"
              :duration="st.duration"
              :locked="true"
            />
          </div>
          <SessionTypeCard
            v-else
            :type="st.type"
            :icon="st.icon"
            :name="st.name"
            :description="st.description"
            :duration="st.duration"
            :locked="false"
            @select="handleSelectType"
          />
        </div>
      </div>

      <!-- Error banner -->
      <q-banner v-if="generateError" class="bg-red-1 text-red-9 q-mb-lg" rounded>
        <template v-slot:default>
          Couldn't prepare your session. Tap Retry or choose a different type.
        </template>
        <template v-slot:action>
          <q-btn flat no-caps label="Back" class="text-grey-5" @click="generateError = null" />
          <q-btn flat no-caps label="Retry" color="primary" @click="handleSelectType(sessionStore.sessionType)" />
        </template>
      </q-banner>

      <!-- Loading overlay -->
      <q-inner-loading :showing="isGenerating">
        <q-spinner-dots size="64px" color="primary" />
        <p class="text-body2 text-grey-6 q-mt-md text-center">Preparing your session...</p>
      </q-inner-loading>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useSessionStore } from 'stores/session'
import { usePlacementStore } from 'stores/placement'
import { useProfileStore } from 'stores/profile'
import SessionTypeCard from 'components/SessionTypeCard.vue'

const router = useRouter()
const $q = useQuasar()
const sessionStore = useSessionStore()
const placementStore = usePlacementStore()
const profileStore = useProfileStore()

const SESSION_TYPES = [
  { type: 'free-talk', icon: 'chat', name: 'Free Talk', description: 'Open conversation on any topic', duration: '15\u201320 min', minCefr: 1 },
  { type: 'scenario', icon: 'work', name: 'Scenario', description: 'Role-play a real-world situation', duration: '15\u201320 min', minCefr: 1 },
  { type: 'story-builder', icon: 'menu_book', name: 'Story Builder', description: 'Build a story together with AI', duration: '20\u201325 min', minCefr: 3 },
  { type: 'debate', icon: 'gavel', name: 'Debate', description: 'Argue your position on a topic', duration: '20\u201325 min', minCefr: 3 }
]

const CEFR_VALUE = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

const userCefrNumeric = computed(() => {
  const level = placementStore.finalResult?.overallLevel || profileStore.currentLevel || 'B1'
  return CEFR_VALUE[level] ?? 3
})

const isGenerating = ref(false)
const generateError = ref(null)

function isLocked(sessionDef) {
  return userCefrNumeric.value < sessionDef.minCefr
}

async function handleSelectType(type) {
  isGenerating.value = true
  generateError.value = null

  const result = await sessionStore.startSession(type)

  if (result?.paywallRequired) {
    isGenerating.value = false
    // TODO: open PaywallDialog — Phase 18 will handle this
    return
  }

  if (result?.error) {
    isGenerating.value = false
    generateError.value = result.error
    return
  }

  isGenerating.value = false
  router.push({ name: 'session-brief' })
}

function handleLockedTap(sessionDef) {
  $q.notify({
    message: `${sessionDef.name} unlocks at B1`,
    type: 'warning',
    position: 'top'
  })
}
</script>
