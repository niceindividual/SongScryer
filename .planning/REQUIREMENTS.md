# Requirements: Music DNA -- Song Submission App

**Defined:** 2026-03-01
**Core Value:** Every submission, regardless of which card was drawn, produces clean, consistent data that can be aggregated and fed to Claude to reveal the musical common ground between two musicians.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: App is deployed and accessible at `https://h.eino.us/theyellow/songscryer/` with HTTPS and correct subpath routing for all assets and API calls
- [ ] **INFRA-02**: SQLite database stores all submissions with migration tooling in place from the first deploy
- [ ] **INFRA-03**: Node.js server runs via PM2 with auto-restart on boot and log rotation configured
- [ ] **INFRA-04**: Automated database backups are scheduled via cron and stored off-server

### Identity

- [ ] **IDNT-01**: User can select their identity (Matt or Mike) before starting a session
- [ ] **IDNT-02**: Identity selection persists across page refreshes via localStorage so users don't re-select every visit

### Card Draw

- [ ] **CARD-01**: User sees an animated card shuffle when initiating a draw (under 3 seconds total sequence)
- [ ] **CARD-02**: User sees an animated card flip that reveals the prompt text
- [ ] **CARD-03**: Drawn card displays the full prompt text prominently
- [ ] **CARD-04**: Card is selected using deck-style shuffle (each card appears roughly equally across sessions, not pure random)
- [ ] **CARD-05**: User can draw another card immediately after submitting a song

### Form

- [ ] **FORM-01**: Form presents questions one at a time (progressive disclosure -- conversational feel, not a spreadsheet)
- [ ] **FORM-02**: Question text and placeholder copy adapts tone/framing based on which card was drawn
- [ ] **FORM-03**: All 21 cards produce identical underlying data fields -- adaptive framing is presentation-layer only, never schema-level
- [ ] **FORM-04**: User can enter song title and artist name
- [ ] **FORM-05**: User can write why this song matters / what it means (free text)
- [ ] **FORM-06**: User can select up to 2 primary hooks from: melody / groove+rhythm / lyrics / chord progression / texture+production / energy+feel / arrangement / indefinable
- [ ] **FORM-07**: User can select whether lyrics matter: central / somewhat / not really
- [ ] **FORM-08**: User can enter a standout instrument or sonic element (short text)
- [ ] **FORM-09**: User can enter an emotional quality descriptor (short text, e.g. melancholy, joyful, driving)
- [ ] **FORM-10**: User can rate energy level on a 1-5 scale
- [ ] **FORM-11**: User can rate how much they love the song on a 1-5 scale
- [ ] **FORM-12**: User can select performance feasibility: yes as-is / yes with adaptation / probably not but the feel is the point / not sure
- [ ] **FORM-13**: User can select performance desire: definitely / maybe / no
- [ ] **FORM-14**: User can add optional notes on how they'd approach performing the song
- [ ] **FORM-15**: User can enter optional key or tonal center
- [ ] **FORM-16**: User can select tempo feel: slow / mid / uptempo / variable
- [ ] **FORM-17**: User can enter optional approximate BPM
- [ ] **FORM-18**: User can select time signature: 4/4 / 3/4 / 6/8 / odd meter / not sure
- [ ] **FORM-19**: User can add any other optional notes (free text)
- [ ] **FORM-20**: Required vs optional fields are visually distinct throughout the form

### Submission

- [ ] **SUBM-01**: User receives clear confirmation after a successful submission
- [ ] **SUBM-02**: Submission is persisted to SQLite immediately on submit; server validates schema before accepting
- [ ] **SUBM-03**: User can draw another card immediately after submission (draw-again flow)

### Export

- [ ] **EXPRT-01**: User can download all submissions as a JSON file with a `_metadata` block and denormalized card prompt text per submission
- [ ] **EXPRT-02**: User can download all submissions as a CSV file compatible with Google Sheets (proper escaping, pipe-delimited multi-select fields, UTF-8 with BOM)
- [ ] **EXPRT-03**: User can download a Claude-ready markdown export that includes schema description, field explanations, and suggested analysis prompts
- [ ] **EXPRT-04**: All export formats support filtering by submitter (Matt-only, Mike-only, or all)

