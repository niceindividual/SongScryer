# Project Research Summary

**Project:** Music DNA (SongScryer) — Song Submission App
**Domain:** Browser-based creative data collection app with animated UI and adaptive form flows
**Researched:** 2026-03-01
**Confidence:** MEDIUM (training data; no live web verification available; well-established domains)

## Executive Summary

SongScryer is a personal creative data-collection tool for two users (Matt and Mike) built around an Oblique Strategies-style card draw mechanic. Users draw one of 21 prompt cards, answer adaptive questions about a song it evokes, and the app accumulates a structured dataset for downstream Claude analysis. The research consensus is clear: this is a deliberately small-scale project and the entire architecture should reflect that. Vanilla JS + CSS + Express + SQLite is the correct stack — any framework, ORM, or database server would add overhead with zero return at this scale.

The recommended build approach is data-first, animation-last. The cardinal mistake for this type of app is investing in the card shuffle/flip animation before the submit-to-store-to-export pipeline works end-to-end. Building in the opposite order (schema, API, form, then animation) means animation failures never block data integrity. The adaptive question flow is a copy/tone concern only — the data schema must be identical for all 21 cards. This invariant is the most important design principle in the system and must be enforced server-side, not just in the UI.

The primary risks are schema brittleness (SQLite has limited ALTER TABLE support; getting it wrong early forces painful migrations), animation scope creep (visually rewarding but can consume the entire build timeline), and deployment gotchas around the `/theyellow/songscryer/` subpath (assets and API URLs all break unless the base path is configured from day one). All three risks are preventable with discipline: use a migration tool from the first commit, time-box animation work to after the data pipeline is proven, and test the production subpath with a "hello world" before building features.

## Key Findings

### Recommended Stack

The stack is intentionally minimal. Vanilla JS (ES modules), vanilla CSS, and Vite for dev HMR on the frontend. Express 4 and better-sqlite3 on the backend. SQLite as the database with WAL mode enabled. nginx as the reverse proxy with Let's Encrypt SSL. PM2 for process management. No frameworks, no ORMs, no TypeScript, no Docker.

See `.planning/research/STACK.md` for full rationale and version details.

**Core technologies:**
- **Vanilla JS (ES modules):** UI logic, state machine, form flow — no virtual DOM needed for one-screen app
- **Vanilla CSS (custom properties + keyframes):** Card animations and medieval theme — CSS 3D transforms are better than React for this
- **Vite ~6.x:** Dev server with HMR — speeds up CSS animation iteration; zero-framework template
- **Node.js 20/22 LTS:** Runtime — LTS for VPS stability
- **Express 4:** HTTP server and API — battle-tested, simple middleware, correct choice at this scale
- **better-sqlite3 ~11.x:** SQLite interface — synchronous API is a feature, not a limitation, for a 2-user app
- **nginx + certbot:** Reverse proxy, SSL termination, subpath routing
- **PM2 ~5.x:** Process management — auto-restart, log rotation, boot persistence

**Explicitly avoid:** React/Vue/Svelte, TypeScript, Prisma/Drizzle, Tailwind, Docker, WebSocket, MongoDB/PostgreSQL, Passport.js

### Expected Features

See `.planning/research/FEATURES.md` for full dependency graph and export quality notes.

**Must have (table stakes):**
- Card draw animation (shuffle, flip, reveal) — this IS the experience; static selection kills the magic
- One-question-at-a-time progressive disclosure — conversational feel, not a spreadsheet
- Identity selector (Matt / Mike) with localStorage persistence — no login system
- All 21 prompt cards with adaptive question tone per card — the full deck is the product
- Required vs optional field clarity — visual distinction prevents abandonment
- Submit confirmation + draw again prompt — completes the core loop
- SQLite persistence with all fields — submissions survive server restarts
- JSON + CSV export endpoints — the entire purpose of the app is feeding data to Claude

**Should have (differentiators):**
- Claude-ready structured export (markdown with schema description and analysis prompts)
- Export filtering by submitter (`?submitter=matt|mike|all`)
- Card history / deck tracking — completionism indicator, prevents accidental duplicates
- Submission browse/review — lets users see their growing collection
- "Choose a card" mode — pick from remaining undrawn cards

**Defer indefinitely:**
- In-app comparison/overlap view — let Claude do this from exported data
- Sound/haptic feedback — add only if aesthetic phase calls for it
- Session recovery (localStorage restore on crash) — add only if abandonment becomes real
- In-app Claude integration — couples the tool to an API; export stays cleaner

