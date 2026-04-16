<template>
  <q-page class="feedback-page">

    <!-- Sticky Header (FEED-01) -->
    <div class="feedback-header q-px-md q-py-sm row items-center no-wrap">
      <!-- Close / X — navigates to dashboard (FEED-04) -->
      <q-btn
        flat
        round
        dense
        icon="sym_o_close"
        class="header-close-btn"
        @click="goToDashboard"
      />
      <div class="col text-center">
        <span class="text-subtitle1 text-weight-bold">Session Feedback</span>
      </div>
      <!-- Share icon — decorative -->
      <div class="share-icon-wrap row items-center justify-center">
        <q-icon name="sym_o_share" size="20px" color="primary" />
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="feedback-scroll q-px-md q-pb-xl">

      <!-- Level-up banner(s) — Phase 17 (D-03, 17-UI-SPEC §Component Inventory) -->
      <div
        v-if="session.levelUps && session.levelUps.length > 0"
        class="level-up-stack q-mb-md q-gutter-sm"
      >
        <div
          v-for="(lu, idx) in session.levelUps"
          :key="`${lu.skill}-${idx}`"
          class="level-up-banner row items-center no-wrap q-px-md q-py-sm"
        >
          <q-icon name="sym_o_trending_up" size="20px" color="primary" class="q-mr-sm" />
          <span class="text-subtitle2 text-weight-bold">
            Your {{ capitalize(lu.skill) }} just leveled up to
            <span class="text-primary">{{ lu.to }}</span>!
          </span>
        </div>
      </div>

      <!-- Hero section (FEED-01) -->
      <div class="hero-card q-pa-lg q-mt-md q-mb-lg text-center">
        <!-- Abstract celebration bg (CSS radial gradients) -->
        <div class="hero-bg-fx"></div>
        <div class="hero-content">
          <!-- Celebration icon circle -->
          <div class="celebration-circle q-mx-auto q-mb-md row items-center justify-center">
            <q-icon name="sym_o_celebration" size="40px" color="primary" />
          </div>
          <div class="text-h5 text-weight-bold q-mb-xs">Session Complete!</div>
          <!-- Overall score from session store -->
          <div class="text-h4 text-weight-bold text-primary q-mb-sm">{{ session.overallScore }}%</div>
          <!-- Streak badge (orange) -->
          <div class="streak-badge row items-center justify-center no-wrap q-mx-auto q-px-md q-py-xs">
            <q-icon name="sym_o_local_fire_department" size="14px" class="q-mr-xs" />
            <span class="text-caption text-weight-bold">5 Day Streak!</span>
          </div>
        </div>
      </div>

      <!-- QTabs navigation (FEED-02) -->
      <q-tabs
        v-model="tab"
        dense
        no-caps
        indicator-color="primary"
        active-color="primary"
        class="feedback-tabs q-mb-md"
        align="justify"
      >
        <q-tab name="overview" label="Overview" />
        <q-tab name="mistakes" label="Mistakes" />
        <q-tab name="vocabulary" label="Vocabulary" />
      </q-tabs>

      <!-- Tab panels (FEED-02, FEED-03) -->
      <q-tab-panels v-model="tab" animated class="feedback-tab-panels">

        <!-- OVERVIEW tab -->
        <q-tab-panel name="overview" class="q-pa-none">

          <!-- Score cards (FEED-01) — CSS conic-gradient circles -->
          <div class="column q-gutter-md q-mb-lg">

            <!-- Pronunciation card -->
            <div class="score-card q-pa-md row items-center justify-between no-wrap">
              <div>
                <div class="text-caption text-grey-5 q-mb-xs">Pronunciation</div>
                <div class="text-h5 text-weight-bold">{{ pronPct }}%</div>
                <div class="text-caption text-primary row items-center no-wrap q-mt-xs">
                  <q-icon name="sym_o_check_circle" size="12px" class="q-mr-xs" />
                  Excellent clarity
                </div>
              </div>
              <div
                class="circular-progress"
                :style="{ '--pct': pronPct + '%', '--clr': '#4cae4f' }"
              >
                <q-icon name="sym_o_mic" size="24px" color="primary" />
              </div>
            </div>

            <!-- Grammar card -->
            <div class="score-card q-pa-md row items-center justify-between no-wrap">
              <div>
                <div class="text-caption text-grey-5 q-mb-xs">Grammar</div>
                <div class="text-h5 text-weight-bold">{{ gramPct }}%</div>
                <div class="text-caption row items-center no-wrap q-mt-xs" style="color: #FF9800;">
                  <q-icon name="sym_o_trending_up" size="12px" class="q-mr-xs" style="color: #FF9800;" />
                  Getting better!
                </div>
              </div>
              <div
                class="circular-progress"
                :style="{ '--pct': gramPct + '%', '--clr': '#FF9800' }"
              >
                <q-icon name="sym_o_edit_note" size="24px" style="color: #FF9800;" />
              </div>
            </div>

            <!-- Vocabulary card -->
            <div class="score-card q-pa-md row items-center justify-between no-wrap">
              <div>
                <div class="text-caption text-grey-5 q-mb-xs">Vocabulary</div>
                <div class="text-h5 text-weight-bold">{{ vocabPct }}%</div>
                <div class="text-caption text-primary row items-center no-wrap q-mt-xs">
                  <q-icon name="sym_o_auto_awesome" size="12px" class="q-mr-xs" />
                  Impressive range
                </div>
              </div>
              <div
                class="circular-progress"
                :style="{ '--pct': vocabPct + '%', '--clr': '#4cae4f' }"
              >
                <q-icon name="sym_o_menu_book" size="24px" color="primary" />
              </div>
            </div>

          </div>

          <!-- Growth Trends mini bar chart -->
          <div class="score-card q-pa-md q-mb-md">
            <div class="row items-center justify-between q-mb-md">
              <span class="text-subtitle2 text-weight-bold">Growth Trends</span>
              <span class="text-caption text-grey-5">Past 7 days</span>
            </div>
            <div class="trend-chart">
              <div v-for="bar in trendBars" :key="bar.label" class="trend-bar-wrap">
                <div
                  class="trend-bar"
                  :style="{ height: bar.pct + '%' }"
                  :class="{ 'trend-bar--today': bar.isToday }"
                ></div>
                <span class="trend-label" :class="{ 'trend-label--today': bar.isToday }">
                  {{ bar.label }}
                </span>
              </div>
            </div>
          </div>

        </q-tab-panel>

        <!-- MISTAKES tab (FEED-03) — real data from Firestore -->
        <q-tab-panel name="mistakes" class="q-pa-none">
          <div class="column q-gutter-md">

            <!-- Empty state when no mistakes recorded -->
            <div v-if="mistakes.length === 0" class="score-card q-pa-md">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon name="sym_o_check_circle" size="20px" color="positive" style="flex-shrink: 0;" />
                <div class="text-body2 text-grey-5">No mistakes detected in this session — great work!</div>
              </div>
            </div>

            <!-- Real mistake cards from Firestore sessions/{sessionId}.mistakes -->
            <div
              v-for="(mistake, index) in mistakes"
              :key="index"
              class="score-card q-pa-md"
            >
              <div class="row items-start no-wrap q-gutter-sm">
                <q-icon name="sym_o_lightbulb" size="20px" class="q-mt-xs" style="color: #ef4444; flex-shrink: 0;" />
                <div>
                  <div class="text-subtitle2 text-weight-bold q-mb-xs">{{ mistake.type ?? 'Grammar' }}</div>
                  <div class="text-body2 text-grey-5 q-mb-sm">"{{ mistake.original }}" → should be "{{ mistake.correction }}"</div>
                  <div class="text-caption text-primary">{{ mistake.explanation }}</div>
                </div>
              </div>
            </div>

          </div>
        </q-tab-panel>

        <!-- VOCABULARY tab (FEED-03) -->
        <q-tab-panel name="vocabulary" class="q-pa-none">
          <div class="column q-gutter-md">

            <div
              v-for="word in vocabWords"
              :key="word.term"
              class="score-card q-pa-md"
            >
              <div class="row items-center justify-between no-wrap q-mb-xs">
                <span class="text-subtitle2 text-weight-bold">{{ word.term }}</span>
                <div
                  class="vocab-badge q-px-sm q-py-xs text-caption text-weight-bold"
                  :class="`vocab-badge--${word.level}`"
                >
                  {{ word.level }}
                </div>
              </div>
              <div class="text-body2 text-grey-5 q-mb-xs">{{ word.definition }}</div>
              <div class="text-caption text-grey-6 vocab-example">"{{ word.example }}"</div>
              <div class="row justify-end q-mt-sm">
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="sym_o_bookmark"
                  label="Add to Bank"
                  color="primary"
                  size="sm"
                  @click="saveWordToBank(word)"
                />
              </div>
            </div>

          </div>
        </q-tab-panel>

      </q-tab-panels>
    </div>

    <!-- Fixed footer (FEED-04) -->
    <div class="feedback-footer q-px-md q-pb-md">
      <q-btn
        unelevated
        no-caps
        rounded
        color="primary"
        label="Back to Dashboard"
        icon="sym_o_home"
        class="full-width"
        size="lg"
        @click="goToDashboard"
      />
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from 'src/stores/session'
import { useVocabularyStore } from 'src/stores/vocabulary'
import { doc, getDoc } from 'firebase/firestore'
import { db } from 'boot/firebase'

