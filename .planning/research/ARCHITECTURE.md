# Architecture Patterns

**Domain:** Browser-based creative form app with animated UI, adaptive flows, and data export
**Researched:** 2026-03-01

## Recommended Architecture

Three-tier architecture with a thin client, thin server, and file-based database. The app is small (2-4 users, ~21 card types, one data model) so the architecture should be deliberately simple -- no framework overhead, no build tools beyond what is necessary, no abstraction layers that do not pay for themselves.

```
+--------------------------------------------------+
|  BROWSER CLIENT                                   |
|                                                   |
|  +-----------+  +------------+  +-----------+     |
|  | Card Draw |  | Question   |  | Session   |     |
|  | Animation |  | Renderer   |  | Manager   |     |
|  | Layer     |->| (Adaptive) |->| (state,   |     |
|  |           |  |            |  |  identity) |     |
|  +-----------+  +-----+------+  +-----------+     |
|                       |                           |
|                  +----v----+                       |
|                  | API     |                       |
|                  | Client  |                       |
|                  +---------+                       |
+-----------|---------------------------------------+
            | REST/JSON
+-----------|---------------------------------------+
|  NODE.JS SERVER                                   |
|                                                   |
|  +-----------+  +------------+  +-----------+     |
|  | Routes    |->| Submission |  | Export    |     |
|  | (Express) |  | Service    |  | Service   |     |
|  |           |  |            |  | (JSON/CSV)|     |
|  +-----------+  +-----+------+  +-----------+     |
|                       |                           |
|                  +----v----+                       |
|                  | SQLite  |                       |
|                  | (better |                       |
|                  | -sqlite3)|                      |
|                  +---------+                       |
+--------------------------------------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Card Draw Animation Layer** | Shuffle animation, card flip, prompt reveal. Purely visual -- emits selected card ID when animation completes. | Question Renderer (sends selected card ID) |
| **Question Renderer** | Reads card definition, adapts question tone/labels per card, renders form fields. All 21 fields always present in data model; display order and framing vary by card. | Card Draw (receives card ID), API Client (sends completed submission), Session Manager (reads identity) |
| **Session Manager** | Holds current user identity (Matt/Mike), tracks session state (idle, drawing, answering, submitted). No server-side sessions needed. | All client components read from it |
| **API Client** | Thin wrapper around fetch(). Sends submissions, requests exports. Handles errors. | Node.js Routes |
| **Express Routes** | HTTP endpoints. Validates input, delegates to services. Serves static files. | Submission Service, Export Service |
| **Submission Service** | Validates and persists song submissions. Business logic lives here, not in routes. | SQLite |
| **Export Service** | Queries submissions, formats as JSON or CSV. Filtering by submitter, card, date range. | SQLite |
| **SQLite Database** | Single file. One main table (submissions) plus a reference table (cards). | Accessed only by services |

### Data Flow

**Submission flow (happy path):**

```
1. User selects identity (Matt/Mike) --> Session Manager stores it
2. User clicks "Draw a Card"
3. Card Draw Layer: shuffle animation --> random card selected --> flip animation --> reveal
4. Card ID emitted to Question Renderer
5. Question Renderer loads card definition (client-side JSON), adapts labels/tone
6. User fills out form fields
7. On submit: Question Renderer --> API Client --> POST /api/submissions
8. Express Route validates --> Submission Service persists to SQLite
9. Server returns 201 --> Client shows success + "Draw Again?" prompt
```

**Export flow:**

```
1. GET /api/export?format=json&submitter=matt (or csv, or all)
2. Express Route --> Export Service queries SQLite
3. Export Service formats response (JSON array or CSV string)
4. Response returned to client (or as file download with Content-Disposition header)
```

## Data Model

### submissions table

This is the core table. One row per submission. All 21 data fields captured regardless of which card was drawn.

```sql
CREATE TABLE submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  submitter     TEXT NOT NULL CHECK(submitter IN ('matt', 'mike')),
  card_id       INTEGER NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),

  -- Song identity
  song_title    TEXT NOT NULL,
  artist        TEXT NOT NULL,

  -- Free text responses
  why_this_song TEXT NOT NULL,
  standout_element TEXT,
  emotional_quality TEXT,
  performance_notes TEXT,
  other_notes   TEXT,

  -- Structured responses
  primary_hooks TEXT NOT NULL,          -- JSON array, max 2 from enum
  lyrics_matter TEXT NOT NULL CHECK(lyrics_matter IN ('central', 'somewhat', 'not_really')),
  energy_level  INTEGER NOT NULL CHECK(energy_level BETWEEN 1 AND 5),
  love_level    INTEGER NOT NULL CHECK(love_level BETWEEN 1 AND 5),
  feasibility   TEXT NOT NULL CHECK(feasibility IN ('yes_as_is', 'yes_adapted', 'probably_not', 'not_sure')),
  performance_desire TEXT NOT NULL CHECK(performance_desire IN ('definitely', 'maybe', 'no')),
  tempo_feel    TEXT NOT NULL CHECK(tempo_feel IN ('slow', 'mid', 'uptempo', 'variable')),
  time_signature TEXT NOT NULL CHECK(time_signature IN ('4/4', '3/4', '6/8', 'odd', 'not_sure')),

  -- Optional musical details
  key_or_tonal_center TEXT,
  approximate_bpm INTEGER,

  FOREIGN KEY (card_id) REFERENCES cards(id)
);
```

### cards table

Reference data, seeded on first run. Never modified by the application.

```sql
CREATE TABLE cards (
  id     INTEGER PRIMARY KEY,
  prompt TEXT NOT NULL,
  tone   TEXT NOT NULL  -- short descriptor guiding adaptive rendering
);
```

**Why `primary_hooks` is a JSON array in a TEXT column:** SQLite does not have a native array type. Storing as JSON (`["melody", "groove_rhythm"]`) is the pragmatic choice for a 2-user app. The export service can unpack it. A junction table would add complexity for no benefit at this scale.

### Card Definitions (Client-Side)

Each card needs a definition object that lives in a static JSON file served to the client:

```json
{
  "id": 7,
  "prompt": "A wildcard -- a song I love that wouldn't normally show up on a list like this",
  "tone": "playful",
  "intro_text": "This one is off the map. No expectations, no genre constraints...",
  "why_label": "Why does this one matter to you, even though it breaks the pattern?",
  "standout_label": "What element grabs you most?"
}
```

The `tone` and custom labels are what make the "adaptive" rendering work. The Question Renderer swaps labels and intro text based on card definition. The underlying form fields and their `name` attributes stay identical.

## Patterns to Follow

### Pattern 1: Static-First Client

**What:** Serve HTML/CSS/JS as static files from the Express server. No SSR, no build step for the client, no React/Vue/Svelte.

**When:** Always, for this project. The app is a single page with one flow: draw card, answer questions, submit, repeat.

**Why:** The animation layer and form are the entire UI. A framework adds bundle size, build complexity, and learning curve for zero benefit. Vanilla JS with CSS animations and transitions handles everything needed here.

**Example structure:**
```
public/
  index.html
  css/
    main.css
    animations.css        # Card draw/flip keyframes
    manuscript.css        # Medieval aesthetic (added last)
  js/
    app.js                # Entry point, state machine
    card-draw.js          # Animation orchestration
    question-renderer.js  # Form generation from card definitions
    api-client.js         # fetch wrapper
    session.js            # Identity management
  data/
    cards.json            # All 21 card definitions
