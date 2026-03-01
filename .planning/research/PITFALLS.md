# Domain Pitfalls

**Domain:** Browser-based creative data collection app with animated UI, adaptive form flows, SQLite backend, and data export
**Project:** Music DNA (SongScryer)
**Researched:** 2026-03-01

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: SQLite Schema Painted Into a Corner

**What goes wrong:** The initial schema is designed around the current 21 cards and current field list. Two weeks in, you realize you need a new field (e.g., "decade of release") or want to change how multi-select fields like "primary hook" are stored. SQLite has limited ALTER TABLE support — you cannot drop columns (before 3.35.0), rename columns (before 3.25.0), or change column types. Migrations become copy-table-rename dances.

**Why it happens:** Small projects skip migration tooling because "it's just SQLite." Then the schema solidifies before the data model is truly validated by actual use.

**Consequences:** Manual SQL gymnastics to reshape data. Risk of data loss during migration on a live VPS. Submissions already collected become orphaned or malformed.

**Prevention:**
- Use a migration tool from day one. Even something minimal like `better-sqlite3-migrations` or a numbered `.sql` file runner. The overhead is ~30 minutes; the payoff is every future schema change.
- Store multi-select fields (primary hook: up to 2) in a junction table, not as comma-separated strings. Querying "all songs where hook includes melody" is trivial with a junction table and painful with string parsing.
- Store the card ID as a foreign key integer, not the card text. Card text will change (wordsmithing); the ID should not.
- Add a `schema_version` field or table so the app knows what shape the DB is in at startup.
- Keep a `submitted_raw` JSON column alongside normalized columns. This is your insurance policy — if the schema is wrong, you can re-derive from the raw payload.

**Detection:** You catch yourself writing `UPDATE submissions SET new_col = substr(old_col, ...)` or similar data surgery. That means the schema needed a migration path.

**Phase relevance:** Phase 1 (data model/backend). This is a "get it right early or pay forever" decision.

---

### Pitfall 2: Card Prompt Logic Entangled With UI Rendering

**What goes wrong:** Each of the 21 cards has slightly different question framing. Developers embed the per-card logic directly in the rendering code — `if (cardId === 7) { label = "wildcard: ..."; }` scattered across the form component. Adding card 22 or tweaking card 12's tone requires touching rendering logic.

**Why it happens:** With only 21 cards it feels manageable to hardcode. The adaptive framing (tone shifts per card) blurs the line between data and presentation.

**Consequences:** Card content changes require code changes and redeployment. Testing all 21 paths becomes combinatorial. Bugs hide in card-specific branches.

**Prevention:**
- Define all 21 cards as a data structure (JSON or JS object) with fields: `id`, `promptText`, `framingTone` (affects label/placeholder text), `questionOverrides` (any per-card label changes). The form reads this structure; it never contains card-specific `if` statements.
- The adaptive question flow is driven by card metadata, not imperative code. A card's "tone" is a property that selects from a small set of label/placeholder variants, not bespoke logic per card.
- Test by iterating the card data structure and asserting each produces valid form output. One loop, not 21 test cases.

**Detection:** Grep for card IDs or card text in your form/UI code. If they appear outside the card data file, the logic is leaking.

**Phase relevance:** Phase 1 (data model) and Phase 2 (form/UI). Define the card data structure in Phase 1; consume it in Phase 2.

---

### Pitfall 3: Animation Complexity Creep Blocking Core Functionality

**What goes wrong:** The card shuffle/flip/reveal animation becomes a rabbit hole. You spend days perfecting 3D CSS transforms, easing curves, and particle effects before the form even submits data. The medieval manuscript aesthetic compounds this — every element "should" have decorative flourishes.

**Why it happens:** Animation work is visually rewarding and feels like progress. The project brief emphasizes the creative/experiential aspect. CSS 3D transforms and keyframe animations have hidden cross-browser edge cases that consume debugging time.