const router = useRouter()
const session = useSessionStore()
const vocabStore = useVocabularyStore()

// Active tab (FEED-02)
const tab = ref('overview')

// Capitalize skill name for banner copy (vocabulary → Vocabulary)
function capitalize(str) {
  if (!str || typeof str !== 'string') return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

async function saveWordToBank(word) {
  await vocabStore.saveWord({
    word:       word.term,
    definition: word.definition,
    example:    word.example
  })
}

// Navigate back to dashboard (FEED-04)
function goToDashboard() {
  router.push({ name: 'dashboard' })
}

// Animated score circle percentages (FEED-01)
const pronPct = ref(0)
const gramPct = ref(0)
const vocabPct = ref(0)

// Real session data from Firestore
const mistakes   = ref([])   // array of { type, original, correction, explanation }
const vocabWords = ref([])   // array of { term, definition, example, level }
const isLoading  = ref(true) // prevents empty flash before data loads

function animateValue(refTarget, target, duration = 800) {
  const start = Date.now()
  const interval = setInterval(() => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    refTarget.value = Math.round(eased * target)
    if (progress >= 1) clearInterval(interval)
  }, 16)
}

onMounted(async () => {
  // Guard: if session.sessionId is null (direct navigation / hard reload), show fallback
  if (!session.sessionId) {
    isLoading.value = false
    const fallback = session.overallScore ?? 0
    setTimeout(() => {
      animateValue(pronPct,  fallback)
      animateValue(gramPct,  fallback)
      animateValue(vocabPct, fallback)
    }, 300)
    return
  }

  try {
    const snap = await getDoc(doc(db, 'sessions', session.sessionId))
    if (snap.exists()) {
      const data = snap.data()
      const s    = data.scores ?? {}

      // Animate score rings to real Gemini scores.
      // pronPct maps to fluency (TRD: no separate pronunciation score in MVP; fluency is closest analog)
      setTimeout(() => {
        animateValue(pronPct,  s.fluency    ?? 0)
        animateValue(gramPct,  s.grammar    ?? 0)
        animateValue(vocabPct, s.vocabulary ?? 0)
      }, 300)

      // Real mistakes — accumulated by sendMessage via FieldValue.arrayUnion
      mistakes.value = data.mistakes ?? []

      // Real vocabulary — deduplicate by word field (sendMessage may emit same word multiple turns)
      const rawVocab = data.newVocabulary ?? []
      const seen     = new Set()
      vocabWords.value = rawVocab
        .filter(v => {
          if (seen.has(v.word)) return false
          seen.add(v.word)
          return true
        })
        .map(v => ({
          term:       v.word,
          definition: v.definition,
          example:    v.example ?? v.exampleSentence ?? '',
          level:      'B1'   // newVocabulary schema has no level field; static B1 badge is correct
        }))
    }
  } catch (err) {
    console.error('FeedbackPage: Firestore read failed', err)
  } finally {
    isLoading.value = false
  }
})

