<template>
  <q-page class="landing-page column items-center justify-between">
    <!-- Top bar -->
    <div class="row full-width items-center justify-center q-pa-md">
      <span class="text-h6 text-weight-bold">SpeakAI</span>
    </div>

    <!-- Hero section -->
    <div class="col column items-center justify-center q-px-lg q-pb-lg full-width">
      <!-- Logo circle with glow -->
      <div class="logo-circle q-mb-xl">
        <div class="logo-glow" />
        <q-icon name="sym_o_graphic_eq" size="64px" color="white" />
      </div>

      <!-- Headline + tagline -->
      <h1 class="text-weight-bold text-center q-mb-sm q-mt-none landing-headline">
        Welcome to SpeakAI
      </h1>
      <p class="text-body1 text-grey-6 text-center q-mb-none landing-tagline">
        Master English with real-time AI feedback and personalized practice.
      </p>

      <!-- Sign In button -->
      <q-btn
        class="full-width q-mt-xl sign-in-btn"
        rounded
        unelevated
        no-caps
        color="primary"
        @click="handleSignIn"
      >
        <div class="google-icon-wrapper q-mr-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
        <span class="text-weight-bold">Sign in with Google</span>
      </q-btn>

      <!-- Decorative soundwave placeholder -->
      <div class="soundwave-placeholder q-mt-lg full-width" />
    </div>

    <!-- Footer TOS links -->
    <div class="q-px-lg q-pb-xl text-center">
      <p class="text-caption text-grey-5 q-mb-none">
        By continuing, you agree to SpeakAI's<br />
        <a class="text-grey-7 text-weight-medium" href="#">Terms of Service</a>
        and
        <a class="text-grey-7 text-weight-medium" href="#">Privacy Policy</a>
      </p>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleSignIn() {
  authStore.mockSignIn()
  router.push({ name: 'onboarding' })
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background-color: var(--bg-surface, #ffffff);
}

.body--dark .landing-page {
  background-color: var(--bg-dark);
}

/* Logo */
.logo-circle {
  position: relative;
  width: 128px;
  height: 128px;
  background-color: var(--primary);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(76, 174, 79, 0.3);
}

.logo-glow {
  position: absolute;
  inset: -8px;
  background: rgba(76, 174, 79, 0.15);
  border-radius: var(--radius-full);
  filter: blur(16px);
}

/* Typography */
.landing-headline {
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.landing-tagline {
  max-width: 280px;
  line-height: 1.6;
}

/* Sign-In button */
.sign-in-btn {
  height: 56px;
  font-size: 16px;
  letter-spacing: 0.01em;
}

.google-icon-wrapper {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Soundwave decorative element */
.soundwave-placeholder {
  min-height: 120px;
  background: rgba(76, 174, 79, 0.08);
  border-radius: var(--radius-md);
  border: 1px solid rgba(76, 174, 79, 0.1);
  background-image: linear-gradient(180deg, rgba(76, 174, 79, 0.05) 0%, transparent 100%);
}
</style>
