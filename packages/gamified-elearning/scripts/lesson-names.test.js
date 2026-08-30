'use strict';

/**
 * One lesson, two names, on the same site.
 *
 * The generator carried a hand-typed title for each of the thirty-one lessons,
 * beside the topic sentence it also needs. The lesson data files carry their
 * own titles. They had drifted apart on nine of thirty-one, and the two most
 * visible surfaces disagreed: /lessons announced "Lesson 25: Return Values"
 * while /lesson/25 was titled "Functions That Give Things Back".
 *
 * Nothing was factually wrong, which is why it survived. A crawler asked what
 * lesson 25 is called gets a different answer depending on which page it read,
 * and that is the kind of inconsistency that costs an entity its coherence
 * without ever being a mistake anyone could point at.
 */

const test = require('node:test');
const assert = require('node:assert');

const { PAGES } = require('./generate-static-seo.js');
const { loadLessons } = require('./content-loader');

const LESSON_DATA = loadLessons();
const LESSON_PAGES = PAGES.filter((page) => /^\/lesson\/\d+$/.test(page.route));
const INDEX = PAGES.find((page) => page.route === '/lessons');

test('every lesson page is named by its own lesson file', () => {
  assert.ok(LESSON_PAGES.length > 20, `only ${LESSON_PAGES.length} lesson pages were examined`);

  for (const page of LESSON_PAGES) {
    const number = Number(page.route.split('/')[2]);
    const data = LESSON_DATA.get(number);
    assert.ok(data, `lesson ${number} has a page and no data file`);
    assert.equal(
      page.h1,
      data.title,
      `/lesson/${number} is headed "${page.h1}" and its lesson file calls it "${data.title}"`
    );
  }
});

test('the index calls a lesson what its own page calls it', () => {
  assert.ok(INDEX, 'the lessons index is missing');

  for (const page of LESSON_PAGES) {
    const number = Number(page.route.split('/')[2]);
    const heading = INDEX.sections.find((section) => section.heading.startsWith(`Lesson ${number}:`));
    assert.ok(heading, `the index does not list lesson ${number}`);
    assert.equal(
      heading.heading,
      `Lesson ${number}: ${page.h1}`,
      `the index and /lesson/${number} give the lesson different names`
    );
  }
});

test('a lesson title does not run on past its own subtitle', () => {
  // Lessons 17 onward are titled "Classes and Objects. Your Own Kind of Thing".
  // That is right as a heading. In a <title>, where the template appends "for
  // Beginners", it produced a sentence that carried on past its own full stop.
  let withSubtitles = 0;
  for (const page of LESSON_PAGES) {
    const number = Number(page.route.split('/')[2]);
    const full = LESSON_DATA.get(number).title;
    if (!/\.\s+\S/.test(full)) continue;

    withSubtitles += 1;
    const subtitle = full.split(/\.\s+/).slice(1).join('. ').trim();
    assert.ok(
      !page.title.includes(subtitle),
      `/lesson/${number} puts its subtitle in the page title: "${page.title}"`
    );
    assert.ok(
      page.title.includes(full.split(/\.\s+/)[0]),
      `/lesson/${number} lost its own name from the page title: "${page.title}"`
    );
  }

  assert.ok(
    withSubtitles > 5,
    `only ${withSubtitles} lessons have a subtitle; this test examined almost nothing`
  );
});
