'use strict';

// ── The sentence a machine quotes, not the one we meant it to ───────────────
//
// Measured on 7 November 2026, from Google, on the two queries this site wins:
//
//   "free python for kids"  — organic 1, named in the AI Overview
//   "python for kids free"  — organic 2, named in the AI Overview
//
// Both overviews described CodeIt, word for word, as:
//
//   "CodeIt: Offers free, self-paced, gamified Python lessons for kids aged 5
//    to 12 (with independent accounts for ages 13+)."
//
// Wrong on the one fact the age work exists to get right, and it sells the
// product as younger than it is. The whole reason src/config/company.js names
// a single range is that "an assistant asked for coding for a 9 year old
// matches products that are FOR nine-year-olds". Google was answering 5 to 12.
//
// It cited /learn-python-for-kids, so it had read the page, where "Built for
// ages 8 to 14" appears first. What it summarised instead was the account
// sentence further down:
//
//   "profiles for ages 5 to 12 work this way, and independent student accounts
//    begin at 13"
//
// Two ranges either side of an "and" is a more quotable shape than a plain
// statement, so that is what got quoted. Spelling the dash as "to" does
// nothing about it; the structure is the problem, and no test could see it,
// because every age guard in this repo asks whether the right range is present
// and none asks whether a wrong one can be assembled from what is.
//
// This one does. It is about shape, not correctness: a published sentence may
// state the managed-profile floor, and may say independent accounts begin at
// 13, but it may not put a 5-to-12 range in the same breath as the audience.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { PAGES, HOME_PAGE, renderRouteDocument } = require('./generate-static-seo.js');
const { loadCompany } = require('./content-loader');

const COMPANY = loadCompany();
const TEMPLATE = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
const LLMS = fs.readFileSync(path.resolve(__dirname, '../public/llms.txt'), 'utf8');

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ');
}

// "ages 5 to 12", "5–12", "aged 5 to 12", and the spelled variants.
const MANAGED_AS_RANGE = new RegExp(
  `ages?d?\\s*${COMPANY.MANAGED_RANGE.from}\\s*(?:to|–|—|-)\\s*${COMPANY.MANAGED_RANGE.to}`,
  'i'
);

// The audience claim, in any of the forms the site writes it.
const AUDIENCE = new RegExp(
  `(?:built for|audience|for kids|for learners|for children|suits)[^.]{0,60}`
  + `${COMPANY.AGE_RANGE.from}\\s*(?:to|–|—|-)\\s*${COMPANY.AGE_RANGE.to}`,
  'i'
);

/**
 * How close is the managed range to an audience claim? Measured in characters
 * of visible text, because that is roughly what an extractive summariser sees
 * as "the same place on the page".
 */
function proximity(text) {
  const managed = MANAGED_AS_RANGE.exec(text);
  if (!managed) return null;
  const audience = AUDIENCE.exec(text);
  if (!audience) return { managedAt: managed.index, audienceAt: null, gap: null };
  return {
    managedAt: managed.index,
    audienceAt: audience.index,
    gap: Math.abs(managed.index - audience.index),
    quote: text.slice(Math.max(0, managed.index - 120), managed.index + 120).trim(),
  };
}

// ── Two rules, and why not a third ─────────────────────────────────────────
//
// The first version of this test forbade the managed range anywhere. It failed
// on about twenty sentences of the form "managed profiles for ages 5 to 12
// cannot publish projects", which are a different claim: the range there is
// attached to a permission, not to an audience, and no summariser is going to
// turn "cannot publish" into "this is for 5 to 12 year olds". Forbidding them
// would have meant rewriting the guides to say less, to satisfy a rule wider
// than the problem.
//
// So: the two ranges may not share a sentence, anywhere. And on the pages whose
// job includes saying who CodeIt is for, which are the pages Google quotes when
// someone asks, the managed range is not written as a range at all.

/** Visible text, split into sentences. Crude on purpose: it is how a reader reads. */
function sentences(text) {
  return text.split(/(?<=[.!?])\s+/);
}

