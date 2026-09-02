'use strict';

const EVENT_META = Object.freeze({
  acquisition_visit: new Set(['google', 'youtube', 'instagram', 'tiktok', 'facebook', 'linkedin', 'search', 'project', 'referral', 'direct', 'other']),
  homepage_view: new Set(),
  challenge_view: new Set(),
  challenge_start: new Set(['reaction', 'football', 'pet-catch']),
  landing_cta_click: new Set(['hero-build', 'hero-idea', 'hero-lessons', 'final-build', 'member-resume-project', 'public-project-build', 'shelf', 'starter']),
  learning_start: new Set(['lesson-one', 'playground']),
  parent_guide_view: new Set(),
  parent_cta_click: new Set(['create-family-account', 'try-project', 'join-pilot', 'view-pricing', 'pilot-email', 'builder-trial-return', 'evidence-pilot']),
  signup_complete: new Set(['student', 'educator']),
  new_account_studio_view: new Set(),
  new_account_family_setup_view: new Set(),
  builder_start: new Set(['website', 'game', 'quiz', 'tool', 'other']),
  generation_complete: new Set([
    'ai', 'fallback',
    // fallback-<reason>: the cause, not just the rate. Five causes, five
    // different fixes.
    'fallback-no-api-key', 'fallback-timeout', 'fallback-retry-timeout',
    'fallback-invalid-output', 'fallback-error', 'fallback-unknown',
  ]),
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

  // ── Events the browser was already firing into a 400 ──────────────────
  //
  // A read-only audit on 1 September 2026 found eleven trackEvent names that
  // no one had ever added here. Every call fired an HTTP request, the ingest
  // route rejected it, and nothing was written. Two of them were the
  // measurement for the studio-door change shipped that same day, so the
  // read-out promised for 8 September would have reported nothing and the
  // silence would have looked like a null result.
  //
  // None of these carry meta. An unbounded meta (a lesson id, an error code,
  // a starter name) is how the previous set of rejections happened: the name
  // passed and the value did not. The event name says which surface, and
  // that is what these questions need.
  lesson_to_studio: new Set(),
  quiz_to_studio: new Set(),

  // The gate that blocks Save and Publish until the child actually clicks or
  // types inside their own project. It decided who could save and who could
  // publish and it was invisible in every report, so the drop between
  // "generated" and "saved" could not be attributed to anything.
  project_played: new Set(),

  builder_starter_open: new Set(),
  shelf_project_reopened: new Set(),
  project_explained: new Set(),
  builder_look_inside: new Set(),
  publish_refused: new Set(),
  publish_celebrate_share: new Set(),
  parent_evidence_open: new Set(),
  billing_portal_open: new Set(),
  billing_checkout_start: new Set(),

  // Added 2 September 2026, after the first paying family said subscribing
  // took too many buttons. These three are the only way to tell whether the
  // shorter path is the reason someone paid, or whether it only moved a
  // control nobody presses. The wall event is the denominator: how many
  // families reach the monthly limit at all.
  ai_limit_reached: new Set(),
  ai_limit_upgrade_click: new Set(),
  header_get_plus_click: new Set(),

  // Server-side. The milestone table counts lesson completions from
  // Student_Lesson_Progress, which cannot say when one happened relative to
  // anything else. An event can.
  lesson_complete: new Set(),

  // ── The two stages that had no event of any kind ──────────────────────
  //
  // Asked for on 2 September 2026: a prospective measurement framework needs
  // a denominator for "entered the studio" and for "started a lesson", and
  // neither existed.
  //
  // Studio entry was measurable only through two specific doors
  // (lesson_to_studio, quiz_to_studio), a welcome banner that fires only for
  // ?welcome=1, and four of the roughly forty links that reach /builder. So
  // "of learners who entered the studio, how many generated a project" had no
  // honest denominator. studio_view is every arrival, by any route.
  //
  // lesson_start is the counterpart. learning_start already exists but it is
  // a click on a call to action on the home page and the SEO pages, not a
  // lesson opening, and using one as the other is the kind of substitution
  // that produces a number nobody can defend.
  studio_view: new Set(),
  lesson_start: new Set(),
});

const CLIENT_REPORTED_EVENTS = new Set([
  'acquisition_visit', 'homepage_view', 'challenge_view', 'challenge_start',
  'landing_cta_click', 'learning_start', 'parent_guide_view', 'parent_cta_click',
  'new_account_studio_view', 'new_account_family_setup_view', 'guest_draft_recovered',
  'project_personalize', 'activation_account_gate', 'activation_next_step',
  'project_share', 'return_use', 'pricing_view',
  // Added 1 September 2026 after the audit. See EVENT_META above.
  'lesson_to_studio', 'quiz_to_studio', 'project_played', 'builder_starter_open',
  'shelf_project_reopened', 'project_explained', 'builder_look_inside',
  'publish_refused', 'publish_celebrate_share', 'parent_evidence_open',
  'billing_portal_open', 'billing_checkout_start',
  // Added 2 September 2026: the two missing denominators.
  'studio_view', 'lesson_start',
  // Added 2 September 2026: the shorter path to subscribing.
  'ai_limit_reached', 'ai_limit_upgrade_click', 'header_get_plus_click',
]);
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

// One classifier for the whole backend (projectKind.js). The exact-string
// list this used to hold sent 'interactive-website' and 'simulator' to
// 'other', so analytics and the monthly evidence email mislabelled them.
const { projectKind } = require('./projectKind');
function projectCategory(value) {
  return projectKind(value);
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
