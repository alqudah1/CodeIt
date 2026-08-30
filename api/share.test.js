'use strict';

/**
 * The unfurl is the whole growth loop, and nothing tested it.
 *
 * A child sending "play my game" to three friends is the only channel here that
 * compounds, and it lives or dies in the card WhatsApp draws. api/share.js does
 * that with string replacement against the built index.html, which is exactly
 * the kind of code that breaks silently: change a meta tag in public/index.html
 * and every replacement stops matching, with no error anywhere and a homepage
 * card on every shared link.
 *
 * These run against the real template so that is caught.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { applyShareTags, shareImageFor } = require('./share.js');

const TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, '../packages/gamified-elearning/public/index.html'),
  'utf8'
);

const PROJECT = {
  title: 'Cat Dodger',
  creator_name: 'Amina',
  project_type: 'dodge',
};

function tag(html, pattern) {
  const match = pattern.exec(html);
  return match ? match[1] : null;
}

test('every tag the shim rewrites exists in the template it rewrites', () => {
  // If one of these is renamed or dropped in public/index.html, the matching
  // replacement silently does nothing and the card falls back to the homepage.
  const REQUIRED = [
    /<title>/,
    /<link rel="canonical"/,
    /<meta property="og:title"/,
    /<meta property="og:description"/,
    /<meta property="og:image"/,
    /<meta property="og:image:alt"/,
    /<meta property="og:url"/,
    /<meta name="description"/,
    /<meta name="twitter:title"/,
    /<meta name="twitter:description"/,
    /<meta name="twitter:image"/,
    /<meta name="twitter:card"/,
  ];
  for (const pattern of REQUIRED) {
    assert.match(TEMPLATE, pattern, `public/index.html no longer contains ${pattern}`);
  }
});

test('a shared project carries its own title, creator and image', () => {
  const out = applyShareTags(TEMPLATE, PROJECT, 'codeitlearn.com', 'abc123');

  assert.equal(tag(out, /<title>([^<]*)<\/title>/), 'Cat Dodger — play it on CodeIt');
  assert.equal(
    tag(out, /<meta property="og:title" content="([^"]*)"/),
    'Cat Dodger — play it on CodeIt'
  );
  assert.match(tag(out, /<meta property="og:description" content="([^"]*)"/), /Amina/);
  assert.equal(
    tag(out, /<meta property="og:image" content="([^"]*)"/),
    'https://codeitlearn.com/brand/share-game.png'
  );
  assert.equal(
    tag(out, /<meta property="og:url" content="([^"]*)"/),
    'https://codeitlearn.com/project/abc123'
  );
});

test('the canonical points at the project, not at the homepage', () => {
  // It pointed at the homepage. og:url was right, so the unfurl looked correct
  // and the defect was invisible: the page still declared itself to be
  // codeitlearn.com/ in the one tag whose job is to answer that question.
  const out = applyShareTags(TEMPLATE, PROJECT, 'codeitlearn.com', 'abc123');

  assert.equal(
    tag(out, /<link rel="canonical" href="([^"]*)"/),
    'https://codeitlearn.com/project/abc123'
  );
  assert.equal(
    tag(out, /<meta property="og:image:alt" content="([^"]*)"/),
    'Cat Dodger — play it on CodeIt'
  );
});

test('a project title cannot inject markup into the card', () => {
  // The title is written by a child and interpolated into HTML attributes.
  const nasty = { ...PROJECT, title: '"><script>alert(1)</script>', creator_name: '<b>x</b>' };
  const out = applyShareTags(TEMPLATE, nasty, 'codeitlearn.com', 'abc123');

  assert.ok(!out.includes('<script>alert(1)</script>'), 'a title escaped its attribute');
  assert.ok(!out.includes('<b>x</b>'), 'a creator name escaped its attribute');
});

test('the image matches the kind of thing the child made', () => {
  assert.equal(shareImageFor('quiz'), '/brand/share-quiz.png');
  assert.equal(shareImageFor('portfolio'), '/brand/share-site.png');
  assert.equal(shareImageFor('dodge'), '/brand/share-game.png');
  assert.equal(shareImageFor(undefined), '/brand/share-game.png');
});

test('every share image the shim can name actually exists', () => {
  // A missing file is a broken image in every unfurl, and nothing else would
  // report it: the function returns a path, not a file.
  const brand = path.resolve(__dirname, '../packages/gamified-elearning/public');
  for (const type of ['quiz', 'website', 'dodge', undefined]) {
    const file = path.join(brand, shareImageFor(type));
    assert.ok(fs.existsSync(file), `${file} is referenced by the share card and does not exist`);
  }
});

test('a project that could not be fetched leaves the page untouched', () => {
  assert.equal(applyShareTags(TEMPLATE, null, 'codeitlearn.com', 'abc123'), TEMPLATE);
  assert.equal(applyShareTags(TEMPLATE, {}, 'codeitlearn.com', 'abc123'), TEMPLATE);
});
