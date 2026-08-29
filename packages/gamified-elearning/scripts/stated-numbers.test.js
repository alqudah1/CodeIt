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
  // Deliberate scope, stated so it is not mistaken for more than it is: this
  // matches CA$ and US$ prefixed amounts only. Bare "$18" is not checked,
  // because comparison pages quote competitors' prices in their own currency
  // and flagging those would make the guard unusable on exactly the pages that
  // most need writing.
  //
  // The gap that leaves: CodeIt's own price written as a bare "$12" would pass.
  // The assertion below closes it — anywhere the product is named near a price,
  // that price must carry the currency, because "$12" means different money in
  // Toronto than it does anywhere Tynker is sold.
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

test('the live price is never written without its currency', () => {
  // First attempt at this matched "CodeIt" within 80 characters of a dollar
  // sign, and could not cross a full stop. The product name sat in the previous
  // sentence, so breaking the page on purpose did not fail the test. It passed
  // for the wrong reason, which is worse than not existing.
  //
  // This looks for the live amount with no currency in front of it. A bare
  // "$12" means different money in Toronto than in the United States, and the
  // only place that figure appears is our own plan.
  //
  // If a competitor is ever genuinely priced at the same number, this fails and
  // a person decides what to do. That is the correct outcome: a human looking
  // at an ambiguous price is the thing being protected.
  const BARE = new RegExp(`(?<!CA)(?<!US)\\$\\s?${PRICING.AMOUNT}\\b`);
  for (const page of [HOME_PAGE, ...PAGES]) {
    const match = BARE.exec(visibleText(page));
    assert.ok(
      !match,
      `${page.route || '/'} writes the price as "${match && match[0]}" with no currency`
    );
  }
});

test('a page quoting a competitor price shows the reader when it was checked', () => {
  // Competitor prices go stale silently and there is no way for the build to
  // know. The next best thing is that the reader can see the date and judge for
  // themselves, so any guide quoting money must render its own lastVerified.
  //
  // This is the honest limit of what a test can do here: it cannot tell whether
  // Tynker still costs $15, only that the page is not pretending to be timeless.
  const { loadGuidePages } = require('./content-loader');
  const MONEY = /\$\s?\d/;
  let checked = 0;

  for (const guide of loadGuidePages()) {
    if (!MONEY.test(guide.markdown)) continue;
    checked += 1;
    assert.ok(
      /^\d{4}-\d{2}-\d{2}$/.test(guide.lastVerified || ''),
      `/guide/${guide.slug} quotes a price but carries no lastVerified date`
    );
    const page = PAGES.find((entry) => entry.route === `/guide/${guide.slug}`);
    assert.ok(
      visibleText(page).includes(guide.lastVerified),
      `/guide/${guide.slug} quotes a price but never shows the reader when it was checked`
    );
  }

  assert.ok(checked > 0, 'no guide quotes a price; this test examined nothing');
});
