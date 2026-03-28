<template>
  <q-page class="profile-page">

    <!-- Sticky header -->
    <div class="profile-header q-px-md q-py-sm row items-center no-wrap">
      <q-btn
        flat
        round
        dense
        icon="sym_o_chevron_left"
        class="header-btn"
        @click="router.go(-1)"
      />
      <div class="col text-center">
        <span class="text-subtitle1 text-weight-bold">Settings</span>
      </div>
      <!-- Spacer to keep title centered -->
      <div style="width: 40px; height: 40px;"></div>
    </div>

    <!-- Scrollable content -->
    <div class="q-pb-xl">

      <!-- Profile section -->
      <div class="column items-center q-pt-lg q-pb-md q-px-lg">
        <!-- Avatar circle with initials -->
        <div class="avatar-wrap q-mb-md">
          <div class="avatar-circle row items-center justify-center">
            <span class="text-h5 text-weight-bold text-white">{{ initials }}</span>
          </div>
          <div class="avatar-edit-badge row items-center justify-center">
            <q-icon name="sym_o_edit" size="14px" class="text-white" />
          </div>
        </div>

        <!-- Name + level badge -->
        <div class="row items-center no-wrap q-gutter-sm q-mb-xs">
          <span class="text-h5 text-weight-bold">{{ profile.displayName }}</span>
          <div class="level-pill q-px-sm q-py-xs">
            <span class="text-caption text-weight-bold text-primary" style="font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;">{{ profile.level }}</span>
          </div>
        </div>

        <!-- Email -->
        <span class="text-caption text-grey-5">sarah.chen@example.com</span>
      </div>

      <!-- AI Practice Goal card -->
      <div class="goal-card q-mx-md q-mb-lg q-pa-md row items-center justify-between no-wrap">
        <div class="row items-center no-wrap q-gutter-md">
          <div class="goal-icon-circle row items-center justify-center flex-shrink-0">
            <q-icon name="sym_o_auto_awesome" size="22px" color="primary" />
          </div>
          <div>
            <div class="text-body2 text-weight-bold">AI Practice Goal</div>
            <div class="text-caption text-grey-5">85% of daily target reached</div>
          </div>
        </div>
        <div class="text-caption text-weight-bold text-primary flex-shrink-0 q-ml-md">12 Day Streak</div>
      </div>

      <!-- Account Details section -->
      <div class="q-mb-lg">
        <div class="section-label q-px-md q-pb-sm">
          <span class="text-caption text-weight-bold text-grey-5 section-label-text">ACCOUNT DETAILS</span>
        </div>
        <div class="menu-group">
          <div
            v-for="item in accountItems"
            :key="item.label"
            class="menu-row row items-center no-wrap q-px-md"
            :class="{ 'menu-row--last': item === accountItems[accountItems.length - 1] }"
          >
            <div class="menu-icon-circle row items-center justify-center q-mr-md flex-shrink-0">
              <q-icon :name="item.icon" size="18px" color="primary" />
            </div>
            <div class="col row items-center justify-between menu-row-inner"
              :class="{ 'menu-row-inner--no-border': item === accountItems[accountItems.length - 1] }">
              <span class="text-body2 text-weight-medium">{{ item.label }}</span>
              <q-icon name="sym_o_chevron_right" size="20px" class="text-grey-4" />
            </div>
          </div>
        </div>
      </div>

      <!-- App Preferences section -->
      <div class="q-mb-lg">
        <div class="section-label q-px-md q-pb-sm">
          <span class="text-caption text-weight-bold text-grey-5 section-label-text">APP PREFERENCES</span>
        </div>
        <div class="menu-group">
          <div
            v-for="item in prefItems"
            :key="item.label"
            class="menu-row row items-center no-wrap q-px-md"
            :class="{ 'menu-row--last': item === prefItems[prefItems.length - 1] }"
          >
            <div class="menu-icon-circle row items-center justify-center q-mr-md flex-shrink-0">
              <q-icon :name="item.icon" size="18px" color="primary" />
            </div>
            <div class="col row items-center justify-between menu-row-inner"
              :class="{ 'menu-row-inner--no-border': item === prefItems[prefItems.length - 1] }">
              <span class="text-body2 text-weight-medium">{{ item.label }}</span>
              <q-icon name="sym_o_chevron_right" size="20px" class="text-grey-4" />
            </div>
          </div>
        </div>
      </div>

      <!-- App Toggles section (PROF-02) -->
      <div class="q-mb-lg">
        <div class="section-label q-px-md q-pb-sm">
          <span class="text-caption text-weight-bold text-grey-5 section-label-text">APP TOGGLES</span>
        </div>
        <div class="menu-group">
          <!-- Notifications toggle -->
          <div class="toggle-row row items-center no-wrap q-px-md">
            <div class="menu-icon-circle row items-center justify-center q-mr-md flex-shrink-0">
              <q-icon name="sym_o_notifications" size="18px" color="primary" />
            </div>
            <div class="col row items-center justify-between toggle-row-inner">
              <span class="text-body2 text-weight-medium">Notifications</span>
              <q-toggle
                v-model="notificationsEnabled"
                color="primary"
                keep-color
              />
            </div>
          </div>

          <!-- Dark Mode Override toggle -->
          <div class="toggle-row row items-center no-wrap q-px-md">
            <div class="menu-icon-circle row items-center justify-center q-mr-md flex-shrink-0">
              <q-icon name="sym_o_dark_mode" size="18px" color="primary" />
            </div>
            <div class="col row items-center justify-between toggle-row-inner">
              <span class="text-body2 text-weight-medium">Dark Mode Override</span>
              <q-toggle
                v-model="darkModeOverride"
                color="primary"
                keep-color
              />
            </div>
          </div>

          <!-- Sound Effects toggle -->
          <div class="toggle-row row items-center no-wrap q-px-md toggle-row--last">
            <div class="menu-icon-circle row items-center justify-center q-mr-md flex-shrink-0">
              <q-icon name="sym_o_volume_up" size="18px" color="primary" />
            </div>
            <div class="col row items-center justify-between toggle-row-inner toggle-row-inner--no-border">
              <span class="text-body2 text-weight-medium">Sound Effects</span>
              <q-toggle
                v-model="soundEffects"
                color="primary"
                keep-color
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Logout button -->
      <div class="q-px-md q-mb-md">
        <q-btn
          unelevated
          no-caps
          class="full-width logout-btn"
          icon="sym_o_logout"
          label="Logout"
        />
      </div>

      <!-- Version text -->
      <div class="text-center q-pb-xl">
        <span class="text-caption text-grey-6" style="font-size: 11px;">SpeakAI v1.0.0</span>
      </div>

    </div>

  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from 'src/stores/profile'

