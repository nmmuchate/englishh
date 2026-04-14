---
phase: 16-session-types-personalisation
plan: 02
subsystem: session-ui
tags: [vue, quasar, session-types, cefr-lock, scenario-brief]
dependency_graph:
  requires: [16-01]
  provides: [SessionTypeSelectPage, SessionTypeCard, ScenarioBriefPage]
  affects: [session-store, placement-store, router]
tech_stack:
  added: []
  patterns: [q-inner-loading, QNotify, q-banner, QChip, role=button accessibility]
key_files:
  created:
    - src/components/SessionTypeCard.vue
    - src/pages/SessionTypeSelectPage.vue
    - src/pages/ScenarioBriefPage.vue
  modified: []
decisions:
  - "CEFR lock logic uses CEFR_VALUE map with placementStore.finalResult?.overallLevel fallback to profileStore.currentLevel then B1"
  - "Locked card tap wrapper div retains pointer-events while inner card has opacity 0.5 — parent handles QNotify"
  - "PaywallDialog integration deferred to Phase 18 — startSession returns paywallRequired signal, page returns early"
metrics:
  duration: 98s
  completed_date: 2026-04-11
  tasks: 2
  files_created: 3
  files_modified: 0
---

# Phase 16 Plan 02: Session UI — SessionTypeCard, SessionTypeSelectPage, ScenarioBriefPage Summary

**One-liner:** 2x2 session type selector with CEFR lock states (QNotify on locked tap, q-inner-loading during plan gen) and pre-session ScenarioBriefPage reading topic/role/context/objectives from session store.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create SessionTypeCard.vue component | e0575dc | src/components/SessionTypeCard.vue |
| 2 | Create SessionTypeSelectPage.vue and ScenarioBriefPage.vue | dc07b47 | src/pages/SessionTypeSelectPage.vue, src/pages/ScenarioBriefPage.vue |

## What Was Built

### SessionTypeCard.vue (88 lines)

Reusable session type card with locked/unlocked variants:
- Props: type, icon, name, description, duration, locked
- Emits `select(type)` only when not locked
- Locked variant: opacity 0.5, lock icon overlay (top-right, absolute positioned), "Available at B1" caption, transparent border
- Unlocked variant: 2px solid var(--q-primary) border, primary icon + chip with duration
- Full accessibility: role="button", tabindex="0", aria-disabled, aria-label with "locked, available at B1" message
- border-radius: 16px, min-height: 88px per card

### SessionTypeSelectPage.vue (119 lines)

2x2 grid session type picker:
- 4 session types: Free Talk, Scenario (minCefr 1), Story Builder, Debate (minCefr 3)
- CEFR_VALUE map: A1=1, A2=2, B1=3, B2=4, C1=5, C2=6
- userCefrNumeric computed from placementStore.finalResult?.overallLevel → profileStore.currentLevel → 'B1' fallback
- isLocked() compares userCefrNumeric to sessionDef.minCefr
- handleLockedTap() fires $q.notify({ type: 'warning', message: '{Name} unlocks at B1', position: 'top' })
- handleSelectType() calls sessionStore.startSession(type), shows q-inner-loading overlay, navigates to session-brief on success
- Error banner with Retry and Back buttons
- PaywallDialog stub returns early (Phase 18)

### ScenarioBriefPage.vue (82 lines)

Pre-session briefing display:
- Reads sessionStore.sessionPlan for topic, role, context, objectives
- Reads sessionStore.sessionType for q-chip badge (Free Talk, Scenario, etc.)
- onMounted guard: redirects to /sessions if plan is null (e.g. direct URL access)
- Four sections: q-chip type badge, text-h6 topic, YOUR ROLE card, CONTEXT card, OBJECTIVES card with check_circle icons (aria-hidden)
- Primary CTA: Start Session → router.push({ name: 'session' })
- Secondary: Choose Different Type → router.push({ name: 'sessions' })

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| src/pages/SessionTypeSelectPage.vue | 98 | PaywallDialog not opened | Phase 18 will implement paywall dialog; startSession returns paywallRequired signal, page returns early without crashing |

## Self-Check

Verifying created files and commits exist.
