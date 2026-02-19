# Coding Conventions

**Analysis Date:** 2026-02-20

## Naming Patterns

**Files:**
- Vue Single File Components: PascalCase (e.g., `EssentialLink.vue`, `MainLayout.vue`, `IndexPage.vue`)
- JavaScript modules: camelCase or kebab-case (e.g., `axios.js`, `example-store.js`, `routes.js`)
- Directory names: camelCase (e.g., `boot`, `router`, `stores`, `pages`, `components`, `layouts`)

**Functions:**
- Composition API setup functions: camelCase (e.g., `toggleLeftDrawer`, `increment`)
- Store actions: camelCase (e.g., `increment`)
- Bootstrap/setup functions: camelCase (e.g., `defineBoot`)

**Variables:**
- Reactive refs: camelCase (e.g., `leftDrawerOpen`, `counter`)
- Constants/Lists: camelCase (e.g., `linksList`)
- Component names: PascalCase (e.g., `EssentialLink`)

**Types:**
- Component names in exports: PascalCase (e.g., `export default defineComponent({ name: 'App' })`)
- Store names: camelCase (e.g., `useCounterStore`)

## Code Style

**Formatting:**
- Indentation: 2 spaces (defined in `.editorconfig`)
- Line endings: LF (Unix style)
- Charset: UTF-8
- Final newline: Required in all files
- Trailing whitespace: Removed

**Linting:**
- No dedicated ESLint/Prettier config found in project root
- EditorConfig enforces baseline formatting across all code files

## Import Organization

**Order:**
1. Vue core imports (`import { defineComponent, ref } from 'vue'`)
2. Third-party packages (e.g., `import axios from 'axios'`, `import { defineStore } from 'pinia'`)
3. Quasar-specific imports (e.g., `import { defineBoot } from '#q-app/wrappers'`)
4. Local components/modules (e.g., `import routes from './routes'`, `import EssentialLink from 'components/EssentialLink.vue'`)

**Path Aliases:**
- Asset path alias: `~assets/` (e.g., `src="~assets/quasar-logo-vertical.svg"`)
- Component imports: `components/` relative path (e.g., `import('components/EssentialLink.vue')`)
- Layout imports: `layouts/` relative path (e.g., `import('layouts/MainLayout.vue')`)
- Page imports: `pages/` relative path (e.g., `import('pages/IndexPage.vue')`)

## Error Handling

**Patterns:**
- Global error handling through Quasar framework
- No explicit try/catch blocks observed in current codebase
- Axios configured as global property through boot file for centralized API management

## Logging

**Framework:** `console` object (no custom logging framework detected)

**Patterns:**
- Comments used to explain non-obvious logic and SSR considerations (see `src/boot/axios.js`)
- No structured logging observed in current implementation

## Comments

**When to Comment:**
- Explain critical concerns (e.g., SSR state pollution warnings in `src/boot/axios.js`)
- Clarify configuration decisions (e.g., Vue Router mode in `src/router/index.js`)
- Document requirements and constraints for developers

**JSDoc/TSDoc:**
- Not detected in current codebase
- Vue component documentation: Inline comments for prop definitions when needed

## Function Design

**Size:** Small, focused functions preferred
- Most functions in components are 2-5 lines (e.g., `toggleLeftDrawer`, `increment`)

**Parameters:**
- Props: Explicitly defined with TypeScript/Vue 3 prop validation
- Example from `EssentialLink.vue`:
```javascript
props: {
  title: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: '#'
  },
  icon: {
    type: String,
    default: ''
  }
}
```

**Return Values:**
- Setup functions return object with reactive state and methods
- Components return component definition via `defineComponent`
- Stores return state management object via `defineStore`

## Module Design

**Exports:**
- Default exports used for main components/modules (e.g., `export default defineComponent(...)`, `export default defineRouter(...)`)
- Named exports for utilities (e.g., `export { api }` in `src/boot/axios.js`)

**Barrel Files:**
- Store index file exists at `src/stores/index.js` to centralize store setup
- No barrel exports for components observed; components imported directly

## Component Patterns

**Vue 3 Composition API:**
- All components use `defineComponent` from Vue 3
- Functional components preferred (stateless presentational components like `EssentialLink.vue`)
- Setup function pattern used for component logic (see `MainLayout.vue`)

**Pinia Store Pattern:**
- Store definition follows Pinia's Setup Stores pattern
- Uses `defineStore` with composition function approach (see `example-store.js`)
- HMR updates supported via `acceptHMRUpdate` for hot module replacement

**Bootstrap/Boot Files:**
- Located in `src/boot/` directory
- Use `defineBoot` wrapper from Quasar
- Global property registration for framework-wide access (e.g., `$axios`, `$api`)

---

*Convention analysis: 2026-02-20*
