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

test('the sitemap lists every generated public route on the canonical host', () => {
  const sitemap = fs.readFileSync(path.resolve(__dirname, '../public/sitemap.xml'), 'utf8');

  for (const page of PAGES) {
    assert.match(sitemap, new RegExp(`<loc>https://codeitlearn\\.com${page.route.replaceAll('/', '\\/')}</loc>`));
  }
  assert.doesNotMatch(sitemap, /www\.codeitlearn\.com/);
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

const { HOME_PAGE, PRICING } = require('./generate-static-seo');

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
  assert.ok(text.includes(PRICING.symbol + PRICING.amount), 'homepage does not state the price');
});

test('the price is stated in exactly one currency across all routes', () => {
  const template = TEMPLATE;
  const wrongCurrency = PRICING.symbol === 'CA$' ? /US\$\s?12/ : /CA\$\s?12/;
  for (const page of [...PAGES, HOME_PAGE]) {
    const html = renderRouteDocument(template, page);
    assert.ok(!wrongCurrency.test(bodyText(html)), `${page.route} states a second currency`);
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
