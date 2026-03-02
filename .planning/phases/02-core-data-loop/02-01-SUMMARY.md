---
phase: 02-core-data-loop
plan: 01
subsystem: ui
tags: [vanilla-js, esm, state-machine, localStorage, fetch]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: server routes for POST /api/submissions with validated REQUIRED_FIELDS list

provides:
  - Pure state machine with 7+1 transition functions (state.js)
  - 17-question form schema with tone copy overrides (questions.js)
  - POST /api/submissions fetch wrapper accepting baseUrl parameter (api.js)

affects: [02-02, 02-03, 03-card-animation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure state machine: all transitions spread into new objects, never mutate in place"
    - "Tone copy adaptation: TONE_LABELS overrides merged over question defaults via optional chaining"
    - "Testable API wrapper: baseUrl passed as parameter rather than reading import.meta.env"
    - "localStorage abstraction: STORAGE_KEY constant, validated loadUser(), no raw key strings in consumers"

key-files:
  created:
    - frontend/js/state.js
    - frontend/js/questions.js
    - frontend/js/api.js
  modified: []

key-decisions:
  - "loadUser() added beyond the 7 required exports to avoid raw localStorage reads in consumers"
  - "postSubmission throws on non-201 (not just !res.ok) is intentional — server always returns 201 on success"
  - "QUESTIONS key names match server REQUIRED_FIELDS exactly — verified via node --input-type=module check"

patterns-established:
  - "State transitions: always { ...state, changedFields } — never state.field = value"
  - "Copy resolution: getQuestionCopy(question, tone) — single call for both label and placeholder"
  - "API: baseUrl always passed as first argument, never imported from environment in logic modules"

requirements-completed: [IDNT-01, IDNT-02, FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06, FORM-07, FORM-08, FORM-09, FORM-10, FORM-11, FORM-12, FORM-13, FORM-14, FORM-15, FORM-16, FORM-17, FORM-18, FORM-19, FORM-20]

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 2 Plan 01: Core Data Loop Summary

**Pure-logic data contracts for Phase 2: immutable state machine, 17-question adaptive form schema with 6-tone copy overrides, and testable POST /api/submissions fetch wrapper**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-02T12:31:05Z
- **Completed:** 2026-03-02T12:39:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- state.js: pure state machine with createInitialState + 7 transition functions + loadUser helper, all transitions immutable via spread
- questions.js: 17-question QUESTIONS array with key names matching server REQUIRED_FIELDS exactly, TONE_LABELS for 6 card tones, getQuestionCopy resolver
- api.js: postSubmission(baseUrl, payload) that throws Error with server message on non-201, returns created record on success

## Task Commits

Each task was committed atomically:

1. **Task 1: Create state.js** - `9e9a9eb` (feat)
2. **Task 2: Create questions.js and api.js** - `b95f09c` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `frontend/js/state.js` - Centralized state machine: createInitialState, selectUser, drawCard, answerQuestion, submissionSucceeded, drawAnother, switchUser, loadUser
- `frontend/js/questions.js` - QUESTIONS (17 items), TONE_LABELS (6 tones), getQuestionCopy helper
- `frontend/js/api.js` - postSubmission fetch wrapper using baseUrl parameter

## Decisions Made
- Added `loadUser()` as an 8th export to provide a validated localStorage read (returns null on invalid/missing value) — consumers won't need raw localStorage calls
- `postSubmission` throws on `!res.ok` rather than specifically `!== 201` to handle unexpected 2xx responses gracefully
- QUESTIONS verified end-to-end via `node --input-type=module` import test confirming 17 items and all 11 required keys present with `required: true`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three data contract modules ready for 02-02 (rendering) and 02-03 (form integration)
- Downstream plans import by exact export names documented in plan frontmatter
- No blockers or concerns

---
*Phase: 02-core-data-loop*
*Completed: 2026-03-02*
