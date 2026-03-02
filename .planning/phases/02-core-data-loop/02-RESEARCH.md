# Phase 2: Core Data Loop - Research

**Researched:** 2026-03-01
**Domain:** Vanilla JS state machine, multi-step adaptive form, localStorage identity, Vite JSON import, fetch submission
**Confidence:** HIGH

## Summary

Phase 2 replaces the minimal Phase 1 stub (`frontend/js/app.js`, `frontend/index.html`) with a complete, functional data-collection application. The work is entirely frontend -- the API and database from Phase 1 are ready and unchanged. The technical challenge is organizing vanilla JS (no framework) into a maintainable state machine that drives five distinct screens: identity selection, card draw, question-by-question form, and confirmation.

The stack is intentionally simple: vanilla JS ESM modules, localStorage for identity, Vite's built-in JSON import for card data, and `fetch()` for submission. No new npm dependencies are required for this phase. The primary design decision is the state machine architecture -- a centralized store object that holds current app state and a render loop that redraws the appropriate screen whenever state changes. This pattern is well-established and fits the no-framework constraint exactly.

The most important pitfall is coupling UI rendering to application state in ad-hoc ways -- scattered DOM manipulation spread across event listeners without a single source of truth. The recommended architecture keeps state in one object, renders from that state, and handles events by calling a central dispatch/transition function. This makes the form's progressive disclosure and auto-advance behavior predictable and testable by inspection.

**Primary recommendation:** Build as three files -- `state.js` (pure state object + transitions), `render.js` (renders each screen from state), `app.js` (entry point: initializes state, attaches event delegation, drives the loop). Keep all screen rendering as functions that accept state and return/mutate a single `#app` container.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Identity selector
- Two large name buttons (Matt / Mike) on a simple identity screen shown on first visit
- Selection stored in localStorage -- no re-selection on subsequent visits
- Active user shown persistently as a small label (e.g. top corner or below heading)
- Unobtrusive "switch user" link to change identity -- no modal, just shows the selector screen again

#### Static card selection
- Single "Draw a Card" button that randomly selects one of the 21 cards and displays the prompt
- No grid, no dropdown, no list -- just the button and the revealed card prompt
- This is a placeholder: Phase 3 replaces it entirely with the animated shuffle/flip sequence
- Acceptable to be visually plain -- functionality only

#### Form progression
- Questions presented one at a time (conversational, not a spreadsheet)
- Auto-advance on selection for multiple-choice fields (radio buttons, button groups)
- Explicit "Next" button for free-text fields (user must type then confirm)
- No going back -- keeps form state simple; submitted_raw covers any data recovery needs
- Progress indicator showing current position (e.g. "4 / 13")
- Required vs optional fields visually distinct (required marker or label)

#### Post-submission flow
- Confirmation screen shows the submitted song title
- "Draw another card" button appears immediately -- no auto-redirect timer
- Clicking draw resets state to card selection (same user identity retained)

### Claude's Discretion
- Exact layout and component structure of the form
- How card prompt text is displayed (card-like container vs plain text)
- Tone adaptation implementation (how the 6 tones map to label variants per question)
- State machine implementation details (which JS module manages transitions)
- Error handling for failed submissions (retry vs error message)

