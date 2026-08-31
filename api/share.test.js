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

const { applyShareTags, shareImageFor, canonicalOrigin } = require('./share.js');

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

// The vocabulary below is not invented here. Every entry on the left is a
// project_type this system has actually produced: the first block is every
// `type:` designEngine.js returns, paired with the `category:` it returns
// alongside it, and the second block is what the live /api/explore was
// serving on 30 August 2026. The old version of this test asserted three
// types, all three of which the code already handled, so it could never have
// caught the bug it was supposed to guard: a one-page website was unfurling
// with the game card because the classifier matched types exactly and the
// string in the database was 'interactive-website'.
const SITE = '/brand/share-site.png';
const GAME = '/brand/share-game.png';
const QUIZ = '/brand/share-quiz.png';

const VOCABULARY = [
  // designEngine.js: category 'website'
  ['portfolio', SITE], ['restaurant', SITE], ['sports', SITE],
  ['shop', SITE], ['blog', SITE], ['landing', SITE], ['website', SITE],
  // designEngine.js: category 'game'
  ['basketball', GAME], ['clicker', GAME], ['cooking', GAME], ['dodge', GAME],
  ['maze', GAME], ['memory', GAME], ['platformer', GAME], ['puzzle', GAME],
  ['racing', GAME], ['reaction', GAME], ['runner', GAME], ['soccer', GAME],
  ['survival', GAME], ['tower', GAME], ['typing', GAME], ['game', GAME],
  // designEngine.js: category 'tool'. A tool is not a game, but there is no
  // tool card, and the game card is the closer of the two we have.
  ['calculator', GAME], ['drawing', GAME], ['flashcards', GAME],
  ['simulator', GAME], ['timer', GAME],
  // quiz has its own card, which is why the shim classifies it before
  // designEngine's 'game' category would swallow it
  ['quiz', QUIZ],
  // seen live on /api/explore, 30 August 2026
  ['interactive-website', SITE],
];

test('the image matches the kind of thing the child made', () => {
  for (const [type, expected] of VOCABULARY) {
    assert.equal(shareImageFor(type), expected,
      `project_type '${type}' unfurls with the wrong card`);
  }
  assert.equal(shareImageFor(undefined), GAME, 'no type at all must still name a card');
  assert.equal(shareImageFor(''), GAME);
});

test('a compound type is read by its words, not matched whole', () => {
  // This is the property that broke. The builder does not guarantee its
  // project_type is one bare word from a fixed list, so an exact-match
  // classifier silently mislabels anything it has not seen before.
  assert.equal(shareImageFor('interactive-website'), SITE);
  assert.equal(shareImageFor('one page website'), SITE);
  assert.equal(shareImageFor('personal_portfolio_site'), SITE);
  assert.equal(shareImageFor('MULTIPLE-CHOICE QUIZ'), QUIZ);
  assert.equal(shareImageFor('endless runner game'), GAME);
});

test('every share image the shim can name actually exists', () => {
  // A missing file is a broken image in every unfurl, and nothing else would
  // report it: the function returns a path, not a file.
  const brand = path.resolve(__dirname, '../packages/gamified-elearning/public');
  for (const [type] of [...VOCABULARY, [undefined]]) {
    const file = path.join(brand, shareImageFor(type));
    assert.ok(fs.existsSync(file), `${file} is referenced by the share card and does not exist`);
  }
});

test('a project that could not be fetched leaves the page untouched', () => {
  assert.equal(applyShareTags(TEMPLATE, null, 'codeitlearn.com', 'abc123'), TEMPLATE);
  assert.equal(applyShareTags(TEMPLATE, {}, 'codeitlearn.com', 'abc123'), TEMPLATE);
});

test('a project served over www still announces the apex, like every other page', () => {
  // Vercel serves this site on the apex and on www, and every static page says
  // the apex whichever host you reached it through. This shim built its URLs
  // from request.headers.host, so the live unfurl for a real project came back
  // with a www og:url beside an apex canonical — one project, two identities,
  // and social platforms key on og:url.
  const out = applyShareTags(TEMPLATE, PROJECT, 'www.codeitlearn.com', 'abc123');

  assert.equal(
    tag(out, /<meta property="og:url" content="([^"]*)"/),
    'https://codeitlearn.com/project/abc123'
  );
  assert.equal(
    tag(out, /<link rel="canonical" href="([^"]*)"/),
    'https://codeitlearn.com/project/abc123'
  );
  assert.equal(
    tag(out, /<meta property="og:image" content="([^"]*)"/),
    'https://codeitlearn.com/brand/share-game.png'
  );
});

test('a preview deployment does not claim to be the production domain', () => {
  // The origin is read from the template, and the template on a preview build
  // carries the production canonical, so a preview unfurl naming the real domain
  // is correct: the project it describes lives there. What must not happen is a
  // crash or an empty tag when the template has no canonical at all.
  assert.equal(canonicalOrigin('<html></html>', 'preview-xyz.vercel.app'), 'https://preview-xyz.vercel.app');
  assert.equal(canonicalOrigin(TEMPLATE, 'preview-xyz.vercel.app'), 'https://codeitlearn.com');
});

test('the origin comes from the template, not from a constant in this file', () => {
  // If the domain moves, public/index.html changes and this must follow. A
  // hardcoded origin would pass every other test in this file and be wrong.
  const moved = TEMPLATE.replace(/https:\/\/codeitlearn\.com/g, 'https://example.org');
  assert.equal(canonicalOrigin(moved, 'codeitlearn.com'), 'https://example.org');

  const out = applyShareTags(moved, PROJECT, 'codeitlearn.com', 'abc123');
  assert.equal(
    tag(out, /<meta property="og:url" content="([^"]*)"/),
    'https://example.org/project/abc123'
  );
});
