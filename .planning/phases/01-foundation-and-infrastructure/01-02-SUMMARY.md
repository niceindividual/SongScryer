# Plan 01-02 Execution Summary

**Plan:** 01-02 — VPS deployment: nginx reverse proxy, PM2 process management, production verification
**Phase:** 01-foundation-and-infrastructure
**Executed:** 2026-03-01
**Status:** COMPLETE

## What Was Built

### Task 1: Deployment script and nginx reference config

- `deploy.sh` — builds frontend locally, pushes to GitHub, SSHes to VPS for git pull + pm2 restart
- `nginx/songscryer.conf` — location block with `proxy_pass http://127.0.0.1:3000/` (trailing slash strips subpath prefix)

### Task 2: Production verification (human checkpoint)

Production URL verified working by user.

## Issues Encountered and Fixed

1. **`/*splat` doesn't match root `/` in Express 5** — path-to-regexp v8 treats `*` as one-or-more, so bare `/` fell through to Express's default 404 ("Cannot GET /"). Fixed by changing to `/{*splat}` (optional wildcard).

2. **`vite` not found on VPS** — Vite was in `devDependencies`, skipped by `npm install --omit=dev`. Fixed by moving `vite` and `concurrently` to regular `dependencies`.

## Production Verification Results

| Check | Result |
|-------|--------|
| `https://h.eino.us/theyellow/songscryer/` loads frontend | PASS |
| Static assets (JS, CSS) load without 404s | PASS |
| API accessible at production URL | PASS |
| PM2 managing process | PASS |

## Requirements Satisfied

- **INFRA-01**: App deployed at `https://h.eino.us/theyellow/songscryer/` with HTTPS and correct subpath routing ✓
- **INFRA-02**: SQLite database with migration tooling deployed ✓
- **INFRA-03**: PM2 configured with auto-restart and log rotation ✓
- **INFRA-04**: Deferred per user decision (no off-server backup account)
