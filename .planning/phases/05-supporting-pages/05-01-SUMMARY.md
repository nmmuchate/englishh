---
phase: 05-supporting-pages
plan: 01
subsystem: ui
tags: [vue, quasar, qdialog, paywall, monetisation]

# Dependency graph
requires:
  - phase: 03-dashboard
    provides: DashboardPage.vue header row where Go Pro chip is inserted
provides:
  - PaywallDialog.vue QDialog paywall component with pricing tiers and dismiss paths
  - Go Pro trigger chip wired into DashboardPage.vue header
affects: [any future plan that wires real in-app purchase logic to showPaywall]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "QDialog v-model pattern — modelValue prop + emit('update:modelValue') for parent-controlled dialog visibility"
    - "Pricing card selection via ref + :class binding — no QOptionGroup needed for fully custom card layouts"
    - "Accent-orange chip trigger in existing header row — rgba background + border for pill badge matching Stitch design"

key-files:
  created:
    - src/components/PaywallDialog.vue
  modified:
    - src/pages/DashboardPage.vue

key-decisions:
  - "PaywallDialog uses maximized QDialog with slide-up/slide-down transitions and a bottom-sheet card (border-radius 24px 24px 0 0) anchored at screen bottom — matches Stitch upgrade_to_pro modal exactly"
  - "Backdrop dismiss implemented via @click.self on the overlay wrapper div (not QDialog's persistent prop) so tap-outside-card closes without extra prop"
  - "Annual plan selected by default (ref('annual')) to front-load the higher-value option on every open"

patterns-established:
  - "PaywallDialog pattern: v-model-controlled QDialog, pricing toggle via local ref, three dismiss paths (X btn / Subscribe btn / backdrop)"
  - "Go Pro chip pattern: accent-orange rgba pill in header row, @click sets showPaywall = true, no router navigation"

requirements-completed: [PAYW-01, PAYW-02, PAYW-03]

# Metrics
duration: 15min
completed: 2026-02-23
---

# Phase 5 Plan 01: Paywall Dialog and Go Pro Trigger Summary

**QDialog paywall modal with annual/monthly pricing toggle, hero gradient area, and three dismiss paths wired to an accent-orange Go Pro chip in DashboardPage header**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-23T08:07:00Z
- **Completed:** 2026-02-23T08:08:00Z
- **Tasks:** 2 auto + 1 human-verify checkpoint
- **Files modified:** 2

## Accomplishments
- Created PaywallDialog.vue (283 lines) with QDialog bottom-sheet, hero gradient, feature checklist, annual/monthly pricing cards with selection toggle, Subscribe Now button, and all three dismiss paths
- Wired accent-orange "Go Pro" chip into DashboardPage.vue header row; chip opens PaywallDialog via showPaywall ref
- Human visual verification passed — all 13 verification steps confirmed by user

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PaywallDialog.vue** - `1073711` (feat)
2. **Task 2: Wire Go Pro trigger into DashboardPage.vue** - `dfdf554` (feat)

## Files Created/Modified
- `src/components/PaywallDialog.vue` - QDialog paywall component with pricing tiers, feature checklist, hero gradient, and dismiss emit wiring
- `src/pages/DashboardPage.vue` - Added Go Pro chip trigger, PaywallDialog import, showPaywall ref, and PaywallDialog template usage

## Decisions Made
- Used maximized QDialog with custom bottom-sheet card div rather than non-maximized dialog, to achieve the Stitch slide-up-from-bottom sheet feel while allowing tap-outside-card dismiss via @click.self
- Annual plan pre-selected by default to surface the "Best Value" option on every open
- Backdrop dismiss via @click.self on overlay wrapper avoids needing to set QDialog to non-persistent; simpler and matches design intent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PaywallDialog is fully standalone and ready for real in-app purchase integration when a payments backend is wired
- showPaywall ref in DashboardPage provides the exact entry point for future IAP trigger logic
- Remaining Phase 5 plans (05-02, 05-03, 05-04) can proceed independently

---
*Phase: 05-supporting-pages*
*Completed: 2026-02-23*
