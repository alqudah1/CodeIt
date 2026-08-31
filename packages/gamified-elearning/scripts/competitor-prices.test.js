'use strict';

/**
 * No two pages may disagree about what a competitor costs.
 *
 * Three guides disagreed about CodeMonkey. Two said $8 individual and $13
 * family; the newest one said US$7 and US$12, on a page whose second line is
 * "Prices below were read from each product's own pricing page". The page it
 * links to says $8 and $13.
 *
 * Every price guard already in this repo passed it. They ask whether a stated
 * price is ours, or is declared in that guide's own quotedPrices. US$7 was
 * declared, truthfully, as somebody else's money. The bare "$8" on the other
 * pages was not read as a foreign currency at all, because it has no prefix.
 * Nothing anywhere compared one page to another.
 *
 * The whole argument for these guides is that the numbers were checked. A
 * competitor's price we got wrong costs more than a competitor's price we
 * never mentioned.
 */

const test = require('node:test');
const assert = require('node:assert');

const { loadGuidePages, loadCompetitorPrices, loadPricing } = require('./content-loader');

const LEDGER = loadCompetitorPrices();
const GUIDES = loadGuidePages();

/** Any money amount, with or without a currency prefix. */
const PRICE = /((?:US|CA|A|NZ)?\$)\s?(\d[\d,]*(?:\.\d{2})?)/g;

// Our own price, so a line that compares us to somebody does not read as a
// claim about them. CA$12 next to Tynker is us, and saying so once here is
// better than a guard that cannot tell.
const PRICING = loadPricing();
const OURS = `${PRICING.CURRENCY_SYMBOL}${PRICING.AMOUNT}`;

/**
 * '1,750' and '$99.99' both become numbers, so the prefix cannot hide a typo.
 *
 * Ranges are written "$100-250/month" with one currency sign for two amounts,
 * so the second half is expanded into its own price first. Without that, the
 * upper bound of every range looks unquoted and the staleness check below
 * reports prices that are on the page.
 */
function amounts(line) {
  const expanded = line.replace(
    /((?:US|CA|A|NZ)?\$)\s?(\d[\d,]*(?:\.\d{2})?)\s*[-\u2013\u2014]\s*(\d[\d,]*(?:\.\d{2})?)/g,
    (_, sign, low, high) => `${sign}${low} ${sign}${high}`
  );
  return [...expanded.matchAll(PRICE)]
    .filter((m) => `${m[1]}${m[2]}` !== OURS)
    .map((m) => Number(m[2].replace(/,/g, '')));
}

/** Lines that name exactly one vendor, so a price can be attributed honestly. */
function vendorLines(markdown) {
  const names = Object.keys(LEDGER);
  const out = [];
  for (const raw of markdown.split('\n')) {
    const named = names.filter((name) =>
      new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(raw)
    );
    if (named.length === 1) out.push([named[0], raw]);
  }
  return out;
}

test('the ledger says where each price came from and when', () => {
  assert.ok(Object.keys(LEDGER).length >= 5, 'the ledger is too small to be the real one');
  for (const [vendor, entry] of Object.entries(LEDGER)) {
    assert.match(entry.source || '', /^https:\/\//, `${vendor} has no source URL`);
    assert.match(entry.checked || '', /^\d{4}-\d{2}-\d{2}$/, `${vendor} has no checked date`);
    assert.ok(Array.isArray(entry.prices) && entry.prices.length, `${vendor} lists no prices`);
    for (const price of entry.prices) {
      assert.equal(typeof price, 'number', `${vendor} lists ${price} as something other than a number`);
    }
  }
});

test('every price a guide states beside a competitor is one that competitor charges', () => {
  const wrong = [];
  for (const guide of GUIDES) {
    for (const [vendor, line] of vendorLines(guide.markdown)) {
      const allowed = new Set(LEDGER[vendor].prices);
      for (const value of amounts(line)) {
        // Percentages, counts and years are not prices, but they do not carry a
        // currency sign either, and PRICE requires one. So anything reaching
        // here is money.
        if (!allowed.has(value)) {
          wrong.push(`/guide/${guide.slug} says ${vendor} costs ${value}; ${LEDGER[vendor].source} says ${[...allowed].join(', ')}`);
        }
      }
    }
  }
  assert.deepEqual(wrong, [], `prices this site states that the source does not:\n  ${wrong.join('\n  ')}`);
});

test('no price sits in the ledger that no page uses', () => {
  // A number nobody quotes any more is a number nobody is checking any more,
  // and it will be wrong by the time somebody copies it out of here.
  const used = new Map();
  for (const guide of GUIDES) {
    for (const [vendor, line] of vendorLines(guide.markdown)) {
      for (const value of amounts(line)) {
        if (!used.has(vendor)) used.set(vendor, new Set());
        used.get(vendor).add(value);
      }
    }
  }

  const stale = [];
  for (const [vendor, entry] of Object.entries(LEDGER)) {
    const seen = used.get(vendor) || new Set();
    for (const price of entry.prices) {
      if (!seen.has(price)) stale.push(`${vendor}: ${price}`);
    }
  }

  assert.deepEqual(stale, [], `declared but quoted nowhere, so nothing keeps them honest:\n  ${stale.join('\n  ')}`);
});

test('a price over 999 is read as one number, not chopped at the comma', () => {
  // The generator's price pattern was /\$\s?\d+(\.\d+)?/, which read "US$1,750"
  // as "US$1". Every currency-marked price above 999 therefore reached the
  // guards as a meaningless amount that no declaration could ever match, and
  // the guards reported the amount they had invented. It surfaced on
  // 31 August 2026, the first time a school site licence was written with its
  // currency marked.
  const { statedPrices } = require('./generate-static-seo.js');

  assert.deepEqual(
    statedPrices('US$1,750, US$2,500 and US$3,500 a year, or US$119.99, or CA$12.'),
    ['US$1,750', 'US$2,500', 'US$3,500', 'US$119.99', 'CA$12'],
    'a thousands separator or a trailing sentence comma is being read as part of the wrong number'
  );
});
