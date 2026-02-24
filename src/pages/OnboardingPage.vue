<template>
  <q-page class="onboarding-page">
    <q-stepper
      v-model="step"
      flat
      :header-nav="false"
      animated
      class="onboarding-stepper"
    >
      <!-- ───────────────────────────────────────────── -->
      <!-- Step 1: Welcome / First Session               -->
      <!-- Source: Stitch welcome_to_speakai             -->
      <!-- ───────────────────────────────────────────── -->
      <q-step name="welcome" title="First Session">
        <!-- Top bar -->
        <div class="row items-center q-pa-md q-pb-sm">
          <q-icon name="sym_o_language" size="28px" color="primary" />
          <span class="text-h6 text-weight-bold col text-center" style="margin-right: 28px;">SpeakAI</span>
        </div>

        <!-- Hero illustration -->
        <div class="hero-section q-mx-md q-mb-md">
          <div class="row items-center justify-center" style="gap: 24px;">
            <div class="hero-circle">
              <q-icon name="sym_o_person" size="48px" color="white" />
            </div>
            <div class="hero-line" />
            <div class="hero-robot">
              <q-icon name="sym_o_smart_toy" size="48px" color="primary" />
            </div>
          </div>
        </div>

        <!-- Headline + subtext -->
        <div class="q-px-md text-center q-mb-sm">
          <h1 class="text-weight-bold q-mt-none q-mb-sm welcome-headline">
            Master English by Speaking
          </h1>
          <p class="text-body1 text-grey-6 q-mb-none" style="line-height: 1.5;">
            Practice 10 minutes a day with your personal AI tutor.
          </p>
        </div>

        <!-- Get Started button -->
        <div class="q-px-md q-pt-md q-pb-md">
          <q-btn
            label="Get Started"
            color="primary"
            unelevated
            no-caps
            class="full-width step-cta"
            style="border-radius: var(--radius-md);"
            @click="step = 'assessment'"
          />
        </div>

        <!-- Feature cards -->
        <div class="q-px-md q-pb-xl">
          <p class="text-overline text-grey-6 text-weight-bold q-mb-md" style="letter-spacing: 0.1em;">Key Features</p>
          <div class="q-gutter-y-md">
            <div v-for="feature in features" :key="feature.title" class="feature-card row items-center no-wrap q-pa-md">
              <div class="feature-icon-box q-mr-md" :style="{ background: feature.iconBg }">
                <q-icon :name="feature.icon" size="24px" :color="feature.iconColor" />
              </div>
              <div>
                <p class="text-weight-bold q-mb-xs q-mt-none">{{ feature.title }}</p>
                <p class="text-caption text-grey-6 q-mb-none">{{ feature.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </q-step>

      <!-- ───────────────────────────────────────────── -->
      <!-- Step 2: Assessment                            -->
      <!-- Source: Stitch quick_assessment               -->
      <!-- ───────────────────────────────────────────── -->
      <q-step name="assessment" title="Assessment">
        <!-- Top bar with back (decorative) -->
        <div class="row items-center q-pa-md q-pb-sm">
          <q-btn flat round dense icon="sym_o_arrow_back" color="grey-7" @click="step = 'welcome'" />
          <span class="text-h6 text-weight-bold col text-center" style="margin-right: 40px;">Quick Assessment</span>
        </div>

        <!-- Progress bar: Step 2 of 3 -->
        <div class="q-px-lg q-pb-md">
          <div class="row justify-between items-center q-mb-sm">
            <span class="text-overline text-weight-bold" style="letter-spacing: 0.08em;">Onboarding Progress</span>
            <span class="text-caption text-primary text-weight-bold">Step 2 of 3</span>
          </div>
          <q-linear-progress :value="0.66" color="primary" rounded style="height: 8px; border-radius: var(--radius-full);" />
        </div>

        <!-- Question -->
        <div class="q-px-lg q-pb-md">
          <h2 class="text-weight-bold q-mt-none q-mb-sm assessment-question">
            What is your main goal for learning English?
          </h2>
          <p class="text-body2 text-grey-6 q-mb-none">
            This helps us personalize your practice sessions and AI-generated scenarios.
          </p>
        </div>

        <!-- Radio option cards -->
        <div class="q-px-lg q-pb-md">
          <q-item
            v-for="option in goalOptions"
            :key="option.value"
            tag="label"
            clickable
            class="option-card q-mb-md"
            :class="{ 'option-card--selected': selectedGoal === option.value }"
          >
            <q-item-section avatar>
              <div class="option-icon" :class="{ 'option-icon--selected': selectedGoal === option.value }">
                <q-icon :name="option.icon" size="22px" />
              </div>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-semibold">{{ option.title }}</q-item-label>
              <q-item-label caption>{{ option.desc }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-radio v-model="selectedGoal" :val="option.value" color="primary" />
            </q-item-section>
          </q-item>
        </div>

        <!-- Continue button -->
        <div class="q-px-lg q-pb-xl">
          <q-btn
            color="primary"
            unelevated
            no-caps
            class="full-width step-cta"
            style="border-radius: var(--radius-md);"
            @click="step = 'result'"
          >
            Continue
            <q-icon name="sym_o_arrow_forward" size="20px" class="q-ml-sm" />
          </q-btn>
          <p class="text-center text-caption text-grey-5 q-mt-md q-mb-none" style="letter-spacing: 0.08em; text-transform: uppercase;">
            You can change this later
          </p>
        </div>
      </q-step>

      <!-- ───────────────────────────────────────────── -->
      <!-- Step 3: Level Result                          -->
      <!-- No Stitch source — designed from tokens       -->
      <!-- ───────────────────────────────────────────── -->
      <q-step name="result" title="Level Result">
        <!-- Top bar -->
        <div class="row items-center justify-center q-pa-md q-pb-sm">
          <span class="text-h6 text-weight-bold">SpeakAI</span>
        </div>

        <!-- Progress bar: Step 3 of 3 -->
        <div class="q-px-lg q-pb-md">
          <div class="row justify-between items-center q-mb-sm">
            <span class="text-overline text-weight-bold" style="letter-spacing: 0.08em;">Onboarding Progress</span>
            <span class="text-caption text-primary text-weight-bold">Step 3 of 3</span>
          </div>
          <q-linear-progress :value="1.0" color="primary" rounded style="height: 8px; border-radius: var(--radius-full);" />
        </div>

        <!-- Result content -->
        <div class="column items-center text-center q-px-lg q-py-xl">
          <!-- Check icon -->
          <div class="result-icon q-mb-lg">
            <q-icon name="sym_o_check_circle" size="72px" color="primary" />
          </div>

          <!-- Level badge -->
          <div class="level-badge q-mb-lg">
            <span class="text-weight-bold text-primary">Intermediate</span>
          </div>

          <!-- Headline -->
          <h1 class="text-weight-bold q-mt-none q-mb-sm result-headline">
            You're Intermediate!
          </h1>
          <p class="text-body1 text-grey-6 q-mb-xl" style="max-width: 280px; line-height: 1.5;">
            Your AI sessions are now personalized for your level. Let's start practicing!
          </p>

          <!-- Start Learning button -->
          <q-btn
            label="Start Learning"
            color="primary"
            unelevated
            no-caps
            class="full-width step-cta"
            style="border-radius: var(--radius-md);"
            @click="handleComplete"
          />
        </div>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from 'boot/firebase'

const router = useRouter()
const authStore = useAuthStore()

const step = ref('welcome')
const selectedGoal = ref('career')

const features = [
  {
    icon: 'sym_o_record_voice_over',
    title: 'Real-time Feedback',
    desc: 'Instant corrections to improve your accent and grammar.',
    iconBg: 'rgba(76, 174, 79, 0.1)',
    iconColor: 'primary'
  },
  {
    icon: 'sym_o_psychology',
    title: 'Native-like AI',
    desc: 'Conversations that feel natural and adapt to your level.',
    iconBg: 'rgba(59, 130, 246, 0.1)',
    iconColor: 'blue-6'
  },
  {
    icon: 'sym_o_local_fire_department',
    title: 'Daily Streaks',
    desc: 'Stay motivated and build a habit that sticks.',
    iconBg: 'rgba(249, 115, 22, 0.1)',
    iconColor: 'orange-6'
  }
]

const goalOptions = [
  { value: 'career', title: 'Career growth', desc: 'Advance in your professional field', icon: 'sym_o_work' },
  { value: 'travel', title: 'Travel', desc: 'Communicate easily on your trips', icon: 'sym_o_flight_takeoff' },
  { value: 'education', title: 'Education', desc: 'Succeed in your academic studies', icon: 'sym_o_school' },
  { value: 'fun', title: 'Just for fun', desc: 'Enjoy movies and books in English', icon: 'sym_o_sentiment_satisfied' }
]

async function handleComplete() {
  const userRef = doc(db, 'users', authStore.uid)
  await updateDoc(userRef, {
    onboardingCompleted: true,
    currentLevel:        'B1',
    levelProgress:       0,
    freeSessionUsed:     false,
    updatedAt:           serverTimestamp()
  })
  authStore.completeOnboarding()
  router.push({ name: 'dashboard' })
}
</script>

<style scoped>
.onboarding-page {
  background-color: var(--bg-surface, #ffffff);
}

/* Hide QStepper's built-in header tab row */
:deep(.q-stepper__header) {
  display: none;
}

/* Remove inner step padding so we control spacing per-step */
:deep(.q-stepper__step-inner) {
  padding: 0;
}

/* Remove default stepper background */
.onboarding-stepper {
  background: transparent;
  min-height: 100vh;
}

/* Step 1: Hero */
.hero-section {
  background: #e8f5e9;
  border-radius: var(--radius-md);
  padding: 40px 24px;
  margin-bottom: 8px;
}

.body--dark .hero-section {
  background: #1a2e1a;
}

.hero-circle {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-full);
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-line {
  width: 64px;
  height: 4px;
  background: rgba(76, 174, 79, 0.3);
  border-radius: var(--radius-full);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.hero-robot {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-lg);
  background: white;
  border: 2px solid rgba(76, 174, 79, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.body--dark .hero-robot {
  background: #2d3748;
}

/* Typography */
.welcome-headline {
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.assessment-question {
  font-size: 26px;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.result-headline {
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

/* Feature cards */
.feature-card {
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid #f3f4f6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
}

.body--dark .feature-card {
  background: #1f2937;
  border-color: #374151;
}

.feature-icon-box {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* CTA button */
.step-cta {
  height: 56px;
  font-size: 16px;
  font-weight: 700;
}

/* Option cards */
.option-card {
  border: 2px solid #e5e7eb;
  border-radius: var(--radius-md);
  padding: 16px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  min-height: unset;
}

.body--dark .option-card {
  border-color: #374151;
}

.option-card--selected {
  border-color: var(--primary);
  background-color: rgba(76, 174, 79, 0.05);
}

.body--dark .option-card--selected {
  background-color: rgba(76, 174, 79, 0.1);
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: #f9fafb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.body--dark .option-icon {
  background: #374151;
  color: #9ca3af;
}

.option-icon--selected {
  background-color: var(--primary);
  color: white;
}

/* Result step */
.result-icon {
  color: var(--primary);
}

.level-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 24px;
  background: rgba(76, 174, 79, 0.1);
  border-radius: var(--radius-full);
  border: 1px solid rgba(76, 174, 79, 0.3);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
</style>