**Critical path:** Identity Selector → Card Draw → Adaptive Questions → Form → Persistence → Export. Everything else branches off this spine.

### Architecture Approach

Three-tier thin architecture: static-first browser client with vanilla JS modules, Express REST API with business logic in service objects, SQLite accessed synchronously via better-sqlite3. The client is modeled as an explicit state machine (`SELECT_IDENTITY → IDLE → DRAWING → ANSWERING → SUBMITTING → SUBMITTED → IDLE`) to prevent impossible states. The 21 card definitions live in a static client-side JSON file; the Question Renderer reads card metadata to adapt labels and tone, but the underlying form fields and their data schema are identical for every card.

See `.planning/research/ARCHITECTURE.md` for full component diagram, data model SQL, API design, and build order.

**Major components:**
1. **Card Draw Animation Layer** — shuffle, flip, reveal; emits selected card ID when animation completes; purely visual
2. **Question Renderer** — reads card definition JSON, adapts labels/placeholder text, renders hardcoded form fields
3. **Session Manager** — holds current user identity, manages state machine transitions; no server-side sessions
4. **API Client** — thin fetch() wrapper; sends submissions, requests exports
5. **Express Routes + Submission Service** — validates input, persists to SQLite; business logic in service layer not routes
6. **Export Service** — queries SQLite, formats as JSON array or CSV string with proper escaping
7. **SQLite Database** — single file, two tables: `submissions` (one row per submission, all 21 fields always present) and `cards` (21 rows, seeded once)

**Key schema insight:** `primary_hooks` stored as JSON array in TEXT column (not a junction table); enum fields stored as short codes (`as_is`, `with_adaptation`), never display strings; all 21 fields always present regardless of card drawn.

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full prevention strategies and phase warnings.

1. **Schema painted into a corner** — SQLite ALTER TABLE is limited; use a migration tool from commit 1, add a `submitted_raw` JSON column as an insurance policy, store card IDs not card text. Phase 1 risk.

2. **Inconsistent data shape across cards** — The adaptive framing must never alter the data schema. Validate submissions server-side against a strict schema; reject non-conforming payloads. Cards change copy, not fields. Phase 1 + 2 risk.

3. **Animation complexity creep** — Build the entire submit→store→export pipeline with static card selection first. Add animation only after round-trip is proven. Time-box animation work. Phase 3 (animation is explicitly last).

4. **Export format as afterthought** — Design the target JSON and CSV formats before designing the schema. Include denormalized card prompt text, human-readable enum values, and a `_metadata` block in JSON exports. Test with real Google Sheets import early. Phase 1 decision.

5. **Subpath routing breakage** — The production URL is `https://h.eino.us/theyellow/songscryer/`. Every asset reference and API call must respect this base path. Set `BASE_PATH` env var, use `<base href="...">` in HTML, test with production subpath before building features. Phase 1 (infrastructure).

**Additional moderate pitfalls:** Enable SQLite WAL mode and `busy_timeout` at DB init (Pitfall 7); automated off-VPS backups before collecting real data (Pitfall 8); deck-style shuffle (not random dice) to feel fair with only 21 cards and ~42 expected submissions (Pitfall 9); PM2 or systemd before first deploy (Pitfall 10).

## Implications for Roadmap

Research from all four files converges on the same build order. This is not coincidence — it is the correct order derived from data-flow dependencies and risk profiles.

### Phase 1: Foundation and Infrastructure

**Rationale:** Every downstream component depends on the data model being correct. Schema mistakes are the most expensive to fix. Infrastructure mistakes (subpath, PM2, backups) block all meaningful testing on the real VPS. Get both right before writing a single form field.

**Delivers:** Working SQLite schema with migrations, all 21 card definitions seeded, Express server deployed at the production subpath (`/theyellow/songscryer/`), PM2 running, HTTPS live, automated backups configured.

**Addresses (from FEATURES.md):** SQLite persistence, basic API scaffolding, export endpoint skeleton.

**Avoids (from PITFALLS.md):** Pitfalls 1 (schema), 4 (data consistency), 5 (export format), 7 (WAL mode), 8 (backups), 10 (PM2), 11 (subpath routing), 13 (metadata columns), 14 (enum codes).

