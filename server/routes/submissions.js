import { Router } from 'express';

const REQUIRED_FIELDS = [
  'submitter', 'card_id', 'song_title', 'artist', 'why_this_song',
  'primary_hooks', 'lyrics_matter', 'energy_level', 'love_level',
  'feasibility', 'performance_desire', 'tempo_feel', 'time_signature'
];

export function submissionsRouter(db) {
  const router = Router();

  router.post('/submissions', async (req, res) => {
    const body = req.body;

    // Validate required fields
    const missing = REQUIRED_FIELDS.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Missing required fields', fields: missing });
    }

    const stmt = db.prepare(`
      INSERT INTO submissions (
        submitter, card_id, song_title, artist,
        why_this_song, standout_element, emotional_quality,
        performance_notes, other_notes,
        primary_hooks, lyrics_matter, energy_level, love_level,
        feasibility, performance_desire, tempo_feel, time_signature,
        key_or_tonal_center, approximate_bpm,
        submitted_raw
      ) VALUES (
        @submitter, @card_id, @song_title, @artist,
        @why_this_song, @standout_element, @emotional_quality,
        @performance_notes, @other_notes,
        @primary_hooks, @lyrics_matter, @energy_level, @love_level,
        @feasibility, @performance_desire, @tempo_feel, @time_signature,
        @key_or_tonal_center, @approximate_bpm,
        @submitted_raw
      )
    `);

    const result = stmt.run({
      submitter: body.submitter,
      card_id: body.card_id,
      song_title: body.song_title,
      artist: body.artist,
      why_this_song: body.why_this_song,
      standout_element: body.standout_element || null,
      emotional_quality: body.emotional_quality || null,
      performance_notes: body.performance_notes || null,
      other_notes: body.other_notes || null,
      primary_hooks: typeof body.primary_hooks === 'string'
        ? body.primary_hooks
        : JSON.stringify(body.primary_hooks),
      lyrics_matter: body.lyrics_matter,
      energy_level: body.energy_level,
      love_level: body.love_level,
      feasibility: body.feasibility,
      performance_desire: body.performance_desire,
      tempo_feel: body.tempo_feel,
      time_signature: body.time_signature,
      key_or_tonal_center: body.key_or_tonal_center || null,
      approximate_bpm: body.approximate_bpm || null,
      submitted_raw: JSON.stringify(body)
    });

    const created = db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  });

  router.get('/submissions', async (req, res) => {
    const submissions = db.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();
    res.json(submissions);
  });

  return router;
}
