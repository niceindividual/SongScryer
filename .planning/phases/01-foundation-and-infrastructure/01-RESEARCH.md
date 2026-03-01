# Phase 1: Foundation and Infrastructure - Research

**Researched:** 2026-03-01
**Domain:** Node.js server deployment, SQLite database setup, nginx reverse proxy, PM2 process management
**Confidence:** HIGH

## Summary

Phase 1 delivers the production environment that every subsequent phase builds on: an Express server deployed at `https://h.eino.us/theyellow/songer/`, SQLite database with migration tooling, PM2 process management, and the 21 card definitions seeded as data. The domain is well-established Node.js VPS deployment -- no cutting-edge technology, no ambiguity about approach.

The most important finding is that **Express 5 is now stable** (v5.2.1, released after the initial project research). Express 5 offers automatic async error handling, which simplifies middleware. Since this is a greenfield project with no Express 4 code to migrate, Express 5 is the correct choice. The other key finding is that the subpath routing at `/theyellow/songer/` must be configured correctly in three places simultaneously (Vite `base`, nginx `location`, and Express route mounting) -- getting any one wrong causes cascading 404s that are confusing to debug.

**Primary recommendation:** Start with a "hello world" deployed at the production URL before building any real features. Prove the nginx-to-Express proxy, subpath routing, and PM2 restart cycle work end-to-end first.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Develop locally on Mac, deploy to VPS via git push + pull on server
- Local: Vite dev server for frontend (hot reload) + local Node/Express for API
- Local dev uses a separate local SQLite database -- never points at VPS production data
- Production: Vite build output served as static files from Express via nginx reverse proxy
- Code lives in a GitHub repo; deploy by SSHing into VPS and running `git pull` + `pm2 restart`
- No CI/CD for now -- manual deploy is fine for a 2-user personal project
- Backups deferred -- not implementing automated backups in this phase
- Production URL is `https://h.eino.us/theyellow/songer/` -- subpath routing must be correct from day one
- The VPS is a DigitalOcean droplet running Ubuntu, full root access

