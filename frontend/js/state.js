// state.js — centralized state machine for SongScryer
// Pure ESM module: no DOM imports, no side effects at module level.
// All transition functions return new state objects — never mutate state in place.

const STORAGE_KEY = 'songscryer_user';

/**
 * createInitialState(): Returns the baseline application state.
 * Screen union: 'identity' | 'card' | 'form' | 'confirmation'
 */
export function createInitialState() {
  return {
    screen: 'identity',
    user: null,
    card: null,
    answers: {},
    questionIndex: 0,
    lastSubmission: null,
    error: null,
  };
}

/**
 * selectUser(state, user): Persist identity to localStorage and advance to card screen.
 */
export function selectUser(state, user) {
  localStorage.setItem(STORAGE_KEY, user);
  return { ...state, user, screen: 'card' };
}

/**
 * drawCard(state, cards): Pick a random card from the cards array, advance to form screen.
 * Resets questionIndex and answers so a fresh draw starts clean.
 */
export function drawCard(state, cards) {
  const card = cards[Math.floor(Math.random() * cards.length)];
  return { ...state, card, screen: 'form', questionIndex: 0, answers: {} };
}

/**
 * answerQuestion(state, fieldKey, value): Record an answer and advance the question index.
 */
export function answerQuestion(state, fieldKey, value) {
  return {
    ...state,
    answers: { ...state.answers, [fieldKey]: value },
    questionIndex: state.questionIndex + 1,
  };
}

/**
 * submissionSucceeded(state, songTitle): Advance to confirmation screen after successful POST.
 */
export function submissionSucceeded(state, songTitle) {
  return {
    ...state,
    screen: 'confirmation',
    lastSubmission: { song_title: songTitle },
    error: null,
  };
}

/**
 * drawAnother(state): Return to card screen for a new draw, keeping user identity.
 */
export function drawAnother(state) {
  return {
    ...state,
    screen: 'card',
    card: null,
    answers: {},
    questionIndex: 0,
    lastSubmission: null,
    error: null,
  };
}

/**
 * switchUser(state): Clear stored identity and return to identity screen.
 */
export function switchUser(state) {
  localStorage.removeItem(STORAGE_KEY);
  return {
    ...state,
    screen: 'identity',
    user: null,
    card: null,
    answers: {},
    questionIndex: 0,
  };
}

/**
 * loadUser(): Read identity from localStorage. Returns string or null.
 * Validates that the stored value is a non-empty string.
 */
export function loadUser() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return typeof stored === 'string' && stored.length > 0 ? stored : null;
}