```

### Pattern 2: State Machine for Session Flow

**What:** Model the client as an explicit state machine with defined transitions.

**States:** `SELECT_IDENTITY` --> `IDLE` --> `DRAWING` --> `ANSWERING` --> `SUBMITTING` --> `SUBMITTED` --> `IDLE`

**Why:** Prevents impossible states (submitting without a card drawn, drawing while answering). Makes the flow predictable and debuggable. No library needed -- a simple object with `currentState` and `transition(action)` method.

```javascript
const TRANSITIONS = {
  SELECT_IDENTITY: { IDENTITY_CHOSEN: 'IDLE' },
  IDLE:            { DRAW_CARD: 'DRAWING' },
  DRAWING:         { ANIMATION_COMPLETE: 'ANSWERING' },
  ANSWERING:       { SUBMIT: 'SUBMITTING', CANCEL: 'IDLE' },
  SUBMITTING:      { SUCCESS: 'SUBMITTED', ERROR: 'ANSWERING' },
  SUBMITTED:       { DRAW_AGAIN: 'IDLE', DONE: 'IDLE' }
};
```

### Pattern 3: Card-Driven Adaptive Rendering

**What:** The Question Renderer reads a card definition object and uses it to customize labels, placeholder text, and intro copy. The form structure (field names, types, validation) is hardcoded and identical for every card.

**Why:** This is the key architectural insight for this app. The "adaptive" feel comes from copy and tone, not from different form structures. This means:
- One form component, not 21
- One submission handler, not 21
- One data model, always consistent
- The card definition is a content/copy concern, not a schema concern

### Pattern 4: Express with better-sqlite3 (Synchronous)

**What:** Use `better-sqlite3` instead of `sqlite3` (the async one). better-sqlite3 is synchronous, faster, and simpler for small apps.

**Why:** For a 2-user app, synchronous database access in Express route handlers is perfectly fine. No callback hell, no promise chains for simple queries. The code reads top-to-bottom.

```javascript
const db = require('better-sqlite3')('songer.db');
const insert = db.prepare(`INSERT INTO submissions (...) VALUES (...)`);