### Deferred Ideas (OUT OF SCOPE)
- None -- user deferred all implementation decisions to Claude's discretion; discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IDNT-01 | User can select their identity (Matt or Mike) before starting a session | Identity screen with two large buttons; rendered when no localStorage entry found |
| IDNT-02 | Identity selection persists across page refreshes via localStorage | `localStorage.setItem('songscryer_user', 'matt'|'mike')` on selection; read on init |
| FORM-01 | Form presents questions one at a time (progressive disclosure -- conversational feel) | Question array with index pointer in state; render only current question |
| FORM-02 | Question text and placeholder copy adapts tone/framing based on which card was drawn | Tone copy map (`toneLabels[tone][fieldKey]`) -- see Code Examples section |
| FORM-03 | All 21 cards produce identical underlying data fields -- adaptive framing is presentation only | Single question definition array; only label/placeholder text varies by tone |
| FORM-04 | User can enter song title and artist name | Two sequential text input questions (type: 'text'); require "Next" button |
| FORM-05 | User can write why this song matters / what it means (free text) | text question type (type: 'textarea'); requires "Next" button |
| FORM-06 | User can select up to 2 primary hooks from 8 options | Multi-select checkbox question (type: 'multi-select', max: 2); "Next" required |
| FORM-07 | User can select whether lyrics matter: central / somewhat / not really | Radio/button-group question (type: 'choice'); auto-advance on selection |
| FORM-08 | User can enter a standout instrument or sonic element (short text) | Text input (type: 'text', optional: true); "Next" button |
| FORM-09 | User can enter an emotional quality descriptor (short text) | Text input (type: 'text', optional: true); "Next" button |
| FORM-10 | User can rate energy level on a 1-5 scale | Rating scale (type: 'rating', max: 5); auto-advance on selection |
| FORM-11 | User can rate how much they love the song on a 1-5 scale | Rating scale (type: 'rating', max: 5); auto-advance on selection |
| FORM-12 | User can select performance feasibility from 4 options | Button group (type: 'choice'); auto-advance on selection |
| FORM-13 | User can select performance desire: definitely / maybe / no | Button group (type: 'choice'); auto-advance on selection |
| FORM-14 | User can add optional notes on performing the song | Textarea (type: 'textarea', optional: true); "Next" button |
| FORM-15 | User can enter optional key or tonal center | Text input (type: 'text', optional: true); "Next" button |
| FORM-16 | User can select tempo feel: slow / mid / uptempo / variable | Button group (type: 'choice'); auto-advance on selection |
| FORM-17 | User can enter optional approximate BPM | Number input (type: 'number', optional: true); "Next" button |
| FORM-18 | User can select time signature: 4/4 / 3/4 / 6/8 / odd meter / not sure | Button group (type: 'choice'); auto-advance on selection |
| FORM-19 | User can add any other optional notes (free text) | Textarea (type: 'textarea', optional: true); "Next" button |
| FORM-20 | Required vs optional fields are visually distinct throughout the form | Required indicator (asterisk or "(required)" label) on all required questions |
| SUBM-01 | User receives clear confirmation after a successful submission | Confirmation screen showing song title; triggered on 201 response from API |
| SUBM-02 | Submission is persisted to SQLite immediately on submit; server validates schema before accepting | POST to `${BASE_URL}api/submissions` with complete form data; handle 400 response |
| SUBM-03 | User can draw another card immediately after submission | "Draw another card" button on confirmation screen resets to card draw state |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS ESM | Native (ES2022+) | State machine, rendering, event handling | Locked by CONTEXT.md -- no framework |
| localStorage | Browser native | Identity persistence | No serialization needed for simple string value |
| fetch() | Browser native | POST submission to Express API | No library needed for single API call |
| Vite | 7.3.1 (already installed) | Dev server + production build, JSON import | Already installed in Phase 1; handles JSON import natively |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| import.meta.env.BASE_URL | Vite built-in | Prefix all API fetch URLs | Every API call -- prevents 404 on VPS subpath |
| CSS custom properties | Native | Theming parchment colors, spacing | Already established in main.css; extend for form UI |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written state machine | XState | XState adds 100KB bundle for simple 4-screen flow; not worth it |
| Direct DOM mutation per event | Re-render full screen from state | Full-screen re-render is simpler to reason about for < 20 questions; no visible flicker at this scale |
| localStorage | sessionStorage | sessionStorage clears on tab close; localStorage survives refreshes as required |
| Fetch at runtime | Static import of cards.json | Both work; static import is simpler (no loading state needed) |

**Installation:**
```bash
# No new npm dependencies required for Phase 2
# All libraries are browser-native or already installed (Vite 7.3.1)
```

## Architecture Patterns

### Recommended Project Structure

```
frontend/
  index.html           # Keep HTML shell; replace body content
  css/
    main.css           # Extend with form styles; keep parchment base
  js/
    app.js             # Entry point: init, event delegation, boot sequence
    state.js           # Pure state object + transition functions
    render.js          # Screen renderers: renderIdentity, renderCard, renderQuestion, renderConfirmation
    questions.js       # Question definition array + tone copy map
    api.js             # fetch wrapper for POST /api/submissions
data/
  cards.json           # Already exists (21 cards with id, prompt, tone)
```

### Pattern 1: Centralized State Object

**What:** A single `state` object in `state.js` holds all mutable application data. Transition functions are the only way to modify state. `app.js` calls `render(state)` after every transition.

**When to use:** Always. This is the core architecture for the entire frontend.

```javascript
// frontend/js/state.js

// Initial state factory (called on page load)
export function createInitialState() {
  return {
    screen: 'identity',   // 'identity' | 'card' | 'form' | 'confirmation'
    user: null,           // 'matt' | 'mike'
    card: null,           // { id, prompt, tone } from cards.json
    answers: {},          // { [fieldKey]: value } accumulated as user progresses
    questionIndex: 0,     // which question in QUESTIONS array is active
    lastSubmission: null, // { song_title } for confirmation screen
    error: null           // string | null for submission errors
  };
}

// Transition: user selected identity
export function selectUser(state, user) {
  localStorage.setItem('songscryer_user', user);
  return { ...state, user, screen: 'card' };
}

// Transition: draw a random card
export function drawCard(state, cards) {
  const card = cards[Math.floor(Math.random() * cards.length)];
  return { ...state, card, screen: 'form', questionIndex: 0, answers: {} };
}

// Transition: answer current question and advance
export function answerQuestion(state, fieldKey, value) {
  const answers = { ...state.answers, [fieldKey]: value };
  return { ...state, answers, questionIndex: state.questionIndex + 1 };
}

// Transition: submission succeeded
export function submissionSucceeded(state, songTitle) {
  return { ...state, screen: 'confirmation', lastSubmission: { song_title: songTitle }, error: null };
}

// Transition: draw another card (resets to card screen, keeps user)
export function drawAnother(state) {
  return { ...state, screen: 'card', card: null, answers: {}, questionIndex: 0, lastSubmission: null, error: null };
}

// Transition: switch user (shows identity screen again)
export function switchUser(state) {
  localStorage.removeItem('songscryer_user');
  return { ...state, screen: 'identity', user: null, card: null, answers: {}, questionIndex: 0 };
}
```

