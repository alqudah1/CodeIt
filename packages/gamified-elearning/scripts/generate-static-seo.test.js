'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES, renderRouteDocument } = require('./generate-static-seo');

const TEMPLATE = `<!doctype html><html><head>
  <title>Home</title>
  <meta name="description" content="home" />
  <link rel="canonical" href="https://codeitlearn.com/" />
  <meta property="og:url" content="https://codeitlearn.com/" />
  <meta property="og:title" content="Home" />
  <meta property="og:description" content="home" />
  <meta name="twitter:title" content="Home" />
  <meta name="twitter:description" content="home" />
</head><body><div id="root"><main>homepage fallback</main></div></body></html>`;

test('every generated page has a unique route', () => {
  const routes = PAGES.map((page) => page.route);
  assert.equal(new Set(routes).size, routes.length);
});

test('replaces homepage fallback and metadata with route-specific content', () => {
  const page = PAGES.find((item) => item.route === '/coding-for-kids');
  const html = renderRouteDocument(TEMPLATE, page);

  assert.match(html, /A first coding project they’ll want to keep improving/);
  assert.match(html, /private managed profiles for ages 5–12/);
  assert.match(html, /Independent student accounts begin at 13/);
  assert.match(html, /canonical" href="https:\/\/codeitlearn\.com\/coding-for-kids/);
  assert.match(html, /static-route-jsonld/);
  assert.doesNotMatch(html, /homepage fallback/);
});

test('does not leak one route into another route document', () => {
  const builder = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/builder'));
  const games = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/python-games-for-kids'));

  assert.match(builder, /Build a website\. Then learn how it works/);
  assert.doesNotMatch(builder, /Python games that make every line matter/);
  assert.match(games, /Python games that make every line matter/);
});

test('every route document has one matching canonical, title, and static marker', () => {
  for (const page of PAGES) {
    const html = renderRouteDocument(TEMPLATE, page);
    const canonicalMatches = html.match(/<link rel="canonical"[^>]*>/g) || [];
    const titleMatches = html.match(/<title>[\s\S]*?<\/title>/g) || [];

    assert.equal(canonicalMatches.length, 1, `${page.route} should have one canonical`);
    assert.match(canonicalMatches[0], new RegExp(`href="https://codeitlearn\\.com${page.route.replaceAll('/', '\\/')}"`));
    assert.equal(titleMatches.length, 1, `${page.route} should have one title`);
    assert.match(html, new RegExp(`data-static-route="${page.route.replaceAll('/', '\\/')}"`));
  }
});

// The sitemap is no longer hand-maintained — it is generated from PAGES at
// build time, which is what stops routes going unlisted. Coverage is asserted
// against the generated file in "the sitemap covers every generated route".
test('the sitemap uses the canonical host and no www', () => {
  const fsMod = require('node:fs');
  const os = require('node:os');
  const dir = fsMod.mkdtempSync(path.join(os.tmpdir(), 'sitemap-host-'));
  fsMod.writeFileSync(path.join(dir, 'index.html'), TEMPLATE);
  require('./generate-static-seo').generate(dir);
  const sitemap = fsMod.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /www\.codeitlearn\.com/);
  assert.match(sitemap, /<loc>https:\/\/codeitlearn\.com\//);
});

test('public search documents use one accurate age range', () => {
  const template = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const llms = fs.readFileSync(path.resolve(__dirname, '../public/llms.txt'), 'utf8');
  const codingForKids = renderRouteDocument(
    template,
    PAGES.find((item) => item.route === '/coding-for-kids')
  );

  for (const document of [template, llms, codingForKids]) {
    assert.match(document, /ages 5–18/);
    assert.doesNotMatch(document, /ages 8[–-](?:12|17|18)/);
  }
});

test('homepage search copy leads with creating and learning, not AI', () => {
  const template = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const title = template.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
  const description = template.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';

  assert.match(title, /Coding for Kids.*Build Websites.*Learn the Code/);
  assert.match(description, /build websites, games, and quizzes, then learn and edit the code/i);
  assert.doesNotMatch(`${title} ${description}`, /\bAI\b/);
});

test('homepage fallback explains the family offer and links to commercial pages', () => {
  const template = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');

  assert.match(template, /Students ages 5–18 can build, edit, save/);
  assert.match(template, /managed learner profiles for children ages 5–12/);
  assert.match(template, /No card or paid subscription starts automatically/);
  for (const route of ['/coding-for-kids', '/ai-website-builder-for-kids', '/pricing', '/blog']) {
    assert.match(template, new RegExp(`href="${route}"`));
  }
});