### Collection

- [ ] **COLL-01**: User can see which of the 21 cards they have already drawn (card history per submitter)
- [ ] **COLL-02**: Card history displays a completionism indicator (e.g. 7/21 cards drawn)
- [ ] **COLL-03**: User can browse their past submissions in a read-only gallery view
- [ ] **COLL-04**: Submission gallery is filterable by submitter (Matt / Mike / all)

### Aesthetic

- [ ] **AEST-01**: App has a medieval illuminated manuscript visual style -- warm parchment tones, earthy palette, not dark
- [ ] **AEST-02**: Card faces feature manuscript-inspired imagery (vines, instruments, cables, pedals, symbolic figures)
- [ ] **AEST-03**: Typography and decorative borders evoke the feeling of a medieval manuscript throughout the app

## v2 Requirements

### Collection

- **COLL-V2-01**: User can choose a specific card from the remaining undrawn cards instead of random draw
- **COLL-V2-02**: Deck resets and reshuffles after all 21 cards have been drawn once

### Export / Analysis

- **EXPRT-V2-01**: Automated Claude analysis pipeline -- submissions feed directly to Claude API without manual export step

### Sharing

- **SHAR-V2-01**: Shareable export URL that generates a snapshot link for sending to collaborators

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full authentication / login system | Simple name selector is sufficient for 2 known users; login adds friction with no benefit |
| Real-time collaboration features | Not needed -- both users collect independently, analysis happens after |
| Mobile-native app | Browser-based is sufficient; responsive design is acceptable but not native |
| In-app Claude integration | Couples the tool to Claude API; clean file export is more flexible and simpler |
| Song metadata auto-lookup (Spotify, MusicBrainz) | Adds API complexity; manual entry keeps the tool focused and private |
| In-app comparison / overlap analysis | Let Claude do this from the exported data -- it's better at it |
| Scaling beyond ~4 users | Intentionally personal tool; engineering for scale would add unnecessary complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| IDNT-01 | Phase 2 | Pending |
| IDNT-02 | Phase 2 | Pending |
| CARD-01 | Phase 3 | Pending |
| CARD-02 | Phase 3 | Pending |
| CARD-03 | Phase 3 | Pending |
| CARD-04 | Phase 3 | Pending |
| CARD-05 | Phase 3 | Pending |
| FORM-01 | Phase 2 | Pending |
| FORM-02 | Phase 2 | Pending |
| FORM-03 | Phase 2 | Pending |
| FORM-04 | Phase 2 | Pending |
| FORM-05 | Phase 2 | Pending |
| FORM-06 | Phase 2 | Pending |
| FORM-07 | Phase 2 | Pending |
| FORM-08 | Phase 2 | Pending |
| FORM-09 | Phase 2 | Pending |
| FORM-10 | Phase 2 | Pending |
| FORM-11 | Phase 2 | Pending |
| FORM-12 | Phase 2 | Pending |
| FORM-13 | Phase 2 | Pending |
| FORM-14 | Phase 2 | Pending |
| FORM-15 | Phase 2 | Pending |
| FORM-16 | Phase 2 | Pending |
| FORM-17 | Phase 2 | Pending |
| FORM-18 | Phase 2 | Pending |
| FORM-19 | Phase 2 | Pending |
| FORM-20 | Phase 2 | Pending |
| SUBM-01 | Phase 2 | Pending |
| SUBM-02 | Phase 2 | Pending |
| SUBM-03 | Phase 2 | Pending |
| EXPRT-01 | Phase 4 | Pending |
| EXPRT-02 | Phase 4 | Pending |
| EXPRT-03 | Phase 4 | Pending |
| EXPRT-04 | Phase 4 | Pending |
| COLL-01 | Phase 5 | Pending |
| COLL-02 | Phase 5 | Pending |
| COLL-03 | Phase 5 | Pending |
| COLL-04 | Phase 5 | Pending |
| AEST-01 | Phase 6 | Pending |
| AEST-02 | Phase 6 | Pending |
| AEST-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