test('the two ranges never share a sentence', () => {
  // This is the shape that produced the wrong answer, at its tightest. Three
  // guide pages had "Built for ages 8 to 14, with parent-managed, email-
  // verified private profiles for ages 5 to 12 and independent accounts from
  // 13" — both ranges and a third number, in one breath.
  const offenders = [];
  for (const page of [HOME_PAGE, ...PAGES]) {
    const text = visibleText(renderRouteDocument(TEMPLATE, page));
    for (const sentence of sentences(text)) {
      if (MANAGED_AS_RANGE.test(sentence) && AUDIENCE.test(sentence)) {
        offenders.push(`${page.route || '/'}: "${sentence.trim().slice(0, 170)}"`);
      }
    }
  }
  assert.deepStrictEqual(
    offenders, [],
    'the audience range and the managed-profile range share a sentence here, '
    + 'which is the shape Google read as "lessons for kids aged 5 to 12":\n  '
    + offenders.join('\n  ')
  );
});

test('the pages that say who CodeIt is for do not write the managed range as a range', () => {
  // These are the pages that answer an audience question, and the ones Google
  // cited while getting the answer wrong. Elsewhere the range may appear
  // attached to a permission ("managed profiles for ages 5 to 12 cannot
  // publish"), because that is a claim about publishing and reads as one.
  const AUDIENCE_PAGES = ['/', '/learn-python-for-kids', '/coding-for-kids', '/press', '/about'];
  const offenders = [];
  for (const route of AUDIENCE_PAGES) {
    const page = route === '/' ? HOME_PAGE : PAGES.find((item) => item.route === route);
    assert.ok(page, `${route} is no longer generated`);
    const text = visibleText(renderRouteDocument(TEMPLATE, page));
    for (const sentence of sentences(text)) {
      if (!MANAGED_AS_RANGE.test(sentence)) continue;
      // A permission claim is allowed to name the range.
      if (/cannot publish|not publish|publish(?:ing)? (?:is|are)? ?(?:not|never)/i.test(sentence)) continue;
      offenders.push(`${route}: "${sentence.trim().slice(0, 170)}"`);
    }
  }
  assert.deepStrictEqual(
    offenders, [],
    'these are pages a parent reads to find out who CodeIt is for, and they '
    + 'state a second age range that is not the audience:\n  '
    + offenders.join('\n  ')
  );
});

test('llms.txt does not either, since it is read by machines and nothing else', () => {
  const hit = proximity(LLMS.replace(/\s+/g, ' '));
  assert.equal(
    hit, null,
    `llms.txt states the managed range as a range: "${hit && hit.quote}"`
  );
});

test('the audience range is still stated, so this did not fix one thing by losing another', () => {
  // The rule above is satisfiable by saying nothing about ages. Guard the other
  // side: the pages that exist to answer "what age is this for" still answer it.
  const mustSayAges = ['/learn-python-for-kids', '/coding-for-kids', '/press'];
  for (const route of mustSayAges) {
    const page = PAGES.find((item) => item.route === route);
    assert.ok(page, `${route} is no longer generated`);
    const text = visibleText(renderRouteDocument(TEMPLATE, page));
    assert.match(
      text, new RegExp(COMPANY.AGE_RANGE.short, 'i'),
      `${route} no longer states "${COMPANY.AGE_RANGE.short}"`
    );
  }
  assert.match(LLMS, new RegExp(COMPANY.AGE_RANGE.short, 'i'), 'llms.txt no longer states the range');
});

test('the under-13 rule is still published, because it is the legal one', () => {
  // Removing the range must not remove the fact. A parent of a nine-year-old
  // has to be able to find out that they set the account up, and from what age.
  const page = PAGES.find((item) => item.route === '/learn-python-for-kids');
  const text = visibleText(renderRouteDocument(TEMPLATE, page));
  assert.match(text, /managed profile/i, 'the managed-profile route is no longer explained');
  assert.match(
    text, new RegExp(`from age ${COMPANY.MANAGED_RANGE.from}`, 'i'),
    `the floor of ${COMPANY.MANAGED_RANGE.from} is no longer stated anywhere on the page`
  );
  assert.match(text, /13 or over/i, 'the independent-account age is no longer stated');
});
