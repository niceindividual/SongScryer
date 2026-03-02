---
phase: 02-core-data-loop
verified: 2026-03-02T14:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Complete happy-path run: identity → card draw → 17 questions → submit → confirmation → draw-again → refresh"
    expected: "All screens transition correctly; submission appears in GET /api/submissions with all 13 required fields; localStorage key 'songscryer_user' persists across refresh"
    why_human: "End-to-end user interaction flow, localStorage behavior across page loads, and SQLite persistence require a browser and a running server — cannot verify programmatically"
  - test: "Multi-select max-2 enforcement via live checkbox change listener"
    expected: "After selecting 2 hooks, remaining checkboxes disable immediately; unchecking one re-enables the rest"
    why_human: "Live DOM disabled-state toggling on checkbox change events requires interactive testing in a real browser"
  - test: "Required field enforcement: Next button ignores empty required fields; optional blank fields pass through"
    expected: "Clicking Next on an empty required text/textarea/number field focuses the input and does not advance; empty optional fields advance normally"
    why_human: "Form validation gating on Next click is behavioral — requires browser interaction"
---

# Phase 2: Core Data Loop — Verification Report

**Phase Goal:** Users can select their identity, pick a card (static selection, no animation yet), fill out the complete adaptive form one question at a time, submit, and draw again — the full data capture workflow
**Verified:** 2026-03-02T14:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can select "Matt" or "Mike" and that choice persists across page refreshes | VERIFIED | `app.js:20-22` validates localStorage `'songscryer_user'` strictly (`=== 'matt' || === 'mike'`) on boot and sets screen to `'card'`; `state.js:selectUser` writes to localStorage via `STORAGE_KEY`; `state.js:switchUser` removes it |
| 2 | Questions are presented one at a time; text adapts tone without changing data schema | VERIFIED | `render.js:renderForm` shows `QUESTIONS[state.questionIndex]` one at a time with `getQuestionCopy(question, state.card.tone)` for tone adaptation; `questions.js` shows TONE_LABELS overrides only `label`/`placeholder`, never adds fields; server REQUIRED_FIELDS aligned with QUESTIONS required keys |
| 3 | All required and optional fields are supported with visual distinction | VERIFIED | All 17 QUESTIONS defined (11 required, 6 optional); `render.js:72-75` appends `span.required-mark` (*) or `span.optional-mark` (optional); all 6 input types implemented (text, textarea, number, choice, multi-select, rating); CSS provides `.required-mark` (red) and `.optional-mark` (muted) styles |
| 4 | User receives confirmation after submit; submission persists to SQLite with server validation | VERIFIED | `app.js:handleSubmit` calls `postSubmission(BASE_URL, payload)` with coerced numeric fields; server validates all 13 REQUIRED_FIELDS, returns 201 with created record; `render.js:renderConfirmation` shows "Submitted!" with escaped `song_title`; migration `001-initial.sql` defines submissions schema with CHECK constraints |
| 5 | User can immediately draw another card after submission within the same session | VERIFIED | `render.js:88` renders "Draw another card" button with `data-action="draw-another"`; `app.js:134-137` handles it via `drawAnother(state)` which resets card/answers/questionIndex while retaining `state.user`; QUESTIONS length verified at 17 |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/js/state.js` | Pure state machine + 7 transition functions | VERIFIED | File exists (101 lines); exports `createInitialState`, `selectUser`, `drawCard`, `answerQuestion`, `submissionSucceeded`, `drawAnother`, `switchUser`, `loadUser` (8 total — loadUser added as documented deviation); all transitions use spread `{ ...state, ... }` — confirmed by Node ESM import test |
| `frontend/js/questions.js` | QUESTIONS array (17 items), TONE_LABELS, getQuestionCopy | VERIFIED | File exists (234 lines); `QUESTIONS.length === 17` confirmed by Node execution; TONE_LABELS covers all 6 tones; `getQuestionCopy` returns merged `{ label, placeholder }` — confirmed by Node execution |
| `frontend/js/api.js` | POST /api/submissions fetch wrapper using baseUrl parameter | VERIFIED | File exists (31 lines); exports `postSubmission(baseUrl, payload)`; constructs URL as `${baseUrl}api/submissions`; throws `Error` with server message on `!res.ok`; returns `res.json()` on success |
| `frontend/js/render.js` | render(state) dispatcher + 4 screen renderers + renderQuestionInput | VERIFIED | File exists (233 lines); exports `render(state)`; 4 private renderers: `renderIdentity`, `renderCard`, `renderForm`, `renderConfirmation`; `renderQuestionInput` handles all 6 input types; `escapeHtml` applied throughout |
| `frontend/index.html` | Minimal shell: empty `#app` div + module script import | VERIFIED | File exists (13 lines); `<div id="app"></div>` confirmed; `<script type="module" src="js/app.js"></script>` confirmed; no `#status` element |
| `frontend/css/main.css` | Complete styles for all 4 screens and all input/button types | VERIFIED | File exists (315 lines); all 28 CSS classes referenced in render.js template strings have corresponding rules in main.css (verified via ripgrep cross-check); includes `.submission-error` used in `app.js` |
| `frontend/js/app.js` | Entry point: boot, event delegation, 8 actions, submission handler | VERIFIED | File exists (164 lines); boot sequence reads localStorage before first `render(state)`; single delegated click listener handles all 8 actions (`select-user`, `switch-user`, `draw-card`, `answer-choice`, `next-question`, `next-multi-select`, `draw-another`, `default`); separate `change` listener for multi-select |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `state.js selectUser` | `localStorage 'songscryer_user'` | `localStorage.setItem(STORAGE_KEY, user)` | WIRED | `STORAGE_KEY = 'songscryer_user'` constant used in selectUser and switchUser; confirmed in file |
| `state.js switchUser` | `localStorage 'songscryer_user'` | `localStorage.removeItem(STORAGE_KEY)` | WIRED | `switchUser` calls `localStorage.removeItem(STORAGE_KEY)` — confirmed in file |
| `questions.js QUESTIONS[n].key` | `server/routes/submissions.js REQUIRED_FIELDS` | key names match exactly | WIRED | Server REQUIRED_FIELDS: `['submitter','card_id','song_title','artist','why_this_song','primary_hooks','lyrics_matter','energy_level','love_level','feasibility','performance_desire','tempo_feel','time_signature']`; QUESTIONS required keys match all 11 form fields (submitter+card_id added by handleSubmit, not form fields) |
| `api.js postSubmission` | `POST /api/submissions` | `fetch(\`${baseUrl}api/submissions\`, ...)` | WIRED | `app.js:12` sets `BASE_URL = import.meta.env.BASE_URL` (Vite injects `/theyellow/songscryer/`); `app.js:43` calls `postSubmission(BASE_URL, payload)`; Vite proxy rewrites `/theyellow/songscryer/api` → `/` on `localhost:3000`; server mounts `submissionsRouter` at `/api` |
| `render.js` | `questions.js QUESTIONS + getQuestionCopy` | `import { QUESTIONS, getQuestionCopy } from './questions.js'` | WIRED | Line 4 of render.js; `QUESTIONS` used at lines 62, 69; `getQuestionCopy` called at line 63 |
| `render.js renderConfirmation` | `state.lastSubmission.song_title` | `escapeHtml(state.lastSubmission.song_title)` | WIRED | Line 87: `${escapeHtml(state.lastSubmission.song_title)}` — user-provided value safely escaped before innerHTML |
| `app.js 'answer-choice' handler` | auto-submit after last question | `if (state.questionIndex >= QUESTIONS.length)` then `handleSubmit()` | WIRED | Lines 93-97 in app.js; same boundary check at lines 111-113 and 126-128 for next-question and next-multi-select |
| `app.js handleSubmit payload` | `energy_level` and `love_level` as integers | `Number(payload.energy_level)` and `Number(payload.love_level)` | WIRED | Lines 39-40; also `app.js:91` coerces rating data-value during answer-choice action |

