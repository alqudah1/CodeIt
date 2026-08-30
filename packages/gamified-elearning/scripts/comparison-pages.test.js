'use strict';

/**
 * A comparison page that silently compares fewer things than it says it does.
 *
 * ItemList schema is built by matching a page's declared comparesOptions against
 * its own <h2> headings and keeping the ones that appear in both. That is the
 * right way round — it refuses to claim a section the page does not have — but
 * it fails quietly in the other direction. Rename a heading from "Tynker" to
 * "Tynker, and when it is still right" and that option drops out of the schema
 * with no error, no warning, and a page that still looks correct to a reader.
 *
 * Comparison is the format that outranks this site: every roundup that owns
 * "best coding platform for kids" is one. The schema is how an assistant reads
 * what the options are, so an option missing from it is an option that does not
 * exist as far as the answer is concerned.
 */

const test = require('node:test');
const assert = require('node:assert');

const { PAGES, pageSchema } = require('./generate-static-seo.js');

const COMPARISONS = PAGES.filter((page) => Array.isArray(page.comparesOptions));

function headings(page) {
  return [...String(page.bodyHtml || '').matchAll(/<h2>(.*?)<\/h2>/g)]
    .map((match) => match[1].replace(/<[^>]+>/g, '').trim());
}

test('there are comparison pages to check', () => {
  assert.ok(
    COMPARISONS.length >= 2,
    `only ${COMPARISONS.length} pages declare comparesOptions; this test examined almost nothing`
  );
});

test('every option a page says it compares has a section of its own', () => {
  for (const page of COMPARISONS) {
    const found = headings(page);
    const missing = page.comparesOptions.filter((option) => !found.includes(option));
    assert.deepEqual(
      missing,
      [],
      `${page.route} says it compares ${missing.join(', ')} but has no matching heading, ` +
        'so those options are dropped from the schema without an error'
    );
  }
});

test('the ItemList names every option, not a subset of them', () => {
  for (const page of COMPARISONS) {
    const graph = JSON.parse(pageSchema(page));
    const list = graph.find((node) => node['@type'] === 'ItemList');

    assert.ok(list, `${page.route} declares comparesOptions and emits no ItemList`);
    assert.equal(
      list.numberOfItems,
      page.comparesOptions.length,
      `${page.route} declares ${page.comparesOptions.length} options and lists ${list.numberOfItems}`
    );
  }
});

test('a comparison presents its options in a table as well as in prose', () => {
  // The roundups that hold these queries all lead with one, and a table is what
  // an assistant extracts when it is asked to lay the options side by side.
  // Prose alone reads well and compares badly.
  for (const page of COMPARISONS) {
    assert.match(
      String(page.bodyHtml || ''),
      /<table/,
      `${page.route} compares ${page.comparesOptions.length} things and never puts them side by side`
    );
  }
});

test('a comparison page links out to the things it compares', () => {
  // The first version of this test looked for phrases — "wrong for", "not the
  // answer", "use X instead". It failed on two pages that are scrupulously
  // honest and phrase it differently ("Not us, mostly. A motivated 16-year-old
  // is better served by freeCodeCamp and we would rather say so"), and it would
  // have passed any advert that happened to use the magic words. Editorial
  // honesty is not a regex.
  //
  // What is checkable: a comparison written by one of the products, that never
  // sends a reader to any of the others, is an advert. Outbound links are the
  // structural version of the thing the phrases were trying to catch.
  for (const page of COMPARISONS) {
    const hosts = [...String(page.bodyHtml || '').matchAll(/href="https?:\/\/([^/"]+)/g)]
      .map((match) => match[1].replace(/^www\./, ''))
      .filter((host) => !host.endsWith('codeitlearn.com'));

    const distinct = [...new Set(hosts)];
    assert.ok(
      distinct.length >= 3,
      `${page.route} compares ${page.comparesOptions.length} options and links out to ` +
        `${distinct.length} other sites, which makes it an advert rather than a comparison`
    );
  }
});
