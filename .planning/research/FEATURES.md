# Feature Landscape

**Domain:** Creative music data collection app with card-draw mechanic
**Researched:** 2026-03-01
**Confidence:** MEDIUM (training data, no web verification available)

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Card draw animation (shuffle, flip, reveal) | Core mechanic — this IS the experience. A static card assignment would kill the magic. | Medium | CSS/JS animation: shuffle wobble, flip with 3D transform, reveal with text fade-in. Keep under 3 seconds total. |
| One-question-at-a-time flow | Card-framed submissions feel like conversations, not spreadsheets. Multi-question pages kill the intimacy. | Low | Each field appears after previous is answered or skipped. Progressive disclosure. |
| Identity selector (Matt / Mike) | Must know who submitted. No login needed at this scale. | Low | Persistent via localStorage after first selection. Show current identity in header with ability to switch. |
| All 21 prompt cards available | The full Oblique Strategies deck is the product. Partial deck = incomplete tool. | Low | Card data is static config. Render from JSON/array. |
| Required vs optional field clarity | Users must know what they can skip. Ambiguity causes frustration or abandonment. | Low | Visual distinction (subtle asterisk or "optional" label). Song title, artist, and "why this song" are required; technical fields are optional. |
| Submit confirmation with clear feedback | Users need to know their submission was saved. Especially important with no account system. | Low | Success state with the card shown, brief summary of what was captured, and "draw another" prompt. |
| Draw again after submission | Multiple submissions per session is a core requirement. Flow must feel natural, not like starting over. | Low | Post-submit screen offers "draw another card" with a fresh shuffle animation. |
| Data persistence (SQLite) | Submissions must survive server restarts and browser closes. | Low | SQLite via better-sqlite3. Simple schema, one submissions table with JSON for array fields (hooks). |
| Basic data export (JSON + CSV) | Data must get out of the app. Without export, the whole point (Claude analysis) fails. | Medium | Admin-only export endpoint. JSON for Claude input, CSV for Google Sheets. |
| Mobile-responsive layout | Both users will likely submit from phones at some point (inspiration strikes anywhere). | Medium | Card and form must work on 320px+ screens. Touch-friendly inputs. |

## Differentiators

