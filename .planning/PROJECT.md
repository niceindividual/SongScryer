# Music DNA — Song Submission App

## What This Is

A creative web app for a collaborative music project between two musicians (Matt and Mike). Instead of a standard form, users draw an animated virtual card that presents a unique prompt — inspired by Oblique Strategies — which shapes the tone of the questions while mapping all responses to a consistent underlying data structure. The collected "musical DNA" is exported for Claude analysis to identify overlapping tastes, guide song selection for covers, and eventually inform original composition.

## Core Value

Every submission, regardless of which card was drawn, produces clean, consistent data that can be aggregated and fed to Claude to reveal the musical common ground between two musicians.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Animated card draw experience (shuffle → flip → reveal prompt)
- [ ] Twenty-one prompt cards, each with distinct framing but consistent underlying data capture
- [ ] Adaptive question flow — tone/structure shifts slightly per card, data output stays identical
- [ ] Full song data capture per submission (see data fields below)
- [ ] Multiple submissions per session (draw again after submitting)
- [ ] Light backend with SQLite persistence (Node.js on DigitalOcean VPS)
- [ ] Identity selection (Matt or Mike) — no login required, simple selector
- [ ] Export to JSON and CSV for Google Sheets or direct Claude input
- [ ] Medieval illuminated manuscript aesthetic — parchment cards, warm earthy tones, symbolic figures, vines, instruments, cables, pedals — built after functional core

### Out of Scope

- Full authentication/login system — two known users, simple name selector is sufficient
- Real-time collaboration features — not needed for this use case
- Mobile-native app — browser-based is sufficient
- Scaling beyond ~4 users — intentionally small, personal tool
- Automated Claude analysis pipeline (v1 exports to file; manual Claude feed is fine for now)

## Context

**The twenty-one prompt cards:**
1. A song that defined a specific period of my life
2. A song I'd play for someone to explain who I am
3. A song that surprised me — I didn't expect to love it but I do
4. A song I wish I'd written
5. A song connected to a vivid memory
6. A song that captures the mood I most want to create when I play
7. A wildcard — a song I love that wouldn't normally show up on a list like this
8. A song I return to when everything feels heavy
9. A song that makes my body move before my mind catches up
10. A song I know every note of by heart
11. A song that changed what I thought was possible in music
12. A song I'd want played at my funeral
13. A song that belongs to a specific place in the world
14. A song I love more to play than to listen to
15. A song that sounds better in a car, at night, at volume
16. A song someone gave me that became mine
17. A song with a detail I noticed years later that changed everything
18. A song I'd use to introduce our sound to a stranger
19. A song I'd play to get in the zone before performing
20. A song whose structure I've been trying to understand for years
21. A song from a genre I don't usually love

**Data captured per submission:**
- Submitter (Matt or Mike)
- Prompt card drawn
- Song title and artist
- Why this song / what it means (free text)
- Primary hook: melody / groove+rhythm / lyrics / chord progression / texture+production / energy+feel / arrangement / indefinable (pick up to 2)
- Whether lyrics matter: central / somewhat / not really
- Standout instrument or sonic element (short text)
- Emotional quality (short text — e.g. melancholy, joyful, driving)
- Energy level (1–5 scale)
- How much they love it (1–5 scale)
- Performance feasibility: yes as-is / yes with adaptation / probably not but the feel is the point / not sure
- Performance desire: definitely / maybe / no
- Notes on performing it (optional free text)
- Key or tonal center (optional)
- Tempo feel: slow / mid / uptempo / variable
- Approximate BPM (optional)
- Time signature: 4/4 / 3/4 / 6/8 / odd meter / not sure
- Any other notes (optional free text)

**Instrument context (informs performance feasibility questions):**
Both musicians play acoustic and electric guitar, ukulele, electric bass, piano, tin whistle, synth/keys. Matt plays flute (prefers on or below the staff) and autoharp. Mike plays hammered dulcimer. Shared: harmonicas (C and G blues harps), ocarinas (including dual-chambered G), children's glockenspiel, slightly off-key toy piano, otamatone.

**Hosting:** DigitalOcean VPS, Ubuntu, full control — can run Node.js, SQLite, any stack needed.

**URL:** https://h.eino.us/theyellow/songscryer/

## Constraints

- **Stack**: Browser-based frontend (HTML/CSS/JS); Node.js backend; SQLite for persistence
- **Scale**: Personal tool, ~2 users, max ~4 — no need to engineer for scale
- **Usage**: Free personal tool; keep infrastructure minimal and cheap to run
- **Aesthetic**: Medieval illuminated manuscript style (warm parchment, not dark) — planned for end of development after functional core is solid

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SQLite over Postgres | 2–4 users, no concurrency concerns, zero ops overhead | — Pending |
| No login system | Identity via simple name selector (Matt/Mike) — login adds friction for no benefit at this scale | — Pending |
| Card draw is mandatory | Every submission is framed by a card — preserves the Oblique Strategies spirit | — Pending |
| Aesthetics deferred | Functional core first; illuminated manuscript visuals added at end to avoid burning Claude usage on aesthetics before data model is solid | — Pending |

---
*Last updated: 2026-03-01 after initialization*
