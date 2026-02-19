# Codebase Concerns

**Analysis Date:** 2026-02-20

## Tech Debt

**Boilerplate Code Not Removed:**
- Issue: Project initialized from Quasar template with numerous example/placeholder files that don't serve the actual application
- Files: `src/layouts/MainLayout.vue` (contains Quasar links), `src/components/EssentialLink.vue`, `src/pages/ErrorNotFound.vue`, `src/stores/example-store.js`
- Impact: Increases cognitive load, adds unnecessary bundle size, confuses developers about actual application purpose
- Fix approach: Remove all template example components and replace with domain-specific implementations. Refactor MainLayout to contain actual application UI structure.

**Placeholder API Configuration:**
- Issue: Axios base URL set to hardcoded `https://api.example.com` placeholder
- Files: `src/boot/axios.js` (line 10)
- Impact: Any API calls will fail; requires developer discovery to understand correct endpoint. Not environment-aware.
- Fix approach: Move baseURL to environment variable configuration (e.g., `process.env.VUE_APP_API_URL`). Create environment-specific config files.

**Generic Application Title:**
- Issue: App title remains "Quasar App" from template throughout UI
- Files: `src/layouts/MainLayout.vue` (line 15), `index.html`, `quasar.config.js` (productName)
- Impact: Confuses users and developers about actual application purpose
- Fix approach: Define product name in configuration, replace all references with actual application identity.

## Test Coverage Gaps

**No Tests Implemented:**
- What's not tested: All application logic, components, stores, routing
- Files: Entire `src/` directory
- Risk: Critical bugs can reach production undetected. Refactoring becomes dangerous. No regression protection.
- Priority: High - The test script explicitly echoes "No test specified" and exits

**Missing Test Framework Configuration:**
- Issue: No Jest, Vitest, or other test runner configured
- Files: `package.json` (test script), no jest.config.js or vitest.config.js
- Impact: No automated test execution pipeline. Developers must manually set up testing infrastructure.
- Fix approach: Install and configure testing framework (recommend Vitest for Vite-based Quasar), add test scripts to package.json

## Fragile Areas

**SSR State Pollution Warning Not Addressed:**
- Files: `src/boot/axios.js` (comment on lines 4-9)
- Why fragile: Code explicitly warns about singleton instance pollution in SSR mode but takes no mitigation. If SSR is enabled, concurrent requests may interfere.
- Safe modification: If SSR is disabled (current state in `quasar.config.js` line 110), this is safe. If SSR is enabled in future, must refactor to create per-request axios instances.
- Test coverage: No SSR mode testing present

**Hardcoded Links in Layout:**
- Files: `src/layouts/MainLayout.vue` (lines 52-95)
- Why fragile: External URLs are hardcoded in template. Any change requires code modification. Links point to Quasar framework, not application.
- Safe modification: Extract to configuration file, make links application-specific, consider link management system for future extensibility
- Test coverage: No component tests verify link content or structure

**Unused Store Export Pattern:**
- Files: `src/stores/index.js` (wraps Pinia in defineStore incorrectly)
- Why fragile: Pattern uses `defineStore` wrapper around `createPinia()`, which is non-standard. Creates confusion about actual store structure.
- Safe modification: Simplify to direct Pinia export. Verify all imports still work.
- Test coverage: No store tests

## Missing Critical Features

**No Error Handling:**
- Problem: No global error handler, API error handling, or validation messaging
- Blocks: Users won't know when requests fail; API errors won't be surfaced
- Impact: Poor UX, silent failures in production

**No Environment Configuration:**
- Problem: All configuration (API URL, feature flags, etc.) is hardcoded
- Blocks: Cannot deploy to different environments without code modification
- Impact: Prevents production deployment; violates 12-factor app principles

**No Logging Infrastructure:**
- Problem: No structured logging, error tracking, or observability
- Blocks: Debugging production issues becomes impossible; cannot track user behavior
- Impact: Poor post-deployment visibility

**No Form Validation:**
- Problem: Even basic forms would lack validation framework
- Blocks: Cannot ensure data quality in user inputs
- Impact: Corrupted data submissions to backend

## Scaling Limits

**No State Management Scale Plan:**
- Current capacity: Single counter store with 1 action
- Limit: Will become unmaintainable as soon as 3+ stores with cross-store dependencies emerge
- Scaling path: Establish store organization patterns, module-based store separation, documented best practices before expanding