Features that set this product apart. Not expected, but create delight or significantly improve utility.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Adaptive question tone per card | The same data fields feel different depending on which card was drawn. "A song connected to a vivid memory" prompts differently than "A song that makes my body move." The question text shifts; the data schema stays identical. | Medium | Map each of 21 cards to a tone/voice variant for key questions. Store as card metadata. E.g., "why this song" becomes "What memory does this pull up?" vs "What makes your body respond to this?" |
| Card history / deck tracking | Show which cards each person has drawn. Creates completionism pull ("I've done 14 of 21") and prevents accidental duplicates. | Low | Query submissions by user, show drawn/undrawn cards. Optional: let users pick a specific undrawn card instead of random draw. |
| Submission review / browse | Let users see their own past submissions (and optionally each other's). Builds the feeling of a growing collection. | Medium | Read-only view of past submissions, filterable by person and card. Simple list or card-gallery layout. |
| Structured export with Claude-ready formatting | Export that is not just raw CSV but pre-formatted for Claude analysis: includes instructions, schema description, and organized data. | Medium | Generate a text/markdown export with a preamble explaining the data structure, what each field means, and suggested analysis prompts. Huge time-saver over manual paste. |
| Export filtered by submitter | "Show me just Matt's submissions" or "show me overlapping songs" — pre-filtered exports for targeted analysis. | Low | Query params on export endpoint: ?submitter=matt, ?submitter=all. |
| Session memory (card drawn but not yet submitted) | If the browser closes mid-submission, the drawn card and partial answers are preserved. | Medium | localStorage save on each field change. Restore on page load. Clear on successful submit. |
| Comparison / overlap view | Show songs both users submitted, or where their data overlaps (same artist, similar emotional qualities, same hooks). | High | Requires text matching and fuzzy comparison. Better suited for Claude analysis than in-app logic. Consider deferring to export. |
| Sound/haptic feedback on card draw | Subtle audio cue (card shuffle sound, parchment rustle) or phone vibration on draw. Deepens the tactile feel. | Low | Short audio sprite, Vibration API for mobile. Optional, off by default, togglable. |
| "Surprise me" vs "Choose a card" toggle | Sometimes you want the random draw; sometimes you know exactly which prompt you want to answer. | Low | Default to random draw. Small "or pick a card" link that shows the remaining deck as a grid. |
| Timestamp and submission ordering | Know when each submission was made. Useful for tracking how tastes evolve or for ordering in analysis. | Low | Auto-capture created_at on submit. Include in export. |

## Anti-Features

Features to explicitly NOT build. These would add complexity without serving the core mission.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts / authentication | Two known users. Login friction destroys the "grab phone, draw a card" impulse. Password resets, sessions, security — all overhead for zero benefit. | Simple name selector (Matt/Mike) with localStorage persistence. |
| In-app AI analysis | Tempting to pipe submissions directly to Claude API from the app. But it couples the tool to an API, adds cost, requires prompt engineering in-app, and limits analysis flexibility. | Export clean data; run Claude analysis manually or via a separate script. Keep this app focused on collection. |
| Real-time collaboration / live sync | No scenario where both users need to see each other's submissions appear in real-time. This isn't a chat app. | Refresh to see new data. Or add a simple "last updated" indicator. |
| Complex form validation | Over-validating creative text inputs (character limits, format checking on song titles) kills the creative flow. | Validate only truly required fields (song title not empty, artist not empty). Let free text be free. |
| Drag-and-drop card reordering | The deck order doesn't matter. Cards are drawn randomly. Adding drag-and-drop complexity serves no purpose. | Fixed deck, random draw. Optional pick-from-remaining for targeted use. |
| Song metadata auto-lookup (Spotify/MusicBrainz API) | Adds API dependency, rate limits, and complexity. Users know their songs — they don't need autofill. Also risks wrong matches for obscure tracks. | Let users type freely. Consistent data structure matters more than normalized metadata. |
| Multi-language support | Two users, both English speakers. i18n infrastructure would be pure waste. | English only. Hardcode all strings. |
| Offline/PWA mode | Both users have reliable internet. The backend needs to receive submissions. Offline adds sync complexity for no real benefit. | Online-only. localStorage for session recovery is sufficient. |
| Analytics / usage tracking | No need to track page views, conversion funnels, or engagement metrics for a 2-person tool. | If curious, check server logs. |
| Undo/edit submissions | Once submitted, the data should be stable. Allowing edits complicates the data integrity story and the "moment of submission" feeling. | If a mistake is made, submit again with the same card (or fix directly in the database — it's SQLite, trivial to update). |

## Feature Dependencies

```
Identity Selector ─────────────────────────────────┐
                                                    v
Card Draw Animation ──> Prompt Display ──> Adaptive Question Flow ──> Form Fields ──> Submit ──> Confirmation
                                                                                        │
                                                                              Data Persistence (SQLite)
                                                                                        │
                                                                                   Data Export
                                                                                   (JSON/CSV)
                                                                                        │
                                                                              Claude-Ready Export
                                                                              (structured markdown)

Card History / Deck Tracking ──> requires: Data Persistence + Identity
Submission Review / Browse ──> requires: Data Persistence + Identity
Session Recovery ──> requires: Card Draw + Form Fields (localStorage layer)
"Choose a Card" mode ──> requires: Card History (to show remaining)
Export Filtering ──> requires: Data Export + Identity
```

**Critical path:** Identity Selector -> Card Draw -> Adaptive Questions -> Form -> Persistence -> Export. Everything else branches off this spine.

## MVP Recommendation

### Phase 1: Core Loop (build first)
1. **Identity selector** (Matt/Mike) — gate everything behind this
2. **Card draw animation** — shuffle, flip, reveal. This is the soul of the app.
3. **Adaptive question flow** — all 21 cards with tone-shifted questions mapping to identical data schema
4. **Form with all data fields** — required/optional clearly marked, one-at-a-time progressive disclosure
5. **SQLite persistence** — save submissions with all fields + timestamp
6. **Submit confirmation + draw again** — complete the loop

### Phase 2: Data Out (build second)
7. **JSON + CSV export** — basic export endpoints, admin-only
8. **Claude-ready structured export** — markdown with schema description and analysis prompts
9. **Export filtering by submitter** — query param filtering

### Phase 3: Collection Experience (build third)
10. **Card history / deck tracking** — which cards drawn, completionism indicator
11. **Submission review / browse** — see past submissions in a card gallery
12. **"Choose a card" mode** — pick from remaining undrawn cards

### Defer Indefinitely
- **Comparison/overlap view** — let Claude do this from exported data
- **Sound/haptic feedback** — nice-to-have, add if the aesthetic phase calls for it
- **Session recovery** — add only if mid-submission abandonment becomes a real problem

## Data Export Quality Notes

Since the downstream consumer is Google Sheets and Claude, export quality is critical.

**For Google Sheets compatibility:**
- CSV with proper escaping (quoted fields containing commas, newlines in free text)
- Header row matching field names exactly
- Array fields (hooks: pick up to 2) serialized as pipe-delimited within a single cell (e.g., "melody|groove+rhythm") rather than separate columns — keeps the schema flat
- Consistent date format (ISO 8601)
- UTF-8 encoding with BOM for Excel compatibility

**For Claude analysis quality:**
- JSON export with full schema: each submission as a complete object, no abbreviations
- Include a `_metadata` block describing what each field means, valid values, and the prompt card text
- Group submissions by submitter for easy comparative analysis
- Include the prompt card's full text alongside each submission (not just the card number) so Claude has context without needing a separate lookup
- Consider a "Claude prompt" export: a single markdown file that includes the data AND suggested analysis questions ("Find overlapping musical values between Matt and Mike", "Identify songs both would enjoy performing", "Suggest original song characteristics based on shared preferences")

**For data consistency across different prompts:**
- The adaptive question tone is a presentation layer concern ONLY. The stored data schema must be identical regardless of which card was drawn.
- Validate at the API level, not just the frontend: the server should enforce the schema regardless of what the client sends.
- Enum fields (hooks, lyrics_matter, tempo_feel, time_signature, feasibility, desire) should be stored as exact string values, not display text. Map display text to enum values in the frontend.

## Sources

- Training data knowledge of survey/form UX patterns (MEDIUM confidence)
- Training data knowledge of Oblique Strategies apps and card-based digital interfaces (MEDIUM confidence)
- Training data knowledge of CSV/JSON export best practices (HIGH confidence — well-established patterns)
- No web verification was possible during this research session

*Note: Web search was unavailable during research. Findings are based on training data knowledge of form/survey UX, card-based interfaces, and data export patterns. Confidence is MEDIUM overall — these are well-established domains but specific competitor analysis could not be performed.*
