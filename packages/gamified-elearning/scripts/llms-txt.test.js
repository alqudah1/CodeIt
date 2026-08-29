'use strict';

/**
 * The file written for language models should mention the pages written to
 * answer questions.
 *
 * llms.txt listed thirteen product pages and none of the fifteen guides. A
 * model fetching it learned what CodeIt sells and nothing about what CodeIt
 * knows, which is backwards: the guides are the only part of this site written
 * to be the best answer to a question rather than a description of a product.
 *
 * It was also hand-maintained, which on this site has been a dependable way to
 * make something stop being true — the sitemap, the alias list, the lesson
 * count and the noindex rules all went that way. The guide section is generated
 * now, so it cannot drift.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { writeLlmsTxt } = require('./generate-static-seo.js');
const { loadGuidePages } = require('./content-loader');

function generated() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llms-'));
  writeLlmsTxt(dir);
  return fs.readFileSync(path.join(dir, 'llms.txt'), 'utf8');
}

test('every guide appears in llms.txt', () => {
  const text = generated();
  const guides = loadGuidePages();
  assert.ok(guides.length > 0, 'no guides loaded; this test examined nothing');

  for (const guide of guides) {
    assert.ok(
      text.includes(`/guide/${guide.slug}`),
      `llms.txt does not mention /guide/${guide.slug}`
    );
    assert.ok(
      text.includes(guide.h1),
      `llms.txt lists /guide/${guide.slug} without saying what question it answers`
    );
  }
});

test('llms.txt keeps the hand-written part above the generated guides', () => {
  const text = generated();
  assert.match(text, /^# CodeIt/, 'the hand-written opening was lost');
  assert.ok(text.includes('## Guides'), 'the generated section is missing');
  assert.ok(
    text.indexOf('Canonical website') < text.indexOf('## Guides'),
    'the generated section has overwritten the hand-written part rather than following it'
  );
});

test('regenerating twice produces the same file', () => {
  // The build runs on every deploy. A file that differs each time is noise in
  // the diff and, worse, a changed llms.txt implies to anything watching that
  // the content changed when it did not.
  assert.equal(generated(), generated());
});

test('each listed guide carries the date its facts were checked', () => {
  const text = generated();
  for (const guide of loadGuidePages()) {
    assert.ok(
      text.includes(`Last checked ${guide.lastVerified}`),
      `llms.txt lists /guide/${guide.slug} with no verification date`
    );
  }
});
