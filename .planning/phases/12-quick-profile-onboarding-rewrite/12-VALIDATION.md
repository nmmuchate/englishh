---
phase: 12
slug: quick-profile-onboarding-rewrite
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework installed (deferred per project decision) |
| **Config file** | none |
| **Quick run command** | Manual browser check |
| **Full suite command** | Manual browser check |
| **Estimated runtime** | ~2 min manual walkthrough |

---

## Sampling Rate

- **After every task commit:** Visual browser check of the modified component
- **After every plan wave:** Full onboarding flow walkthrough (sign in → onboarding → Quick Profile complete)
- **Before `/gsd:verify-work`:** All 4 success criteria from ROADMAP.md must be manually verified
- **Max feedback latency:** ~2 minutes (manual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | PLACE-01 | smoke (file check) | `test -f src/pages/QuickProfileStage.vue` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | PLACE-01 | smoke (grep) | `grep "profileSubStep\|@complete" src/pages/QuickProfileStage.vue` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 1 | PLACE-01, PLACE-11 | smoke (grep) | `grep "QuickProfileStage\|q-linear-progress\|stageIndex" src/pages/OnboardingPage.vue` | ✅ | ⬜ pending |
| 12-02-02 | 02 | 1 | PLACE-11 | smoke (grep) | `grep "placementTests\|startedAt\|serverTimestamp" src/pages/QuickProfileStage.vue` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/pages/QuickProfileStage.vue` — created in Plan 01 (new file)

*All other files exist. No framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Quick Profile 4 sub-screens render correctly with correct labels | PLACE-01 | No test framework | Sign in → go to /onboarding → confirm 4 sub-steps advance correctly with back/continue |
| All required fields enforced before Continue | PLACE-01 | No test framework | Try tapping Continue with no selection on each sub-step — must be blocked |
| Firestore writes to users/{uid}.profile | PLACE-11 | Requires live Firebase | Complete Quick Profile → check Firestore console for profile.occupation, .field, .interests, .goal, .priorExperience |
| placementTests/{uid} initialized with userId + startedAt | PLACE-11 | Requires live Firebase | Check Firestore console for placementTests/{uid}.userId and .startedAt |
| Refreshing mid-test returns user to onboarding | PLACE-11 | Requires live browser | Complete Quick Profile, close tab, reopen → confirm redirect to /onboarding |
| onboardingCompleted remains false after Quick Profile | PLACE-11 | Requires live Firebase | Check users/{uid}.onboardingCompleted is still false after completing Quick Profile |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
