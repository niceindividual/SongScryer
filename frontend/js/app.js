// app.js — SongScryer entry point
// Boots state from localStorage, drives the render loop, handles all user events.
// This is the only module with DOM side effects and localStorage writes (via state.js).

import cards from '../../data/cards.json';
import { createInitialState, selectUser, drawCard, answerQuestion,
         submissionSucceeded, drawAnother, switchUser } from './state.js';
import { render } from './render.js';
import { QUESTIONS } from './questions.js';
import { postSubmission } from './api.js';

const BASE_URL = import.meta.env.BASE_URL;

// ---------------------------------------------------------------------------
// Boot sequence — runs immediately on module load
// ---------------------------------------------------------------------------

let state = createInitialState();

const savedUser = localStorage.getItem('songscryer_user');
if (savedUser === 'matt' || savedUser === 'mike') {
  state = { ...state, user: savedUser, screen: 'card' };
}

render(state);

// ---------------------------------------------------------------------------
// Submission handler
// ---------------------------------------------------------------------------

async function handleSubmit(finalState) {
  const payload = {
    submitter: finalState.user,
    card_id: finalState.card.id,
    ...finalState.answers,
  };

  // energy_level and love_level must be integers for the server
  if (payload.energy_level !== undefined) payload.energy_level = Number(payload.energy_level);
  if (payload.love_level !== undefined) payload.love_level = Number(payload.love_level);

  try {
    const result = await postSubmission(BASE_URL, payload);
    state = submissionSucceeded(finalState, result.song_title);
    render(state);
  } catch (err) {
    // Show error inline without losing form state — append error message to #app
    const errEl = document.createElement('p');
    errEl.className = 'submission-error';
    errEl.textContent = 'Submission failed: ' + err.message + '. Check your connection and try again.';
    document.getElementById('app').appendChild(errEl);
  }
}

// ---------------------------------------------------------------------------
// Click event delegation — single listener on #app
// ---------------------------------------------------------------------------

document.getElementById('app').addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const action = el.dataset.action;

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
      // Auto-advance for choice and rating questions
      const key = el.dataset.key;
      let value = el.dataset.value;
      // Coerce numeric values: rating buttons have integer-string values
      if (value !== '' && !isNaN(Number(value))) value = Number(value);
      state = answerQuestion(state, key, value);
      if (state.questionIndex >= QUESTIONS.length) {
        await handleSubmit(state);
      } else {
        render(state);
      }
      break;
    }

    case 'next-question': {
      // Explicit advance for text / textarea / number questions
      const question = QUESTIONS[state.questionIndex];
      const input = document.querySelector('[name="' + question.key + '"]');
      const value = input?.value?.trim() ?? '';
      if (question.required && !value) {
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
      // Explicit advance for multi-select questions
      const key = el.dataset.key;
      const checked = [...document.querySelectorAll('[name="' + key + '"]:checked')].map(cb => cb.value);
      const question = QUESTIONS[state.questionIndex];
      if (question.required && checked.length === 0) return; // require at least 1
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

    default:
      break;
  }
});

// ---------------------------------------------------------------------------
// Change listener — re-renders disabled state for multi-select checkboxes
// without advancing the question
// ---------------------------------------------------------------------------

document.getElementById('app').addEventListener('change', (e) => {
  if (!e.target.matches('.multi-select-group input[type=checkbox]')) return;
  const group = e.target.closest('.multi-select-group');
  if (!group) return;
  const name = e.target.name;
  const question = QUESTIONS.find(q => q.key === name);
  if (!question || question.type !== 'multi-select') return;
  const checked = [...group.querySelectorAll('input:checked')].map(cb => cb.value);
  const atMax = checked.length >= question.max;
  group.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.disabled = atMax && !cb.checked;
    cb.closest('.multi-select-option')?.classList.toggle('selected', cb.checked);
    cb.closest('.multi-select-option')?.classList.toggle('disabled', cb.disabled);
  });
});
