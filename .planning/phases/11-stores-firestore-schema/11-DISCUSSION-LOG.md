# Phase 11 Discussion Log

**Date:** 2026-04-06
**Phase:** 11 — Stores & Firestore Schema

## Areas Discussed

### 1. Profile Store Integration

**Q:** How should the new v1.2 user fields be loaded from Firestore?

| Option | Selected |
|--------|----------|
| Extend profileStore (single read on auth) | — |
| Each new store owns its reads | — |
| You decide | ✓ |

**Captured decision:** Claude's discretion — will extend `useProfileStore.setProfile()` to include v1.2 fields. Consistent with existing auth pattern.

---

### 2. Scenario Library Seeding

**Q1:** How many scenario templates should be seeded in Phase 11?

| Option | Selected |
|--------|----------|
| Minimal seed (3-5 templates) | — |
| Full seed per field | ✓ |
| Schema only, no data | — |

**Q2:** How should scenario templates be seeded?

| Option | Selected |
|--------|----------|
| Seed script (functions/scripts/) | ✓ |
| Cloud Function (onRequest) | — |
| Manual Firestore console | — |

**Q3:** Which session types should be seeded?

| Option | Selected |
|--------|----------|
| Scenario (role-play) | ✓ |
| Free Talk | ✓ |
| Story Builder | ✓ |
| Debate | ✓ |

**Captured decision:** Full seed for all 4 session types across all fields (Engineering, Health, Business, Technology, Student) and interests (Travel, Gaming, Cooking, Sports, Music). Run via `functions/scripts/seed-scenario-library.js`.

---

### 3. Placement Store Persistence

**Q:** When should usePlacementStore save stage results to Firestore?

| Option | Selected |
|--------|----------|
| Progressive save (after each stage) | ✓ |
| Batch save at end | — |
| You decide | — |

**Captured decision:** Progressive save — write to `placementTests/{uid}` after each stage completes.