### Pattern 2: Question Definition Array with Tone Copy Map

**What:** A single `QUESTIONS` array defines the sequence of questions with field keys, types, and options. A separate `TONE_LABELS` map provides tone-specific copy (label and placeholder text). The renderer combines them at render time -- never at data time.

**When to use:** Whenever a question is rendered. This ensures FORM-03 (identical data fields, presentation-only adaptation).

```javascript
// frontend/js/questions.js

export const QUESTIONS = [
  {
    key: 'song_title',
    type: 'text',
    required: true,
    defaultLabel: 'Song title',
    defaultPlaceholder: 'e.g. Blackbird'
  },
  {
    key: 'artist',
    type: 'text',
    required: true,
    defaultLabel: 'Artist or band',
    defaultPlaceholder: 'e.g. The Beatles'
  },
  {
    key: 'why_this_song',
    type: 'textarea',
    required: true,
    defaultLabel: 'Why this song?',
    defaultPlaceholder: 'What does it mean to you? Why now?'
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
      { value: 'indefinable', label: 'Indefinable' }
    ]
  },
  {
    key: 'lyrics_matter',
    type: 'choice',
    required: true,
    defaultLabel: 'Do lyrics matter to you in this song?',
    options: [
      { value: 'central', label: 'Central — the song lives in the words' },
      { value: 'somewhat', label: 'Somewhat — they matter but aren\'t the whole point' },
      { value: 'not_really', label: 'Not really — it\'s all about the sound' }
    ]
  },
  {
    key: 'standout_element',
    type: 'text',
    required: false,
    defaultLabel: 'Standout instrument or sonic element (optional)',
    defaultPlaceholder: 'e.g. the guitar tone, that snare, the string arrangement'
  },
  {
    key: 'emotional_quality',
    type: 'text',
    required: false,
    defaultLabel: 'Emotional quality in one word (optional)',
    defaultPlaceholder: 'e.g. melancholy, driving, joyful'
  },
  {
    key: 'energy_level',
    type: 'rating',
    required: true,
    max: 5,
    defaultLabel: 'Energy level',
    lowLabel: 'Low',
    highLabel: 'High'
  },
  {
    key: 'love_level',
    type: 'rating',
    required: true,
    max: 5,
    defaultLabel: 'How much do you love this song?',
    lowLabel: 'Like it',
    highLabel: 'Obsessed'
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
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    key: 'performance_desire',
    type: 'choice',
    required: true,
    defaultLabel: 'Do you want to perform it?',
    options: [
      { value: 'definitely', label: 'Definitely' },
      { value: 'maybe', label: 'Maybe' },
      { value: 'no', label: 'No' }
    ]
  },
  {
    key: 'performance_notes',
    type: 'textarea',
    required: false,
    defaultLabel: 'Notes on performing it (optional)',
    defaultPlaceholder: 'How would you approach it? What would need to change?'
  },
  {
    key: 'key_or_tonal_center',
    type: 'text',
    required: false,
    defaultLabel: 'Key or tonal center (optional)',
    defaultPlaceholder: 'e.g. D minor, Mixolydian, not sure'
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
      { value: 'variable', label: 'Variable' }
    ]
  },
  {
    key: 'approximate_bpm',
    type: 'number',
    required: false,
    defaultLabel: 'Approximate BPM (optional)',
    defaultPlaceholder: 'e.g. 120'
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
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    key: 'other_notes',
    type: 'textarea',
    required: false,
    defaultLabel: 'Anything else? (optional)',
    defaultPlaceholder: 'Any other thoughts about this song?'
  }
];

// Tone-specific copy overrides
// Keys match QUESTIONS[n].key; values override defaultLabel and defaultPlaceholder
// Tones from cards.json: reflective, energetic, nostalgic, introspective, playful, provocative
export const TONE_LABELS = {
  reflective: {
    why_this_song: {
      label: 'What does this song reflect back at you?',
      placeholder: 'What do you hear when you really listen?'
    },
    emotional_quality: {
      label: 'The feeling it captures (optional)',
      placeholder: 'e.g. wistful, searching, resolved'
    }
  },
  energetic: {
    why_this_song: {
      label: 'What makes this song move you?',
      placeholder: 'What drives it? What do you feel in your body?'
    },
    energy_level: {
      label: 'How much does it move you?'
    }
  },
  nostalgic: {
    why_this_song: {
      label: 'What does this song take you back to?',
      placeholder: 'A place, a person, a time in your life?'
    },
    emotional_quality: {
      label: 'The feeling of that time (optional)',
      placeholder: 'e.g. bittersweet, aching, warm'
    }
  },
  introspective: {
    why_this_song: {
      label: 'What does this song make you think about?',
      placeholder: 'What question does it ask, or what does it answer?'
    }
  },
  playful: {
    why_this_song: {
      label: 'What makes this song irresistible?',
      placeholder: 'Why can\'t you not like it?'
    }
  },
  provocative: {
    why_this_song: {
      label: 'What does this song dare you to feel?',
      placeholder: 'What boundary does it push for you?'
    }
  }
};

// Helper: get effective label/placeholder for a question given a tone
export function getQuestionCopy(question, tone) {
  const override = TONE_LABELS[tone]?.[question.key] ?? {};
  return {
    label: override.label ?? question.defaultLabel,
    placeholder: override.placeholder ?? question.defaultPlaceholder ?? ''
  };
}
```

