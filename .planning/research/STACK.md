# Technology Stack

**Project:** Music DNA (SongScryer) -- Song Submission App
**Researched:** 2026-03-01
**Overall confidence:** MEDIUM (versions not verified against npm registry -- Read/Bash/WebSearch unavailable during research; rationale and choices are HIGH confidence)

## Recommended Stack

This is a small personal tool for 2 users with an animated card UI, adaptive forms, and SQLite persistence. The stack should be minimal, zero-framework on the frontend (vanilla JS + CSS), and dead-simple on the backend.

### Frontend

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vanilla JS (ES modules) | ES2022+ | UI logic, card animations, form flow | No framework needed for 2 users and ~5 screens. React/Vue/Svelte add build complexity and bundle size for zero benefit here. Native ES modules work in all modern browsers. | HIGH |
| Vanilla CSS (with custom properties) | CSS3 | Styling, card flip animations, parchment aesthetic | CSS `@keyframes`, `perspective`, `transform-style: preserve-3d` handle the card shuffle/flip natively. CSS custom properties enable the medieval theme layer later. No Tailwind needed for a small app. | HIGH |
| Vite | ~6.x | Dev server, asset bundling, HMR | Fast dev experience even for vanilla JS projects. The `vanilla` template gives you zero-framework scaffolding with HMR. Alternative: no bundler at all (just serve static files), but Vite's dev server with HMR makes iteration on animations much faster. | HIGH (choice), MEDIUM (version) |

### Backend

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js | 20 LTS or 22 LTS | Runtime | LTS is the right choice for a VPS that should stay stable. Node 20 LTS is supported through April 2026; Node 22 LTS through April 2027. Either works. | HIGH |
| Express | ~4.21.x | HTTP server, API routes, static file serving | Express 5 reached RC but is not yet widely adopted in production. Express 4 is battle-tested, has the largest ecosystem, and is the right choice for a simple REST API with ~6 endpoints. Alternatives: Fastify (faster but unnecessary at this scale), Hono (too new for a project that should just work). | HIGH (choice), MEDIUM (version) |
| better-sqlite3 | ~11.x | SQLite interface | Synchronous API is actually a feature here -- no async complexity for a 2-user app. Faster than `sqlite3` (async wrapper). The synchronous model means simpler code: `db.prepare(sql).run(params)` instead of callback chains. | HIGH (choice), MEDIUM (version) |

### Data Export

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Built-in JSON.stringify | N/A | JSON export | Native. No library needed. Serialize query results directly. | HIGH |
| @json2csv/plainjs | ~7.x | CSV export | Lightweight, no streaming needed for small datasets. The `@json2csv` family replaced the older `json2csv` package. For ~200 rows max, the plain (non-streaming) version is correct. | MEDIUM |

### Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Ubuntu | 22.04 or 24.04 LTS | Server OS | Standard DigitalOcean VPS. LTS for stability. | HIGH |
| nginx | Latest from apt | Reverse proxy, SSL termination, static file serving | Sits in front of Node.js. Handles SSL (Let's Encrypt), serves the built frontend static files directly (faster than Express for static), proxies `/api/*` to Node. | HIGH |
| PM2 | ~5.x | Process manager | Keeps Node running, auto-restarts on crash, handles log rotation. Alternative: systemd unit file (also fine, but PM2 is simpler for single-app VPS). | HIGH (choice), MEDIUM (version) |
| Let's Encrypt / certbot | Latest | SSL certificate | Free, automated. The URL is `https://h.eino.us/theyellow/songscryer/` so SSL is required. | HIGH |
| SQLite | Bundled with better-sqlite3 | Database | Zero-config, file-based, backed up by copying one file. Perfect for 2 users. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cors | ~2.8.x | CORS middleware | Only if frontend is served from a different origin during development. In production, nginx serves both frontend and API from the same origin, so CORS is unnecessary. Include for dev convenience. |
| helmet | ~8.x | Security headers | Always. Adds sensible security headers (CSP, X-Frame-Options, etc.) with one line. |
| compression | ~1.7.x | gzip responses | Always. Reduces API response sizes. Negligible CPU cost at this scale. |

### Dev Tools

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| ESLint | ~9.x | Linting | Flat config format (eslint.config.js). Catches bugs early. |
| Prettier | ~3.x | Code formatting | Consistent style without debates. |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| React / Vue / Svelte / any frontend framework | Massive overkill. This app has one main view (card draw + form). Frameworks add bundle size, build complexity, and learning curve for zero benefit at this scale. The card animation is actually easier in vanilla CSS than in React (no virtual DOM diffing interfering with CSS transitions). |
| TypeScript | Controversial take, but: for a personal 2-user app with ~10 files, TypeScript adds build complexity without proportional safety benefit. The app is small enough to hold in your head. If this were a team project or growing codebase, TypeScript would be mandatory. |
| Prisma / Drizzle / any ORM | better-sqlite3 with raw SQL is simpler and faster for a single-table schema. The data model has one main table (submissions) with ~20 columns. An ORM adds abstraction for no gain. Write the 4 SQL queries directly. |
| Tailwind CSS | The medieval illuminated manuscript aesthetic requires custom CSS that Tailwind's utility classes would fight against. Custom properties + hand-written CSS is the right tool for a bespoke visual design. |
| Docker | One app, one VPS, one process. Docker adds complexity (image builds, container management, volume mounts for SQLite file) with no benefit. Just run Node directly via PM2. |
| WebSocket / Socket.io | No real-time features needed. Two users will never be on the app simultaneously. Standard HTTP request/response is correct. |
| MongoDB / PostgreSQL | SQLite is the right database. File-based, zero-config, backed up with `cp`. At 2 users and ~200 rows, any external database server is pure overhead. |
| Next.js / Nuxt / Remix / any meta-framework | These are for server-rendered React/Vue apps. This project does not use React or Vue. A meta-framework on top of no framework is nonsensical. |
| Passport.js / any auth library | Two known users, selected by name from a dropdown. Auth is a `<select>` element, not a library. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Frontend | Vanilla JS + CSS | Svelte | Svelte is lightweight but still adds a compiler step, component abstraction, and Svelte-specific patterns for an app that is fundamentally one page with animations |
| Backend | Express 4 | Fastify | Fastify is faster, but Express has simpler middleware patterns and this app will never see enough traffic for the performance difference to matter |
| Backend | Express 4 | Hono | Hono is excellent but newer, smaller ecosystem, and optimized for edge/serverless -- none of which apply here |
| SQLite lib | better-sqlite3 | sql.js (WASM) | sql.js runs SQLite in WASM, useful for browser-side SQLite. We have a real Node.js server, so native bindings via better-sqlite3 are faster and simpler |
| Dev server | Vite | None (plain HTTP server) | Viable -- the app could be developed with just a static file server. But Vite's HMR makes iterating on CSS animations and form flow noticeably faster. Low cost, real benefit. |
| Process mgr | PM2 | systemd | systemd is fine and has no extra dependency. PM2 is slightly easier for log viewing (`pm2 logs`) and has `pm2 startup` for boot persistence. Either works. |
| CSV export | @json2csv/plainjs | Manual CSV generation | For ~20 columns with free-text fields that may contain commas and quotes, a library handles escaping correctly. Rolling your own CSV serializer is a bug farm. |

## Project Structure

```
songscryer/
  frontend/
    index.html
    css/
      main.css
      animations.css      # Card shuffle, flip, reveal
      theme.css            # Medieval aesthetic (added last)
    js/
      app.js               # Entry point, routing
      cards.js             # Card data, draw logic
      animations.js        # Card animation orchestration
      form.js              # Adaptive form rendering
      api.js               # Backend API calls
    assets/
      (card art, fonts -- added with aesthetic phase)
  backend/
    server.js              # Express app, middleware
    db.js                  # SQLite setup, migrations
    routes/
      submissions.js       # CRUD for song submissions
      export.js            # CSV/JSON export endpoints
    data/
      songscryer.db            # SQLite database file
  vite.config.js           # Dev server config
  package.json
```

## Installation

```bash
# Initialize project
npm init -y

# Backend dependencies
npm install express better-sqlite3 helmet compression cors

# CSV export
npm install @json2csv/plainjs

# Dev dependencies
npm install -D vite eslint prettier

# Production (on VPS)
npm install -g pm2
```

## Key Configuration Notes

**Vite for vanilla JS:** Use `npx create-vite@latest frontend --template vanilla` or configure manually. Vite's dev server proxies API requests to Express during development:

```js
// vite.config.js
export default {
  root: 'frontend',
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: '../dist'
  }
}
```

**Express serves built frontend in production:**

```js
// In production, serve Vite's built output
app.use(express.static(path.join(__dirname, '../dist')));
```

**nginx proxies everything:**

```nginx
server {
    listen 443 ssl;
    server_name h.eino.us;

    location /theyellow/songscryer/ {
        proxy_pass http://127.0.0.1:3000/;
    }

    # Or serve static files directly from nginx for better performance:
    location /theyellow/songscryer/assets/ {
        alias /path/to/dist/assets/;
    }
}
```

**SQLite path:** Store the database file outside the project's git-tracked directory, or add `*.db` to `.gitignore`. Back up with a simple cron job: `cp songscryer.db songscryer.db.bak`.

## Version Verification Needed

The following versions should be verified with `npm view <package> version` before installation, as they are based on training data (May 2025 cutoff):

- Express: expected ~4.21.x (verify; Express 5 may have gone stable)
- better-sqlite3: expected ~11.x
- Vite: expected ~6.x (Vite 6 released late 2024)
- @json2csv/plainjs: expected ~7.x
- helmet: expected ~8.x
- PM2: expected ~5.x
- ESLint: expected ~9.x (flat config is the default)

## Sources

- Express.js official documentation (expressjs.com) -- HIGH confidence on Express 4 recommendation
- better-sqlite3 GitHub repository (JoshuaWise/better-sqlite3) -- HIGH confidence on synchronous API advantages
- Vite official documentation (vite.dev) -- HIGH confidence on vanilla JS template support
- CSS Transforms specification (W3C) -- HIGH confidence on card flip animation approach
- Node.js release schedule (nodejs.org/en/about/previous-releases) -- HIGH confidence on LTS recommendations
- Training data (May 2025) -- MEDIUM confidence on specific version numbers
