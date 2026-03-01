-- Migration 001: Initial schema

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