app.post('/api/submissions', (req, res) => {
  // validate req.body
  const result = insert.run(/* bound params */);
  res.status(201).json({ id: result.lastInsertRowid });
});
```

### Pattern 5: Export as a Service, Not a Report

**What:** The export endpoint returns raw structured data (JSON array or CSV). Formatting, analysis, and visualization happen downstream (Google Sheets, Claude).

**Why:** The goal is to feed data to Claude for analysis. Claude works best with clean JSON or CSV, not with pre-formatted reports. Keep the export dumb and complete.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Framework Overhead for a Single-Page Form App

**What:** Reaching for React, Vue, or Svelte for this project.

**Why bad:** Adds a build step, increases complexity, creates dependency on framework updates. This app has one screen, one flow, one form. The animation layer is better served by CSS keyframes and a small amount of vanilla JS than by a virtual DOM diffing algorithm.

**Instead:** Vanilla HTML/CSS/JS with a clear module structure. ES modules in the browser (`type="module"` in script tags) give you import/export without a bundler.

### Anti-Pattern 2: Over-Normalizing the Schema

**What:** Creating separate tables for hooks, emotional qualities, etc. with junction tables.

**Why bad:** At 2 users and maybe 100 total submissions, normalization adds query complexity for zero performance benefit. The export use case (dump everything to JSON/CSV) is actively harmed by joins.

**Instead:** One flat submissions table. Store multi-select values as JSON arrays in TEXT columns. Parse on export if needed.

### Anti-Pattern 3: Client-Side Routing

**What:** Adding a router (hash-based or history API) with multiple "pages."

**Why bad:** This is a single-flow app. There is one thing to do: draw a card and submit. Routing adds navigation state management for no UX benefit.

**Instead:** Show/hide sections based on state machine state. One HTML file, sections toggled with CSS classes.

### Anti-Pattern 4: Premature Aesthetic Investment

**What:** Building the medieval illuminated manuscript theme before the data flow works end-to-end.

**Why bad:** Visual polish is time-consuming and creates emotional attachment to specific layouts, making it harder to restructure if the form flow needs changes.

**Instead:** Build with minimal/default styling. Add `manuscript.css` as a final layer that transforms the look without changing the DOM structure.

## Server Structure

```
server/
  index.js              # Express app setup, static serving, route mounting
  routes/
    submissions.js      # POST /api/submissions, GET /api/submissions
    export.js           # GET /api/export
  services/
    submission-service.js  # Validation, persistence
    export-service.js      # Query, format
  db/
    database.js         # better-sqlite3 init, migrations
    seed.js             # Insert 21 card definitions
    migrations/
      001-initial.sql   # CREATE TABLE statements
  package.json
```

## API Design

```
POST   /api/submissions          -- Create a submission
GET    /api/submissions          -- List all submissions (optional ?submitter=matt)
GET    /api/submissions/:id      -- Get one submission
GET    /api/export               -- Export data
         ?format=json|csv
         &submitter=matt|mike|all
         &card_id=7              -- (optional filter)
