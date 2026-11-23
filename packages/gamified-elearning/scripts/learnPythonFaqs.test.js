'use strict';

// The questions on /learn-python-for-kids were only in the React component,
// so the HTML a crawler gets first had none of them and no FAQPage. Both
// halves now read src/data/learnPythonFaqs.js. This fails if the crawlable
// page loses them, or if the lesson-length answer stops matching the lessons.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES } = require('./generate-static-seo');

const page = PAGES.find((p) => p.route === '/learn-python-for-kids');

test('the crawlable Python page carries the questions', () => {
  assert.ok(page.faqs && page.faqs.length >= 6, 'the questions are missing');
  const qs = page.faqs.map((f) => f.q);
  assert.ok(qs.includes('Can kids learn Python online for free?'));
  assert.ok(qs.includes('How long does each Python lesson take?'));
});

test('the step count stated is the step count the lessons have', () => {
  const dir = path.join(__dirname, '../src/pages/Lessons/lessonData');
  const counts = fs.readdirSync(dir)
    .filter((f) => /^lesson\d+\.js$/.test(f))
    .map((f) => {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      const steps = src.slice(src.indexOf('steps: ['));
      return (steps.match(/^\s{4}\{\s*$/gm) || []).length;
    });
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const answer = page.faqs.find((f) => f.q === 'How long does each Python lesson take?').a;
  assert.ok(answer.includes(`${words[min]} to ${words[max]} short steps`), `lessons have ${min} to ${max} steps`);
  assert.ok(!/\d+ to \d+ minutes/.test(answer), 'a time per lesson has nothing behind it');
});
