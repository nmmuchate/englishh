---
phase: 14
slug: listening-test
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual verification only (no jest/vitest configured in project) |
| **Config file** | none |
| **Quick run command** | N/A |
| **Full suite command** | N/A |
| **Estimated runtime** | Manual browser walkthrough ~5 minutes |

---

## Sampling Rate

- **After every task commit:** Visual inspection in browser (npm run dev)
- **After every plan wave:** Full manual walkthrough of implemented stage
- **Before `/gsd:verify-work`:** Full placement test flow must complete end-to-end
- **Max feedback latency:** Manual — inspect after each task

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | PLACE-03 | manual | grep -n "listening" functions/index.js | ✅ existing file | ⬜ pending |
| 14-01-02 | 01 | 1 | PLACE-03 | manual | grep -n "ListeningStage\|ListeningPlayer" src/pages/ListeningStage.vue | ❌ new file | ⬜ pending |
| 14-01-03 | 01 | 1 | PLACE-03 | manual | grep -n "speechSynthesis" src/pages/ListeningPlayer.vue | ❌ new file | ⬜ pending |
| 14-02-01 | 02 | 2 | PLACE-03 | manual | grep -n "ListeningStage\|handleListeningComplete" src/pages/OnboardingPage.vue | ✅ existing file | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test framework exists in this project; all verification is manual. Existing `grep`-based acceptance criteria in each plan task serve as structural verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Play button triggers speechSynthesis TTS audio | PLACE-03 | Browser audio API — not testable in Node/CI | Load /onboarding, advance to listening stage, tap Play, verify audio heard |
| Replay button works after first play | PLACE-03 | Browser audio API — not testable in Node/CI | After audio plays, tap Replay, verify audio plays again |
| Answer selection gated until audio plays | PLACE-03 | UI interaction state — not testable headlessly | Verify answer options are disabled/non-interactive before Play is tapped |
| TTS unavailability fallback | PLACE-03 | Requires browser environment manipulation | In a browser without speechSynthesis, verify fallback message + Skip button appear |
| Audio stops when stage advances | PLACE-03 | onUnmounted lifecycle | Tap Skip mid-audio, verify TTS stops immediately |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < manual (~5 min)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