**Consequences:** Core data flow (submit -> store -> export) is delayed. The animation may need to be reworked once real form content is integrated (card size changes, text overflow, etc.). Sunk cost makes it harder to simplify animations that cause performance issues.

**Prevention:**
- Build the entire submit->store->export pipeline with zero animation first. Use static card selection (dropdown or click-to-select) as a placeholder.
- Implement animations as a separate, swappable layer. The card draw component should expose `onCardSelected(cardId)` — how the selection happens visually is independent of what happens after.
- Set a time box for animation work: one focused session, not open-ended polish.
- The project brief already calls for aesthetics at the end. Honor that strictly.

**Detection:** You are tweaking animation timing but have never successfully exported data to JSON. The cart is before the horse.

**Phase relevance:** Explicitly the final phase. The PROJECT.md already says this — the pitfall is drifting from that plan.

---

### Pitfall 4: Inconsistent Data Shape Across Card Submissions

**What goes wrong:** The 21 cards produce "consistent underlying data" in theory, but in practice, subtle differences creep in. Card 14 ("a song I love more to play than to listen to") naturally biases toward performance fields, so the developer adds extra prompting or skips certain questions for that card. Card 7 (wildcard) gets special treatment. Over time, the exported data has gaps, inconsistent field populations, and per-card quirks that make Claude analysis unreliable.

**Why it happens:** The adaptive framing is meant to change tone, not structure. But when implementing, the line between "different framing" and "different questions" blurs. Optional fields get conditionally hidden based on card context.

**Consequences:** The entire point of the app — clean, consistent data for Claude analysis — is undermined. Aggregation across cards becomes impossible without per-card normalization logic.

**Prevention:**
- Define a strict submission schema (TypeScript interface or JSON Schema) that every card must produce. Validate submissions server-side against this schema before storing. Reject non-conforming submissions.
- Cards can change labels, placeholders, and helper text. Cards CANNOT add fields, remove fields, or change field types. This is the fundamental invariant.
- The "adaptive" part is cosmetic (UI copy), not structural (data shape). Enforce this as a design principle, not just a guideline.
- Write a single integration test: submit one entry per card, assert all 21 produce identical JSON keys.

**Detection:** Export all submissions to JSON. Run `Object.keys()` on each. If the key sets differ, the invariant is broken.

**Phase relevance:** Phase 1 (data model) — define and enforce the schema. Phase 2 (form) — ensure UI variations don't leak into data.

---

### Pitfall 5: Export Format Decisions Made Too Late

**What goes wrong:** JSON and CSV export are treated as an afterthought. The schema and storage are designed for the app's internal needs. When it's time to export for Claude input or Google Sheets, you discover: multi-select fields don't CSV-ify cleanly, free text with commas/newlines breaks CSV parsers, the JSON structure is nested in ways Claude's context window doesn't handle well, and the export doesn't include card prompt text (just IDs).

**Why it happens:** Export feels like a "last mile" feature. But export is the entire purpose of this app — it exists to feed Claude.

**Consequences:** Manual post-processing of every export. Data that looks right in the app but is garbled in Sheets. Claude analysis requires custom prompting to parse awkward formats.

**Prevention:**
- Design the export format FIRST. Write a sample JSON and CSV of what a perfect Claude input looks like for 5 submissions. Then design the schema to produce that output naturally.
- For CSV: use a proper CSV library (like `csv-stringify` in Node) that handles quoting, escaping, and multi-line fields. Never hand-roll CSV generation with string concatenation.
- For multi-select fields (primary hook), export as pipe-delimited within the CSV cell (`melody|groove+rhythm`) or as separate boolean columns (`hook_melody: true, hook_groove: false, ...`). Decide this before building the schema.
- Include denormalized context in exports: card prompt text (not just ID), submitter name (not just ID), human-readable enum values.
- Test export with real Google Sheets import and real Claude input from the start.

**Detection:** You try to import your CSV into Google Sheets and fields are misaligned, or you paste JSON into Claude and it asks for clarification about the data structure.