**Research flag:** No additional phase research needed. Express + SQLite + nginx + PM2 is well-documented, standard Node.js VPS deployment.

### Phase 2: Core Data Loop (No Animation)

**Rationale:** The app's entire value proposition is collecting consistent structured data. Prove the full round-trip — identity selection, card pick (via dropdown/click, no animation yet), form fill, submit, confirm, draw again — before any visual polish. This phase ends with the app functionally complete.

**Delivers:** Identity selector, static card selection, all 21 cards' adaptive question text loaded from JSON, complete form with all required/optional fields clearly marked, one-question-at-a-time progressive disclosure, submission confirmation, working POST `/api/submissions` and GET `/api/export` endpoints.

**Addresses (from FEATURES.md):** All 10 table-stakes features except the animation itself. By end of this phase the app is usable for real data collection.

**Avoids (from PITFALLS.md):** Pitfall 2 (card logic in data, not UI code), Pitfall 4 (consistent schema enforced server-side), Pitfall 6 (form state persistence to sessionStorage), Pitfall 9 (deck-style shuffle algorithm), Pitfall 12 (character limits with counters).

**Research flag:** No additional research needed. Form UX and state machine patterns are standard.

### Phase 3: Card Draw Animation

**Rationale:** Animation is the "creative wrapper" around proven functionality. Building it third means you know exactly what the animation must emit (a card ID), what state it transitions to (ANSWERING), and the precise card dimensions (form content is already designed). Rework risk is minimal.

**Delivers:** CSS shuffle wobble, 3D card flip, text reveal animation sequence. Total duration under 3 seconds. Animation wired into state machine: `DRAWING → ANIMATION_COMPLETE → ANSWERING`.

**Addresses (from FEATURES.md):** Card draw animation (table stakes), foundation for "draw again" loop feeling natural.

**Avoids (from PITFALLS.md):** Pitfall 3 (time-boxed, after data pipeline is proven — not open-ended polish).

**Research flag:** No additional research needed. CSS keyframe 3D transforms are well-documented. Keep to one focused session.

### Phase 4: Export Pipeline and Claude-Ready Output

**Rationale:** Export is the product's ultimate purpose. It builds on the working submission store from Phase 2. Doing it as a distinct phase keeps export quality high — it gets the attention it deserves rather than being bolted on.

**Delivers:** JSON export (full submissions with `_metadata` block, card prompt text denormalized, submissions grouped by submitter), CSV export (proper library-based escaping, pipe-delimited multi-select, UTF-8 with BOM), export filtering by submitter and card, Claude-ready markdown export with analysis prompt suggestions.

**Addresses (from FEATURES.md):** JSON + CSV export (table stakes), Claude-ready structured export, export filtering by submitter (differentiators).

**Avoids (from PITFALLS.md):** Pitfall 5 (export format designed in Phase 1; this phase implements it fully).

**Research flag:** No additional research needed. `@json2csv/plainjs` is the correct tool; patterns are established.

### Phase 5: Collection Experience

**Rationale:** These features make the growing dataset feel like a meaningful collection rather than a utilitarian data dump. They depend on having real submissions in the database, so they naturally come after the core loop is working.

**Delivers:** Card history / deck tracking (which cards each user has drawn, completionism indicator), submission browse/review (read-only gallery of past submissions, filterable), "Choose a card" mode (pick from remaining undrawn cards instead of random draw).

**Addresses (from FEATURES.md):** Card history, submission review, "choose a card" mode (all differentiators).

**Avoids:** None specific — these are additive features with no sharp pitfall risk.

**Research flag:** No additional research needed. Standard read-query and display patterns.

### Phase 6: Medieval Aesthetic Layer

**Rationale:** The illuminated manuscript visual treatment is explicitly the final phase per the project brief. Building it last means the DOM structure is stable, the CSS is purely additive, and no architectural decisions were made to serve the aesthetic.

**Delivers:** Parchment textures, warm color palette, decorative borders, custom typography, thematic card visual design, manuscript-appropriate form styling.

**Addresses (from FEATURES.md):** Medieval aesthetic is the product's signature feel, elevating all previous phases.

**Avoids (from PITFALLS.md):** Pitfall 3 (aesthetic after functionality, as prescribed) and Anti-Pattern 4 from ARCHITECTURE.md (premature aesthetic investment).

