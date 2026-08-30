'use strict';

/**
 * The guides answer forty questions that no machine could see.
 *
 * FAQPage schema was wired into this generator months ago and only /faq ever
 * populated it. Meanwhile eight guides carry hand-written questions under a
 * "Common questions" heading, each with a real answer, structured as nothing
 * but bold text in a paragraph. Assistants pull question-and-answer pairs in
 * preference to prose, and these are the exact questions the guides were
 * written to be found for.
 *
 * The risk in generating this rather than authoring it is FAQ schema that does
 * not match what a reader sees, which is a manual action from Google rather
 * than a rich result. So the load-bearing test here is the visibility one: every
 * answer must be findable in the page's own crawlable body.
 */

const test = require('node:test');
const assert = require('node:assert');

const { PAGES, plainText } = require('./generate-static-seo.js');

const GUIDES = PAGES.filter((page) => page.route.startsWith('/guide/'));

function visibleText(page) {
  return String(page.bodyHtml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

test('the guides carry Q&A pairs at all', () => {
  const withFaqs = GUIDES.filter((guide) => guide.faqs?.length);
  assert.ok(
    withFaqs.length >= 5,
    `only ${withFaqs.length} guides produced FAQ pairs; the extractor has stopped matching`
  );

  const total = withFaqs.reduce((sum, guide) => sum + guide.faqs.length, 0);
  assert.ok(total >= 25, `only ${total} question and answer pairs were found across the guides`);
});

test('every answer in the schema is text a reader can see on the page', () => {
  // The one rule that matters. Schema describing content the page does not
  // contain is a manual action, and it is dishonest besides.
  let checked = 0;
  for (const guide of GUIDES) {
    const body = visibleText(guide);
    for (const { q, a } of guide.faqs || []) {
      checked += 1;
      // Compare on a distinctive slice: the rendered body has markdown links
      // expanded to anchor text, so full-string equality would fail on
      // formatting rather than on substance.
      const probe = a.slice(0, 40);
      assert.ok(
        body.includes(probe),
        `${guide.route} answers "${q}" with text that is not on the page: "${probe}"`
      );
    }
  }
  assert.ok(checked > 0, 'no FAQ answers were examined, which is how a guard passes for nothing');
});

test('every question in the schema is a question, and is on the page', () => {
  for (const guide of GUIDES) {
    const body = visibleText(guide);
    for (const { q } of guide.faqs || []) {
      assert.match(q, /\?$/, `${guide.route} lists "${q}" as a question and it does not ask anything`);
      assert.ok(body.includes(q), `${guide.route} asks "${q}" only in its schema, not on the page`);
    }
  }
});

test('no answer is a fragment', () => {
  let checked = 0;
  for (const guide of GUIDES) {
    for (const { q, a } of guide.faqs || []) {
      checked += 1;
      assert.ok(a.length >= 20, `${guide.route} answers "${q}" in ${a.length} characters`);
    }
  }
  assert.ok(checked > 0, 'no answers were examined');
});

test('markdown in an answer is flattened to text', () => {
  // Checked as a unit rather than by surveying the guides, because none of the
  // thirty-five answers written so far contains a link or a bold run. A survey
  // would report success having examined nothing, and would keep reporting it
  // on the day somebody writes the first answer with a link in it — which is
  // precisely the shape of guard this repo has had to rewrite twice already.
  // The schema field is plain text; raw Markdown in it reads as gibberish.
  assert.equal(
    plainText('See [the announcement](https://example.com/x) for the **exact** date and `code`.'),
    'See the announcement for the exact date and code.'
  );
  assert.equal(plainText('  spaced   out\n  lines  '), 'spaced out lines');
});

test('a checklist that happens to use question marks is not collected as a FAQ', () => {
  // /guide/ai-builder-you-can-edit has a six-point checklist whose items are
  // bold and end in question marks. They are not questions a reader asked and
  // they are not under a questions heading, and an extractor that took them
  // would be describing the page wrongly.
  const guide = GUIDES.find((page) => page.route === '/guide/ai-builder-you-can-edit');
  assert.ok(guide, 'the guide this test is about is missing');
  assert.ok(guide.faqs.length > 0, 'that guide produced no FAQs at all, so this proves nothing');

  const collected = guide.faqs.map((faq) => faq.q).join(' | ');
  assert.ok(
    !/Can you see the code\?/.test(collected),
    `a checklist item was collected as a FAQ: ${collected}`
  );
});

test('the schema graph actually carries the pairs', () => {
  const { pageSchema } = require('./generate-static-seo.js');
  const guide = GUIDES.find((page) => page.faqs?.length);
  const graph = JSON.parse(pageSchema(guide));
  const faq = graph.find((node) => node['@type'] === 'FAQPage');

  assert.ok(faq, `${guide.route} has FAQ pairs but emits no FAQPage node`);
  assert.equal(faq.mainEntity.length, guide.faqs.length);
  for (const entry of faq.mainEntity) {
    assert.equal(entry['@type'], 'Question');
    assert.equal(entry.acceptedAnswer['@type'], 'Answer');
    assert.ok(entry.acceptedAnswer.text.length >= 20);
  }
});
