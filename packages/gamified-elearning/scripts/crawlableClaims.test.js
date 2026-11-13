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

/** Every content file the generator renders, guides/ included. */
function contentFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...contentFiles(full));
    else if (/\.js$/.test(entry.name) && !/\.test\.js$/.test(entry.name)) out.push(full);
  }
  return out;
}

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

test('the managed-profile range is never interpolated into crawlable copy', () => {
  // The literal-range test above walked straight past four sentences that
  // wrote the range through a constant: "managed profiles for ${MANAGED}".
  // One of them sat in the sentence after "CodeIt is built for ages 8 to 14",
  // which is the shape that had Google describing a 5-to-12 product.
  const found = codeLines()
    .filter(line => /MANAGED_RANGE|\$\{MANAGED\}/.test(line.text))
    .map(line => `line ${line.number}: ${line.text.trim()}`);
  assert.deepEqual(found, [], 'the managed range is written into crawlable copy again');
});

test('no content the generator renders states the managed range as a range', () => {
  // The guides, the blog and the FAQ are rendered into the crawlable half
  // too, and that is where "profiles for ages 5 to 12" survived the fix:
  // fifteen pages, including the home page, /faq and /privacy. 5 to 12 is
  // only ever the managed range, so it is matched exactly; other ranges in
  // those files are facts about other products, such as ScratchJr's 5 to 7.
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const managed = /\b5\s*(?:to|-|\u2013|\u2014)\s*12\b/;
  const found = [];
  for (const full of contentFiles(dataDir)) {
    const file = path.relative(dataDir, full);
    let inBlock = false;
    fs.readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
      const text = line.trim();
      if (text.startsWith('/*')) inBlock = true;
      if (inBlock) { if (text.includes('*/')) inBlock = false; return; }
      if (text.startsWith('//') || text.startsWith('*')) return;
      if (managed.test(line)) found.push(`${file}:${i + 1}: ${line.match(managed)[0]}`);
    });
  }
  assert.deepEqual(found, [], 'the managed range is written as a range in rendered content');
});

test('nothing says CodeIt cannot run a class while it can', () => {
  // Thirteen places told Google and every assistant that CodeIt was "not a
  // schools product", had "no teacher dashboard", "no class management and
  // no bulk account creation", and was "wrong for schools". One was the
  // FAQ answer published as FAQPage schema on the home page, and one was the
  // comparison table Google's AI Mode cites at position 1 to 3 when parents
  // ask what to buy.
  //
  // All of it was true until October, when classes shipped: a teacher makes a
  // class, children join with a code and a first name, and the teacher sees
  // each child's games and sentences. What is still true (no rostering, no
  // LMS, no standards alignment, no gradebook, no district plan) is still
  // said. This fails on the false half for as long as the class routes exist.
  const classRoutes = path.join(__dirname, '..', '..', 'codeit-backend', 'routes', 'class.js');
  if (!fs.existsSync(classRoutes)) return;
  const source = fs.readFileSync(classRoutes, 'utf8');
  assert.match(source, /router\.post\('\/:code\/join'/, 'the class join route moved; re-check this test');

  const stale = /no teacher dashboards?|not a schools product|no class management|no bulk account creation|not (currently )?a fit for a school|no school or district features|and schools \|/i;
  const files = [path.join(__dirname, 'generate-static-seo.js')];
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  files.push(...contentFiles(dataDir));
  const found = [];
  for (const file of files) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return;
      const m = line.match(stale);
      if (m) found.push(`${path.basename(file)}:${i + 1}: ${m[0]}`);
    });
  }
  assert.deepEqual(found, [], 'a page says CodeIt cannot run a class, and it can');
});
