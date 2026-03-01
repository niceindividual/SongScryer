# Roadmap: Music DNA -- Song Submission App

## Overview

This roadmap delivers a creative song submission app for two musicians. The build follows the data pipeline: infrastructure and schema first, then the complete data capture loop (identity, form, submission) without visual polish, then card draw animation layered on top of proven functionality, then export (the app's ultimate purpose), then collection/browsing features, and finally the medieval illuminated manuscript aesthetic. This order ensures the most expensive mistakes (schema, subpath routing) are caught earliest and the most scope-creep-prone work (animation, aesthetics) happens last against a stable foundation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Infrastructure** - Deploy the server, database, and subpath routing so everything downstream has a working production environment
- [ ] **Phase 2: Core Data Loop** - Identity selection, adaptive form with all fields, submission persistence -- the complete data capture pipeline without animation
- [ ] **Phase 3: Card Draw Animation** - Animated shuffle, flip, and reveal sequence layered onto the proven data pipeline
- [ ] **Phase 4: Export Pipeline** - JSON, CSV, and Claude-ready markdown exports with submitter filtering
- [ ] **Phase 5: Collection Experience** - Card history tracking, completionism indicator, and submission gallery
- [ ] **Phase 6: Medieval Aesthetic** - Illuminated manuscript visual treatment across all surfaces

## Phase Details

### Phase 1: Foundation and Infrastructure
**Goal**: A working production environment where the server responds at the correct URL, the database accepts submissions, and operational basics (process management, backups) are in place
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Visiting `https://h.eino.us/theyellow/songer/` in a browser returns a response from the Node.js server with correct HTTPS
  2. All static assets (JS, CSS) load correctly under the `/theyellow/songer/` subpath without 404s
  3. SQLite database exists with the submissions schema and migration tooling runs without error
  4. Server auto-restarts after a crash or VPS reboot (PM2 configured)
  5. Database backup runs on schedule and stores a copy off-server
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Core Data Loop
**Goal**: Users can select their identity, pick a card (static selection, no animation yet), fill out the complete adaptive form one question at a time, submit, and draw again -- the full data capture workflow
**Depends on**: Phase 1
**Requirements**: IDNT-01, IDNT-02, FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06, FORM-07, FORM-08, FORM-09, FORM-10, FORM-11, FORM-12, FORM-13, FORM-14, FORM-15, FORM-16, FORM-17, FORM-18, FORM-19, FORM-20, SUBM-01, SUBM-02, SUBM-03
**Success Criteria** (what must be TRUE):
  1. User can select "Matt" or "Mike" and that choice persists across page refreshes without re-selection
  2. User sees questions presented one at a time in a conversational flow, with question text adapting tone based on the drawn card while producing identical data fields for every card
  3. User can fill out all required and optional fields (song title, artist, hooks, lyrics importance, energy, love rating, feasibility, desire, tempo, time signature, free text fields) with clear visual distinction between required and optional
  4. User receives confirmation after submitting, and the submission is persisted to SQLite with server-side schema validation
  5. User can immediately draw another card and submit again within the same session
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Card Draw Animation
**Goal**: The card draw experience feels like drawing from a physical deck -- animated shuffle, flip, and reveal -- replacing the static card selection from Phase 2
**Depends on**: Phase 2
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05
**Success Criteria** (what must be TRUE):
  1. User sees an animated card shuffle sequence that completes in under 3 seconds
  2. User sees a card flip animation that reveals the prompt text prominently on the card face
  3. Cards are selected using deck-style distribution so each card appears roughly equally across sessions (not pure random)
  4. After submitting a song, user can draw another card and the full animation plays again
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Export Pipeline
**Goal**: Users can export all collected submissions in formats ready for Google Sheets analysis and direct Claude input
**Depends on**: Phase 2
**Requirements**: EXPRT-01, EXPRT-02, EXPRT-03, EXPRT-04
**Success Criteria** (what must be TRUE):
  1. User can download a JSON file containing all submissions with a `_metadata` block and denormalized card prompt text per submission
  2. User can download a CSV file that imports cleanly into Google Sheets with proper escaping, pipe-delimited multi-select fields, and UTF-8 with BOM
  3. User can download a Claude-ready markdown export with schema description, field explanations, and suggested analysis prompts
  4. All three export formats support filtering by submitter (Matt-only, Mike-only, or all)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Collection Experience
**Goal**: Users can see their growing collection of submissions and track their progress through the 21-card deck
**Depends on**: Phase 2
**Requirements**: COLL-01, COLL-02, COLL-03, COLL-04
**Success Criteria** (what must be TRUE):
  1. User can see which of the 21 cards they have already drawn, displayed per submitter
  2. User can see a completionism indicator showing progress (e.g., 7/21 cards drawn)
  3. User can browse past submissions in a read-only gallery view
  4. Submission gallery is filterable by submitter (Matt / Mike / all)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Medieval Aesthetic
**Goal**: The app looks and feels like a medieval illuminated manuscript -- warm parchment, earthy tones, decorative borders, symbolic imagery -- elevating the functional core into a distinctive creative experience
**Depends on**: Phase 3, Phase 5
**Requirements**: AEST-01, AEST-02, AEST-03
**Success Criteria** (what must be TRUE):
  1. App surfaces (backgrounds, panels, buttons) use a warm parchment palette with earthy tones rather than default browser styling
  2. Card faces display manuscript-inspired imagery including vines, instruments, cables, pedals, or symbolic figures
  3. Typography and decorative borders throughout the app evoke a medieval manuscript feel
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
Note: Phases 3, 4, and 5 all depend on Phase 2 but not on each other. However, building them sequentially (3 -> 4 -> 5) is the recommended order per research.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Infrastructure | 0/2 | Not started | - |
| 2. Core Data Loop | 0/3 | Not started | - |
| 3. Card Draw Animation | 0/1 | Not started | - |
| 4. Export Pipeline | 0/1 | Not started | - |
| 5. Collection Experience | 0/1 | Not started | - |
| 6. Medieval Aesthetic | 0/1 | Not started | - |