### Pattern 3: Screen-Based Renderer (innerHTML replacement)

**What:** Each screen is rendered by calling a function that replaces `#app`'s innerHTML. Event handlers are re-attached after each render using event delegation on `#app`. No virtual DOM, no diffing -- full replacement is acceptable for a simple 4-screen app.

**When to use:** On every state transition. Called from `app.js` after each `state = transition(state, ...)`.

```javascript
// frontend/js/render.js
import { QUESTIONS, getQuestionCopy } from './questions.js';

const app = document.getElementById('app');

export function render(state) {
  switch (state.screen) {
    case 'identity':   return renderIdentity(state);
    case 'card':       return renderCard(state);
    case 'form':       return renderForm(state);
    case 'confirmation': return renderConfirmation(state);
  }
}

function renderIdentity(state) {
  app.innerHTML = `
    <div class="screen screen-identity">
      <h1>SongScryer</h1>
      <p class="screen-subtitle">Who are you?</p>
      <div class="identity-buttons">
        <button class="btn btn-identity" data-action="select-user" data-user="matt">Matt</button>
        <button class="btn btn-identity" data-action="select-user" data-user="mike">Mike</button>
      </div>
    </div>
  `;
}

function renderCard(state) {
  app.innerHTML = `
    <div class="user-badge">
      ${state.user} &middot; <a href="#" data-action="switch-user">switch</a>
    </div>
    <div class="screen screen-card">
      <h1>SongScryer</h1>
      <button class="btn btn-primary" data-action="draw-card">Draw a Card</button>
    </div>
  `;
}

function renderForm(state) {
  const question = QUESTIONS[state.questionIndex];
  const { label, placeholder } = getQuestionCopy(question, state.card.tone);
  const progress = `${state.questionIndex + 1} / ${QUESTIONS.length}`;
  const isLast = state.questionIndex === QUESTIONS.length - 1;

  app.innerHTML = `
    <div class="user-badge">
      ${state.user} &middot; <a href="#" data-action="switch-user">switch</a>
    </div>
    <div class="screen screen-form">
      <div class="card-prompt">${state.card.prompt}</div>
      <div class="progress">${progress}</div>
      <div class="question">
        <label class="question-label">
          ${label}
          ${question.required ? '<span class="required-mark" aria-label="required">*</span>' : '<span class="optional-mark">(optional)</span>'}
        </label>
        ${renderQuestionInput(question, placeholder, state.answers[question.key])}
      </div>
    </div>
  `;
}

function renderQuestionInput(question, placeholder, currentValue) {
  switch (question.type) {
    case 'text':
      return `
        <input type="text" class="question-input" name="${question.key}"
          placeholder="${placeholder}" value="${currentValue ?? ''}" autocomplete="off">
        <button class="btn btn-next" data-action="next-question">Next</button>
      `;
    case 'textarea':
      return `
        <textarea class="question-textarea" name="${question.key}"
          placeholder="${placeholder}" rows="4">${currentValue ?? ''}</textarea>
        <button class="btn btn-next" data-action="next-question">Next</button>
      `;
    case 'number':
      return `
        <input type="number" class="question-input" name="${question.key}"
          placeholder="${placeholder}" value="${currentValue ?? ''}" min="1" max="300">
        <button class="btn btn-next" data-action="next-question">Next</button>
      `;
    case 'choice':
      return `
        <div class="choice-group" role="group">
          ${question.options.map(opt => `
            <button class="btn btn-choice ${currentValue === opt.value ? 'selected' : ''}"
              data-action="answer-choice" data-key="${question.key}" data-value="${opt.value}">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      `;
    case 'multi-select':
      const selected = currentValue ?? [];
      return `
        <div class="multi-select-group">
          ${question.options.map(opt => `
            <label class="multi-select-option ${selected.includes(opt.value) ? 'selected' : ''}">
              <input type="checkbox" name="${question.key}" value="${opt.value}"
                ${selected.includes(opt.value) ? 'checked' : ''}
                ${selected.length >= question.max && !selected.includes(opt.value) ? 'disabled' : ''}>
              ${opt.label}
            </label>
          `).join('')}
        </div>
        <button class="btn btn-next" data-action="next-multi-select" data-key="${question.key}">Next</button>
      `;
    case 'rating':
      return `
        <div class="rating-group" role="group">
          <span class="rating-label-low">${question.lowLabel}</span>
          ${[1,2,3,4,5].map(n => `
            <button class="btn btn-rating ${currentValue === n ? 'selected' : ''}"
              data-action="answer-choice" data-key="${question.key}" data-value="${n}">
              ${n}
            </button>
          `).join('')}
          <span class="rating-label-high">${question.highLabel}</span>
        </div>
      `;
  }
}

