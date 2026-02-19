# Phase 1: Foundation - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the app shell infrastructure: design tokens, dark/light theming, mobile container, Vue Router with all named routes, Pinia mock stores, and stripped HTTP layer — everything subsequent phases build on. No visible pages delivered in this phase beyond a working skeleton that routes correctly.

</domain>

<decisions>
## Implementation Decisions

### Design Token Method
- Use **both** Quasar brand config (quasar.config.js) + CSS custom properties (app.css)
  - Quasar brand config: sets primary (#4cae4f) and secondary/accent colors so QBtn, QCard, etc. auto-tint correctly
  - CSS variables in app.css: `--primary`, `--accent-orange` (#FF6B35), `--bg-light` (#f6f7f6), `--bg-dark` (#151d15), `--text-deep-slate` (#131613) for use in scoped component styles
- **Inter font**: loaded via Google Fonts CDN link in `index.html`
- **Icons**: Claude's discretion — use whichever of Material Icons (Quasar extras, already configured) vs Material Symbols CDN matches the Stitch icon set more closely
- **Border-radius / spacing scale**: Claude's discretion — use CSS variables or inline values, whichever keeps components cleanest

### Router / Auth Guard
- **No navigation guards** — all routes freely accessible; this is a static UI demo
- **No Pinia auth enforcement** — mock auth store holds a `isAuthenticated` flag for component-level use (e.g., showing avatar), but does not gate routes
- **Entry point**: Claude's discretion — decide the most natural demo entry (root = Landing is simplest)
- **Onboarding skip**: Claude's discretion — decide whether `hasCompletedOnboarding` flag in store skips onboarding on reload

### Bottom Navigation
- **Persistent bottom nav** on main app screens using Quasar QTabsBar or QFooter + QTabs
- **3 tabs**: Home (Dashboard), Progress (Your Progress), Profile
- **Bottom nav HIDDEN on**: Landing/Sign-in, Onboarding wizard, Active Session, Feedback screen
- **Bottom nav SHOWN on**: Dashboard, Your Progress, Vocabulary Bank (accessible within the app though not a nav tab), Profile/Settings, Paywall modal context
- Vocabulary Bank is reachable (e.g., from Profile or Progress) but does not get its own bottom nav tab

### Claude's Discretion
- Icon set selection (Material Icons vs Material Symbols) — pick whichever matches Stitch icons
- Border-radius and spacing variable approach — inline or variables, cleanliness wins
- App entry point behavior (root URL, onboarding skip flag)
- Bottom nav active-state indicator style (underline, color highlight, etc.)

</decisions>

<specifics>
## Specific Ideas

- Design tokens come from Stitch Tailwind config: primary #4cae4f, accent-orange #FF6B35, background-light #f6f7f6, background-dark #151d15, deep-slate #131613
- Stitch uses Inter weights 400/500/600/700/800 — load all 5 weights from Google Fonts
- App is mobile-first, max-width 430px centered — this constraint is global (applied in MainLayout or App.vue wrapper)
- Dark mode follows OS only (no manual toggle in Phase 1 — the settings toggle in Phase 5 will layer on top)

</specifics>

<deferred>
## Deferred Ideas

- Manual dark mode toggle in UI — Phase 5 (Profile/Settings page)
- PWA install prompt / service worker customization — future enhancement

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-20*