---

### Requirements Coverage

All 25 requirement IDs claimed across the three plans are accounted for:

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| IDNT-01 | 02-01, 02-02, 02-03 | User can select Matt or Mike before starting a session | SATISFIED | Identity screen renders two buttons; `selectUser` writes to localStorage; `renderIdentity` confirmed |
| IDNT-02 | 02-01, 02-03 | Identity persists across page refreshes via localStorage | SATISFIED | `app.js:20-22` reads and validates localStorage on boot; strict `=== 'matt' \|\| === 'mike'` check |
| FORM-01 | 02-01, 02-02, 02-03 | Form presents one question at a time | SATISFIED | `renderForm` renders `QUESTIONS[state.questionIndex]`; `answerQuestion` increments index; auto-advance and explicit-next both confirmed |
| FORM-02 | 02-01, 02-02 | Question text adapts tone/framing based on drawn card | SATISFIED | `TONE_LABELS` covers all 6 tones; `getQuestionCopy(question, state.card.tone)` called in renderForm |
| FORM-03 | 02-01, 02-02 | All 21 cards produce identical data fields; adaptation is presentation only | SATISFIED | TONE_LABELS overrides only `label`/`placeholder` properties — confirmed by code inspection; no field key changes |
| FORM-04 | 02-01 | Song title and artist entry | SATISFIED | `questions.js`: `song_title` (text, required), `artist` (text, required) |
| FORM-05 | 02-01 | Why this song matters (free text) | SATISFIED | `questions.js`: `why_this_song` (textarea, required) |
| FORM-06 | 02-01 | Up to 2 primary hooks from 8 options | SATISFIED | `questions.js`: `primary_hooks` (multi-select, max:2, 8 options); `render.js` disables unchosen when 2 selected |
| FORM-07 | 02-01 | Lyrics matter: central / somewhat / not really | SATISFIED | `questions.js`: `lyrics_matter` (choice, 3 options: central/somewhat/not_really) |
| FORM-08 | 02-01 | Standout instrument/sonic element (short text, optional) | SATISFIED | `questions.js`: `standout_element` (text, required:false) |
| FORM-09 | 02-01 | Emotional quality descriptor (short text, optional) | SATISFIED | `questions.js`: `emotional_quality` (text, required:false) |
| FORM-10 | 02-01 | Energy level 1-5 rating | SATISFIED | `questions.js`: `energy_level` (rating, max:5, required:true); DB CHECK: `energy_level BETWEEN 1 AND 5` |
| FORM-11 | 02-01 | Love rating 1-5 | SATISFIED | `questions.js`: `love_level` (rating, max:5, required:true); DB CHECK: `love_level BETWEEN 1 AND 5` |
| FORM-12 | 02-01 | Performance feasibility: 4 options | SATISFIED | `questions.js`: `feasibility` (choice, 4 options); DB CHECK enforces enum values |
| FORM-13 | 02-01 | Performance desire: definitely/maybe/no | SATISFIED | `questions.js`: `performance_desire` (choice, 3 options); DB CHECK enforces enum values |
| FORM-14 | 02-01 | Optional performance notes (textarea) | SATISFIED | `questions.js`: `performance_notes` (textarea, required:false) |
| FORM-15 | 02-01 | Optional key or tonal center | SATISFIED | `questions.js`: `key_or_tonal_center` (text, required:false) |
| FORM-16 | 02-01 | Tempo feel: slow/mid/uptempo/variable | SATISFIED | `questions.js`: `tempo_feel` (choice, 4 options); DB CHECK enforces enum values |
| FORM-17 | 02-01 | Optional approximate BPM | SATISFIED | `questions.js`: `approximate_bpm` (number, required:false) |
| FORM-18 | 02-01 | Time signature: 4/4 / 3/4 / 6/8 / odd / not sure | SATISFIED | `questions.js`: `time_signature` (choice, 5 options); DB CHECK enforces enum values |
| FORM-19 | 02-01 | Optional other notes (free text) | SATISFIED | `questions.js`: `other_notes` (textarea, required:false) |
| FORM-20 | 02-01, 02-02 | Required vs optional visually distinct | SATISFIED | `render.js:72-75` appends `.required-mark` (*) for required, `.optional-mark` (optional) for others; distinct CSS colors |
| SUBM-01 | 02-03 | Clear confirmation after successful submission | SATISFIED | `renderConfirmation` renders "Submitted!" h2 + escaped song_title + "Draw another card" button |
| SUBM-02 | 02-03 | Submission persisted to SQLite; server validates schema | SATISFIED | Server validates all 13 REQUIRED_FIELDS; DB schema has NOT NULL + CHECK constraints; server returns 201 with created record; `app.js:handleSubmit` calls `submissionSucceeded` on success |
| SUBM-03 | 02-03 | User can draw another card immediately after submission | SATISFIED | `renderConfirmation` shows "Draw another card" button; `drawAnother` resets card/answers/questionIndex retaining user |