test('generated public routes link back to high-value discovery pages', () => {
  const lesson = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/lesson/1'));

  for (const route of ['/coding-for-kids', '/ai-website-builder-for-kids', '/pricing', '/blog']) {
    assert.match(lesson, new RegExp(`href="${route}"`));
  }
});

test('legal search documents use trust-specific copy', () => {
  const privacy = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/privacy'));
  const terms = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/terms'));

  assert.match(privacy, /Privacy choices and controls/);
  assert.match(privacy, /Read Privacy &amp; Safety/);
  assert.doesNotMatch(privacy, /What you can do on CodeIt/);
  assert.match(terms, /Using CodeIt responsibly/);
  assert.match(terms, /Read the Terms of Use/);
  assert.doesNotMatch(terms, /What you can do on CodeIt/);
});

test('private application pages are crawlable but excluded with X-Robots-Tag', () => {
  const robots = fs.readFileSync(path.resolve(__dirname, '../public/robots.txt'), 'utf8');
  const htaccess = fs.readFileSync(path.resolve(__dirname, '../public/.htaccess'), 'utf8');

  assert.doesNotMatch(robots, /Disallow:\s*\/(login|register|MainPage|admin|character|leaderboard|quiz)/);
  assert.match(htaccess, /X-Robots-Tag "noindex, nofollow"/);

  for (const route of ['login', 'register', 'MainPage', 'admin', 'character', 'leaderboard', 'quiz', 'project']) {
    assert.match(htaccess, new RegExp(`\\|${route}\\||\\(${route}\\||\\|${route}\\)`));
  }
});

/* ─── Crawlable-content guarantees ─────────────────────────────────────────
   Assistants that retrieve this site do not execute JavaScript. These tests
   fail if substantive content stops being present in the static HTML. */

const { HOME_PAGE, PRICING, FAQS } = require('./generate-static-seo');

