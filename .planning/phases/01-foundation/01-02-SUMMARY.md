---
plan: 01-02
phase: 01-foundation
status: complete
completed: 2026-02-20
---

# Plan 01-02 Summary: Two-Layout Routing & Page Stubs

## What was built
- src/router/routes.js: Two-layout groups (FullscreenLayout for /, MainLayout for /app), 8 named routes + catchAll 404, no guards
- src/layouts/MainLayout.vue: Complete rewrite — QLayout + QFooter + QTabs with 3 QRouteTab entries (Home/Progress/Profile)
- src/layouts/FullscreenLayout.vue: New chromeless layout (no header, no footer)
- 8 page stubs: LandingPage, OnboardingPage, DashboardPage, SessionPage, FeedbackPage, ProgressPage, VocabularyPage, ProfilePage
- Deleted: src/pages/IndexPage.vue

## Files modified/created
- src/router/routes.js (modified)
- src/layouts/MainLayout.vue (rewritten)
- src/layouts/FullscreenLayout.vue (created)
- src/pages/LandingPage.vue (created)
- src/pages/OnboardingPage.vue (created)
- src/pages/DashboardPage.vue (created)
- src/pages/SessionPage.vue (created)
- src/pages/FeedbackPage.vue (created)
- src/pages/ProgressPage.vue (created)
- src/pages/VocabularyPage.vue (created)
- src/pages/ProfilePage.vue (created)
- src/pages/IndexPage.vue (deleted)
