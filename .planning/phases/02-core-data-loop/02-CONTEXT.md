# Phase 2: Core Data Loop - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can select their identity, pick a card (static selection, no animation), fill out the complete adaptive form one question at a time, submit, and draw again — the full data capture workflow without animation. By end of phase the app is functionally complete for real data collection.

</domain>

<decisions>
## Implementation Decisions

### Identity selector
- Two large name buttons (Matt / Mike) on a simple identity screen shown on first visit
- Selection stored in localStorage — no re-selection on subsequent visits
- Active user shown persistently as a small label (e.g. top corner or below heading)
- Unobtrusive "switch user" link to change identity — no modal, just shows the selector screen again

### Static card selection
- Single "Draw a Card" button that randomly selects one of the 21 cards and displays the prompt
- No grid, no dropdown, no list — just the button and the revealed card prompt
- This is a placeholder: Phase 3 replaces it entirely with the animated shuffle/flip sequence
- Acceptable to be visually plain — functionality only

### Form progression
- Questions presented one at a time (conversational, not a spreadsheet)
- **Auto-advance** on selection for multiple-choice fields (radio buttons, button groups)
- **Explicit "Next" button** for free-text fields (user must type then confirm)
- **No going back** — keeps form state simple; submitted_raw covers any data recovery needs
- Progress indicator showing current position (e.g. "4 / 13")
- Required vs optional fields visually distinct (required marker or label)

### Post-submission flow
- Confirmation screen shows the submitted song title
- "Draw another card" button appears immediately — no auto-redirect timer
- Clicking draw resets state to card selection (same user identity retained)

### Claude's Discretion
- Exact layout and component structure of the form
- How card prompt text is displayed (card-like container vs plain text)
- Tone adaptation implementation (how the 6 tones map to label variants per question)
- State machine implementation details (which JS module manages transitions)
- Error handling for failed submissions (retry vs error message)

</decisions>

<specifics>
## Specific Ideas

- The form should feel conversational, not like a data entry spreadsheet — one question fills the screen
- The adaptive tone per card changes label/placeholder copy only; the underlying fields are identical for all 21 cards
- User identity persists across draws within a session and across page refreshes

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/routes/submissions.js` — POST /submissions already validates required fields and persists; GET /submissions works
- `data/cards.json` — 21 cards with id, prompt, tone — ready to load client-side
- `frontend/css/main.css` — parchment background (#f5f0e8) established; extend for form styling
- `frontend/js/app.js` — minimal stub; replace entirely with Phase 2 state machine
- `frontend/index.html` — replace body content; keep HTML shell

### Established Patterns
- ESM throughout — all JS uses `import`/`export`; no CommonJS in frontend
- `import.meta.env.BASE_URL` for all API fetch calls (never hardcode subpath)
- Vanilla JS only — no framework; state machine in plain JS modules

### Integration Points
- `POST ${BASE_URL}api/submissions` — the submission endpoint; payload shape defined in server/routes/submissions.js
- `GET ${BASE_URL}api/submissions` — for confirming persistence (optional, used in stub)
- Cards loaded from `data/cards.json` at build time (Vite handles JSON imports) or fetched at runtime

</code_context>

<deferred>
## Deferred Ideas

- None — user deferred all implementation decisions to Claude's discretion; discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-data-loop*
*Context gathered: 2026-03-01*
