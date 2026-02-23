<template>
  <q-page class="dashboard-page">

    <!-- Sticky header -->
    <div class="dashboard-header q-px-md q-py-sm">
      <div class="row items-center no-wrap">
        <!-- Avatar -->
        <div class="avatar-circle q-mr-sm">
          <span class="text-weight-bold text-white">{{ initials }}</span>
        </div>
        <!-- Greeting -->
        <div class="col">
          <div class="text-caption text-grey-5">Good morning</div>
          <div class="text-subtitle2 text-weight-bold">{{ profile.displayName }}</div>
        </div>
        <!-- Streak badge -->
        <div class="streak-badge row items-center no-wrap q-px-sm q-py-xs">
          <q-icon name="sym_o_local_fire_department" size="16px" class="q-mr-xs" />
          <span class="text-caption text-weight-bold">{{ profile.streakDays }} days</span>
        </div>
        <!-- Go Pro chip — triggers PaywallDialog (PAYW-01) -->
        <div
          class="go-pro-chip row items-center no-wrap q-px-sm q-py-xs q-ml-sm cursor-pointer"
          @click="showPaywall = true"
        >
          <q-icon name="sym_o_star" size="12px" class="q-mr-xs" />
          <span class="text-caption text-weight-bold">Go Pro</span>
        </div>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="q-px-md q-pb-xl">

      <!-- Stats row (DASH-01) -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-4">
          <div class="stat-card text-center q-pa-sm">
            <q-icon name="sym_o_history" size="20px" class="text-primary q-mb-xs" />
            <div class="text-h6 text-weight-bold">{{ profile.totalSessions }}</div>
            <div class="text-caption text-grey-5">Sessions</div>
          </div>
        </div>
        <div class="col-4">
          <div class="stat-card text-center q-pa-sm">
            <q-icon name="sym_o_local_fire_department" size="20px" class="stat-icon-streak q-mb-xs" />
            <div class="text-h6 text-weight-bold">{{ profile.streakDays }}</div>
            <div class="text-caption text-grey-5">Streak</div>
          </div>
        </div>
        <div class="col-4">
          <div class="stat-card text-center q-pa-sm">
            <q-icon name="sym_o_school" size="20px" class="stat-icon-vocab q-mb-xs" />
            <div class="text-h6 text-weight-bold">{{ profile.vocabularyLearned }}</div>
            <div class="text-caption text-grey-5">Vocab</div>
          </div>
        </div>
      </div>

      <!-- Weekly activity chart (DASH-02) -->
      <div class="section-card q-pa-md q-mb-md">
        <div class="text-subtitle2 text-weight-bold q-mb-md">Weekly Activity</div>
        <div class="chart-container">
          <div
            v-for="day in weekData"
            :key="day.label"
            class="chart-bar-wrapper"
          >
            <div
              class="chart-bar"
              :style="{ height: day.value + '%' }"
              :class="{ 'chart-bar--active': day.isToday, 'chart-bar--empty': day.value === 0 }"
            />
            <span class="chart-label" :class="{ 'chart-label--today': day.isToday }">
              {{ day.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Hero card (mirrors Stitch home_dashboard hero) -->
      <div class="hero-card q-pa-lg q-mb-md">
        <div class="text-caption text-weight-bold text-primary q-mb-xs">DAILY PRACTICE</div>
        <div class="text-h6 text-weight-bold q-mb-sm">Ready for today's session?</div>
        <div class="text-body2 text-grey-5 q-mb-md">
          A 5-minute conversation is all it takes to keep your streak going.
        </div>
        <q-btn
          unelevated
          no-caps
          rounded
          color="primary"
          label="Start Session"
          icon="sym_o_mic"
          class="full-width"
          @click="goToSession"
        />
      </div>

    </div>

    <!-- QFab — bottom-right, navigates to session (DASH-04) -->
    <q-fab
      color="primary"
      icon="sym_o_mic"
      class="dashboard-fab"
      @click="goToSession"
    />

    <!-- Paywall dialog (PAYW-01) -->
    <PaywallDialog v-model="showPaywall" />

  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from 'src/stores/profile'
import PaywallDialog from 'src/components/PaywallDialog.vue'

const router = useRouter()
const profile = useProfileStore()
const showPaywall = ref(false)

const initials = computed(() => {
  return profile.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

function goToSession() {
  router.push({ name: 'session' })
}

// Mock weekly data — Sat is today (DASH-02)
const weekData = [
  { label: 'Mon', value: 60, isToday: false },
  { label: 'Tue', value: 85, isToday: false },
  { label: 'Wed', value: 40, isToday: false },
  { label: 'Thu', value: 100, isToday: false },
  { label: 'Fri', value: 70, isToday: false },
  { label: 'Sat', value: 55, isToday: true },
  { label: 'Sun', value: 0, isToday: false },
]
</script>

<style scoped>
.dashboard-page {
  background: var(--bg-dark);
  min-height: 100vh;
}

/* ---- Header ---- */
.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-dark);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--q-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

/* Streak badge — accent-orange pill (DASH-03) */
.streak-badge {
  background: rgba(255, 107, 53, 0.15);
  border-radius: var(--radius-full, 9999px);
  color: #FF6B35;
}

/* Go Pro chip — accent-orange pill (PAYW-01) */
.go-pro-chip {
  background: rgba(255, 107, 53, 0.15);
  border-radius: var(--radius-full, 9999px);
  color: #FF6B35;
  border: 1px solid rgba(255, 107, 53, 0.3);
  flex-shrink: 0;
}

/* ---- Stats cards (DASH-01) ---- */
.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md, 12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-icon-streak {
  color: #FF6B35;
}

.stat-icon-vocab {
  color: #4cae4f;
}

/* ---- Section card wrapper ---- */
.section-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-lg, 16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* ---- Weekly bar chart (DASH-02) ---- */
.chart-container {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 80px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  justify-content: flex-end;
}

.chart-bar {
  width: 100%;
  background: rgba(76, 174, 79, 0.35);
  border-radius: 4px 4px 0 0;
  min-height: 3px;
  transition: height 0.3s ease;
}

.chart-bar--active {
  background: var(--q-primary);
}

.chart-bar--empty {
  background: rgba(255, 255, 255, 0.08);
  min-height: 3px;
  height: 3px !important;
}

.chart-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
}

.chart-label--today {
  color: var(--q-primary);
  font-weight: 700;
}

/* ---- Hero card ---- */
.hero-card {
  background: linear-gradient(135deg, rgba(76, 174, 79, 0.15) 0%, rgba(76, 174, 79, 0.04) 100%);
  border-radius: var(--radius-lg, 16px);
  border: 1px solid rgba(76, 174, 79, 0.2);
}

/* ---- QFab positioning ---- */
.dashboard-fab {
  position: fixed;
  bottom: 80px; /* above bottom nav (~56px) + 24px gap */
  right: 20px;
}

/* ---- Light mode overrides ---- */
.body--light .dashboard-page {
  background: #f5f7f5;
}

.body--light .dashboard-header {
  background: #f5f7f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.body--light .stat-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .section-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .hero-card {
  background: linear-gradient(135deg, rgba(76, 174, 79, 0.1) 0%, rgba(76, 174, 79, 0.02) 100%);
  border-color: rgba(76, 174, 79, 0.25);
}

.body--light .chart-label {
  color: rgba(0, 0, 0, 0.45);
}
</style>
