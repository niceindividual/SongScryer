// render.js — pure rendering layer: maps state to DOM
// Reads state, writes to #app. No event listeners — app.js handles those.

import { QUESTIONS, getQuestionCopy } from './questions.js';

const app = document.getElementById('app');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * render(state) — top-level dispatcher. Switches on state.screen.
 */
export function render(state) {
  switch (state.screen) {
    case 'identity':
      renderIdentity(state);
      break;
    case 'card':
      renderCard(state);
      break;
    case 'form':
      renderForm(state);
      break;
    case 'confirmation':
      renderConfirmation(state);
      break;
    default:
      app.innerHTML = `<p>Unknown screen: ${escapeHtml(state.screen)}</p>`;
  }
}

// ---------------------------------------------------------------------------
// Screen renderers
// ---------------------------------------------------------------------------

function renderIdentity(state) {
  app.innerHTML = `
    <div class="screen screen-identity">
      <h1>SongScryer</h1>
      <p class="subtitle">Who's picking tonight?</p>
      <div class="identity-buttons">
        <button class="btn btn-identity" data-action="select-user" data-user="matt">Matt</button>
        <button class="btn btn-identity" data-action="select-user" data-user="mike">Mike</button>
      </div>
    </div>
  `;
}

function renderCard(state) {
  app.innerHTML = `
    ${renderUserBadge(state.user)}
    <div class="screen screen-card">
      <h1>SongScryer</h1>
      <button class="btn btn-primary" data-action="draw-card">Draw a Card</button>
    </div>
  `;
}

function renderForm(state) {
  const question = QUESTIONS[state.questionIndex];
  const { label, placeholder } = getQuestionCopy(question, state.card.tone);

  app.innerHTML = `
    ${renderUserBadge(state.user)}
    <div class="screen screen-form">
      <div class="card-prompt">${state.card.prompt}</div>
      <div class="progress">${state.questionIndex + 1} / ${QUESTIONS.length}</div>
      <div class="question">
        <label class="question-label">
          ${escapeHtml(label)}${question.required
            ? '<span class="required-mark">*</span>'
            : '<span class="optional-mark">(optional)</span>'}
        </label>
        ${renderQuestionInput(question, placeholder, state.answers[question.key])}
      </div>
    </div>
  `;
}

function renderConfirmation(state) {
  app.innerHTML = `
    ${renderUserBadge(state.user)}
    <div class="screen screen-confirmation">
      <h2>Submitted!</h2>
      <p class="submitted-song-title">${escapeHtml(state.lastSubmission.song_title)}</p>
      <button class="btn btn-primary" data-action="draw-another">Draw another card</button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function renderUserBadge(user) {
  return `<div class="user-badge">${escapeHtml(user)} &mdash; <a data-action="switch-user">switch</a></div>`;
}

/**
 * renderQuestionInput(question, placeholder, currentValue)
 * Returns an HTML string for the appropriate input type.
 */
function renderQuestionInput(question, placeholder, currentValue) {
  const { key, type } = question;

  switch (type) {
    case 'text': {
      const val = escapeHtml(currentValue ?? '');
      return `
        <input
          type="text"
          class="question-input"
          name="${escapeHtml(key)}"
          placeholder="${escapeHtml(placeholder)}"
          value="${val}"
          autocomplete="off"
        >
        <button class="btn btn-next" data-action="next-question">Next</button>
      `;
    }

    case 'textarea': {
      const val = escapeHtml(currentValue ?? '');
      return `
        <textarea
          class="question-textarea"
          name="${escapeHtml(key)}"
          placeholder="${escapeHtml(placeholder)}"
          rows="4"
        >${val}</textarea>
        <button class="btn btn-next" data-action="next-question">Next</button>
      `;
    }

    case 'number': {
      const val = escapeHtml(String(currentValue ?? ''));
      return `
        <input
          type="number"
          class="question-input"
          name="${escapeHtml(key)}"
          placeholder="${escapeHtml(placeholder)}"
          value="${val}"
          min="1"
          max="300"
        >
        <button class="btn btn-next" data-action="next-question">Next</button>
      `;
    }

    case 'choice': {
      const options = question.options.map(opt => {
        const selected = currentValue === opt.value ? ' selected' : '';
        return `<button
          class="btn btn-choice${selected}"
          data-action="answer-choice"
          data-key="${escapeHtml(key)}"
          data-value="${escapeHtml(opt.value)}"
        >${escapeHtml(opt.label)}</button>`;
      }).join('');
      return `<div class="choice-group" role="group">${options}</div>`;
    }

    case 'multi-select': {
      const selected = Array.isArray(currentValue) ? currentValue : [];
      const maxReached = selected.length >= question.max;
      const options = question.options.map(opt => {
        const isSelected = selected.includes(opt.value);
        const isDisabled = maxReached && !isSelected;
        const selectedClass = isSelected ? ' selected' : '';
        return `<label class="multi-select-option${selectedClass}">
          <input
            type="checkbox"
            name="${escapeHtml(key)}"
            value="${escapeHtml(opt.value)}"
            ${isSelected ? 'checked' : ''}
            ${isDisabled ? 'disabled' : ''}
          >
          ${escapeHtml(opt.label)}
        </label>`;
      }).join('');
      return `
        <div class="multi-select-group">
          ${options}
        </div>
        <button class="btn btn-next" data-action="next-multi-select" data-key="${escapeHtml(key)}">Next</button>
      `;
    }

    case 'rating': {
      const buttons = [1, 2, 3, 4, 5].map(n => {
        const selected = currentValue === n ? ' selected' : '';
        return `<button
          class="btn btn-rating${selected}"
          data-action="answer-choice"
          data-key="${escapeHtml(key)}"
          data-value="${n}"
        >${n}</button>`;
      }).join('');
      return `
        <div class="rating-group" role="group">
          <span class="rating-label-low">${escapeHtml(question.lowLabel)}</span>
          ${buttons}
          <span class="rating-label-high">${escapeHtml(question.highLabel)}</span>
        </div>
      `;
    }

    default:
      return `<p>Unknown question type: ${escapeHtml(type)}</p>`;
  }
}

// ---------------------------------------------------------------------------
// Security helper
// ---------------------------------------------------------------------------

/**
 * escapeHtml(str) — prevents XSS when inserting user-provided strings into innerHTML.
 * Always use for: song_title, artist, any state value originating from user input.
 * Not needed for: card.prompt (static seed data), QUESTIONS labels (static constants).
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