**Phase relevance:** Phase 1 (data model). Design export format before schema, not after.

## Moderate Pitfalls

### Pitfall 6: Form State Loss on Navigation or Refresh

**What goes wrong:** User draws a card, fills in 10 fields, accidentally hits back/refresh, loses everything. With 16+ fields per submission, re-entry is painful enough to cause abandonment — even with only 2 users.

**Why it happens:** Browser-based forms don't persist state by default. SPAs lose state on refresh unless explicitly managed.

**Prevention:**
- Persist in-progress form state to `sessionStorage` or `localStorage` on every field change. Restore on page load.
- Debounce the persistence (save 500ms after last keystroke, not on every keypress).
- Show a "you have an unfinished submission" prompt on return.
- Keep it simple: serialize the form state as a flat JSON object keyed by card ID.

**Detection:** Fill out half the form, hit F5, observe data loss.

**Phase relevance:** Phase 2 (form implementation). Build this into the form from the start, not as a patch.

---

### Pitfall 7: SQLite File Locking on VPS Under Concurrent Writes

**What goes wrong:** Matt and Mike both submit at the same moment. SQLite uses file-level locking. With the default journal mode, concurrent writes can produce `SQLITE_BUSY` errors. At 2 users this is unlikely but not impossible, especially during a session where both are actively submitting.

**Why it happens:** SQLite is a great choice for this scale, but its default configuration isn't optimized for concurrent web use.

**Prevention:**
- Enable WAL (Write-Ahead Logging) mode: `PRAGMA journal_mode=WAL;`. This allows concurrent reads and writes without blocking. One line of SQL, massive improvement.
- Set a busy timeout: `PRAGMA busy_timeout=5000;`. Instead of immediately failing on lock contention, wait up to 5 seconds.
- Use a single database connection with serialized access in the Node.js process (better-sqlite3 is synchronous and handles this naturally).
- If using async sqlite3 bindings, serialize write operations through a queue.

**Detection:** Intermittent 500 errors on submission that resolve on retry.

**Phase relevance:** Phase 1 (backend setup). Set these PRAGMAs at database initialization.

---

### Pitfall 8: No Backup Strategy for SQLite on VPS

**What goes wrong:** The SQLite file is a single file on disk. VPS disk fails, accidental `rm`, bad deploy overwrites the DB, or a schema migration corrupts the file. All submissions are lost.

**Why it happens:** "It's just a small project" thinking. No managed database means no managed backups.

**Consequences:** Loss of all collected musical DNA data. For a personal creative project, this data is irreplaceable — it represents hours of thoughtful responses.

