'use strict';

// ── The structured data nobody was reading ──────────────────────────────────
//
// public/index.html carries a JSON-LD graph that every one of the 89 generated
// pages inherits. Its Offer said:
//
//   { "price": "0", "priceCurrency": "USD" }
//
// CodeIt is sold in Canadian dollars and nothing else. So the only
// machine-readable price on the whole site, on all 89 pages including /pricing
// itself, declared the wrong currency and declared the product free full stop,
// with no mention of the plan it actually sells. src/config/pricing.js opens
// with a note about the price having been stated four different ways and says
// it is now written in one place. This was the fifth way, and that note could
// not reach it: pricing.js is a React module and this is a static HTML file.
//
// It survived a test suite that has a file called stated-numbers.test.js,
// because that file reads this template and then does this:
//
//   .replace(/<script[\s\S]*?<\/script>/gi, ' ')
//
// which is right for its own purpose, since it measures what a person reads.
// The effect is that the one block on the page that states a number to a
// machine is the one block the number guard removes. Google, and every
// assistant that parses schema.org, reads exactly what that line deletes.
//
// So this test reads it instead.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { loadPricing } = require('./content-loader');

const PRICING = loadPricing();
const TEMPLATE = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');

function graph() {
  const blocks = [...TEMPLATE.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  )].map((match) => match[1]);
  assert.equal(blocks.length, 1, 'expected exactly one JSON-LD block in the page template');
  // The template is a CRA source file, so it still holds build placeholders.
  const parsed = JSON.parse(blocks[0].replace(/%PUBLIC_URL%/g, ''));
  return parsed['@graph'] || [parsed];
}

function offersOf(node) {
  const offers = node.offers;
  if (!offers) return [];
  return Array.isArray(offers) ? offers : [offers];
}