### Claude's Discretion
- Exact nginx config and SSL setup (Let's Encrypt via certbot)
- PM2 ecosystem config details
- Node.js version choice (22 LTS recommended per research)
- SQLite schema design and column types -- use research recommendations (flat schema, JSON TEXT for multi-select, enum codes not display strings, `submitted_at` timestamp, `submitted_raw` JSON insurance column)
- Card data structure -- JSON file in project, consumed by Phase 2; research recommends storing card ID (not text) in submissions table
- Migration tooling choice (e.g. `better-sqlite3-helper` or manual migration scripts)
- Directory structure on VPS

### Deferred Ideas (OUT OF SCOPE)
- Automated off-server backups (S3/B2) -- user wants to add later, no account set up yet
- GitHub Actions CI/CD -- overkill for now, can add later if manual deploys become tedious

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | App deployed at `https://h.eino.us/theyellow/songer/` with HTTPS and correct subpath routing | nginx reverse proxy config, Vite `base` option, Express route mounting, Let's Encrypt/certbot |
| INFRA-02 | SQLite database stores all submissions with migration tooling from first deploy | better-sqlite3 v12.x, manual numbered SQL migration runner, schema design with `submitted_raw` insurance column |
| INFRA-03 | Node.js server runs via PM2 with auto-restart on boot and log rotation | PM2 v6.x ecosystem config, `pm2 startup`, pm2-logrotate module |
| INFRA-04 | Automated database backups scheduled via cron and stored off-server | **CONFLICT: CONTEXT.md defers backups. User explicitly said "not implementing automated backups in this phase." Planner should skip INFRA-04 and note it as deferred.** |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard | Confidence |
|---------|---------|---------|--------------|------------|
| Express | 5.2.1 | HTTP server, API routes, static file serving | Now stable; async error handling built-in; greenfield project so no migration cost | HIGH (verified via npm) |
| better-sqlite3 | 12.6.2 | SQLite interface (synchronous) | Synchronous API simplifies code for 2-user app; faster than async sqlite3 | HIGH (verified via npm) |
| Vite | 7.3.1 | Dev server with HMR, production build | Fast dev iteration; `base` option handles subpath deployment | HIGH (verified via npm) |
| Node.js | 22 LTS (local is 24.10.0) | Runtime | LTS for VPS stability; local v24 is fine for dev | HIGH |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| helmet | 8.1.0 | Security headers | Always -- one-line middleware, sensible defaults |
| compression | 1.8.1 | gzip responses | Always -- negligible CPU cost |
| cors | 2.8.6 | CORS middleware | Dev only -- Vite proxy to Express; not needed in production |
| PM2 | 6.0.14 | Process management | Production VPS -- auto-restart, boot persistence, log rotation |
| certbot | latest from apt | SSL certificate | Production VPS -- Let's Encrypt HTTPS |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Express 5 | Express 4 (4.22.1) | Express 4 is more documented online but Express 5 is stable and better for new projects |
| Manual SQL migrations | better-sqlite3-helper | better-sqlite3-helper adds a wrapper layer; manual numbered .sql files are simpler and sufficient |
| PM2 | systemd unit file | systemd has no extra dependency but PM2 has easier log viewing and ecosystem config |

**Installation:**
```bash
# Backend dependencies
npm install express better-sqlite3 helmet compression cors

# Dev dependencies
npm install -D vite

# Production (on VPS)
npm install -g pm2
pm2 install pm2-logrotate
```

## Architecture Patterns

### Recommended Project Structure
```
songer/
  frontend/
    index.html
    css/
      main.css
    js/
      app.js
  server/
    index.js              # Express app setup, static serving, route mounting
    routes/
      submissions.js      # POST /api/submissions
    services/
      submission-service.js
    db/
      database.js         # better-sqlite3 init, WAL mode, migrations
      migrations/
        001-initial.sql   # CREATE TABLE statements
      seed.js             # Insert 21 card definitions
  data/
    cards.json            # 21 card definitions (consumed by seed + Phase 2 frontend)
  ecosystem.config.cjs    # PM2 config
  vite.config.js          # Vite dev server + build config
  package.json
```

### Pattern 1: Subpath-Aware Configuration (Three-Place Rule)

**What:** The `/theyellow/songer/` subpath must be configured in three places simultaneously. Missing any one causes 404s.

**Where to configure:**

1. **Vite** -- `base` option in vite.config.js:
```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  base: '/theyellow/songer/',
  server: {
    proxy: {
      '/theyellow/songer/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/theyellow\/songer/, '')
      }
    }
  },
  build: {
    outDir: '../dist'
  }
});
```

2. **nginx** -- location block with trailing-slash proxy_pass to strip the prefix:
```nginx
location /theyellow/songer/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
The trailing `/` on `proxy_pass http://127.0.0.1:3000/;` is critical -- it strips `/theyellow/songer/` from the request before forwarding to Express. Without it, Express receives the full path and nothing matches.

3. **Express** -- serve static files and mount API routes at root (nginx strips the prefix):
```javascript
// server/index.js
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/api', submissionsRouter);
```

**When to use:** Always. This is the foundational configuration for the entire project.

### Pattern 2: Manual SQL Migration Runner

**What:** Numbered `.sql` files in a `migrations/` directory, executed in order, tracked via SQLite's `PRAGMA user_version`.

**Why:** No external dependency. better-sqlite3's synchronous API makes this trivial.

```javascript
// server/db/database.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function initDatabase(dbPath) {
  const db = new Database(dbPath);

  // Essential PRAGMAs
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  // Run migrations
  const currentVersion = db.pragma('user_version', { simple: true });
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = parseInt(file.split('-')[0], 10);
    if (version > currentVersion) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
      db.pragma(`user_version = ${version}`);
    }
  }

  return db;
}
```

### Pattern 3: PM2 Ecosystem Config

**What:** Single config file for PM2 process management.

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'songer',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_PATH: './data/songer.db'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_restarts: 10,
    restart_delay: 1000
  }]
};
```

Then on VPS:
```bash
pm2 start ecosystem.config.cjs
pm2 startup    # generates boot script
pm2 save       # saves process list
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Anti-Patterns to Avoid

- **Hardcoded paths:** Never use `/theyellow/songer/` as a string literal in JavaScript. Use Vite's `import.meta.env.BASE_URL` on the frontend and environment variables on the backend.
- **Database file in git:** Add `*.db` and `data/` to `.gitignore`. The database is runtime data, not source code.
- **Skipping WAL mode:** Default SQLite journal mode causes SQLITE_BUSY under concurrent writes. Always enable WAL at init.
- **Running `node server.js` directly on VPS:** Always use PM2. Direct execution dies when SSH disconnects.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Process management | Shell scripts to restart Node | PM2 | Handles crash recovery, boot persistence, log rotation |
| SSL certificates | Self-signed certs | certbot + Let's Encrypt | Free, auto-renewing, trusted by browsers |
| Security headers | Manual header setting | helmet middleware | Covers CSP, HSTS, X-Frame-Options, etc. in one line |
| CSV generation | String concatenation | @json2csv/plainjs (Phase 4) | Proper quoting/escaping for fields with commas, quotes, newlines |
| gzip compression | Manual zlib | compression middleware | Transparent, handles content negotiation |

## Common Pitfalls

