'use strict';

// ── Every lesson page carries the lesson's own teaching ─────────────────────
//
// Google crawled lessons 9 and 11 and declined to index them, and never got
// to 5, 8 and 14. As a crawler read them they were step titles, code and
// "Press Run": the meaning of each part of the line a lesson takes apart,
// every question's answer and the explanation behind it, and the story that
// opens the lesson were all in the interactive app only.
//
// These tests render each lesson's crawlable page and require that teaching
// to be on it, taken from the lesson's own data, so a page cannot quietly go
// back to being a list of buttons.

const test = require('node:test');
const assert = require('node:assert');

const { PAGES, renderRouteDocument } = require('./generate-static-seo');
const { loadLessons } = require('./content-loader');

const TEMPLATE = `<!doctype html><html><head>
  <title>Home</title>
  <meta name="description" content="home" />
  <link rel="canonical" href="https://codeitlearn.com/" />
  <meta property="og:url" content="https://codeitlearn.com/" />
  <meta property="og:title" content="Home" />
  <meta property="og:description" content="home" />
  <meta name="twitter:title" content="Home" />
  <meta name="twitter:description" content="home" />
</head><body><div id="root"><main>homepage fallback</main></div></body></html>`;

const LESSONS = loadLessons();
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const textOf = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

function lessonPage(number) {
  const page = PAGES.find(p => p.route === `/lesson/${number}`);
  assert.ok(page, `/lesson/${number} is not generated`);
  return textOf(renderRouteDocument(TEMPLATE, page));
}

test('every lesson is generated, and opens with its story', () => {
  assert.strictEqual(LESSONS.size, 31);
  for (const [number, lesson] of LESSONS) {
    if (lesson.story) assert.ok(lessonPage(number).includes(norm(lesson.story)), `lesson ${number} has lost its story`);
  }
});

test('the meaning of every piece a lesson takes apart is on its page', () => {
  for (const [number, lesson] of LESSONS) {
    const text = lessonPage(number);
    for (const step of lesson.steps.filter(s => s.type === 'concept' && s.parts)) {
      for (const [, key] of step.parts.pieces || []) {
        const note = step.parts.notes && step.parts.notes[key];
        if (note) assert.ok(text.includes(norm(note)), `lesson ${number}: "${note}" is not on the page`);
      }
    }
  }
});

test('every question a lesson asks is answered on its page, with the reason', () => {
  for (const [number, lesson] of LESSONS) {
    const text = lessonPage(number);
    for (const step of lesson.steps.filter(s => s.type === 'predict')) {
      const answer = step.choices[step.correct];
      assert.ok(text.includes(`The answer: ${norm(answer)}.`), `lesson ${number}: the answer "${answer}" is missing`);
      const reason = norm(String(step.explain).replace(/^(?:Yes|Right|Correct|Exactly)[.!,]\s*/, ''));
      assert.ok(text.includes(reason), `lesson ${number}: the explanation for "${step.question}" is missing`);
    }
  }
});

test('every lesson page teaches in its own words, not in the shared links', () => {
  // Measured on the lesson's own sections, without the site links every
  // page carries. Before this, lesson 9's own text was about 160 words of
  // titles, code and "Press Run"; Google crawled it and declined to index it.
  // The thinnest lesson, lesson 1, now carries 236.
  for (const page of PAGES.filter(p => /^\/lesson\/\d+$/.test(p.route))) {
    const words = (page.sections || [])
      .flatMap(s => [s.heading, ...(s.paragraphs || []), s.code || '', s.output || '', ...(s.after || [])])
      .join(' ').split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 220, `${page.route} carries ${words} words of its own`);
  }
});

test('tap instructions are not written into a page for readers', () => {
  for (const number of LESSONS.keys()) {
    assert.ok(!/Press Run[.!]/.test(lessonPage(number)), `lesson ${number} still says "Press Run."`);
  }
});

test('removing a tap instruction never leaves half a sentence behind', () => {
  // "Press Run and watch Pixel." used to lose its first three words, so
  // lesson 1 read "This is one line of real Python. and watch Pixel." A
  // sentence that starts in lower case with "and" or "then" followed by a
  // verb is what that cut leaves; "and needs both" about the and operator
  // is a sentence about Python and is fine.
  const broken = [];
  for (const page of PAGES.filter((p) => /^\/lesson\/\d+$/.test(p.route))) {
    const text = (page.sections || []).flatMap((s) => [...(s.paragraphs || []), ...(s.after || [])]).join(' ');
    const m = text.match(/[.!?] (?:and|then) (?:see|watch|look|press|tap|run)\b[^.]*/);
    if (m) broken.push(`${page.route}: ${m[0]}`);
  }
  assert.deepEqual(broken, []);
});

test('a string piece of a line is not wrapped in a second pair of quote marks', () => {
  // Lesson 3 explained its line as '""Hello, "": A string.' to every crawler,
  // and nine other lessons did the same.
  const doubled = [];
  for (const page of PAGES.filter((p) => /^\/lesson\/\d+$/.test(p.route))) {
    for (const s of page.sections || []) {
      for (const para of s.paragraphs || []) {
        if (/^""|^''/.test(para)) doubled.push(`${page.route}: ${para.slice(0, 40)}`);
      }
    }
  }
  assert.deepEqual(doubled, []);
});