/** Every string anywhere in the graph, with the path that leads to it. */
function strings(value, trail = '$') {
  if (typeof value === 'string') return [[trail, value]];
  if (Array.isArray(value)) return value.flatMap((item, i) => strings(item, `${trail}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => strings(item, `${trail}.${key}`));
  }
  return [];
}

test('the template JSON-LD is valid JSON and a graph', () => {
  const nodes = graph();
  assert.ok(nodes.length > 0);
  for (const node of nodes) assert.ok(node['@type'], 'every node needs an @type');
});

test('every price in the structured data is in the currency CodeIt sells in', () => {
  for (const [trail, value] of strings(graph(), '@graph')) {
    if (!/priceCurrency$/.test(trail)) continue;
    assert.equal(
      value, PRICING.CURRENCY,
      `${trail} is ${value}, and CodeIt sells in ${PRICING.CURRENCY}. This is the `
      + 'price Google and every schema.org parser reads. An aggregator that '
      + 'converts from the wrong currency publishes a price nobody charges.'
    );
  }
});

test('the paid plan is declared, at the price the pricing page prints', () => {
  const apps = graph().filter((node) => node['@type'] === 'SoftwareApplication');
  assert.ok(apps.length > 0, 'no SoftwareApplication node to carry an offer');

  const offers = apps.flatMap(offersOf);
  assert.ok(offers.length > 0, 'the application declares no offer at all');

  // Free has to still be there: it is the true headline and the reason a
  // family tries this at all.
  const free = offers.filter((offer) => String(offer.price) === '0');
  assert.ok(free.length > 0, 'the free plan is no longer declared');

  // And the subscription, because declaring only "free" while charging monthly
  // is how an assistant ends up telling a parent CodeIt has no paid plan.
  const paidPrices = offers.flatMap((offer) => {
    const spec = offer.priceSpecification;
    const candidates = [offer.price, spec && spec.price];
    return candidates.filter((price) => price !== undefined && String(price) !== '0');
  }).map(Number);

  assert.ok(
    paidPrices.includes(PRICING.AMOUNT),
    `the structured data does not declare the ${PRICING.PRICE_PER_INTERVAL} plan. `
    + `Prices found: ${JSON.stringify(paidPrices)}.`
  );
});

test('a recurring price says what period it recurs over', () => {
  // A bare price of 12 on a subscription reads as a one-off purchase of
  // CA$12, which is a different and much better-sounding product than the one
  // being sold.
  const specs = graph()
    .filter((node) => node['@type'] === 'SoftwareApplication')
    .flatMap(offersOf)
    .map((offer) => offer.priceSpecification)
    .filter(Boolean);

  const recurring = specs.filter((spec) => Number(spec.price) === PRICING.AMOUNT);
  assert.ok(recurring.length > 0, `no priceSpecification carries ${PRICING.AMOUNT}`);
  for (const spec of recurring) {
    assert.equal(spec['@type'], 'UnitPriceSpecification');
    assert.ok(spec.referenceQuantity, 'a recurring price needs a referenceQuantity');
    assert.equal(
      spec.referenceQuantity.unitCode, 'MON',
      `the plan is billed by the ${PRICING.INTERVAL}, so the reference quantity has to say so`
    );
  }
});

test('every offer carries a top-level price, which is what Google requires', () => {
  // This test used to accept the price in either place: on the offer, or
  // inside its priceSpecification. That is how the paid plan shipped on all
  // 89 pages with no offers.price at all — the price lived only inside a
  // UnitPriceSpecification, which I had put there in the same change.
  //
  // Google's Software App reference lists offers.price as required and does
  // not mention priceSpecification as an alternative:
  //   developers.google.com/search/docs/appearance/structured-data/software-app
  //
  // So the only price a machine could read on this site was the free plan's
  // zero. For a product whose whole problem is that assistants describe it as
  // free and never mention that it sells anything, that is not a detail.
  //
  // priceSpecification stays: it is what says the 12 recurs monthly. It is an
  // addition to the price, not a place to keep it.
  const offers = graph()
    .filter((node) => node['@type'] === 'SoftwareApplication')
    .flatMap(offersOf);

  assert.ok(offers.length > 0, 'the application declares no offers at all');
  for (const offer of offers) {
    assert.ok(
      offer.price !== undefined,
      `the offer "${offer.name || 'unnamed'}" has no price of its own. `
      + 'A price only inside priceSpecification is a price Google does not read.'
    );
    assert.ok(
      offer.priceCurrency,
      `the offer "${offer.name || 'unnamed'}" has a price with no currency`
    );
  }
});

test('nothing in the structured data still sells the closed pilot', () => {
  // The Founding Family pilot closed when paid plans opened. The pricing
  // page's title and og:title were corrected then; its h1 was not, and the h1
  // is what becomes the WebPage name in the structured data. So the one page
  // that sells was telling every machine that read it to join a pilot that
  // does not exist.
  const offending = graph().flatMap((node) =>
    Object.entries(node)
      .filter(([, value]) => typeof value === 'string' && /pilot/i.test(value))
      .map(([key, value]) => `${node['@type']}.${key} = "${value}"`));

  assert.deepEqual(offending, [], 'the structured data still mentions the pilot');
});

test('the age range is written the way the rest of the site writes it', () => {
  // Being straight about this one: it is consistency, not a factual error.
  // audienceType read "Young creators ages 8\u201314 and beginner coders" while
  // the same range is spelled "ages 8 to 14" everywhere else, including in the
  // Organization description six lines above it in this same graph, because
  // every other instance is wired to AGE_RANGE in src/config/company.js and a
  // static HTML file cannot import it. audienceType is a field assistants
  // quote, so the two forms were being handed out side by side.
  //
  // Numeric ranges in the guide prose are a different thing and are left
  // alone: "Weeks 1\u20132" and "ages 5\u201312" are correct typography, not the
  // dash-as-punctuation habit the house rule is about.
  for (const [trail, value] of strings(graph(), '@graph')) {
    const found = value.match(/[–—]/);
    assert.equal(
      found, null,
      `${trail} contains ${found && JSON.stringify(found[0])}: ${JSON.stringify(value)}`
    );
  }
});