function renderConfirmation(state) {
  app.innerHTML = `
    <div class="user-badge">
      ${state.user} &middot; <a href="#" data-action="switch-user">switch</a>
    </div>
    <div class="screen screen-confirmation">
      <h2>Submitted!</h2>
      <p class="submitted-title">"${state.lastSubmission.song_title}"</p>
      <button class="btn btn-primary" data-action="draw-another">Draw another card</button>
    </div>
  `;
}
```

### Pattern 4: Entry Point with Event Delegation

**What:** `app.js` is the only file with side effects. It initializes state from localStorage, renders on load, and uses a single event listener on `#app` for all user interactions. No inline `onclick` handlers.

**When to use:** Always. Attaching one delegated listener avoids re-binding after every render.

```javascript
// frontend/js/app.js
import cards from '../../data/cards.json';  // Vite handles JSON import natively
import { createInitialState, selectUser, drawCard, answerQuestion,
         submissionSucceeded, drawAnother, switchUser } from './state.js';
import { render } from './render.js';
import { QUESTIONS } from './questions.js';
import { postSubmission } from './api.js';

const BASE_URL = import.meta.env.BASE_URL;

// Boot: restore identity from localStorage
let state = createInitialState();
const savedUser = localStorage.getItem('songscryer_user');
if (savedUser === 'matt' || savedUser === 'mike') {
  state = { ...state, user: savedUser, screen: 'card' };
}
render(state);

// Event delegation: one listener handles all screens
document.getElementById('app').addEventListener('click', async (e) => {
  const action = e.target.closest('[data-action]')?.dataset?.action;
  if (!action) return;

  const el = e.target.closest('[data-action]');

  switch (action) {
    case 'select-user': {
      const user = el.dataset.user;
      state = selectUser(state, user);
      render(state);
      break;
    }
    case 'switch-user': {
      e.preventDefault();
      state = switchUser(state);
      render(state);
      break;
    }
    case 'draw-card': {
      state = drawCard(state, cards);
      render(state);
      break;
    }
    case 'answer-choice': {
      // Auto-advance: no explicit "Next" needed
      const key = el.dataset.key;
      let value = el.dataset.value;
      // Coerce numeric rating values
      if (!isNaN(Number(value)) && value !== '') value = Number(value);
      state = answerQuestion(state, key, value);
      // Check if form is complete
      if (state.questionIndex >= QUESTIONS.length) {
        await handleSubmit(state);
      } else {
        render(state);
      }
      break;
    }
    case 'next-question': {
      // Explicit advance for text/textarea/number inputs
      const question = QUESTIONS[state.questionIndex];
      const input = document.querySelector(`[name="${question.key}"]`);
      const value = input?.value?.trim() ?? '';
      if (question.required && !value) {
        // Simple inline validation -- focus the input, don't advance
        input?.focus();
        return;
      }
      state = answerQuestion(state, question.key, value || null);
      if (state.questionIndex >= QUESTIONS.length) {
        await handleSubmit(state);
      } else {
        render(state);
      }
      break;
    }
    case 'next-multi-select': {
      const key = el.dataset.key;
      const checked = [...document.querySelectorAll(`[name="${key}"]:checked`)].map(cb => cb.value);
      const question = QUESTIONS[state.questionIndex];
      if (question.required && checked.length === 0) return; // require at least one
      state = answerQuestion(state, key, checked.length ? checked : null);
      if (state.questionIndex >= QUESTIONS.length) {
        await handleSubmit(state);
      } else {
        render(state);
      }
      break;
    }
    case 'draw-another': {
      state = drawAnother(state);
      render(state);
      break;
    }
  }
});

async function handleSubmit(state) {
  // Build submission payload matching server/routes/submissions.js REQUIRED_FIELDS
  const payload = {
    submitter: state.user,
    card_id: state.card.id,
    ...state.answers
  };

  try {
    const result = await postSubmission(BASE_URL, payload);
    state = submissionSucceeded(state, result.song_title);
    render(state);
  } catch (err) {
    // Show error inline without losing form state
    const errEl = document.createElement('p');
    errEl.className = 'submission-error';
    errEl.textContent = `Submission failed: ${err.message}. Check your connection and try again.`;
    document.getElementById('app').appendChild(errEl);
  }
}
```