### Pitfall 1: Subpath Routing Mismatch
**What goes wrong:** App works on localhost:3000 but all assets 404 on production because `/theyellow/songer/` prefix is not handled consistently.
**Why it happens:** Three independent configurations (Vite base, nginx location, Express static serving) must agree. Developing locally at `/` masks the problem.
**How to avoid:** Deploy a "hello world" page first. Verify it loads with correct CSS/JS paths before building features. Test with `curl -I https://h.eino.us/theyellow/songer/` after every infrastructure change.
**Warning signs:** 404s for `.js` or `.css` files in browser console; API calls returning HTML instead of JSON.

### Pitfall 2: SQLite Schema Without Migration Path
**What goes wrong:** Schema is created with `CREATE TABLE` in application code. Later changes require manual SQL surgery on the live database.
**Why it happens:** "It's just SQLite" thinking. Migration tooling feels like overkill for a small project.
**How to avoid:** Use numbered migration files from the first commit. Track version with `PRAGMA user_version`. Include a `submitted_raw` JSON column as an insurance policy for re-deriving data if the schema changes.
**Warning signs:** Running ad-hoc `ALTER TABLE` commands on the VPS.

### Pitfall 3: Express 5 Route Pattern Changes
**What goes wrong:** Route patterns that worked in Express 4 fail silently in Express 5 due to updated path-to-regexp.
**Why it happens:** Express 5 uses path-to-regexp v8 which removes sub-expression regex and changes wildcard syntax (`*` must be named: `/*splat`).
**How to avoid:** For this project's simple routes (`/api/submissions`, `/api/submissions/:id`, `/api/export`), this is unlikely to be an issue. Just be aware if using wildcard or regex routes.
**Warning signs:** Routes returning 404 that look correct.

### Pitfall 4: PM2 Not Surviving Reboot
**What goes wrong:** PM2 runs the app fine, but after VPS reboot the app is down.
**Why it happens:** `pm2 startup` generates a command that must actually be run (it prints it to the console). `pm2 save` must be called after starting the app.
**How to avoid:** Run `pm2 startup`, execute the printed command, start the app with `pm2 start`, then `pm2 save`. Test by rebooting the VPS.
**Warning signs:** App is down after VPS maintenance/reboot.

### Pitfall 5: nginx Trailing Slash on proxy_pass
**What goes wrong:** Requests arrive at Express with the `/theyellow/songer/` prefix still attached, so no routes match.
**Why it happens:** `proxy_pass http://127.0.0.1:3000` (no trailing slash) passes the full URI. `proxy_pass http://127.0.0.1:3000/` (with trailing slash) strips the location prefix.
**How to avoid:** Always include the trailing slash on proxy_pass when stripping a location prefix. Test with `curl` to verify Express receives clean paths.
**Warning signs:** Express logs show requests for `/theyellow/songer/api/submissions` instead of `/api/submissions`.

## Code Examples

### SQLite Schema (001-initial.sql)

```sql
-- Migration 001: Initial schema
-- Source: project research ARCHITECTURE.md

CREATE TABLE IF NOT EXISTS cards (
  id     INTEGER PRIMARY KEY,
  prompt TEXT NOT NULL,
  tone   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  submitter           TEXT NOT NULL CHECK(submitter IN ('matt', 'mike')),
  card_id             INTEGER NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),

  -- Song identity
  song_title          TEXT NOT NULL,
  artist              TEXT NOT NULL,

  -- Free text responses
  why_this_song       TEXT NOT NULL,
  standout_element    TEXT,
  emotional_quality   TEXT,
  performance_notes   TEXT,
  other_notes         TEXT,

  -- Structured responses (enum codes, not display strings)
  primary_hooks       TEXT NOT NULL,  -- JSON array, max 2 from enum
  lyrics_matter       TEXT NOT NULL CHECK(lyrics_matter IN ('central', 'somewhat', 'not_really')),
  energy_level        INTEGER NOT NULL CHECK(energy_level BETWEEN 1 AND 5),
  love_level          INTEGER NOT NULL CHECK(love_level BETWEEN 1 AND 5),
  feasibility         TEXT NOT NULL CHECK(feasibility IN ('yes_as_is', 'yes_adapted', 'probably_not', 'not_sure')),
  performance_desire  TEXT NOT NULL CHECK(performance_desire IN ('definitely', 'maybe', 'no')),
  tempo_feel          TEXT NOT NULL CHECK(tempo_feel IN ('slow', 'mid', 'uptempo', 'variable')),
  time_signature      TEXT NOT NULL CHECK(time_signature IN ('4/4', '3/4', '6/8', 'odd', 'not_sure')),

  -- Optional musical details
  key_or_tonal_center TEXT,
  approximate_bpm     INTEGER,

  -- Insurance: raw submission payload for re-deriving if schema changes
  submitted_raw       TEXT NOT NULL,  -- full JSON of the original submission

  FOREIGN KEY (card_id) REFERENCES cards(id)
);
```