// Growth trend bar data (Overview tab)
const trendBars = [
  { label: 'Mon', pct: 40, isToday: false },
  { label: 'Tue', pct: 60, isToday: false },
  { label: 'Wed', pct: 55, isToday: false },
  { label: 'Thu', pct: 75, isToday: false },
  { label: 'Fri', pct: 65, isToday: false },
  { label: 'Sat', pct: 85, isToday: false },
  { label: 'Today', pct: 95, isToday: true },
]
</script>

<style scoped>
/* ---- Page ---- */
.feedback-page {
  background: var(--bg-dark, #151d15);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---- Header ---- */
.feedback-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(21, 29, 21, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-close-btn {
  color: rgba(255, 255, 255, 0.75);
}

/* Share icon wrapper pill */
.share-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(76, 174, 79, 0.12);
}

/* ---- Scrollable area ---- */
.feedback-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 90px; /* clear fixed footer */
}

/* ---- Level-up banner (Phase 17 — 17-UI-SPEC §Component Inventory) ---- */
.level-up-stack {
  animation: level-up-fade-in 0.3s ease-in;
}

.level-up-banner {
  background: rgba(76, 174, 79, 0.12);
  border: 1px solid rgba(76, 174, 79, 0.25);
  border-left: 3px solid #4cae4f;
  border-radius: 8px;
  color: #ffffff;
}

@keyframes level-up-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ---- Hero card (FEED-01) ---- */
.hero-card {
  position: relative;
  overflow: hidden;
  background: rgba(76, 174, 79, 0.1);
  border: 1px solid rgba(76, 174, 79, 0.2);
  border-radius: 16px;
}

.hero-bg-fx {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 30%, #4cae4f 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, #FF9800 0%, transparent 50%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

/* Celebration icon white circle */
.celebration-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* Streak badge — orange pill */
.streak-badge {
  background: rgba(255, 152, 0, 0.15);
  border-radius: 9999px;
  color: #FF9800;
  display: inline-flex;
  width: auto;
}

/* ---- QTabs (FEED-02) ---- */
.feedback-tabs {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* ---- Tab panels ---- */
.feedback-tab-panels {
  background: transparent !important;
}

/* ---- Score cards ---- */
.score-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

/* ---- CSS conic-gradient circular progress (FEED-01) ---- */
.circular-progress {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(closest-side, #151d15 79%, transparent 80% 100%),
    conic-gradient(var(--clr) var(--pct), rgba(255,255,255,0.08) 0);
}

/* ---- Growth Trends chart ---- */
.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 128px;
  gap: 4px;
}

.trend-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 100%;
}

.trend-bar {
  width: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}

.trend-bar--today {
  background: var(--q-primary, #4cae4f);
}

.trend-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}

.trend-label--today {
  color: var(--q-primary, #4cae4f);
}

/* ---- Vocabulary tab ---- */
.vocab-example {
  font-style: italic;
}

.vocab-badge {
  border-radius: 9999px;
  font-size: 10px;
}

.vocab-badge--A2 {
  background: rgba(76, 174, 79, 0.15);
  color: #4cae4f;
}

.vocab-badge--B1 {
  background: rgba(255, 152, 0, 0.15);
  color: #FF9800;
}

.vocab-badge--B2 {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* ---- Fixed footer (FEED-04) ---- */
.feedback-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(21, 29, 21, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 12px;
  z-index: 20;
}

/* ---- Light mode overrides ---- */
.body--light .feedback-page {
  background: #f6f7f6;
}

.body--light .feedback-header {
  background: rgba(246, 247, 246, 0.85);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.body--light .header-close-btn {
  color: rgba(0, 0, 0, 0.6);
}

.body--light .share-icon-wrap {
  background: rgba(76, 174, 79, 0.1);
}

.body--light .hero-card {
  background: rgba(76, 174, 79, 0.08);
  border-color: rgba(76, 174, 79, 0.2);
}

.body--light .celebration-circle {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .feedback-tabs {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .score-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .circular-progress {
  background:
    radial-gradient(closest-side, #f6f7f6 79%, transparent 80% 100%),
    conic-gradient(var(--clr) var(--pct), #e5e7eb 0);
}

.body--light .trend-bar {
  background: rgba(0, 0, 0, 0.1);
}

.body--light .trend-label {
  color: rgba(0, 0, 0, 0.4);
}

.body--light .feedback-footer {
  background: rgba(246, 247, 246, 0.95);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.body--light .level-up-banner {
  background: rgba(76, 174, 79, 0.08);
  border-color: rgba(76, 174, 79, 0.2);
  border-left-color: #4cae4f;
  color: var(--text-deep-slate, #131613);
}
</style>
