'use strict';

// The crawlable /first-game-challenge carries the same text as the page a
// person sees: the three games, the mission, the promises and the parent's
// three questions. Each sentence below has to appear in the React page, so
// if the page changes and the crawlable copy does not, this fails.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES } = require('./generate-static-seo');

const REACT = fs.readFileSync(path.join(__dirname, '..', 'src', 'pages', 'Challenge', 'FirstGameChallenge.js'), 'utf8');

test('every crawlable sentence on the challenge page is on the page a person sees', () => {
  const page = PAGES.find(p => p.route === '/first-game-challenge');
  assert.ok(page && page.sections && page.sections.length >= 4, 'the challenge page has no sections');
  const missing = [];
  for (const section of page.sections) {
    // Written for the crawlable page before the rest, and true: what a child
    // needs to take part. It has no counterpart on the real page to match.
    if (section.heading === 'What you need') continue;
    const pieces = [section.heading, ...section.paragraphs]
      // "Reaction Rush: Tap the target..." is a title and a description in the
      // React data; "Build it. Start with..." is a heading and a line.
      .flatMap(text => text.split(/(?<=^[A-Z][A-Za-z ]{2,20})[:.] /))
      .map(text => text.replace(/^[a-z]/, c => c.toUpperCase()).replace(/\.$/, ''));
    for (const piece of pieces) {
      if (piece === 'What the challenge promises') continue;
      const loose = piece.toLowerCase();
      if (!REACT.toLowerCase().includes(loose)) missing.push(piece);
    }
  }
  assert.deepEqual(missing, [], 'the crawlable challenge page says something the real page does not');
});
