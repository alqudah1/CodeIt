'use strict';

const EVENT_META = Object.freeze({
  landing_cta_click: new Set(['hero-build', 'hero-lessons', 'final-build']),
  signup_complete: new Set(['student', 'educator']),
  builder_start: new Set(['website', 'game', 'quiz', 'tool', 'other']),
  generation_complete: new Set(['ai', 'fallback']),
  project_save: new Set(['website', 'game', 'quiz', 'tool', 'other']),
  project_publish: new Set(['website', 'game', 'quiz', 'tool', 'other']),
  return_use: new Set(),
  pricing_view: new Set(),
  pricing_interest: new Set(['founding-family']),
});

const CLIENT_REPORTED_EVENTS = new Set(['landing_cta_click', 'return_use', 'pricing_view', 'pricing_interest']);

function normalizeEventName(value) {
  return typeof value === 'string' && Object.hasOwn(EVENT_META, value) ? value : null;
}

function normalizeMeta(eventName, value) {
  const allowed = EVENT_META[eventName];
  if (!allowed || allowed.size === 0 || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return allowed.has(normalized) ? normalized : null;
}

function projectCategory(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized === 'quiz') return 'quiz';
  if (['website', 'portfolio', 'restaurant', 'shop', 'sports', 'blog', 'landing'].includes(normalized)) return 'website';
  if (['tool', 'calculator', 'timer', 'drawing', 'flashcards'].includes(normalized)) return 'tool';
  if (['game', 'clicker', 'runner', 'memory', 'reaction', 'soccer', 'platformer', 'dodge', 'racing', 'typing', 'tower', 'maze', 'survival', 'puzzle', 'basketball', 'cooking'].includes(normalized)) return 'game';
  return 'other';
}

module.exports = {
  CLIENT_REPORTED_EVENTS,
  normalizeEventName,
  normalizeMeta,
  projectCategory,
};
