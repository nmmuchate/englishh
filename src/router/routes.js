// src/router/routes.js
// Two-layout pattern: FullscreenLayout (no chrome) + MainLayout (with bottom nav)
// No navigation guards — static UI demo, all routes freely accessible

const routes = [
  // ── Fullscreen pages (no bottom nav, no header) ──────────────────────────
  // Landing, Onboarding, Session, and Feedback are immersive screens.
  {
    path: '/',
    component: () => import('layouts/FullscreenLayout.vue'),
    children: [
      { path: '', name: 'landing', component: () => import('pages/LandingPage.vue') },
      { path: 'onboarding', name: 'onboarding', component: () => import('pages/OnboardingPage.vue') },
      { path: 'placement-result', name: 'placement-result', component: () => import('pages/PlacementResultPage.vue') },
      { path: 'session', name: 'session', component: () => import('pages/SessionPage.vue') },
      { path: 'feedback', name: 'feedback', component: () => import('pages/FeedbackPage.vue') }
    ]
  },

  // ── Main app pages (with persistent bottom nav) ───────────────────────────
  // Dashboard, Progress, Vocabulary Bank, Profile — all show the bottom nav bar.
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'progress', name: 'progress', component: () => import('pages/ProgressPage.vue') },
      { path: 'vocabulary', name: 'vocabulary', component: () => import('pages/VocabularyPage.vue') },
      { path: 'profile', name: 'profile', component: () => import('pages/ProfilePage.vue') }
    ]
  },

  // ── 404 catch-all ─────────────────────────────────────────────────────────
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
