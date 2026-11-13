'use strict';

// ── What a machine reads, checked as carefully as what a person reads ───────
//
// This site renders twice. React renders what a person sees; this generator
// writes the HTML that crawlers and assistants read, because neither runs
// JavaScript. The React half has had tests for a long time. The generated
// half is where the two most expensive mistakes of the last month both lived,
// and neither was caught by anything:
//
//   · Google described CodeIt as a product for children aged 5 to 12 for
//     weeks, because a managed-profile age range sat in crawlable text near
//     an audience claim. That was fixed in nine guide pages and in the one
//     sentence everyone looked at. Three more survived it: an eyebrow reading
//     "Ages 5-18" on the first-game page, "Managed profiles for ages 5 to 12"
//     on the privacy page, and "Independent student accounts are for ages
//     13-18. Younger learners aged 5-12" in the terms. The second of those is
//     the literal phrase Google was echoing.
//
//   · Five routes declared a second SoftwareApplication of their own, named
//     with the page's headline and marked isAccessibleForFree, on pages that
//     already inherit the real application and its two offers. On the home
//     page that meant two products, one of them free and called "Write your
//     first Python program. Run it. Make the message yours."
//
// Both are the same kind of mistake: the machine-readable half saying
// something nobody would write on purpose, in a place nobody reads.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAW = fs.readFileSync(path.join(__dirname, 'generate-static-seo.js'), 'utf8');

/**
 * The generator's lines with its comments removed.
 *
 * The comments explain the wrong copy by quoting it, so a scan of the raw
 * file finds what it is looking for inside the note saying it was removed.
 */
function codeLines() {
  const out = [];
  let inBlock = false;
  RAW.split('\n').forEach((line, index) => {
    const text = line.trim();
    if (text.startsWith('/*')) inBlock = true;
    if (inBlock) {
      if (text.includes('*/')) inBlock = false;
      return;
    }
    if (text.startsWith('//') || text.startsWith('*')) return;
    out.push({ number: index + 1, text: line });
  });
  return out;
}

test('no age is written as a range anywhere in the crawlable copy', () => {
  // The audience, "ages 8 to 14", is stated through one constant that every
  // page interpolates, so it never appears as a literal here. Anything this
  // finds is a second age range: a different number beside the audience, or
  // the managed-profile range the site deliberately writes as a floor.
  const range = /(?:ages?|aged)\s*\d{1,2}\s*(?:to|-|–|—|and)\s*\d{1,2}/i;
  const found = codeLines()
    .filter(line => range.test(line.text))
    .map(line => `line ${line.number}: ${line.text.match(range)[0]}`);

  assert.deepEqual(found, [],
    'an age range is written into the crawlable copy. The site states one '
    + 'audience through the AGES constant and writes every other age rule as '
    + 'a floor, because a second range beside the audience is what had Google '
    + 'calling this a 5-to-12 product.');
});

test('no page declares an application of its own', () => {
  // Every generated page inherits the real SoftwareApplication, its category
  // and its two offers from the template. A page that declares another one
  // is declaring a second product at the same URL.
  const found = codeLines()
    .filter(line => /type:\s*'SoftwareApplication'/.test(line.text))
    .map(line => `line ${line.number}`);

  assert.deepEqual(found, [],
    'a route is typed SoftwareApplication. Pages about the product are '
    + 'WebPages; the product itself is declared once, in public/index.html.');
});

test('only the free lesson course is marked accessible for free', () => {
  // isAccessibleForFree on a node with no offers is how the home page came to
  // carry a free copy of the application beside the one that costs CA$12 a
  // month. The lesson path really is free on every plan, so the Course keeps
  // it. Nothing else may.
  const lines = codeLines();
  const flags = lines.filter(line => /isAccessibleForFree/.test(line.text));
  assert.strictEqual(flags.length, 1,
    `isAccessibleForFree is set ${flags.length} times. Only the lessons Course `
    + 'may claim it; what a plan costs is carried by the offers in the template.');

  // The nearest @type above it has to be the Course, or it has moved onto
  // something that is not free.
  const above = lines.filter(line => line.number < flags[0].number);
  const lastType = [...above].reverse().find(line => /'@type':/.test(line.text));
  assert.match(lastType.text, /Course/,
    `isAccessibleForFree now sits under ${lastType.text.trim()}, not the Course.`);
});