**Research flag:** May benefit from a brief research pass on CSS techniques for parchment/manuscript texture effects — this is a niche visual domain where specific techniques (noise filters, SVG textures, variable fonts) matter. Consider `/gsd:research-phase` before planning this phase.

### Phase Ordering Rationale

- **Schema before everything:** SQLite ALTER TABLE limitations make early schema correctness a hard requirement. All 5 downstream phases depend on the data model.
- **Functionality before animation:** PITFALLS.md identifies animation scope creep as a critical risk. ARCHITECTURE.md explicitly calls for build-order-following-data-flow. Both sources agree: animation is Phase 3, not Phase 1.
- **Export format designed in Phase 1, implemented in Phase 4:** PITFALLS.md calls "export as afterthought" a critical pitfall. The format is specified early; implementation is deferred until the data it consumes is stable.
- **Infrastructure on the VPS in Phase 1:** The subpath routing (`/theyellow/songscryer/`) is a known source of bugs that only manifest on the real server. Test early. Pitfall 11 is caught before it can block later phases.
- **Aesthetic last:** Both ARCHITECTURE.md (Anti-Pattern 4) and the project brief agree on this. Research affirms it unambiguously.

### Research Flags Summary

| Phase | Research Needed | Reason |
|-------|----------------|--------|
| Phase 1: Foundation | No | Standard Express + SQLite + nginx deployment |
| Phase 2: Core Loop | No | Established form UX and state machine patterns |
| Phase 3: Animation | No | CSS 3D keyframe animations are well-documented |
| Phase 4: Export | No | @json2csv patterns are established |
| Phase 5: Collection | No | Standard read-query and display patterns |
| Phase 6: Aesthetic | Yes (optional) | Parchment/manuscript CSS techniques are niche |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Technology choices are HIGH confidence; specific version numbers need `npm view` verification before install |
| Features | MEDIUM | No competitor analysis was possible (no web access); domain is well-understood; features derived from project spec and UX pattern knowledge |
| Architecture | HIGH | Express + SQLite + vanilla JS patterns are stable and well-documented; state machine and adaptive rendering patterns are established |
| Pitfalls | HIGH | SQLite operational characteristics, browser form behavior, VPS deployment patterns are stable domains; training data is reliable here |

**Overall confidence:** MEDIUM-HIGH. The technology choices and architecture are correct. The feature set is well-reasoned. Version numbers and one or two implementation details need live verification during development.

### Gaps to Address

- **Express version:** Express 5 may have gone stable since training data cutoff (May 2025). Run `npm view express version` before installing. If Express 5 is stable, it is acceptable — the API differences are minor for this use case.
- **better-sqlite3 version:** Verify ~11.x is current with `npm view better-sqlite3 version`. Breaking API changes are unlikely but worth checking.
- **Vite version:** Vite 6 released late 2024; verify ~6.x is the current major with `npm view vite version`.
- **Medieval CSS techniques:** The parchment/manuscript aesthetic is niche. Before Phase 6 planning, a brief research pass on CSS noise filters, SVG displacement maps, and variable font options would reduce trial-and-error.
- **Card definitions (all 21 cards):** The research assumes 21 Oblique Strategies-style prompt cards but does not enumerate all 21. The actual card texts and their tone classifications need to be defined as a data authoring task, not a code task, before Phase 2.

## Sources

### Primary (HIGH confidence)
- Express.js official documentation (expressjs.com) — Express 4 recommendation
- better-sqlite3 GitHub repository — synchronous API advantages, WAL mode
- Vite official documentation (vite.dev) — vanilla JS template support
- W3C CSS Transforms specification — card flip animation approach
- Node.js release schedule (nodejs.org) — LTS recommendations
- SQLite documentation — ALTER TABLE limitations, WAL mode, PRAGMA behavior

### Secondary (MEDIUM confidence)
- Training data knowledge of form/survey UX patterns — one-question-at-a-time progressive disclosure
- Training data knowledge of card-based digital interfaces — draw mechanic design
- Training data knowledge of CSV/JSON export best practices — Google Sheets compatibility, Claude input formatting
- Training data knowledge of VPS deployment patterns — PM2, nginx subpath routing

### Tertiary (LOW confidence — verify during implementation)
- Specific package versions (Express ~4.21.x, better-sqlite3 ~11.x, Vite ~6.x, @json2csv/plainjs ~7.x, helmet ~8.x, PM2 ~5.x, ESLint ~9.x) — based on May 2025 training cutoff; verify with npm before installing

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
