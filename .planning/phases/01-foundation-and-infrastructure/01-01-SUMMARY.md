# Plan 01-01 Execution Summary

**Plan:** 01-01 — Project scaffold: Express 5 server, SQLite database with migrations, 21 card seed data, Vite frontend with subpath config
**Phase:** 01-foundation-and-infrastructure
**Executed:** 2026-03-01
**Status:** COMPLETE

## What Was Built

### Task 1: Project scaffold with Express 5 server, SQLite database, and card seed data

**Files created:**
- `package.json` — ESM project (`"type":"module"`), all scripts, dependencies (express@5, better-sqlite3, helmet, compression, cors), devDependencies (vite, concurrently)
- `.gitignore` — node_modules/, dist/, *.db, data/*.db, logs/, .env, .DS_Store
- `server/index.js` — Express 5 server: WAL-mode SQLite init, auto-seed on startup, helmet/compression/json middleware, /api routes mounted, static dist/ serving, SPA fallback with `/*splat` (Express 5 named wildcard), error handler
- `server/db/database.js` — `initDatabase(dbPath)`: creates data dir, WAL/busy_timeout/foreign_keys pragmas, numbered SQL migration runner via PRAGMA user_version
- `server/db/migrations/001-initial.sql` — cards + submissions tables with full CHECK constraints, submitted_raw insurance column, FOREIGN KEY to cards
- `server/db/seed.js` — standalone seed script: INSERT OR IGNORE from data/cards.json
- `server/routes/submissions.js` — `submissionsRouter(db)` factory: POST /submissions (validates required fields, inserts, returns 201), GET /submissions (returns all)
- `data/cards.json` — 21 card definitions with id, prompt, and tone across 6 tones: reflective, energetic, nostalgic, introspective, playful, provocative
- `ecosystem.config.cjs` — PM2 config: name=songer, NODE_ENV=production, PORT=3000, DB_PATH=./data/songer.db, logs in ./logs/

### Task 2: Vite frontend stub with subpath configuration

**Files created:**
- `vite.config.js` — `root: 'frontend'`, `base: '/theyellow/songer/'`, API proxy `/theyellow/songer/api → http://localhost:3000` (strips subpath prefix), `outDir: '../dist'`
- `frontend/index.html` — HTML5 boilerplate, title "Songer", links to css/main.css and js/app.js
- `frontend/js/app.js` — On load, fetches `${import.meta.env.BASE_URL}api/submissions`, displays submission count (proves API connectivity and subpath correctness)
- `frontend/css/main.css` — Minimal reset + warm parchment background (#f5f0e8) to visually confirm CSS loads

## Verification Results

All checks passed:

| Check | Result |
|-------|--------|
| DB initialized with correct tables (cards + submissions) | PASS |
| Vite build succeeds | PASS |
| Built index.html contains /theyellow/songer/ subpath | PASS |
| GET /api/submissions returns JSON array | PASS |
| POST /api/submissions returns 201 | PASS |
| data/songer.db exists with 21 cards seeded | PASS |

## Key Decisions Made

- **ESM throughout**: `"type":"module"` in package.json; all server files use `import`/`export`; `fileURLToPath` for `__dirname` equivalent
- **Auto-seed on startup**: `server/index.js` seeds cards on startup only if cards table is empty (INSERT OR IGNORE is safe to re-run; auto-seed for cleaner deploy)
- **Express 5 wildcard**: SPA fallback uses `/*splat` (Express 5 named wildcard syntax; `/*` would cause startup error)
- **Subpath in 3 places**: Vite `base`, Vite proxy rewrite, and nginx (plan 01-02) — all must agree on `/theyellow/songer/`
- **Test DB cleaned up**: `data/songer.db` removed after verification; regenerates on first server start

## Requirements Satisfied

- **INFRA-02** (partially): SQLite database with migration tooling is in place; deployed in plan 01-02
- **INFRA-01** (partially): Express server and Vite subpath config ready; deployed to production in plan 01-02

## Next Step

Plan 01-02: VPS deployment — nginx reverse proxy, PM2 process management, production verification
