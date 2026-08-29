'use strict';

/**
 * Every number the site states about the plan must be the live one.
 *
 * There was a guard for this. It looked for "\d+ assisted project builds" in the
 * guide bodies, and it passed — because all nine places that state the allowance
 * spell it out as "ten assisted project builds". The pattern matched nothing,
 * the loop never ran, and a test that examined no text reported success.
 * Changing FREE_MONTHLY_AI_BUILDS from 10 to 5 leaves nine pages saying ten and
 * the rest of the suite green.
 *
 * This reads every rendered page, in both the numeral and the spelled-out form,
 * does the same for prices, and refuses to pass if it found nothing to examine —
 * because matching nothing is exactly how the previous one succeeded.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { PAGES, HOME_PAGE, renderRouteDocument } = require('./generate-static-seo.js');
const { loadPricing } = require('./content-loader');

const PRICING = loadPricing();
const TEMPLATE = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');

const WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
};

function visibleText(page) {
  return renderRouteDocument(TEMPLATE, page)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&');
}

const ALLOWANCE = new RegExp(
  `\\b(\\d+|${Object.keys(WORDS).join('|')})\\s+assisted\\s+project\\s+builds?\\b`,
  'gi'
);

test('every stated build allowance is the live one', () => {
  let checked = 0;
  for (const page of [HOME_PAGE, ...PAGES]) {
    for (const match of visibleText(page).matchAll(ALLOWANCE)) {
      checked += 1;
      const token = match[1].toLowerCase();
      const stated = /^\d+$/.test(token) ? Number(token) : WORDS[token];
      assert.equal(
        stated,
        PRICING.FREE_MONTHLY_AI_BUILDS,
        `${page.route || '/'} says "${match[0]}" but the free allowance is ${PRICING.FREE_MONTHLY_AI_BUILDS}`
      );
    }
  }
  assert.ok(
    checked > 0,
    'no build allowance was found anywhere; this test examined nothing, which is how the previous one passed'
  );
});

test('every stated price is the live one', () => {
  let checked = 0;
  for (const page of [HOME_PAGE, ...PAGES]) {
    for (const match of visibleText(page).matchAll(/(CA|US)\$\s?(\d+(?:\.\d+)?)/g)) {
      checked += 1;
      assert.equal(
        `${match[1]}$`,
        PRICING.CURRENCY_SYMBOL,
        `${page.route || '/'} states ${match[0]}, but the live currency is ${PRICING.CURRENCY_SYMBOL}`
      );
      assert.equal(
        Number(match[2]),
        PRICING.AMOUNT,
        `${page.route || '/'} states ${match[0]}, but the live price is ${PRICING.PRICE_PER_INTERVAL}`
      );
    }
  }
  assert.ok(checked > 0, 'no price was found on any page; this test examined nothing');
});
