# Codebase Structure

**Analysis Date:** 2026-02-20

## Directory Layout

```
englishh/
├── src/                          # Application source code
│   ├── App.vue                   # Root Vue component
│   ├── assets/                   # Static images and media
│   │   └── quasar-logo-vertical.svg
│   ├── boot/                     # Application bootstrap files
│   │   └── axios.js              # HTTP client initialization
│   ├── components/               # Reusable Vue components
│   │   └── EssentialLink.vue
│   ├── css/                      # Global stylesheets
│   │   └── app.css
│   ├── layouts/                  # Layout wrapper components
│   │   └── MainLayout.vue
│   ├── pages/                    # Page/route components
│   │   ├── IndexPage.vue
│   │   └── ErrorNotFound.vue
│   ├── router/                   # Vue Router configuration
│   │   ├── index.js              # Router instance creation
│   │   └── routes.js             # Route definitions
│   └── stores/                   # Pinia state management
│       ├── index.js              # Store initialization
│       └── example-store.js      # Example counter store
├── public/                       # Static assets served as-is
│   ├── favicon.ico
│   └── icons/
├── .planning/                    # Project planning documents
├── .quasar/                      # Quasar build artifacts and config (generated)
├── index.html                    # HTML entry point template
├── jsconfig.json                 # JavaScript config (extends .quasar/tsconfig.json)
├── package.json                  # Project dependencies and metadata
├── package-lock.json             # Dependency lock file
├── postcss.config.js             # PostCSS configuration
├── quasar.config.js              # Quasar framework configuration
├── pnpm-workspace.yaml           # pnpm workspace configuration
├── .editorconfig                 # Editor formatting rules
├── .gitignore                    # Git ignore rules
├── README.md                     # Project documentation
└── .vscode/                      # VS Code workspace settings
```

## Directory Purposes

**src/:**
- Purpose: Main application source code - all Vue components, routing, state, and business logic
- Contains: Vue single-file components, JavaScript modules, stylesheets
- Key files: `App.vue`, `router/routes.js`

**src/assets/:**
- Purpose: Static media assets (images, SVGs, fonts) bundled with application
- Contains: SVG files and image assets referenced in components
- Key files: `quasar-logo-vertical.svg` (referenced in `IndexPage.vue`)

**src/boot/:**
- Purpose: Bootstrap files executed during application initialization before Vue mounts
- Contains: Application setup and initialization logic (HTTP clients, global properties, plugins)
- Key files: `axios.js` (HTTP client setup), `index.js` (if present, boots initialization)

**src/components/:**
- Purpose: Reusable Vue components that are imported and used by multiple pages/layouts
- Contains: Presentational components with props, methods, and scoped styles
- Key files: `EssentialLink.vue` (link list item component)

**src/css/:**
- Purpose: Global stylesheets applied to entire application
- Contains: CSS files defining app-wide styles, variables, utility classes
- Key files: `app.css` (main stylesheet)

**src/layouts/:**
- Purpose: Layout shell components that wrap page content
- Contains: Vue components defining page structure (header, footer, sidebar, main area)
- Key files: `MainLayout.vue` (primary application layout with header and drawer)

**src/pages/:**
- Purpose: Full page/route components displayed based on current URL
- Contains: Route-matched components, typically page-level logic and templates
- Key files: `IndexPage.vue` (home page), `ErrorNotFound.vue` (404 fallback)

**src/router/:**
- Purpose: Vue Router configuration and route definitions
- Contains: Router instance setup, route array with path/component/lazy-loading config
- Key files: `index.js` (router instantiation), `routes.js` (route definitions)

**src/stores/:**
- Purpose: Pinia state management store definitions
- Contains: Store definitions with state, getters, actions, and mutations
- Key files: `index.js` (Pinia initialization), `example-store.js` (counter store)

**public/:**
- Purpose: Static files served directly without bundling (favicon, icons, manifests)
- Contains: Files copied as-is to dist root; accessible at root URLs
- Key files: `favicon.ico`, `icons/` directory

**.quasar/:**
- Purpose: Auto-generated Quasar build artifacts and resolved configuration
- Contains: Generated TypeScript config, compiled quasar.config.js, build caches
- Generated: Yes - created during `npm install` postinstall hook
- Committed: No - typically in .gitignore

## Key File Locations

**Entry Points:**
- `index.html`: HTML template with mount point; processed by Quasar to inject app bootstrap
- `src/App.vue`: Root Vue component with `<router-view />` outlet
- `src/router/index.js`: Creates and exports Vue Router instance
- `src/stores/index.js`: Creates and exports Pinia instance

**Configuration:**
- `quasar.config.js`: Quasar framework configuration (boot files, CSS, build targets, SSR settings)
- `package.json`: Project metadata, dependencies, scripts
- `.editorconfig`: Code formatting rules for editors
- `postcss.config.js`: PostCSS plugin configuration for CSS processing

**Core Logic:**
- `src/router/routes.js`: Route definitions mapping URLs to layouts/pages
- `src/boot/axios.js`: HTTP client initialization and global property setup
- `src/stores/example-store.js`: Example state management store (counter)

