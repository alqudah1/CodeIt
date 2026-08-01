'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CLIENT_REPORTED_EVENTS,
  normalizeEventName,
  eventRequiresMeta,
  normalizeMeta,
  normalizeJourneyId,
  normalizeCampaignCode,
  projectCategory,
} = require('./analyticsEvents');

test('accepts only the fixed product event vocabulary', () => {
  assert.equal(normalizeEventName('project_publish'), 'project_publish');
  assert.equal(normalizeEventName('project_personalize'), 'project_personalize');
  assert.equal(normalizeEventName('project_remix'), 'project_remix');
  assert.equal(normalizeEventName('learning_start'), 'learning_start');
  assert.equal(normalizeEventName('parent_guide_view'), 'parent_guide_view');
  assert.equal(normalizeEventName('pilot_join'), 'pilot_join');
  assert.equal(normalizeEventName('pilot_confirmation'), 'pilot_confirmation');
  assert.equal(normalizeEventName('family_child_created'), 'family_child_created');
  assert.equal(normalizeEventName('guest_draft_recovered'), 'guest_draft_recovered');
  assert.equal(normalizeEventName('prompt_submitted'), null);
  assert.equal(normalizeEventName({ event: 'return_use' }), null);
});

test('accepts only allowlisted metadata and never arbitrary content', () => {
  assert.equal(normalizeMeta('landing_cta_click', 'hero-build'), 'hero-build');
  assert.equal(normalizeMeta('landing_cta_click', 'member-resume-project'), 'member-resume-project');
  assert.equal(normalizeMeta('acquisition_visit', 'instagram'), 'instagram');
  assert.equal(normalizeMeta('acquisition_visit', 'linkedin'), 'linkedin');
  assert.equal(normalizeMeta('acquisition_visit', 'project'), 'project');
  assert.equal(normalizeMeta('acquisition_visit', 'private-campaign-name'), null);
  assert.equal(normalizeMeta('parent_cta_click', 'create-family-account'), 'create-family-account');
  assert.equal(normalizeMeta('parent_cta_click', 'pilot-email'), 'pilot-email');
  assert.equal(normalizeMeta('parent_cta_click', 'join-pilot'), 'join-pilot');
  assert.equal(normalizeMeta('parent_cta_click', 'parent@example.com'), null);
  assert.equal(normalizeMeta('landing_cta_click', 'my private project idea'), null);
  assert.equal(normalizeMeta('landing_cta_click', 'Mission Control Quiz'), null);
  assert.equal(normalizeMeta('learning_start', 'lesson-one'), 'lesson-one');
  assert.equal(normalizeMeta('learning_start', 'private lesson title'), null);
  assert.equal(normalizeMeta('return_use', 'anything'), null);
  assert.equal(normalizeMeta('pricing_interest', 'founding-family'), 'founding-family');
  assert.equal(normalizeMeta('pricing_interest', 'custom enterprise plan'), null);
  assert.equal(normalizeMeta('pilot_join', 'parents-guide'), 'parents-guide');
  assert.equal(normalizeMeta('pilot_join', 'parent@example.com'), null);
  assert.equal(normalizeMeta('pilot_confirmation', 'sent'), 'sent');
  assert.equal(normalizeMeta('pilot_confirmation', 'not-sent'), 'not-sent');
  assert.equal(normalizeMeta('pilot_confirmation', 'parent@example.com'), null);
  assert.equal(normalizeMeta('project_share', 'creator'), 'creator');
  assert.equal(normalizeMeta('project_share', 'a private project title'), null);
  assert.equal(normalizeMeta('project_remix', 'game'), 'game');
  assert.equal(normalizeMeta('project_remix', 'a private project title'), null);
  assert.equal(normalizeMeta('project_personalize', 'change the title to my school name'), null);
  assert.equal(normalizeMeta('activation_account_gate', 'save'), 'save');
  assert.equal(normalizeMeta('activation_account_gate', 'private project title'), null);
  assert.equal(normalizeMeta('activation_next_step', 'publish'), 'publish');
  assert.equal(normalizeMeta('activation_next_step', 'private project title'), null);
  assert.equal(normalizeMeta('landing_cta_click', 'hero-idea'), 'hero-idea');
});

test('limits browser-reported events to events the server cannot infer', () => {
  assert.equal(CLIENT_REPORTED_EVENTS.has('acquisition_visit'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('landing_cta_click'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('learning_start'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('parent_guide_view'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('guest_draft_recovered'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('parent_cta_click'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('new_account_studio_view'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('new_account_family_setup_view'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('return_use'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('pricing_view'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('pricing_interest'), false);
  assert.equal(CLIENT_REPORTED_EVENTS.has('pilot_join'), false);
  assert.equal(CLIENT_REPORTED_EVENTS.has('pilot_confirmation'), false);
  assert.equal(CLIENT_REPORTED_EVENTS.has('family_child_created'), false);
  assert.equal(CLIENT_REPORTED_EVENTS.has('project_share'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('project_personalize'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('activation_account_gate'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('activation_next_step'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('signup_complete'), false);
  assert.equal(CLIENT_REPORTED_EVENTS.has('project_remix'), false);
});

test('requires a fixed metadata value whenever an event has a metadata vocabulary', () => {
  assert.equal(eventRequiresMeta('project_share'), true);
  assert.equal(eventRequiresMeta('pricing_view'), false);
  assert.equal(eventRequiresMeta('unknown_event'), false);
});

test('reduces project types to a short non-content category', () => {
  assert.equal(projectCategory('portfolio'), 'website');
  assert.equal(projectCategory('memory'), 'game');
  assert.equal(projectCategory('drawing'), 'tool');
  assert.equal(projectCategory('a unique user prompt'), 'other');
});

test('accepts only anonymous version-four journey identifiers', () => {
  assert.equal(
    normalizeJourneyId('123e4567-e89b-42d3-a456-426614174000'),
    '123e4567-e89b-42d3-a456-426614174000'
  );
  assert.equal(normalizeJourneyId('parent@example.com'), null);
  assert.equal(normalizeJourneyId('123e4567-e89b-12d3-a456-426614174000'), null);
});

test('accepts only short privacy-safe campaign codes', () => {
  assert.equal(normalizeCampaignCode('Creator-01'), 'creator-01');
  assert.equal(normalizeCampaignCode('ig-july-26'), 'ig-july-26');
  assert.equal(normalizeCampaignCode('parent@example.com'), null);
  assert.equal(normalizeCampaignCode('a private full name'), null);
  assert.equal(normalizeCampaignCode('x'), null);
  assert.equal(normalizeCampaignCode('creator-code-that-is-far-too-long'), null);
});
