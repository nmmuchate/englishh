---
phase: 11
slug: stores-firestore-schema
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual import checks + node script smoke test (no unit test framework configured) |
| **Config file** | none |
| **Quick run command** | `node -e "require('./src/stores/placement.js')" 2>/dev/null \|\| echo OK` |
| **Full suite command** | `node functions/scripts/seed-scenario-library.js --dry-run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Confirm file exists and exports expected symbols
- **After every plan wave:** Import check + seed script dry-run
- **Before `/gsd:verify-work`:** All stores importable, seed script idempotent pass

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| placement-store | 01 | 1 | INFRA-v12-01 | import check | `grep -l "usePlacementStore" src/stores/placement.js` | ❌ W0 | ⬜ pending |
| learning-store | 01 | 1 | INFRA-v12-02 | import check | `grep -l "useLearningStore" src/stores/learning.js` | ❌ W0 | ⬜ pending |
| profile-extend | 01 | 1 | INFRA-v12-04 | grep | `grep "profile\|placement\|mistakePatterns\|sessionTypesCompleted" src/stores/profile.js` | ✅ | ⬜ pending |
| scenario-seed | 02 | 2 | INFRA-v12-03 | script | `node functions/scripts/seed-scenario-library.js --dry-run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/stores/placement.js` — new store file
- [ ] `src/stores/learning.js` — new store file
- [ ] `functions/scripts/seed-scenario-library.js` — seed script

*Wave 0 creates these files; they don't exist yet.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| users/{uid} Firestore fields present | INFRA-v12-04 | Requires live Firestore read | Sign in, open Firestore console, verify profile/placement/mistakePatterns/sessionTypesCompleted fields on user doc |
| scenarioLibrary populated | INFRA-v12-03 | Requires running seed script against real Firestore | Run `node functions/scripts/seed-scenario-library.js`, check Firestore console for ≥40 documents |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