DELETE /api/submissions/:id      -- Delete a submission (for corrections)
```

Keep it minimal. No PATCH (submissions are immutable once saved -- if wrong, delete and redo). No pagination (will never have enough rows to need it).

## Suggested Build Order

Build order follows data-flow direction: database first, then API, then client. Each layer is testable independently before the next is built.

### Phase 1: Data Foundation

1. **SQLite schema + seed data** -- Define tables, insert 21 card definitions. Testable with sqlite3 CLI.
2. **Submission service** -- Insert and query functions against the database. Testable with a simple script.
3. **Express routes** -- Wire up POST and GET endpoints. Testable with curl or Postman.

**Why first:** Everything downstream depends on the data model being right. Getting this wrong means rewriting the form, the export, and the API.

### Phase 2: Core Client Flow

4. **Card definitions JSON** -- Static file with all 21 cards, their tones, and adaptive labels.
5. **State machine + session manager** -- Identity selection, state transitions. Testable without visuals.
6. **Question renderer** -- Generate form from card definition. Hardcoded fields, adaptive labels.
7. **API client + form submission** -- Wire form to POST endpoint. Full round-trip: fill form, submit, see in database.

**Why second:** This is the core functionality. At the end of this phase, the app works end-to-end with no animation and minimal styling.

### Phase 3: Card Draw Animation

8. **Card draw UI** -- Shuffle, flip, reveal animations using CSS keyframes and transitions.
9. **Integration** -- Connect animation completion to state machine transition, flow into Question Renderer.

**Why third:** Animation is the "creative wrapper" around functionality that already works. Building it after the form means you know exactly what the animation needs to emit (a card ID) and what state it needs to transition to.

### Phase 4: Export Pipeline

10. **Export service** -- Query builder with filters, JSON and CSV formatters.
11. **Export endpoint** -- Wire to routes.
12. **Export UI** (optional) -- Simple buttons/links on the page, or just document the curl commands.

**Why fourth:** Export is a read-only consumer of data that already exists. It has no dependencies other than the database, and no other component depends on it.

### Phase 5: Aesthetic Layer

13. **Medieval illuminated manuscript CSS** -- Parchment textures, warm tones, decorative borders, custom typography.
14. **Card visual design** -- Make the card draw feel physical and thematic.
15. **Form styling** -- Make inputs and labels feel part of the manuscript world.

**Why last:** As specified in the project constraints. The aesthetic transforms the experience but does not change the architecture.

## Scalability Considerations

| Concern | At 2 users (target) | At 10 users (unlikely) | At 100 users (not happening) |
|---------|---------------------|----------------------|------------------------------|
| Database | SQLite single file, zero issues | SQLite still fine, WAL mode if concurrent writes | Move to PostgreSQL |
| API | Single Express process | Still fine | Add rate limiting |
| Static files | Served by Express | Add nginx reverse proxy | CDN |
| Exports | Direct query, instant | Still instant | Background job, pagination |

This app will never need to scale. The architecture is intentionally optimized for simplicity and developer experience at the 2-user scale.

## Key Architectural Decision: No Build Step

The client uses ES modules natively (`<script type="module">`), CSS files loaded directly, and static JSON for data. No webpack, no Vite, no bundler.

**Tradeoff:** No tree-shaking, no minification, no JSX, no TypeScript in the browser.

**Why acceptable:** The total client codebase will be small (estimated <2000 lines of JS). There are no dependencies to tree-shake. Minification saves negligible bytes for 2 users. TypeScript on the server (via `better-sqlite3` types) provides more value than TypeScript on the client, but even server-side TS is optional for this scale.

## Sources

- Architecture patterns based on established Express + SQLite application structure
- better-sqlite3 is the standard recommendation for synchronous SQLite in Node.js (HIGH confidence -- well-established library, widely used)
- CSS keyframe animations for card effects are well-supported across all modern browsers (HIGH confidence)
- ES modules in browsers have full support in all current browsers (HIGH confidence)
- State machine pattern for UI flow control is a well-documented frontend pattern (HIGH confidence)