### Pattern 5: API Fetch Wrapper

**What:** A single `api.js` module wraps the submission fetch. Throws on non-201 responses so the caller can handle errors.

```javascript
// frontend/js/api.js

export async function postSubmission(baseUrl, payload) {
  const res = await fetch(`${baseUrl}api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json();  // Returns the created submission record
}
```

### Pattern 6: Vite JSON Static Import

**What:** `data/cards.json` is imported directly as an ES module. Vite handles this natively at build time (tree-shakeable). No fetch, no loading state needed.

**When to use:** For any static JSON file that is known at build time. Cards are static data -- this is the correct approach.

```javascript
// Vite resolves this relative path from frontend/js/ to data/
import cards from '../../data/cards.json';
// cards is a JS array -- fully typed, no async needed
```

**Verified:** Vite documentation at vite.dev/guide/features explicitly documents JSON import support including named imports (HIGH confidence).

### Anti-Patterns to Avoid

- **Scattered state:** Storing current question index in a DOM attribute or closure instead of the centralized state object. When Phase 3 replaces the card screen, scattered state causes cascading bugs.
- **Hardcoded API URL:** Never use `/api/submissions` -- always `${BASE_URL}api/submissions`. The BASE_URL on VPS is `/theyellow/songscryer/`.
- **onchange on radio inputs for auto-advance:** Use `data-action` on `<button>` elements styled as choices instead of radio inputs. This avoids keyboard/accessibility issues with auto-advancing radio buttons and is simpler to re-render.
- **localStorage.getItem without fallback:** Always validate the stored value is `'matt'` or `'mike'` -- corrupted/old values should fall through to the identity screen.
- **Setting innerHTML with user-provided content without escaping:** Song titles and artist names go into confirmation screen innerHTML. Escape or use `textContent` for user data. The simplest fix: only use `textContent` for user-entered values, use `innerHTML` only for static template strings.
- **Multi-select max enforcement in JS only:** The `disabled` attribute on unchecked checkboxes when max is reached must also be re-rendered when a checked item is unchecked. Use a delegated `change` listener on the multi-select group to re-render that group's disabled state live.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation library | Custom validator class | Inline validation at advance time | For 17 simple fields, inline is sufficient -- full validation library is overkill |
| Client-side router | History API pushState/popState | Screen state in JS object (no URL routing) | This app has no back button and no bookmarkable URLs for individual questions |
| Animation library | requestAnimationFrame fade system | CSS transitions on `.screen` class | A simple `opacity` transition CSS class is enough for Phase 2; Phase 3 adds real animation |
| JSON fetch + loading spinner | fetch('data/cards.json') + loading state | `import cards from '../../data/cards.json'` | Vite resolves at build time -- synchronous, zero loading state needed |

**Key insight:** The app is 4 screens with 17 questions. The right amount of infrastructure is the minimum that makes the state legible. A state object + a render function covers it.

## Common Pitfalls

### Pitfall 1: Missing BASE_URL on API calls
**What goes wrong:** Submissions work on `localhost:5173` but 404 on `https://h.eino.us/theyellow/songscryer/`.
**Why it happens:** Fetch URL is `/api/submissions` (absolute from root) instead of `${BASE_URL}api/submissions` (relative to Vite base).
**How to avoid:** Every `fetch()` in the frontend uses `import.meta.env.BASE_URL` as a prefix. This is an established pattern from Phase 1.
**Warning signs:** Network tab shows 404 to `/api/submissions` on VPS; works fine in dev.

### Pitfall 2: XSS via innerHTML with user input
**What goes wrong:** Song title like `<script>alert(1)</script>` executes when rendered in the confirmation screen.
**Why it happens:** `app.innerHTML = \`...\${state.lastSubmission.song_title}...\`` passes raw user input into innerHTML.
**How to avoid:** After rendering the confirmation screen, use `el.textContent = songTitle` to set user-provided values. Or escape HTML entities before templating. The simplest rule: user-provided strings always go through `textContent`, never `innerHTML`.
**Warning signs:** Any `${state.answers.X}` or `${state.lastSubmission.X}` inside a template literal used for innerHTML.