**Orphaned requirements check:** All requirements mapped to Phase 2 in REQUIREMENTS.md traceability table (`IDNT-01`, `IDNT-02`, `FORM-01` through `FORM-20`, `SUBM-01` through `SUBM-03`) are claimed in at least one plan. No orphaned requirements.

---

### Anti-Patterns Found

No blockers or warnings detected:

- No TODO/FIXME/HACK/PLACEHOLDER comments in any of the 5 frontend JS files
- No empty handler stubs (`() => {}`, `console.log` only handlers)
- No `return null` / `return {}` / `return []` stub patterns in logic paths
- All state transitions spread into new objects — no mutation detected
- XSS safety: `escapeHtml` applied to all user-provided strings before `innerHTML`; `card.prompt` (static seed data) used raw intentionally (documented decision)

One noted deviation from original plan spec: `api.js` throws on `!res.ok` rather than specifically `!== 201`. This is a documented intentional decision — broader coverage, and the server always returns 201 on success with 400 on error, so no behavioral difference in practice. Not a blocker.

---

### Human Verification Required

The automated checks confirm the complete implementation exists and is correctly wired. Three behavioral paths require human verification in a running browser:

#### 1. Complete End-to-End Happy Path

**Test:** Start the dev server (`npm run dev`), visit `http://localhost:5173/theyellow/songscryer/`. Click "Matt". Click "Draw a Card". Fill out all 17 questions (advance through each type). Observe submission and confirmation. Click "Draw another card". Refresh page.