**No API Layer Abstraction:**
- Current: Raw axios instance exposed globally
- Limit: Request/response handling, caching, retry logic will become scattered across components
- Scaling path: Create service layer in `src/services/` to centralize all API communication

## Security Considerations

**No Input Validation:**
- Risk: XSS attacks through unsanitized user input (if forms added)
- Files: No validation layer exists
- Current mitigation: Vue's template escaping prevents basic XSS, but unsafe patterns are possible
- Recommendations: Implement input validation library (e.g., Vee-Validate), audit any v-html usage, establish input sanitization rules

**No Authentication/Authorization:**
- Risk: No mechanism to protect sensitive functionality or data
- Files: No auth module exists
- Current mitigation: None (public app only currently)
- Recommendations: When authentication needed, use secure token storage (not localStorage), implement refresh token rotation, add route guards in router

**Exposed Axios Instance:**
- Risk: Global `$api` instance could be modified by any component
- Files: `src/boot/axios.js` (lines 19-21), accessed throughout app
- Current mitigation: Single-instance pattern prevents some abuse
- Recommendations: Consider proxy pattern to restrict mutation, add request/response interceptors for centralized security headers

**No CORS Configuration:**
- Risk: CORS policies on API endpoint unknown
- Files: `src/boot/axios.js` (baseURL configuration)
- Current mitigation: None specified
- Recommendations: Document API CORS requirements, add CORS-related headers to axios config, handle CORS errors explicitly

**No Content Security Policy:**
- Risk: XSS, injection attacks possible
- Files: `index.html`
- Current mitigation: None
- Recommendations: Add CSP headers in build configuration or server middleware

## Dependencies at Risk

**Quasar v2.16.0 with No Version Lock:**
- Risk: Minor/patch updates could introduce breaking changes in components
- Current state: Uses `^2.16.0` (allows up to <3.0.0)
- Impact: Unexpected UI breakage with `npm update`
- Migration plan: Pin to exact version `2.16.0`, evaluate updates explicitly before upgrading

**Vue 3.5.22 with Potential Breaking Changes:**
- Risk: Minor updates could introduce behavior changes
- Current state: Uses `^3.5.22`
- Impact: Components may behave differently without notice
- Migration plan: Pin to exact version, evaluate Vue security/feature releases quarterly

**No Lockfile Consistency:**
- Risk: `package-lock.json` exists but `pnpm-workspace.yaml` present suggests monorepo setup that's not configured
- Files: `pnpm-workspace.yaml` (line 1), `package-lock.json`
- Impact: Dependency resolution inconsistency; confusing for team
- Migration plan: Choose single package manager (npm or pnpm), remove conflicting files, document choice

## Performance Bottlenecks

**No Code Splitting Configuration:**
- Files: `src/router/routes.js` (uses lazy import syntax)
- Cause: Routes use dynamic imports correctly but no optimization config in `quasar.config.js`
- Problem: Chunks may not be optimally split; all framework code loads upfront
- Improvement path: Configure vite chunk splitting, analyze bundle size with `build --analyze`

**No Asset Optimization:**
- Problem: SVG asset included inline without compression
- Files: `src/pages/IndexPage.vue` (line 5 references quasar-logo-vertical.svg)
- Impact: Unnecessary bytes transmitted
- Improvement path: Optimize assets, consider inline base64 for critical graphics

**No Caching Strategy:**
- Files: No cache headers, service worker, or browser cache configuration
- Impact: All resources re-fetched on every visit
- Improvement path: Configure browser caching headers, enable PWA (currently `pwa: false` in quasar.config.js line 126)

## Known Issues

**Unclear Store Initialization Pattern:**
- Symptoms: Store index file uses `defineStore` wrapper incorrectly
- Files: `src/stores/index.js` (entire file)
- Trigger: Import and use the store in components
- Workaround: Create stores directly without wrapper; simplify to standard Pinia pattern

**Unused Components and Files:**
- Symptoms: App includes framework documentation links and example components not used
- Files: `src/components/EssentialLink.vue`, portions of `src/layouts/MainLayout.vue`
- Trigger: Browsing codebase or running build
- Workaround: Safe to delete after extracting actual layout structure

---

*Concerns audit: 2026-02-20*