### Pitfall 3: Multi-select max-2 not re-enforced on uncheck
**What goes wrong:** User checks 2 items (remaining checkboxes disable). Then unchecks one. The other 6 remain disabled because the DOM was set disabled and no re-render fired.
**Why it happens:** The `disabled` attribute was set during render and there's no listener to lift it when selection count drops below max.
**How to avoid:** Add a delegated `change` listener on `.multi-select-group` that re-evaluates disabled state whenever any checkbox changes, without advancing the question. This is separate from the `click` delegation.
**Warning signs:** User reports being stuck unable to select more than 2 hooks even after unchecking.

### Pitfall 4: Auto-advance swallowing keyboard users
**What goes wrong:** Keyboard-only users (pressing space/enter on a button) trigger auto-advance before they can review the selection.
**Why it happens:** Auto-advance fires immediately on any click/keyboard activation of a choice button.
**How to avoid:** Auto-advance is fast enough that this is acceptable UX for a 2-user private tool. However: ensure the next question renders quickly enough that the transition feels intentional, not accidental. A 100ms CSS transition on screen swap gives visual feedback.
**Warning signs:** Questions skipping unexpectedly during rapid keyboard navigation.

### Pitfall 5: State mutation instead of replacement
**What goes wrong:** Directly mutating `state.answers.song_title = value` instead of creating a new state object causes rendering bugs if `render()` does shallow comparisons or if state is shared by reference.
**Why it happens:** JavaScript objects are reference types; `state.answers.x = y` mutates in place.
**How to avoid:** All transition functions return new objects: `return { ...state, answers: { ...state.answers, [key]: value } }`. This makes every state change explicit and debuggable in the console.
**Warning signs:** Answers from previous draws appearing in a new form session.

### Pitfall 6: localStorage value not validated on boot
**What goes wrong:** If `localStorage.getItem('songscryer_user')` returns a stale value (e.g., `'null'` as a string, or an old key name), the app skips the identity screen and shows the card screen with an invalid user.
**Why it happens:** localStorage returns strings -- `null` becomes `'null'`; old keys from earlier versions.
**How to avoid:** Always validate: `if (savedUser === 'matt' || savedUser === 'mike')`. If the value isn't one of the two known users, treat it as absent and show the identity screen.
**Warning signs:** App shows card screen with no user badge, or `submitter` field in POST payload is `'null'` (string).

### Pitfall 7: Submission payload field mismatch with server REQUIRED_FIELDS
**What goes wrong:** POST returns 400 "Missing required fields" even though all questions were answered.
**Why it happens:** The server's `REQUIRED_FIELDS` list in `server/routes/submissions.js` uses specific key names that must exactly match the payload. For example: `primary_hooks` must be a JSON array or JSON string; `energy_level` and `love_level` must be integers not strings.
**How to avoid:** Cross-check `QUESTIONS[n].key` values against `REQUIRED_FIELDS` in the server route. Coerce numeric rating values to `Number()` before sending. `primary_hooks` should be sent as an array (the server handles `JSON.stringify` internally).
**Warning signs:** 400 response with `{ error: 'Missing required fields', fields: [...] }` in the Network tab.

## Code Examples

### Verified: Vite JSON import (from vite.dev/guide/features)

```javascript
// Source: https://vite.dev/guide/features (verified 2026-03-01)
import cards from '../../data/cards.json';
// Works out of the box -- no plugin needed
// Named imports also supported for tree-shaking:
// import { id, prompt } from '../../data/cards.json'
```

### Verified: localStorage safe read/write pattern

```javascript
// Source: MDN Web Docs + project convention
const STORAGE_KEY = 'songscryer_user';
const VALID_USERS = ['matt', 'mike'];

// Write
function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, user);
}

// Read with validation
function loadUser() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return VALID_USERS.includes(stored) ? stored : null;
}

// Clear (for switch-user)
function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}
```

### Verified: Event delegation pattern for data-action

```javascript
// Source: CSS-Tricks pattern, confirmed in multiple vanilla JS SPA tutorials
document.getElementById('app').addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  // dispatch on action...
});
```

### Submission payload shape (derived from server/routes/submissions.js)

```javascript
// All required fields must be present and non-empty:
// submitter, card_id, song_title, artist, why_this_song,
// primary_hooks, lyrics_matter, energy_level, love_level,
// feasibility, performance_desire, tempo_feel, time_signature

const payload = {
  submitter: 'matt',          // string: 'matt' | 'mike'
  card_id: 3,                 // integer: 1-21
  song_title: 'Blackbird',    // string
  artist: 'The Beatles',      // string
  why_this_song: '...',       // string
  primary_hooks: ['melody', 'lyrics'],  // string[] (server JSON.stringifys it)
  lyrics_matter: 'central',   // 'central' | 'somewhat' | 'not_really'
  energy_level: 3,            // integer 1-5 (NOT string)
  love_level: 5,              // integer 1-5 (NOT string)
  feasibility: 'yes_adapted', // string enum
  performance_desire: 'maybe',// 'definitely' | 'maybe' | 'no'
  tempo_feel: 'mid',          // 'slow' | 'mid' | 'uptempo' | 'variable'
  time_signature: '4/4',      // '4/4' | '3/4' | '6/8' | 'odd' | 'not_sure'
  // Optional fields (null/undefined OK):
  standout_element: null,
  emotional_quality: null,
  performance_notes: null,
  key_or_tonal_center: null,
  approximate_bpm: null,
  other_notes: null
};
```

