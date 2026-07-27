'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CLIENT_REPORTED_EVENTS,
  normalizeEventName,
  eventRequiresMeta,
  normalizeMeta,
  projectCategory,
} = require('./analyticsEvents');

test('accepts only the fixed product event vocabulary', () => {
  assert.equal(normalizeEventName('project_publish'), 'project_publish');
  assert.equal(normalizeEventName('prompt_submitted'), null);
  assert.equal(normalizeEventName({ event: 'return_use' }), null);
});

test('accepts only allowlisted metadata and never arbitrary content', () => {
  assert.equal(normalizeMeta('landing_cta_click', 'hero-build'), 'hero-build');
  assert.equal(normalizeMeta('acquisition_visit', 'instagram'), 'instagram');
  assert.equal(normalizeMeta('acquisition_visit', 'private-campaign-name'), null);
  assert.equal(normalizeMeta('parent_cta_click', 'pilot-email'), 'pilot-email');
  assert.equal(normalizeMeta('parent_cta_click', 'parent@example.com'), null);
  assert.equal(normalizeMeta('landing_cta_click', 'my private project idea'), null);
  assert.equal(normalizeMeta('return_use', 'anything'), null);
  assert.equal(normalizeMeta('pricing_interest', 'founding-family'), 'founding-family');
  assert.equal(normalizeMeta('pricing_interest', 'custom enterprise plan'), null);
  assert.equal(normalizeMeta('project_share', 'creator'), 'creator');
  assert.equal(normalizeMeta('project_share', 'a private project title'), null);
});

test('limits browser-reported events to events the server cannot infer', () => {
  assert.equal(CLIENT_REPORTED_EVENTS.has('acquisition_visit'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('landing_cta_click'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('parent_cta_click'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('return_use'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('pricing_view'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('pricing_interest'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('project_share'), true);
  assert.equal(CLIENT_REPORTED_EVENTS.has('signup_complete'), false);
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
