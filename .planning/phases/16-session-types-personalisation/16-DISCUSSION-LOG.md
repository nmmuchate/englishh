# Phase 16: Session Types & Personalisation — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 16-session-types-personalisation
**Areas discussed:** Dashboard → session entry, Lock state presentation, generateSessionPlan integration, ScenarioBriefPage content

---

## Dashboard → Session Entry

| Option | Description | Selected |
|--------|-------------|----------|
| FAB reroutes to /sessions | Existing FAB routes to SessionTypeSelectPage instead of /session directly. User always picks a type before starting. | ✓ |
| Recommended card + FAB shortcut | Dashboard gets a recommended session card with direct Start; FAB still goes to type select for override. | |

**User's choice:** FAB reroutes to /sessions
**Notes:** Minimal Dashboard change — only the FAB target changes.

---

## Lock State Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Visible + grayed + lock icon | Reduced opacity, lock icon overlay, "B1+" subtitle. Tapping shows a message. | ✓ |
| Visible + disabled, tap shows toast | Full opacity but disabled; toast on tap explains requirement. | |
| Hidden entirely for lower CEFR | A1-A2 users see only Free Talk + Scenario; others hidden. | |

**User's choice:** Visible + grayed + lock icon
**Notes:** User wants transparency about what's coming at higher levels.

---

## generateSessionPlan Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Replaces startConversation | One function does both personalisation and session creation; returns sessionId + initialMessage. | ✓ |
| Runs first, plan passed to startConversation | Two Cloud Function calls per session start; backwards compatible. | |
| Only for brief screen content | Generates the brief only; startConversation starts the real session. | |

**User's choice:** generateSessionPlan replaces startConversation
**Notes:** Clean replacement — sendMessage and endSession stay unchanged.

---

## ScenarioBriefPage Content

| Option | Description | Selected |
|--------|-------------|----------|
| generateSessionPlan called on type selection, brief shown first | API called immediately on type tap; loading moment; AI-generated brief displayed; sessionId already live on Start. | ✓ |
| Static brief, generateSessionPlan called on Start | Template brief before start; API called when tapping Start. | |
| No brief page, generate on Start directly | Skip brief entirely; go straight to SessionPage after generating. | |

**User's choice:** generateSessionPlan called on type selection, brief shown first
**Notes:** No second API call on Start — sessionId is already active in the session store.

---

## Claude's Discretion

- Icon choice per session type
- Exact card layout (2×2 grid vs list)
- Error handling on generateSessionPlan failure
- Whether to use a new store ref for sessionPlan or pass inline

## Deferred Ideas

None.