### HTML escaping for user content in innerHTML

```javascript
// Safe helper for rendering user-provided strings in innerHTML contexts
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Usage in template:
// `<p class="submitted-title">"${escapeHtml(state.lastSubmission.song_title)}"</p>`
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `window.onload` + globals | ES module with `createInitialState()` factory | State is explicit and testable |
| jQuery `.show()/.hide()` | `innerHTML` replacement per screen | No dependency; simpler for 4 screens |
| `onclick="handler()"` in HTML | `data-action` + event delegation | No re-binding after re-render |
| Fetch + loading spinner for JSON | `import data from './file.json'` (Vite) | Synchronous; zero loading state needed |
| `localStorage.setItem('user', JSON.stringify({...}))` | `localStorage.setItem('user', 'matt')` | Plain string; no parse needed for simple identity |

**Deprecated/outdated for this project:**
- `XMLHttpRequest`: Replaced by `fetch()` universally. Never use XMLHttpRequest.
- `var` declarations: Use `const`/`let` throughout.
- Inline event handlers: Use `data-action` + event delegation.

## Open Questions

1. **Multi-select checkbox re-render on change**
   - What we know: When 2 items are selected, remaining checkboxes should disable. When one is unchecked, others should re-enable.
   - What's unclear: Whether to add a second `change` event listener on the multi-select group, or handle it via the same delegation.
   - Recommendation: Add a delegated `change` listener on `#app` specifically for `[type="checkbox"]` inputs that re-renders just the checkboxes' disabled state (or re-renders the entire question). The full question re-render is simplest -- the input loses focus briefly but is acceptable for this use case.

2. **Question count and progress indicator**
   - What we know: QUESTIONS array as defined above has 17 questions. Progress shows "X / 17". The UI says "4 / 13" as an example in the spec.
   - What's unclear: The spec example count (13) differs from the full requirement count (17). The 17-question sequence covers all FORM-04 through FORM-19 requirements.
   - Recommendation: Use 17 questions. The "13" in the spec was an illustrative example, not a requirement. Progress shows "X / 17".

3. **Error handling UX for failed submission**
   - What we know: CONTEXT.md leaves error handling to Claude's discretion.
   - What's unclear: Whether to show error inline (appended to current screen) or replace with a dedicated error screen.
   - Recommendation: Show error inline as a paragraph appended to the confirmation-in-progress state without clearing the form. A "Try again" button that re-attempts the submit without re-entering data is best. This keeps it simple and doesn't require a new screen state.

## Sources

### Primary (HIGH confidence)
- [Vite JSON import docs](https://vite.dev/guide/features) -- verified JSON import works natively, including named imports
- `server/routes/submissions.js` (project source, read directly) -- exact REQUIRED_FIELDS and payload shape
- `data/cards.json` (project source, read directly) -- 21 cards, 6 tones: reflective/energetic/nostalgic/introspective/playful/provocative
- `server/db/migrations/001-initial.sql` (project source, read directly) -- schema enums for all constrained fields
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) -- localStorage API
- [State Management in Vanilla JS: 2026 Trends](https://medium.com/@chirag.dave/state-management-in-vanilla-js-2026-trends-f9baed7599de) -- current patterns

### Secondary (MEDIUM confidence)
- [CSS-Tricks: Build a state management system with vanilla JS](https://css-tricks.com/build-a-state-management-system-with-vanilla-javascript/) -- centralized store pattern
- [CSS-Tricks: Multi-step forms with vanilla JS](https://css-tricks.com/how-to-create-multi-step-forms-with-vanilla-javascript-and-css/) -- progressive disclosure pattern
- [LogRocket: localStorage complete guide](https://blog.logrocket.com/localstorage-javascript-complete-guide/) -- best practices including validation

### Tertiary (LOW confidence)
- None -- all key findings verified against project source code or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; Vite JSON import verified against official docs; fetch/localStorage are MDN-documented browser APIs
- Architecture: HIGH -- state machine pattern is simple and well-established; code examples are derived directly from the project's existing code (submissions.js, cards.json, vite.config.js)
- Pitfalls: HIGH -- BASE_URL issue is a known Phase 1 pattern; XSS and localStorage validation are standard web security practices; multi-select max re-render is a practical rendering consideration specific to this implementation

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain -- vanilla JS, localStorage, fetch APIs are stable)