function bodyText(html) {
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? '';
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jsonLd(html) {
  const raw = /<script id="static-route-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/i.exec(html)?.[1];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}

test('every generated route carries substantive crawlable body text', () => {
  const template = TEMPLATE;
  for (const page of PAGES) {
    const text = bodyText(renderRouteDocument(template, page));
    assert.ok(
      text.length >= 900,
      `${page.route} has only ${text.length} characters of crawlable body text`
    );
  }
});

test('homepage states what the product is, who it is for, and what it costs', () => {
  const text = bodyText(renderRouteDocument(TEMPLATE, HOME_PAGE));
  assert.ok(text.length >= 2000, `homepage body text is only ${text.length} characters`);
  assert.match(text, /ages 5.18/i);
  assert.match(text, /HTML, CSS, and JavaScript/i);
  assert.ok(text.includes(PRICING.PRICE_PER_INTERVAL), 'homepage does not state the price');
});

test('the price is stated in exactly one currency across all routes', () => {
  const wrong = PRICING.CURRENCY_SYMBOL === 'CA$' ? /US\$\s?\d/ : /CA\$\s?\d/;
  for (const page of [...PAGES, HOME_PAGE]) {
    const text = bodyText(renderRouteDocument(TEMPLATE, page));
    assert.ok(!wrong.test(text), `${page.route} states a second currency`);
  }
});

test('lesson pages inline the full lesson, not a teaser', () => {
  const template = TEMPLATE;
  const lesson1 = PAGES.find((page) => page.route === '/lesson/1');
  const text = bodyText(renderRouteDocument(template, lesson1));
  assert.ok(lesson1.sections.length >= 4, 'lesson 1 should expose every step');
  assert.match(text, /print\(/, 'lesson code should be present in the HTML');
});

test('blog posts declare headline, author and datePublished', () => {
  const template = TEMPLATE;
  for (const page of PAGES.filter((p) => p.type === 'BlogPosting')) {
    const [article] = jsonLd(renderRouteDocument(template, page));
    assert.equal(article['@type'], 'BlogPosting', `${page.route} is not typed BlogPosting`);
    assert.ok(article.headline, `${page.route} has no headline`);
    assert.ok(article.author, `${page.route} has no author`);
    assert.match(article.datePublished ?? '', /^\d{4}-\d{2}-\d{2}$/, `${page.route} has no datePublished`);
  }
});

test('static title matches the rendered h1 subject on blog and lesson pages', () => {
  for (const page of PAGES.filter((p) => p.route.startsWith('/blog/') || p.route.startsWith('/lesson/'))) {
    assert.ok(
      page.title.includes(page.h1),
      `${page.route} title "${page.title}" does not contain its h1 "${page.h1}"`
    );
  }
});

test('the lesson sequence is expressed as a Course', () => {
  const lessons = PAGES.find((page) => page.route === '/lessons');
  const course = jsonLd(renderRouteDocument(TEMPLATE, lessons)).find((n) => n['@type'] === 'Course');
  assert.ok(course, '/lessons does not emit Course schema');

  // Counted from the lesson files rather than written here as a number. This
  // said 16 and the curriculum grew to 31, so the test failed on a change that
  // was entirely correct — and a test that cries wolf when the product improves
  // is a test people start ignoring.
  const lessonFiles = fs
    .readdirSync(path.join(__dirname, '..', 'src', 'pages', 'Lessons', 'lessonData'))
    .filter((name) => /^lesson\d+\.js$/.test(name)).length;

  assert.ok(lessonFiles > 0, 'no lesson data files found');
  assert.equal(course.hasPart.length, lessonFiles);
});

test('the visible FAQ is expressed as FAQPage', () => {
  const page = PAGES.find((p) => p.route === '/coding-for-kids');
  const faq = jsonLd(renderRouteDocument(TEMPLATE, page)).find((n) => n['@type'] === 'FAQPage');
  assert.ok(faq, '/coding-for-kids does not emit FAQPage schema');
  assert.ok(faq.mainEntity.length >= 5);
  for (const entry of faq.mainEntity) {
    assert.ok(entry.acceptedAnswer.text.length > 40, `answer to "${entry.name}" is too thin`);
  }
});

/* ─── Guides ────────────────────────────────────────────────────────────── */


test('every guide page inlines its full body, not a summary', () => {
  const guides = PAGES.filter((page) => page.route.startsWith('/guide/'));
  assert.ok(guides.length >= 11, `expected 11+ guides, found ${guides.length}`);
  for (const guide of guides) {
    assert.ok(guide.bodyHtml, `${guide.route} has no inlined body`);
    const text = bodyText(renderRouteDocument(TEMPLATE, guide));
    assert.ok(text.length >= 4000, `${guide.route} inlines only ${text.length} characters`);
  }
});

test('guide tables survive into the crawlable HTML', () => {
  const withTables = PAGES.filter(
    (page) => page.route.startsWith('/guide/') && page.bodyHtml.includes('<table>')
  );
  assert.ok(withTables.length >= 8, `only ${withTables.length} guides kept their tables`);
});

test('guides are typed as Article with a date and an author', () => {
  for (const guide of PAGES.filter((page) => page.route.startsWith('/guide/'))) {
    const [article] = jsonLd(renderRouteDocument(TEMPLATE, guide));
    assert.equal(article['@type'], 'Article', `${guide.route} is not typed Article`);
    assert.ok(article.author, `${guide.route} has no author`);
    assert.match(article.datePublished ?? '', /^\d{4}-\d{2}-\d{2}$/, `${guide.route} has no date`);
  }
});

test('guides name competitors — a page that recommends only us does not get cited', () => {
  const RIVALS = ['Scratch', 'Tynker', 'CodeMonkey', 'Codecademy', 'Khan Academy', 'Roblox',
                  'freeCodeCamp', 'CodeCombat', 'Neocities', 'GitHub Pages', 'Lovable',
                  'Bolt', 'Wix', 'Squarespace', 'Webflow', 'Framer', 'Replit', 'Kodable',
                  'codeSpark', 'CodeHS', 'Netlify', 'Vercel', 'itch.io', 'KAPLAY', 'Phaser'];
  for (const guide of PAGES.filter((page) => page.route.startsWith('/guide/'))) {
    const named = RIVALS.filter((rival) => guide.bodyHtml.includes(rival));
    assert.ok(named.length >= 2, `${guide.route} names only ${named.length} other products`);
  }
});

test('any price a guide states is the live one', () => {
  for (const guide of PAGES.filter((page) => page.route.startsWith('/guide/'))) {
    for (const quoted of guide.bodyHtml.match(/(?:CA|US)\$\s?\d+(?:\/[a-z]+)?/g) || []) {
      assert.ok(
        quoted.startsWith(PRICING.CURRENCY_SYMBOL) && quoted.includes(String(PRICING.AMOUNT)),
        `${guide.route} quotes "${quoted}" but the live price is ${PRICING.PRICE_PER_INTERVAL}`
      );
    }
    for (const allowance of guide.bodyHtml.match(/\b(\d+)\s+assisted\s+project\s+builds?\b/gi) || []) {
      assert.ok(
        allowance.startsWith(String(PRICING.FREE_MONTHLY_AI_BUILDS)),
        `${guide.route} says "${allowance}" but the free allowance is ${PRICING.FREE_MONTHLY_AI_BUILDS}`
      );
    }
  }
});

test('no page claims accessibility support that has not been tested', () => {
  const BANNED = [/\bdyslexi/i, /\bADHD\b/i, /\bautis/i, /\bscreen reader\b/i, /free forever/i];
  for (const page of [...PAGES, HOME_PAGE]) {
    const haystack = `${page.bodyHtml || ''} ${sectionsToTextSafe(page)} ${page.description}`;
    for (const pattern of BANNED) {
      assert.ok(!pattern.test(haystack), `${page.route} matches forbidden claim ${pattern}`);
    }
  }
});

function sectionsToTextSafe(page) {
  return (page.sections || [])
    .flatMap((section) => [section.heading, ...(section.paragraphs || [])])
    .filter(Boolean)
    .join(' ');
}

test('the sitemap covers every generated route', () => {
  const fsMod = require('node:fs');
  const os = require('node:os');
  const dir = fsMod.mkdtempSync(path.join(os.tmpdir(), 'sitemap-'));
  fsMod.writeFileSync(path.join(dir, 'index.html'), TEMPLATE);
  require('./generate-static-seo').generate(dir);
  const xml = fsMod.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
  for (const page of PAGES) {
    assert.ok(xml.includes(`<loc>https://codeitlearn.com${page.route}</loc>`),
      `${page.route} is missing from the sitemap`);
  }
  assert.ok(xml.includes('<loc>https://codeitlearn.com/</loc>'), 'homepage missing from sitemap');
});

/* ─── Identity ─────────────────────────────────────────────────────────────
   The brand collides with MIT CodeIt, codeit.us and codeitlearning.com. These
   assert the signals that let anything tell them apart actually ship. */

test('/about and /faq exist and are substantial', () => {
  for (const route of ['/about', '/faq']) {
    const page = PAGES.find((entry) => entry.route === route);
    assert.ok(page, `${route} is not generated`);
    const text = bodyText(renderRouteDocument(TEMPLATE, page));
    assert.ok(text.length >= 1500, `${route} has only ${text.length} characters`);
  }
});

test('/about names the organisations CodeIt is confused with', () => {
  const about = PAGES.find((entry) => entry.route === '/about');
  const text = bodyText(renderRouteDocument(TEMPLATE, about));
  for (const rival of ['codeitlearning.com', 'MIT CodeIt', 'codeit.us']) {
    assert.ok(text.includes(rival), `/about does not disambiguate from ${rival}`);
  }
  assert.match(text, /Toronto/, '/about does not say where CodeIt is from');
});

test('/about carries no placeholder where a real fact belongs', () => {
  const about = PAGES.find((entry) => entry.route === '/about');
  const text = bodyText(renderRouteDocument(TEMPLATE, about));
  for (const pattern of [/\[.*?NAME.*?\]/i, /\bTODO\b/, /\bFILL[_ ]IN\b/i, /\bXXX\b/]) {
    assert.ok(!pattern.test(text), `/about contains a placeholder: ${pattern}`);
  }
});

test('the Organization node is built from config, not hand-written HTML', () => {
  // Uses the real template: the global @graph only exists in public/index.html.
  const realTemplate = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const html = renderRouteDocument(realTemplate, PAGES.find((entry) => entry.route === '/about'));
  const graphRaw = /<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/.exec(html);
  const org = JSON.parse(graphRaw[1])['@graph'].find((node) => node['@type'] === 'Organization');
  assert.ok(org, 'no Organization node in the graph');
  assert.equal(org.address.addressLocality, 'Toronto');
  assert.deepEqual(org.alternateName, ['CodeItLearn', 'Code It Learn']);
  // sameAs must be absent while empty rather than shipped as []
  assert.ok(!('sameAs' in org) || org.sameAs.length > 0, 'empty sameAs should be omitted');
});

test('the FAQ has one source and every answer is a real answer', () => {
  const faqPage = PAGES.find((entry) => entry.route === '/faq');
  assert.equal(faqPage.faqs.length, FAQS.length);
  for (const { q, a } of FAQS) {
    assert.ok(a.length > 80, `answer to "${q}" is too thin to be useful`);
  }
  const faqNode = jsonLd(renderRouteDocument(TEMPLATE, faqPage)).find((n) => n['@type'] === 'FAQPage');
  assert.ok(faqNode, '/faq does not emit FAQPage schema');
  assert.equal(faqNode.mainEntity.length, FAQS.length);
});

test('the FAQ answers what CodeIt does not do', () => {
  const combined = FAQS.map(({ a }) => a).join(' ');
  assert.match(combined, /no rostering|LMS/i, 'FAQ does not disclose the schools gap');
  assert.match(combined, /cannot publish/i, 'FAQ does not disclose the under-13 publishing limit');
  assert.match(combined, /Python only|no web curriculum/i, 'FAQ does not disclose the curriculum gap');
});

/* ─── Billing accuracy ──────────────────────────────────────────────────────
   Billing went live on 25 August 2026. Copy saying otherwise is not a stale-
   content problem — it is a page telling parents no subscription can start on
   a site where one can. These fail loudly if that copy ever comes back. */

test('no generated page claims billing is inactive', () => {
  const STALE = [
    /billing (is|are) not (currently )?(active|live|switched on)/i,
    /paid billing has not opened/i,
    /being considered at/i,
    /not live today/i,
  ];
  for (const page of [...PAGES, HOME_PAGE]) {
    const haystack = `${page.bodyHtml || ''} ${sectionsToTextSafe(page)} ${page.description} ${page.intro || ''}`;
    for (const pattern of STALE) {
      assert.ok(!pattern.test(haystack), `${page.route} still says billing is inactive (${pattern})`);
    }
  }
});

test('the price comes from src/config/pricing.js, not a second copy', () => {
  const pricing = require('./content-loader').loadPricing();
  assert.equal(PRICING.PRICE_PER_INTERVAL, pricing.PRICE_PER_INTERVAL);
  const pricingPage = PAGES.find((page) => page.route === '/pricing');
  const text = bodyText(renderRouteDocument(TEMPLATE, pricingPage));
  assert.ok(text.includes(pricing.PRICE_PER_INTERVAL), '/pricing does not state the live price');
  assert.ok(
    text.includes(String(pricing.FREE_MONTHLY_AI_BUILDS)),
    '/pricing does not state the free build allowance'
  );
});

test('pages that state a price state exactly one, in one currency', () => {
  for (const page of [...PAGES, HOME_PAGE]) {
    const text = bodyText(renderRouteDocument(TEMPLATE, page));
    const currencies = new Set((text.match(/(CA|US)\$/g) || []));
    assert.ok(currencies.size <= 1, `${page.route} mixes currencies: ${[...currencies].join(', ')}`);
    assert.ok(!/US\$/.test(text), `${page.route} states USD`);
  }
});

/* ─── Identity is actually present ─────────────────────────────────────────
   The whole point of company.js is that a stranger — or a model — can tell
   this CodeIt apart from MIT CodeIt and codeitlearning.com. These fail if the
   identifying facts stop reaching the page. */

test('/about names a real person and a reachable contact', () => {
  const company = require('./content-loader').loadCompany();
  const realTemplate = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const text = bodyText(renderRouteDocument(realTemplate, PAGES.find((p) => p.route === '/about')));

  assert.ok(company.hasIdentity(), 'company.js carries no identifying facts at all');
  assert.ok(text.includes(company.founderName), '/about does not name the founder');
  assert.ok(text.includes(company.contactEmail), '/about gives no contact address');
});

test('the Organization schema carries founder and contact', () => {
  const company = require('./content-loader').loadCompany();
  const realTemplate = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const html = renderRouteDocument(realTemplate, PAGES.find((p) => p.route === '/about'));
  const graph = JSON.parse(
    /<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/.exec(html)[1]
  )['@graph'];
  const org = graph.find((node) => node['@type'] === 'Organization');

  assert.equal(org.founder.name, company.founderName);
  assert.equal(org.email, company.contactEmail);
  assert.ok(org.contactPoint, 'no contactPoint on the Organization node');
  assert.equal(org.address.addressLocality, company.city);
});

test('no identity field is a placeholder', () => {
  const company = require('./content-loader').loadCompany();
  for (const [key, value] of Object.entries(company)) {
    if (typeof value !== 'string' || !value) continue;
    for (const pattern of [/\[.*?\]/, /\bTODO\b/i, /\bFILL[_ ]IN\b/i, /example\.com/i, /\bXXX\b/]) {
      assert.ok(!pattern.test(value), `company.${key} looks like a placeholder: "${value}"`);
    }
  }
});