**Expected:** Identity screen → card screen with user badge → form questions one-at-a-time with progress counter ("1 / 17" through "17 / 17") → confirmation screen showing submitted song title → card screen again with Matt badge → after refresh, card screen (not identity screen).

**Why human:** Multi-screen UI flow, localStorage persistence across page reload, and SQLite persistence require a running server and browser.

#### 2. Multi-Select Max-2 Enforcement

**Test:** Reach the "What hooks you?" question. Select any 2 options from the 8 checkboxes. Observe remaining checkboxes. Uncheck one. Observe again.

**Expected:** After 2 selections, all other checkboxes immediately become disabled (greyed out, unclickable). After unchecking one, disabled checkboxes re-enable.

**Why human:** Live DOM mutation from the `change` event listener requires interactive browser testing.

#### 3. Required Field Enforcement on Next Button

**Test:** On a required text field (e.g. Song title), leave it blank and click "Next".

**Expected:** Input receives focus; form does not advance to question 2. Entering a value and clicking "Next" advances normally.

**Why human:** Focus behavior and non-advance on empty required fields is behavioral — requires keyboard/mouse interaction in a browser.

---

### Gaps Summary

No gaps. All 5 ROADMAP success criteria are satisfied by concrete, wired implementation. All 25 requirement IDs have code evidence. All artifacts exist, are substantive, and are properly wired to each other. Three items are flagged for human verification as they involve interactive browser behavior that cannot be verified programmatically.

---

## Commit Verification

All commits documented in plan summaries exist in the repository:

| Commit | Plan | Summary |
|--------|------|---------|
| `9e9a9eb` | 02-01 Task 1 | Create state.js — confirmed present |
| `b95f09c` | 02-01 Task 2 | Create questions.js and api.js — confirmed present |
| `c2b5cfb` | 02-02 Task 1 | Create render.js — confirmed present |
| `f6fb706` | 02-02 Task 2 | Update index.html + extend main.css — confirmed present |
| `765cf70` | 02-03 Task 1 | Rewrite app.js — confirmed present |

---

_Verified: 2026-03-02T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
