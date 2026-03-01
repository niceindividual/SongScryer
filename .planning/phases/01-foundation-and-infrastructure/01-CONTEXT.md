# Phase 1: Foundation and Infrastructure - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the server, database, and subpath routing so everything downstream has a working production environment. Delivers: working SQLite schema with migrations, Express server deployed at `https://h.eino.us/theyellow/songer/`, PM2 running, HTTPS live, and the 21 card definitions seeded as data. The app does not need to do anything visible yet — this phase is about the foundation all other phases build on.

</domain>

<decisions>
## Implementation Decisions

### Dev workflow
- Develop locally on Mac, deploy to VPS via git push + pull on server
- Local: Vite dev server for frontend (hot reload) + local Node/Express for API
- Local dev uses a separate local SQLite database — never points at VPS production data
- Production: Vite build output served as static files from Express via nginx reverse proxy

### Deployment
- Code lives in a GitHub repo; deploy by SSHing into VPS and running `git pull` + `pm2 restart`
- No CI/CD for now — manual deploy is fine for a 2-user personal project

### Backups
- Deferred — not implementing automated backups in this phase
- Will add later without touching core architecture

### Claude's Discretion
- Exact nginx config and SSL setup (Let's Encrypt via certbot)
- PM2 ecosystem config details
- Node.js version choice (22 LTS recommended per research)
- SQLite schema design and column types — use research recommendations (flat schema, JSON TEXT for multi-select, enum codes not display strings, `submitted_at` timestamp, `submitted_raw` JSON insurance column)
- Card data structure — JSON file in project, consumed by Phase 2; research recommends storing card ID (not text) in submissions table
- Migration tooling choice (e.g. `better-sqlite3-helper` or manual migration scripts)
- Directory structure on VPS

</decisions>

<specifics>
## Specific Ideas

- Production URL is `https://h.eino.us/theyellow/songer/` — subpath routing must be correct from day one (assets and API URLs all break otherwise)
- The VPS is a DigitalOcean droplet running Ubuntu, full root access

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- None yet — this phase establishes them

### Integration Points
- All subsequent phases build on the Express server and SQLite schema created here
- Phase 2 consumes the card definitions JSON file seeded in this phase

</code_context>

<deferred>
## Deferred Ideas

- Automated off-server backups (S3/B2) — user wants to add later, no account set up yet
- GitHub Actions CI/CD — overkill for now, can add later if manual deploys become tedious

</deferred>

---

*Phase: 01-foundation-and-infrastructure*
*Context gathered: 2026-03-01*
