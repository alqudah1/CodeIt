'use strict';

// /learn-python-for-kids carried "16 Interactive Lessons" in its <title> and
// "31 interactive browser lessons" in its description, on the same page, at the
// same time. The curriculum grew and one of the two was updated. The title is
// the line a person reads in a search result, so the stale half was the half
// that mattered, and it advertised half the course.
//
// Counting the files is the only source that cannot go stale, because adding a
// lesson is what changes it.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { PAGES, HOME_PAGE, renderRouteDocument } = require('./generate-static-seo.js');

const CLAIM = /(\d+)\s+(?:interactive\s+)?(?:browser\s+)?lessons\b/gi;

test('every lesson count in rendered copy matches the lesson files', () => {
  const real = fs
    .readdirSync(path.resolve(__dirname, '../src/pages/Lessons/lessonData'))
    .filter((name) => /^lesson\d+\.js$/.test(name)).length;
  assert.ok(real > 0, 'no lesson data files found');

  const template = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  let checked = 0;

  for (const page of [HOME_PAGE, ...PAGES]) {
    const text = renderRouteDocument(template, page).replace(/<[^>]+>/g, ' ');
    for (const match of text.matchAll(CLAIM)) {
      checked += 1;
      assert.equal(Number(match[1]), real,
        `${page.route || '/'} claims "${match[0]}" but there are ${real} lesson files`);
    }
  }

  // A scan that matches nothing passes, and passing for that reason is worse
  // than failing, because it reads as coverage.
  assert.ok(checked > 0, 'no lesson-count claim was found; this test is not doing anything');
});
