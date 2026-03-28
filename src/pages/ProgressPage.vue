<template>
  <q-page class="progress-page">

    <!-- Sticky header -->
    <div class="progress-header q-px-md q-py-sm row items-center no-wrap">
      <q-btn
        flat
        round
        dense
        icon="sym_o_arrow_back_ios"
        class="header-btn"
        @click="router.go(-1)"
      />
      <div class="col text-center">
        <span class="text-subtitle1 text-weight-bold">Your Progress</span>
      </div>
      <div class="row items-center justify-center header-icon-wrap">
        <q-icon name="sym_o_settings" size="20px" class="text-grey-5" />
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="q-px-md q-pb-xl">

      <!-- Level Badge Card -->
      <div class="level-card q-pa-lg q-mt-md q-mb-md column items-center">
        <!-- Circle with B1 + verified badge -->
        <div class="level-circle-wrap q-mb-md">
          <div class="level-circle row items-center justify-center">
            <span class="text-h4 text-weight-bold text-white">{{ profile.currentLevel }}</span>
          </div>
          <div class="verified-badge row items-center justify-center">
            <q-icon name="sym_o_verified" size="20px" color="primary" />
          </div>
        </div>
        <div class="text-h5 text-weight-bold q-mb-xs">{{ profile.currentLevel }}</div>
        <div class="text-body2 text-grey-5 q-mb-md">Level {{ profile.currentLevel }} &bull; {{ profile.levelProgress }}% to B2</div>
        <!-- Progress bar -->
        <div class="full-width">
          <div class="row items-center justify-between q-mb-sm">
            <span class="text-caption text-weight-semibold">Goal: Advanced B2</span>
            <span class="text-caption text-weight-bold text-primary">{{ profile.levelProgress }}%</span>
          </div>
          <q-linear-progress
            :value="profile.levelProgress / 100"
            color="primary"
            track-color="grey-3"
            rounded
            size="12px"
            class="q-mb-xs"
          />
        </div>
      </div>

      <!-- Fluency Score Section -->
      <div class="row items-center justify-between q-mb-md q-px-xs">
        <span class="text-h6 text-weight-bold">Fluency Score</span>
        <div class="week-badge q-px-sm q-py-xs">
          <span class="text-caption text-weight-bold text-primary">+5.2% this week</span>
        </div>
      </div>

      <!-- Score + Chart Card -->
      <div class="chart-card q-pa-md q-mb-lg">
        <!-- Score numbers -->
        <div class="q-mb-md">
          <div class="row items-baseline no-wrap q-gutter-xs">
            <span class="text-h3 text-weight-bold">{{ profile.averageScore }}</span>
            <span class="text-h6 text-grey-5">/100</span>
          </div>
          <div class="text-caption text-grey-5">Peak performance on Friday</div>
        </div>

        <!-- SVG line chart — path copied verbatim from Stitch your_progress/code.html -->
        <div class="chart-svg-wrap">
          <svg
            viewBox="0 0 472 150"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
              stroke="#4cae4f"
              stroke-linecap="round"
              stroke-width="4"
            />
            <path
              d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V150H0V109Z"
              fill="url(#chartGradient)"
            />
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#4cae4f" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#4cae4f" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Day labels -->
        <div class="row justify-between q-mt-sm q-px-xs">
          <span
            v-for="day in chartDays"
            :key="day.label"
            class="chart-day-label text-caption text-weight-bold"
            :class="day.isPeak ? 'text-primary' : 'text-grey-5'"
          >
            {{ day.label }}
          </span>
        </div>
      </div>

      <!-- Vocabulary Bank mini-section -->
      <div class="row items-center justify-between q-mb-md q-px-xs">
        <span class="text-h6 text-weight-bold">Vocabulary Bank</span>
        <q-btn
          flat
          no-caps
          dense
          color="primary"
          label="View all"
          class="text-caption text-weight-bold"
          @click="router.push({ name: 'vocabulary' })"
        />
      </div>

      <div class="column q-gutter-sm q-mb-xl">
        <div
          v-for="word in miniVocabWords"
          :key="word.word"
          class="vocab-card q-pa-md row items-start justify-between no-wrap"
        >
          <div class="col">
            <div class="row items-center no-wrap q-gutter-sm q-mb-xs">
              <span class="text-subtitle2 text-weight-bold">{{ word.word }}</span>
              <span class="text-caption text-grey-5">{{ word.phonetic }}</span>
            </div>
            <div class="text-caption text-grey-5">{{ word.definition }}</div>
          </div>
          <q-icon name="sym_o_volume_up" size="20px" color="primary" class="q-ml-sm flex-shrink-0 q-mt-xs" />
        </div>
      </div>

    </div>

    <!-- Floating mic FAB -->
    <q-btn
      fab
      unelevated
      color="primary"
      icon="sym_o_mic"
      class="progress-fab"
      @click="router.push({ name: 'session' })"
    />

  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from 'stores/profile'
import { useVocabularyStore } from 'stores/vocabulary'

const router = useRouter()
const profile = useProfileStore()
const vocabStore = useVocabularyStore()

onMounted(() => {
  vocabStore.loadWords()
})

// Show up to 3 words from the user's vocabulary bank
const miniVocabWords = computed(() => vocabStore.words.slice(0, 3))

// Day labels — FRI is peak
const chartDays = [
  { label: 'MON', isPeak: false },
  { label: 'TUE', isPeak: false },
  { label: 'WED', isPeak: false },
  { label: 'THU', isPeak: false },
  { label: 'FRI', isPeak: true },
  { label: 'SAT', isPeak: false },
  { label: 'SUN', isPeak: false },
]
</script>

<style scoped>
/* ---- Page ---- */
.progress-page {
  background: var(--bg-dark, #151d15);
  min-height: 100vh;
}

/* ---- Sticky header ---- */
.progress-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-dark, #151d15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-btn {
  color: rgba(255, 255, 255, 0.75);
}

.header-icon-wrap {
  width: 40px;
  height: 40px;
}

/* ---- Level badge card ---- */
.level-card {
  background: rgba(76, 174, 79, 0.06);
  border: 1px solid rgba(76, 174, 79, 0.15);
  border-radius: 16px;
}

.level-circle-wrap {
  position: relative;
}

.level-circle {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background: var(--q-primary, #4cae4f);
  box-shadow: 0 8px 24px rgba(76, 174, 79, 0.3);
}

.verified-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-dark, #151d15);
  border: 2px solid var(--bg-dark, #151d15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* ---- Week badge ---- */
.week-badge {
  background: rgba(76, 174, 79, 0.1);
  border-radius: 8px;
}

/* ---- Score + chart card ---- */
.chart-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.chart-svg-wrap {
  width: 100%;
  height: 160px;
}

.chart-day-label {
  font-size: 11px;
  letter-spacing: 0.04em;
}

/* ---- Vocabulary mini cards ---- */
.vocab-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

/* ---- Floating FAB ---- */
.progress-fab {
  position: fixed;
  bottom: 88px; /* above bottom nav ~56px + 32px gap */
  right: 20px;
  z-index: 20;
}

/* ---- Light mode overrides ---- */
.body--light .progress-page {
  background: #f6f7f6;
}

.body--light .progress-header {
  background: #f6f7f6;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.body--light .header-btn {
  color: rgba(0, 0, 0, 0.6);
}

.body--light .level-card {
  background: rgba(76, 174, 79, 0.05);
  border-color: rgba(76, 174, 79, 0.2);
}

.body--light .verified-badge {
  background: #f6f7f6;
  border-color: #f6f7f6;
}

.body--light .chart-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .vocab-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}
</style>