**Prevention:**
- Automated daily backup: a cron job that copies the SQLite file (use `.backup` API or `sqlite3 .backup` command, not plain `cp` while the DB might be written to) to a second location.
- Store backups off-VPS: rsync to a local machine or push to an object store (DigitalOcean Spaces, ~$5/mo).
- Before each deploy, take a backup. Make this part of the deploy script.
- The raw JSON column (from Pitfall 1's prevention) serves as a secondary recovery path.

**Detection:** Ask yourself: "If the VPS died right now, could I recover the data?" If the answer is no, fix it.

**Phase relevance:** Phase 1 (infrastructure setup). Set up before first real data is collected.

---

### Pitfall 9: Card Randomness That Doesn't Feel Random

**What goes wrong:** True random selection from 21 cards means the same card can appear multiple times in a row while others never show up. With only ~42 total submissions expected (21 cards x 2 users), duplicates feel broken. Users think "it's not random" or "I keep getting the same ones."

**Why it happens:** Humans expect "shuffled deck" behavior but developers implement "random dice roll" behavior.

**Prevention:**
- Implement deck-style randomness: shuffle all 21 cards into a sequence, deal them in order, reshuffle when exhausted. Track the deck position per user in `localStorage` or server-side.
- Optionally show a "cards remaining" indicator so users know their progress through the deck.
- Allow users to see which cards they have and haven't drawn (a visual tracker).
- Consider: should Matt and Mike each get their own shuffled deck? Almost certainly yes.

**Detection:** User says "I got card 7 again" within their first few draws.

**Phase relevance:** Phase 2 (card draw experience). Design the draw algorithm before building the animation.

---

### Pitfall 10: VPS Deployment Without Process Management

**What goes wrong:** Node.js server is started with `node server.js` over SSH. Developer disconnects, process dies. Or the process crashes on an unhandled error and nobody restarts it. The app is down for hours/days before anyone notices.

**Why it happens:** Small projects skip production ops. "I'll just SSH in and restart it."

**Prevention:**
- Use PM2 or systemd to manage the Node.js process. Auto-restart on crash. Auto-start on VPS reboot.
- Set up a minimal health check: a cron job that curls the app URL and sends an alert (even just an email) if it's down.
- Use `pm2 startup` to survive reboots, or write a systemd unit file.
- Log to a file with rotation (PM2 handles this, or use `logrotate`).

**Detection:** You reboot the VPS and the app doesn't come back up automatically.

**Phase relevance:** Phase 1 (infrastructure). Set up process management before sharing the URL with Mike.

---

### Pitfall 11: Reverse Proxy and HTTPS Misconfiguration

**What goes wrong:** The app is served from `https://h.eino.us/theyellow/songscryer/` which means it's behind a reverse proxy (likely Nginx) at a subpath. Subpath routing is a notorious source of bugs: asset paths break (CSS/JS 404), API calls go to the wrong URL, redirects lose the subpath prefix, and WebSocket upgrades fail if ever needed.

**Why it happens:** Developing locally at `localhost:3000/` works perfectly. Deploying at `/theyellow/songscryer/` introduces a base path that every URL in the app must respect.

**Prevention:**
- Set a configurable `BASE_PATH` environment variable. Use it for all asset references, API endpoints, and redirects.
- In HTML, use `<base href="/theyellow/songscryer/">` or prefix all paths explicitly.
- Test locally with the subpath: run behind a local Nginx or use Node's `--prefix` equivalent to simulate the production path.
- For API calls from the frontend, construct URLs relative to the base path, never hardcode `/api/...`.
- Set up HTTPS with Let's Encrypt/certbot on the VPS. Test that the cert auto-renews (certbot has a `--dry-run` flag).

**Detection:** App works on localhost, all assets 404 on the VPS. Or: works fine for 90 days, then HTTPS cert expires and the site goes down.

**Phase relevance:** Phase 1 (infrastructure). Get the reverse proxy and subpath routing working with a "hello world" before building features.

## Minor Pitfalls

### Pitfall 12: Free Text Fields Without Length Limits

**What goes wrong:** The "why this song / what it means" field accepts unlimited text. One enthusiastic response is 3000 words. The export for Claude becomes dominated by one verbose entry, the CSV cell is unwieldy in Google Sheets, and the UI doesn't handle overflow.

**Prevention:**
- Set reasonable character limits on free text fields (e.g., 500 chars for "why this song", 150 for short text fields). Show a character counter.
- The limit serves double duty: keeps exports manageable AND encourages concise, Claude-parseable responses.
- Make the limit generous enough that it doesn't feel restrictive for a thoughtful answer.

**Phase relevance:** Phase 2 (form implementation).

---

### Pitfall 13: Not Tracking Submission Timestamps and Metadata

**What goes wrong:** Submissions are stored without timestamps, session info, or edit history. Later, you want to know: "When did Mike submit this?", "Did he change his answer?", "What order were these submitted in?" — and the data doesn't exist.

**Prevention:**
- Every submission gets: `created_at` (ISO 8601), `updated_at`, `session_id` (UUID generated per browser session), `card_draw_order` (which number draw this was in the session).
- These are metadata fields, not shown in the form. Auto-populated server-side.
- Cost: 4 extra columns. Value: full provenance of every submission.

**Phase relevance:** Phase 1 (schema design).

---

### Pitfall 14: Enum Fields Stored as Display Strings

**What goes wrong:** "Performance feasibility" is stored as the full display string: `"yes with adaptation"`. Later, the display copy is tweaked to `"yes, with some adaptation"`. Now the DB has two different strings meaning the same thing, and queries/exports break.

**Prevention:**
- Store enum values as short codes: `as_is`, `with_adaptation`, `probably_not`, `not_sure`. Map codes to display strings in the UI layer only.
- Define the enum codes in a shared constants file used by both frontend and backend.
- Validate incoming values server-side against the enum list. Reject unknown values.

**Phase relevance:** Phase 1 (data model).

---

### Pitfall 15: Overengineering for 2 Users

**What goes wrong:** Adding authentication middleware, rate limiting, CSRF protection, input sanitization frameworks, database connection pooling, caching layers, etc. for an app with 2 known, trusted users on a private URL.

**Prevention:**
- Parameterized SQL queries (prevent injection) and basic input validation are non-negotiable, even for 2 users.
- Everything else: skip it. No auth middleware (a name selector is fine). No rate limiting. No CSRF tokens (the app is not a target). No caching layer.
- The counter-pitfall: don't skip parameterized queries just because "it's only us." SQL injection from a form is a habit to never form.

**Phase relevance:** All phases. Resist the urge to add infrastructure appropriate for 10,000 users.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data model / Schema | Schema without migration path (Pitfall 1) | Use migration tool from day 1, include raw JSON column |
| Data model / Schema | Enum values as display strings (Pitfall 14) | Store short codes, map to display in UI |
| Data model / Schema | Missing metadata (Pitfall 13) | Add timestamps, session tracking columns |
| Data model / Schema | Export format as afterthought (Pitfall 5) | Design export format BEFORE schema |
| Data model / Schema | Inconsistent data shape (Pitfall 4) | Strict submission schema, server-side validation |
| Infrastructure / VPS | No process management (Pitfall 10) | PM2 or systemd from first deploy |
| Infrastructure / VPS | Subpath routing broken (Pitfall 11) | Test with production subpath early |
| Infrastructure / VPS | No backup strategy (Pitfall 8) | Automated daily backups before collecting real data |
| Infrastructure / VPS | SQLite locking (Pitfall 7) | Enable WAL mode and busy timeout at DB init |
| Form / UI | Card logic entangled with UI (Pitfall 2) | Cards as data structure, form reads metadata |
| Form / UI | Form state loss (Pitfall 6) | Persist to sessionStorage on every change |
| Form / UI | Bad randomness (Pitfall 9) | Shuffled deck, not random dice |
| Form / UI | No text length limits (Pitfall 12) | Character limits with counters |
| Animation / Aesthetic | Complexity creep (Pitfall 3) | Time-boxed, after core pipeline works end-to-end |
| All phases | Overengineering (Pitfall 15) | Parameterized queries yes; everything else, probably no |

## Sources

- Training data knowledge of SQLite operational characteristics, WAL mode, and ALTER TABLE limitations (HIGH confidence — well-documented, stable behavior)
- Training data knowledge of browser form state management patterns (HIGH confidence)
- Training data knowledge of CSS animation performance and 3D transform pitfalls (HIGH confidence)
- Training data knowledge of Node.js deployment patterns with PM2/systemd (HIGH confidence)
- Training data knowledge of Nginx reverse proxy subpath routing issues (HIGH confidence)
- Project-specific analysis based on PROJECT.md requirements and 21-card data structure (HIGH confidence — derived from project specification)

**Confidence note:** Web search was unavailable during this research session. All findings are based on training data and direct analysis of the project specification. The pitfalls documented here cover well-established, stable problem domains (SQLite behavior, browser forms, VPS ops) where training data is highly reliable. No cutting-edge or rapidly-evolving technology is involved, so staleness risk is LOW.