### Express 5 Server Setup

```javascript
// server/index.js
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const { initDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = initDatabase(process.env.DB_PATH || './data/songer.db');

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());

// API routes
app.use('/api', require('./routes/submissions')(db));

// Serve frontend static files (Vite build output)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback -- serve index.html for non-API routes
app.get('*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Express 5 async error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Songer server running on port ${PORT}`);
});
```

### Card Seed Data Structure

```json
[
  {
    "id": 1,
    "prompt": "A song that changed how you hear music",
    "tone": "reflective"
  },
  {
    "id": 2,
    "prompt": "A song you could play on repeat for an hour",
    "tone": "enthusiastic"
  }
]
```

The full 21 cards need to be authored as a content task. The `tone` field drives adaptive rendering in Phase 2 (label/placeholder text variants). For Phase 1, only `id`, `prompt`, and `tone` are needed in the cards table and JSON file.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Express 4 | Express 5 (stable) | October 2024 | Async error handling built-in; no try/catch needed in route handlers |
| better-sqlite3 v11 | better-sqlite3 v12 | 2025 | Minor API improvements; no breaking changes for this use case |
| Vite 6 | Vite 7 | 2025 | Updated build tooling; `base` option unchanged |
| PM2 v5 | PM2 v6 | 2025 | Minor updates; ecosystem config format unchanged |

**Key update from initial research:** The project research (STACK.md, ARCHITECTURE.md) assumed Express 4. Express 5 is now stable and is the better choice for a greenfield project. The main code difference: wildcard routes use `/*splat` instead of `/*`, and async route handlers automatically propagate errors to error middleware.

## Open Questions

1. **INFRA-04 Conflict**
   - What we know: REQUIREMENTS.md and ROADMAP.md assign INFRA-04 (automated off-server backups) to Phase 1. CONTEXT.md (user decisions) explicitly defers backups: "not implementing automated backups in this phase."
   - Recommendation: Follow CONTEXT.md. Skip INFRA-04 in Phase 1 planning. The planner should note INFRA-04 as deferred and update the requirements traceability.

2. **21 Card Definitions**
   - What we know: The research assumes 21 Oblique Strategies-style prompt cards but does not enumerate all 21. Card texts and tone classifications need to be authored.
   - Recommendation: Author the 21 cards as a content task within Phase 1. The cards are needed for the seed data and will be consumed by Phase 2's adaptive rendering. Keep tone values simple (e.g., "reflective", "playful", "nostalgic", "energetic", "introspective") so the Phase 2 Question Renderer can map them to label variants.

3. **Node.js Version on VPS**
   - What we know: Local machine runs Node 24.10.0. VPS should run Node 22 LTS for stability.
   - Recommendation: Install Node 22 LTS on the VPS via NodeSource or nvm. Do not use Node 24 on production -- it is the Current release, not LTS.

4. **Express 5 Wildcard Route Syntax**
   - What we know: Express 5 requires named wildcards (`/*splat` not `/*`). For a SPA fallback this matters.
   - Recommendation: Use `app.get('*splat', ...)` for the catch-all route. This is a minor syntax change but will cause a startup error if missed.

## Sources

### Primary (HIGH confidence)
- npm registry (verified 2026-03-01): Express 5.2.1, better-sqlite3 12.6.2, Vite 7.3.1, PM2 6.0.14, helmet 8.1.0, compression 1.8.1, cors 2.8.6
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html) -- breaking changes and new patterns
- [Vite base option docs](https://vite.dev/config/shared-options) -- subpath deployment configuration
- [nginx proxy_pass trailing slash](https://www.getpagespeed.com/server-setup/nginx/nginx-proxy-pass-trailing-slash) -- URI stripping behavior

### Secondary (MEDIUM confidence)
- [PM2 Ecosystem File docs](https://pm2.keymetrics.io/docs/usage/application-declaration/) -- config format
- [PM2 production guide](https://ploy.cloud/blog/pm2-nodejs-production-deployment-guide-2025/) -- startup and log rotation patterns
- [nginx subpath proxy for Node.js](https://rumaan.dev/blog/nginx-proxy-node-subpath) -- complete subpath setup example

### Tertiary (LOW confidence)
- None -- all findings verified against npm registry or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry on 2026-03-01
- Architecture: HIGH -- patterns from project research validated; Express 5 update incorporated
- Pitfalls: HIGH -- subpath routing, SQLite migrations, PM2 boot persistence are well-documented stable domains

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain, 30-day validity)
