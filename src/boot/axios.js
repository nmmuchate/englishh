import { defineBoot } from '#q-app/wrappers'

// Axios boot stripped — SpeakAI uses no real HTTP calls.
// All application data is mocked inline in Pinia stores (src/stores/).
// This file is kept as an empty boot stub to satisfy any tooling that expects it.
export default defineBoot(() => {
  // intentionally empty — no HTTP client configured
})