const router = useRouter()
const profile = useProfileStore()

// Initials from displayName — same pattern as DashboardPage
const initials = computed(() => {
  if (!profile.displayName) return '?'
  return profile.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// App Toggles local refs — no persistence (PROF-02)
const notificationsEnabled = ref(true)
const darkModeOverride = ref(false)
const soundEffects = ref(true)

// Account Details menu rows
const accountItems = [
  { icon: 'sym_o_person', label: 'Account Settings' },
  { icon: 'sym_o_notifications', label: 'Notifications' },
  { icon: 'sym_o_card_membership', label: 'Subscription Management' },
]

// App Preferences menu rows
const prefItems = [
  { icon: 'sym_o_translate', label: 'Language Preferences' },
  { icon: 'sym_o_help', label: 'Help & Support' },
]
</script>

<style scoped>
/* ---- Page ---- */
.profile-page {
  background: var(--bg-dark, #151d15);
  min-height: 100vh;
}

/* ---- Sticky header ---- */
.profile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-dark, #151d15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-btn {
  color: rgba(255, 255, 255, 0.75);
}

/* ---- Avatar (SC initials circle — no image) ---- */
.avatar-wrap {
  position: relative;
}

.avatar-circle {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background: var(--q-primary, #4cae4f);
  border: 4px solid rgba(76, 174, 79, 0.2);
  box-shadow: 0 8px 24px rgba(76, 174, 79, 0.25);
}

.avatar-edit-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--q-primary, #4cae4f);
  border: 2px solid var(--bg-dark, #151d15);
}

/* ---- Level pill ---- */
.level-pill {
  background: rgba(76, 174, 79, 0.1);
  border-radius: 9999px;
  border: 1px solid rgba(76, 174, 79, 0.2);
}

/* ---- AI Practice Goal card ---- */
.goal-card {
  background: rgba(76, 174, 79, 0.06);
  border: 1px solid rgba(76, 174, 79, 0.2);
  border-radius: 16px;
}

.goal-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(76, 174, 79, 0.15);
  flex-shrink: 0;
}

/* ---- Section labels ---- */
.section-label-text {
  font-size: 11px;
  letter-spacing: 0.1em;
}

/* ---- Menu groups ---- */
.menu-group {
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(76, 174, 79, 0.08);
  border-bottom: 1px solid rgba(76, 174, 79, 0.08);
}

.menu-row {
  min-height: 56px;
  cursor: pointer;
}

.menu-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.menu-row-inner {
  min-height: 56px;
  border-bottom: 1px solid rgba(76, 174, 79, 0.06);
}

.menu-row-inner--no-border {
  border-bottom: none;
}

.menu-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(76, 174, 79, 0.1);
  flex-shrink: 0;
}

/* ---- Toggle rows (PROF-02) ---- */
.toggle-row {
  min-height: 56px;
}

.toggle-row-inner {
  min-height: 56px;
  border-bottom: 1px solid rgba(76, 174, 79, 0.06);
}

.toggle-row-inner--no-border {
  border-bottom: none;
}

/* ---- Logout button ---- */
.logout-btn {
  height: 52px;
  border-radius: 16px;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.2);
  color: #ef4444;
  font-weight: 700;
  font-size: 15px;
}

/* ---- Light mode overrides ---- */
.body--light .profile-page {
  background: #f6f7f6;
}

.body--light .profile-header {
  background: #f6f7f6;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.body--light .header-btn {
  color: rgba(0, 0, 0, 0.6);
}

.body--light .avatar-circle {
  border-color: rgba(76, 174, 79, 0.3);
}

.body--light .avatar-edit-badge {
  border-color: #f6f7f6;
}

.body--light .goal-card {
  background: rgba(76, 174, 79, 0.05);
}

.body--light .menu-group {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .menu-row-inner,
.body--light .toggle-row-inner {
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

.body--light .logout-btn {
  background: rgba(244, 67, 54, 0.06);
  border-color: rgba(244, 67, 54, 0.15);
}
</style>
