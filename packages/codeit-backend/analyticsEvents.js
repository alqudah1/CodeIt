'use strict';

const EVENT_META = Object.freeze({
  acquisition_visit: new Set(['google', 'youtube', 'instagram', 'tiktok', 'facebook', 'linkedin', 'search', 'project', 'referral', 'direct', 'other']),
  homepage_view: new Set(),
  landing_cta_click: new Set(['hero-build', 'hero-idea', 'hero-lessons', 'final-build', 'member-resume-project']),
  learning_start: new Set(['lesson-one', 'playground']),
  parent_guide_view: new Set(),
  parent_cta_click: new Set(['create-family-account', 'try-project', 'join-pilot', 'view-pricing', 'pilot-email']),
  signup_complete: new Set(['student', 'educator']),
  new_account_studio_view: new Set(),
  new_account_family_setup_view: new Set(),
  builder_start: new Set(['website', 'game', 'quiz', 'tool', 'other']),
  generation_complete: new Set(['ai', 'fallback']),
  guest_draft_recovered: new Set(),
  project_personalize: new Set(),
  activation_account_gate: new Set(['save', 'publish']),
  project_save: new Set(['website', 'game', 'quiz', 'tool', 'other']),
  activation_next_step: new Set(['publish', 'improve', 'learn', 'share']),
  project_publish: new Set(['website', 'game', 'quiz', 'tool', 'other']),
  project_remix: new Set(['website', 'game', 'quiz', 'tool', 'other']),
  project_share: new Set(['creator', 'viewer']),
  return_use: new Set(),
  pricing_view: new Set(),
  pricing_interest: new Set(['founding-family']),
  pilot_join: new Set(['homepage', 'parents-guide', 'pricing']),
  pilot_confirmation: new Set(['sent', 'not-sent']),
  family_child_created: new Set(),
});

const CLIENT_REPORTED_EVENTS = new Set(['acquisition_visit', 'homepage_view', 'landing_cta_click', 'learning_start', 'parent_guide_view', 'parent_cta_click', 'new_account_studio_view', 'new_account_family_setup_view', 'guest_draft_recovered', 'project_personalize', 'activation_account_gate', 'activation_next_step', 'project_share', 'return_use', 'pricing_view']);
const JOURNEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CAMPAIGN_PATTERN = /^[a-z0-9][a-z0-9-]{1,23}$/;

function normalizeEventName(value) {
  return typeof value === 'string' && Object.hasOwn(EVENT_META, value) ? value : null;
}

function normalizeMeta(eventName, value) {
  const allowed = EVENT_META[eventName];
  if (!allowed || allowed.size === 0 || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return allowed.has(normalized) ? normalized : null;
}

function eventRequiresMeta(eventName) {
  const allowed = EVENT_META[eventName];
  return Boolean(allowed && allowed.size > 0);
}

function projectCategory(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized === 'quiz') return 'quiz';
  if (['website', 'portfolio', 'restaurant', 'shop', 'sports', 'blog', 'landing'].includes(normalized)) return 'website';
  if (['tool', 'calculator', 'timer', 'drawing', 'flashcards'].includes(normalized)) return 'tool';
  if (['game', 'clicker', 'runner', 'memory', 'reaction', 'soccer', 'platformer', 'dodge', 'racing', 'typing', 'tower', 'maze', 'survival', 'puzzle', 'basketball', 'cooking'].includes(normalized)) return 'game';
  return 'other';
}

function normalizeJourneyId(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return JOURNEY_PATTERN.test(normalized) ? normalized : null;
}

function normalizeCampaignCode(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return CAMPAIGN_PATTERN.test(normalized) ? normalized : null;
}

module.exports = {
  CLIENT_REPORTED_EVENTS,
  normalizeEventName,
  normalizeMeta,
  normalizeJourneyId,
  normalizeCampaignCode,
  eventRequiresMeta,
  projectCategory,
};
