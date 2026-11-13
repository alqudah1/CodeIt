'use strict';

// ── The crawlable half of the one page that sells ───────────────────────────
//
// This site renders twice. React renders the page a person sees, and
// generate-static-seo.js writes the HTML a crawler and an assistant read,
// because neither runs JavaScript. pricingClaims.test.js guards the first
// half against promising something Plus does not unlock. Nothing guarded the
// second.
//
// So while the React pricing page listed exactly what Plus gives, the
// crawlable one still carried the Founding Family pilot: its name in the
// eyebrow, "Join the family pilot" as the heading, and the pilot's own
// feature list — guided setup, parent visibility, a direct feedback channel —
// as what the paid plan adds. The pilot closed when paid plans opened. The
// heading is also what becomes the WebPage name in the structured data, so
// the page was telling every machine that read it to join something that no
// longer exists.
//
// These tests read the generator's own pricing entry and check it against the
// plans the server actually enforces, so the two halves cannot drift apart
// again without something going red.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { PLANS } = require('../../codeit-backend/entitlements');

const RAW = fs.readFileSync(path.join(__dirname, 'generate-static-seo.js'), 'utf8');

// Comments explain the wrong copy by quoting it, so a scan of the raw file
// finds the thing it is looking for in the note saying it was removed. Only
// what the generator actually writes counts.
const SOURCE = RAW.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** The /pricing entry's fields, read out of the generator's own source. */
function pricingEntry() {
  const start = SOURCE.indexOf("route: '/pricing'");
  assert.notStrictEqual(start, -1, 'the generator no longer has a /pricing entry');
  const block = SOURCE.slice(start, SOURCE.indexOf('},', start));
  const field = (name) => {
    const found = block.match(new RegExp(`${name}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
    return found ? found[1].replace(/\\'/g, "'") : '';
  };
  return {
    eyebrow: field('eyebrow'),
    h1: field('h1'),
    intro: field('intro'),
    detail: field('detail'),
    all: ['eyebrow', 'h1', 'intro', 'detail'].map(field).join(' '),
  };
}

test('the crawlable pricing page does not sell the closed pilot', () => {
  const { all } = pricingEntry();
  assert.ok(!/pilot/i.test(all), `the crawlable pricing copy still says: "${all}"`);
  assert.ok(
    !/founding/i.test(all),
    'the Founding Family plan is not on sale and must not be offered here'
  );
});

test('it names the price the server charges', () => {
  const { all } = pricingEntry();
  assert.ok(
    all.includes(PLANS.plus.priceLabel.replace('/month', ' a month')) || all.includes(PLANS.plus.priceLabel),
    `the copy does not state ${PLANS.plus.priceLabel}: "${all}"`
  );
});

test('what it says Plus adds is what Plus actually adds', () => {
  // Two real differences, both numbers the server enforces. A crawler reading
  // this page should be able to state them, and should not be able to come
  // away with a third thing that no plan gate backs.
  const { all } = pricingEntry();
  assert.ok(
    all.includes(String(PLANS.free.monthlyAiBuilds)) || /ten a month/i.test(all),
    `the free AI build limit of ${PLANS.free.monthlyAiBuilds} is not stated`
  );
  assert.ok(
    /four children|four learner|up to four/i.test(all),
    `the Plus child limit of ${PLANS.plus.maxChildProfiles} is not stated`
  );
  assert.strictEqual(PLANS.plus.maxChildProfiles, 4, 'the copy says four; the plan must too');
  assert.strictEqual(PLANS.free.monthlyAiBuilds, 10, 'the copy says ten; the plan must too');
});

test('it does not promise anything the free plan already includes', () => {
  // The failure this is for: the pilot's feature list stayed on the page
  // after the pilot closed, so the crawlable copy sold guided setup, parent
  // visibility and a direct feedback channel as what the money buys. Nothing
  // in entitlements.js gates any of them.
  const { all } = pricingEntry();
  for (const claim of [/guided setup/i, /direct feedback/i, /parent visibility/i]) {
    assert.ok(!claim.test(all), `the copy sells "${claim}", which no plan gate backs`);
  }
});

test('no age is written as a range in the crawlable terms copy', () => {
  // Google described CodeIt as a product for children aged 5 to 12 for weeks.
  // The cause was a managed-profile age range sitting in crawlable text next
  // to an audience claim; writing the rule as a floor instead fixed it within
  // two days. The terms entry still carried "Student accounts are for ages
  // 13-18", which was both a range and no longer true, since an adult can
  // hold a learner account now.
  const start = SOURCE.indexOf("route: '/terms'");
  assert.notStrictEqual(start, -1, 'the generator no longer has a /terms entry');
  const block = SOURCE.slice(start, SOURCE.indexOf('},', start));
  const ranges = block.match(/ages?\s*\d{1,2}\s*(?:to|-|–|—)\s*\d{1,2}/gi) || [];
  const allowed = /ages?\s*8\s*(?:to|-|–)\s*14/i;   // the audience, which is the one range this site states
  assert.deepEqual(
    ranges.filter((r) => !allowed.test(r)), [],
    'an age range other than the 8 to 14 audience is written into the crawlable terms copy'
  );
});
