// questions.js — question definition array, tone copy map, and copy helper
// Pure ESM module: no DOM imports, no side effects at module level.

/**
 * QUESTIONS — ordered array of all 17 form field definitions.
 * key names match server/routes/submissions.js REQUIRED_FIELDS exactly.
 */
export const QUESTIONS = [
  {
    key: 'song_title',
    type: 'text',
    required: true,
    defaultLabel: 'Song title',
    defaultPlaceholder: 'e.g. Blackbird',
  },
  {
    key: 'artist',
    type: 'text',
    required: true,
    defaultLabel: 'Artist or band',
    defaultPlaceholder: 'e.g. The Beatles',
  },
  {
    key: 'why_this_song',
    type: 'textarea',
    required: true,
    defaultLabel: 'Why this song?',
    defaultPlaceholder: 'What does it mean to you? Why now?',
  },
  {
    key: 'primary_hooks',
    type: 'multi-select',
    required: true,
    max: 2,
    defaultLabel: 'What hooks you? (pick up to 2)',
    options: [
      { value: 'melody', label: 'Melody' },
      { value: 'groove_rhythm', label: 'Groove / rhythm' },
      { value: 'lyrics', label: 'Lyrics' },
      { value: 'chord_progression', label: 'Chord progression' },
      { value: 'texture_production', label: 'Texture / production' },
      { value: 'energy_feel', label: 'Energy / feel' },
      { value: 'arrangement', label: 'Arrangement' },
      { value: 'indefinable', label: 'Indefinable' },
    ],
  },
  {
    key: 'lyrics_matter',
    type: 'choice',
    required: true,
    defaultLabel: 'Do lyrics matter to you in this song?',
    options: [
      { value: 'central', label: 'Central — the song lives in the words' },
      { value: 'somewhat', label: "Somewhat — they matter but aren't the whole point" },
      { value: 'not_really', label: "Not really — it's all about the sound" },
    ],
  },
  {
    key: 'standout_element',
    type: 'text',
    required: false,
    defaultLabel: 'Standout instrument or sonic element (optional)',
    defaultPlaceholder: 'e.g. the guitar tone, that snare, the string arrangement',
  },
  {
    key: 'emotional_quality',
    type: 'text',
    required: false,
    defaultLabel: 'Emotional quality in one word (optional)',
    defaultPlaceholder: 'e.g. melancholy, driving, joyful',
  },
  {
    key: 'energy_level',
    type: 'rating',
    required: true,
    max: 5,
    defaultLabel: 'Energy level',
    lowLabel: 'Low',
    highLabel: 'High',
  },
  {
    key: 'love_level',
    type: 'rating',
    required: true,
    max: 5,
    defaultLabel: 'How much do you love this song?',
    lowLabel: 'Like it',
    highLabel: 'Obsessed',
  },
  {
    key: 'feasibility',
    type: 'choice',
    required: true,
    defaultLabel: 'Could we perform this?',
    options: [
      { value: 'yes_as_is', label: 'Yes, as-is' },
      { value: 'yes_adapted', label: 'Yes, with adaptation' },
      { value: 'probably_not', label: 'Probably not, but the feel is the point' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    key: 'performance_desire',
    type: 'choice',
    required: true,
    defaultLabel: 'Do you want to perform it?',
    options: [
      { value: 'definitely', label: 'Definitely' },
      { value: 'maybe', label: 'Maybe' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    key: 'performance_notes',
    type: 'textarea',
    required: false,
    defaultLabel: 'Notes on performing it (optional)',
    defaultPlaceholder: 'How would you approach it? What would need to change?',
  },
  {
    key: 'key_or_tonal_center',
    type: 'text',
    required: false,
    defaultLabel: 'Key or tonal center (optional)',
    defaultPlaceholder: 'e.g. D minor, Mixolydian, not sure',
  },
  {
    key: 'tempo_feel',
    type: 'choice',
    required: true,
    defaultLabel: 'Tempo feel',
    options: [
      { value: 'slow', label: 'Slow' },
      { value: 'mid', label: 'Mid' },
      { value: 'uptempo', label: 'Uptempo' },
      { value: 'variable', label: 'Variable' },
    ],
  },
  {
    key: 'approximate_bpm',
    type: 'number',
    required: false,
    defaultLabel: 'Approximate BPM (optional)',
    defaultPlaceholder: 'e.g. 120',
  },
  {
    key: 'time_signature',
    type: 'choice',
    required: true,
    defaultLabel: 'Time signature',
    options: [
      { value: '4/4', label: '4/4' },
      { value: '3/4', label: '3/4' },
      { value: '6/8', label: '6/8' },
      { value: 'odd', label: 'Odd meter' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    key: 'other_notes',
    type: 'textarea',
    required: false,
    defaultLabel: 'Anything else? (optional)',
    defaultPlaceholder: 'Any other thoughts about this song?',
  },
];

/**
 * TONE_LABELS — per-tone overrides for label and/or placeholder copy.
 * Only overrides existing field keys — never adds new fields.
 * Tones: reflective | energetic | nostalgic | introspective | playful | provocative
 */
export const TONE_LABELS = {
  reflective: {
    why_this_song: {
      label: 'What does this song reflect back at you?',
      placeholder: 'What do you hear when you really listen?',
    },
    emotional_quality: {
      label: 'The feeling it captures (optional)',
      placeholder: 'e.g. wistful, searching, resolved',
    },
  },
  energetic: {
    why_this_song: {
      label: 'What makes this song move you?',
      placeholder: 'What drives it? What do you feel in your body?',
    },
    energy_level: {
      label: 'How much does it move you?',
    },
  },
  nostalgic: {
    why_this_song: {
      label: 'What does this song take you back to?',
      placeholder: 'A place, a person, a time in your life?',
    },
    emotional_quality: {
      label: 'The feeling of that time (optional)',
      placeholder: 'e.g. bittersweet, aching, warm',
    },
  },
  introspective: {
    why_this_song: {
      label: 'What does this song make you think about?',
      placeholder: 'What question does it ask, or what does it answer?',
    },
  },
  playful: {
    why_this_song: {
      label: 'What makes this song irresistible?',
      placeholder: "Why can't you not like it?",
    },
  },
  provocative: {
    why_this_song: {
      label: 'What does this song dare you to feel?',
      placeholder: 'What boundary does it push for you?',
    },
  },
};

/**
 * getQuestionCopy(question, tone): Returns effective { label, placeholder } for
 * a question given the current card's tone. Merges tone overrides over defaults.
 */
export function getQuestionCopy(question, tone) {
  const override = TONE_LABELS[tone]?.[question.key] ?? {};
  return {
    label: override.label ?? question.defaultLabel,
    placeholder: override.placeholder ?? question.defaultPlaceholder ?? '',
  };
}