**Styling:**
- `src/css/app.css`: Global application styles
- Individual component files: `<style scoped>` blocks in `.vue` files

**Testing:**
- Not yet configured (test field in package.json: `"echo 'No test specified' && exit 0"`)

## Naming Conventions

**Files:**
- Components: PascalCase in filenames (e.g., `EssentialLink.vue`, `MainLayout.vue`)
- Pages: PascalCase with descriptive names (e.g., `IndexPage.vue`, `ErrorNotFound.vue`)
- Stores: camelCase or kebab-case for store IDs (e.g., `example-store.js`)
- Boot files: camelCase (e.g., `axios.js`)
- Assets: kebab-case (e.g., `quasar-logo-vertical.svg`)

**Directories:**
- Plural names for collections: `src/pages/`, `src/components/`, `src/layouts/`, `src/stores/`, `src/assets/`
- Singular for single concepts: `src/router/`, `src/boot/`, `src/css/`

**Vue Components:**
- PascalCase: `name` property matches filename (e.g., name: 'MainLayout' for `MainLayout.vue`)
- Props: camelCase (e.g., `title`, `caption`, `icon`)
- Methods/data: camelCase (e.g., `toggleLeftDrawer`, `leftDrawerOpen`)

**Stores:**
- Store ID: kebab-case (e.g., `'counter'` in `example-store.js`)
- Exported function: `useStoreName` pattern (e.g., `useCounterStore`)
- State properties: camelCase (e.g., `counter`)
- Getters: camelCase (e.g., `doubleCount`)
- Actions: camelCase (e.g., `increment`)

## Where to Add New Code

**New Feature (Page + Store):**
- Primary code: Create `src/pages/FeatureNamePage.vue` for UI, `src/stores/feature-name-store.js` for state
- Tests: Create `src/pages/__tests__/FeatureNamePage.spec.js` (once testing configured)
- Register route: Add route entry in `src/router/routes.js` with path and component
- Example: For "lessons" feature, create `src/pages/LessonsPage.vue` and `src/stores/lessons-store.js`

**New Component (Reusable across pages):**
- Implementation: Create `src/components/ComponentName.vue` with props and methods
- Usage: Import in parent component: `import ComponentName from 'components/ComponentName.vue'`
- Style: Use scoped styles in component file
- Example: For button component, create `src/components/PrimaryButton.vue`, import in pages needing it

**New Layout (Different page structure):**
- Implementation: Create `src/layouts/LayoutName.vue` with `<router-view />` for page outlet
- Register: Add layout to routes in `src/router/routes.js` as parent route component
- Example: For admin pages with different header, create `src/layouts/AdminLayout.vue`, nest admin routes under it

**New Store (Shared state):**
- Implementation: Create `src/stores/feature-store.js` with `defineStore('feature-id', { state, getters, actions })`
- Export: Default export the result, export as `useFeatureStore` function
- Usage: Import and call in components: `const store = useFeatureStore()`
- Example: For user store, create `src/stores/user-store.js` with login/logout actions

**API Integration:**
- Usage: Import and use axios instance: `import { api } from 'boot/axios'`
- Or in Options API: `this.$api.get('/endpoint')`
- Update BaseURL: Modify `src/boot/axios.js` baseURL configuration
- Example: `api.post('/auth/login', credentials).then(response => store.setUser(response.data))`

**Utility Functions:**
- Location: Create `src/utils/` directory for shared helper functions
- Example: `src/utils/validation.js`, `src/utils/formatting.js`
- Import: `import { validateEmail } from 'src/utils/validation.js'`

**Global Styles:**
- Location: Add to `src/css/app.css` for app-wide rules
- Or create new CSS file and import in `quasar.config.js` css array
- Example: For theme variables, add to `app.css` or create `src/css/variables.css`

## Special Directories

**.quasar/:**
- Purpose: Auto-generated build configuration and caches
- Generated: Yes - created by Quasar during `npm install` (postinstall hook runs `quasar prepare`)
- Committed: No - in .gitignore

**node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes - created by `npm install`
- Committed: No - in .gitignore

**dist/:**
- Purpose: Built/compiled application output (created after `npm run build`)
- Generated: Yes - created during build
- Committed: No - not present, in .gitignore

**public/:**
- Purpose: Static assets copied as-is to dist root
- Generated: No - manually maintained
- Committed: Yes - versioned in git

**.vscode/:**
- Purpose: VS Code workspace settings (extensions, formatting, debug configs)
- Generated: No - manually maintained
- Committed: Yes - shared with team

## Path Aliases

The following import aliases are configured in `.quasar/tsconfig.json` and available throughout the codebase:

- `components/` → `src/components/`
- `layouts/` → `src/layouts/`
- `pages/` → `src/pages/`
- `assets/` → `src/assets/`
- `boot/` → `src/boot/`
- `stores/` → `src/stores/`
- `src/` → `src/`
- `app/` → project root
- `#q-app` → Quasar framework types

**Usage Examples:**
- `import EssentialLink from 'components/EssentialLink.vue'`
- `import { useCounterStore } from 'stores/example-store'`
- `import quasarLogo from 'assets/quasar-logo-vertical.svg'`

---

*Structure analysis: 2026-02-20*
