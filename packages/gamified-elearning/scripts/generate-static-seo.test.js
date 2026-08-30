'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES, renderRouteDocument, pageSchema } = require('./generate-static-seo');

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
  // This used to pin the exact sentence "build websites, games, and quizzes,
  // then learn and edit the code". That is how a test ends up holding a false
  // claim in place: the copy was corrected everywhere else and this assertion
  // demanded it back. What the test is actually protecting is that the
  // description leads with what a learner makes rather than with the
  // technology, so assert that and not one particular wording.
  assert.match(description, /websites?,? games?,? (and|or) quiz/i);
  assert.ok(
    description.length > 80 && description.length <= 200,
    `homepage description is ${description.length} chars; search engines truncate well before 200`
  );
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
  // This test used to read public/.htaccess and assert the rules were in it.
  // They were. The file is Apache configuration and the site is served by
  // Vercel, which has no Apache and never reads it, so every rule in it was
  // inert while this test reported them as present. Among the things that were
  // therefore not happening: noindex on /project/*, which is where children's
  // published work lives, and no-cache on index.html, which is why the homepage
  // served a build from before 25 August for days.
  //
  // Assert what actually ships. vercel.json is the only file the edge reads.
  const robots = fs.readFileSync(path.resolve(__dirname, '../public/robots.txt'), 'utf8');
  const vercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../vercel.json'), 'utf8'));

  assert.doesNotMatch(robots, /Disallow:\s*\/(login|register|MainPage|admin|character|leaderboard|quiz)/);

  const noindex = vercel.headers.find((entry) =>
    entry.headers.some((h) => h.key === 'X-Robots-Tag' && /noindex/.test(h.value))
  );
  assert.ok(noindex, 'vercel.json sends no X-Robots-Tag noindex header');

  for (const route of [
    'login', 'register', 'forgot-password', 'reset-password', 'parent-review',
    'MainPage', 'admin', 'character', 'leaderboard', 'profile', 'quiz',
    'project', 'creator-brief', 'investor-brief',
  ]) {
    assert.ok(
      new RegExp(`[(|]${route}[|)]`).test(noindex.source),
      `${route} is not covered by the X-Robots-Tag rule in vercel.json`
    );
  }

  // The rule must not swallow pages that are supposed to rank.
  for (const route of ['about', 'pricing', 'coding-for-kids', 'lessons', 'blog', 'explore']) {
    assert.ok(
      !new RegExp(`[(|]${route}[|)]`).test(noindex.source),
      `${route} should be indexable but is inside the noindex rule`
    );
  }

  // An Apache config in a Vercel project is a rule that looks enforced and is
  // not. If one comes back, it must not be the place the policy lives.
  assert.ok(
    !fs.existsSync(path.resolve(__dirname, '../public/.htaccess')),
    'public/.htaccess is back; Vercel never reads it, so any policy in it is inert'
  );
});

/* ─── Crawlable-content guarantees ─────────────────────────────────────────
   Assistants that retrieve this site do not execute JavaScript. These tests
   fail if substantive content stops being present in the static HTML. */

const {
  HOME_PAGE,
  PRICING,
  FAQS,
  statedPrices,
  declaredPrices,
  unaccountedPrices,
  ourPrice,
} = require('./generate-static-seo');

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
  // A second currency is a bug everywhere except on a page that declares whose
  // money it is. See unaccountedPrices in the generator for why the exemption
  // has to be a declaration rather than a relaxation.
  for (const page of [...PAGES, HOME_PAGE]) {
    const text = bodyText(renderRouteDocument(TEMPLATE, page));
    const loose = unaccountedPrices(page, text);
    assert.deepEqual(
      loose,
      [],
      `${page.route} states ${loose.join(', ')}, which is neither our price nor declared in quotedPrices`
    );
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
  // Lessons 17 onward are named "Classes and Objects. Your Own Kind of Thing".
  // That reads correctly as a heading and badly in a <title>, where the template
  // appends "for Beginners" and the sentence carries on past its own full stop.
  // So a lesson title now carries the name and the h1 carries name and subtitle,
  // and the check is that the title still contains the name — not that it
  // repeats the whole heading.
  //
  // Scoped deliberately: dropping the assertion for lesson pages entirely would
  // have made this pass, and would have stopped noticing if a title and a
  // heading ever described different lessons, which is what it is for.
  for (const page of PAGES.filter((p) => p.route.startsWith('/blog/') || p.route.startsWith('/lesson/'))) {
    const subject = page.route.startsWith('/lesson/')
      ? page.h1.split(/\.\s+/)[0].replace(/[!.]+$/, '').trim()
      : page.h1;

    assert.ok(
      page.title.includes(subject),
      `${page.route} title "${page.title}" does not name its h1 subject "${subject}"`
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
    const loose = unaccountedPrices(guide, guide.bodyHtml);
    assert.deepEqual(
      loose,
      [],
      `${guide.route} quotes ${loose.join(', ')} but the live price is ${PRICING.PRICE_PER_INTERVAL} ` +
        'and nothing on the page says that money belongs to somebody else'
    );
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
  // Read the aliases from config rather than restating them. This assertion
  // was a hand-copied list and it went stale the day 'CodeIt Learn' was added,
  // which is the one alias that matters: it is what the LinkedIn, Crunchbase
  // and YouTube profiles are named.
  const company = require('./content-loader').loadCompany();
  assert.deepEqual(Array.from(org.alternateName), Array.from(company.alternateNames));
  assert.ok(company.alternateNames.includes('CodeIt Learn'), 'the name used on every external profile must be declared as an alias');
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
    const loose = unaccountedPrices(page, text);
    assert.deepEqual(loose, [], `${page.route} states undeclared money: ${loose.join(', ')}`);

    // Ours still has to be ours, whatever else the page quotes.
    for (const price of statedPrices(text)) {
      if (declaredPrices(page).includes(price)) continue;
      assert.equal(price, ourPrice(), `${page.route} states ${price} as if it were our price`);
    }
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

/* ─── Legal pages track the live product ───────────────────────────────────
   Billing went live 25 August 2026. A privacy policy that never mentions
   payments, or a published contact address nobody reads, is a real defect
   rather than stale copy. */

function walkSource(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkSource(full);
    return entry.isFile() && full.endsWith('.js') && !full.includes('.test.') ? [full] : [];
  });
}

test('the privacy page discloses payment processing', () => {
  const text = bodyText(renderRouteDocument(TEMPLATE, PAGES.find((p) => p.route === '/privacy')));
  assert.match(text, /Stripe/, '/privacy does not name the payment processor');
  assert.match(text, /never reach CodeIt/i, '/privacy does not say where card details go');
  assert.match(text, /under 18|adult account/i, '/privacy does not say who may subscribe');
});

test('every published contact address is one that is actually read', () => {
  const company = require('./content-loader').loadCompany();
  assert.ok(company.contactEmail, 'company.js has no contact address to check against');
  const srcDir = path.resolve(__dirname, '../src');
  for (const file of walkSource(srcDir)) {
    for (const address of fs.readFileSync(file, 'utf8').match(/[\w.+-]+@[\w.-]+\.\w+/g) || []) {
      // example.com addresses are input placeholders, not published contacts.
      if (address.endsWith('@example.com')) continue;
      assert.equal(
        address,
        company.contactEmail,
        `${path.relative(srcDir, file)} publishes ${address}, which nobody reads`
      );
    }
  }
});

test('nothing is still deferred until billing opens', () => {
  const srcDir = path.resolve(__dirname, '../src');
  for (const file of walkSource(srcDir)) {
    assert.ok(
      !/before paid subscriptions open/i.test(fs.readFileSync(file, 'utf8')),
      `${path.relative(srcDir, file)} still defers something until billing opens`
    );
  }
});

test('every sameAs entry is an absolute https URL', () => {
  const company = require('./content-loader').loadCompany();
  for (const url of company.sameAs) {
    assert.match(url, /^https:\/\/\S+$/, `sameAs entry is not an absolute https URL: ${url}`);
    assert.ok(!/YOUR-|example\.com|\/$/.test(url), `sameAs entry looks like a placeholder: ${url}`);
  }
});

test('every alias list in the rendered graph comes from config', () => {
  // The Organization node is rebuilt from company.js, so it was right. The
  // WebSite node sitting directly beneath it in the same @graph was hand-written
  // and had gone stale, omitting 'CodeIt Learn' — the one name every external
  // profile is registered under. Checking only the node we happened to look at
  // is how that survived, so this checks all of them.
  const company = require('./content-loader').loadCompany();
  const realTemplate = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const html = renderRouteDocument(realTemplate, PAGES.find((p) => p.route === '/about'));
  const lists = [...html.matchAll(/"alternateName":\s*(\[[^\]]*\])/g)].map((m) => JSON.parse(m[1]));
  assert.ok(lists.length >= 2, 'expected at least the Organization and WebSite alias lists');
  for (const list of lists) {
    assert.deepEqual(list, Array.from(company.alternateNames));
  }
});

test('no profile is listed twice in sameAs', () => {
  // sameAs grows one profile at a time, by hand, over months. The failure it
  // invites is the same URL pasted twice, or the same account under two host
  // spellings. Either one tells a reader the list was not checked, which is
  // the opposite of what a corroboration list is for.
  const company = require('./content-loader').loadCompany();
  const seen = new Map();
  for (const url of company.sameAs) {
    const key = url.toLowerCase().replace(/^https:\/\/(www\.)?/, '').replace(/\/+$/, '');
    assert.ok(!seen.has(key), `sameAs lists the same profile twice: ${seen.get(key)} and ${url}`);
    seen.set(key, url);
  }
});

test('sameAs reaches the Organization node when populated', () => {
  const company = require('./content-loader').loadCompany();
  if (!company.sameAs.length) return;
  const realTemplate = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const html = renderRouteDocument(realTemplate, PAGES.find((p) => p.route === '/about'));
  const org = JSON.parse(
    /<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/.exec(html)[1]
  )['@graph'].find((node) => node['@type'] === 'Organization');
  // company.js is evaluated in a vm sandbox, so its Array has a different
  // prototype and strict deepEqual rejects it. Compare contents, not objects.
  assert.deepEqual(Array.from(org.sameAs), Array.from(company.sameAs));
});
/* ─── The product does what we say it does ─────────────────────────────────
   Copy drifted once into claiming children type code as the main activity.
   builderTabs.js says the loop is Play, Change, The code, Save: a child
   changes a project by moving things and asking, and "The code" shows what
   the project is made of and links to the lesson behind each idea. */

test('no page claims children write or edit code as the main activity', () => {
  // Four rounds of this test have now been written by matching the phrasings
  // that happened to be on screen, and each one passed while the same claim sat
  // in wording it had not anticipated: "edit the real HTML" was caught and "edit
  // the real code behind them" was not; then llms.txt said "inspect and edit the
  // generated HTML" and "inspect, edit, save, and share the code behind their
  // projects", and both slipped through again.
  //
  // These two describe the grammar of the false claim instead of its vocabulary.
  // A: an edit verb governing the code, or the HTML/CSS/JS, directly.
  // B: an edit verb in a list whose object is the code *behind* or *inside* a
  //    project.
  // Both were built against the real strings in this repo, the true ones as well
  // as the false ones: 9 false claims and 13 true ones, with the patterns
  // required to catch every false one and flag none of the true ones. That is
  // why "changing the code, watching it break" in the AI guide and "a challenge
  // that requires changing the code" on the lesson pages stay legal. Children
  // do write Python in the lessons. What they do not do is edit the generated
  // code of a project the studio built, and only that shape is caught here.
  const OVERSTATED = [
    /\b(?:edit|edits|editing|change|changes|changing)\s+(?:[a-z]+\s+){0,3}?(?:and\s+)?(?:the\s+)?(?:(?:real|actual|generated)\s+(?:code|HTML|CSS|JavaScript)|the\s+(?:HTML|CSS|JavaScript))\b/i,
    /\b(?:edit|edits|editing|change|changes|changing)\b[^.]{0,25}?\bthe\s+(?:real\s+|actual\s+|generated\s+)?(?:code|HTML|CSS|JavaScript)\b[^.]{0,25}?\b(?:behind|inside)\b/i,
  ];
  // Every field that reaches a rendered page, not the subset being edited at
  // the time. h1 was missing from this list, and the homepage h1 — the single
  // most visible line on the site — read "Then change the code inside it."
  const pageText = (p) =>
    [p.bodyHtml, sectionsToTextSafe(p), p.description, p.intro, p.detail, p.h1, p.title, p.eyebrow]
      .filter(Boolean)
      .join(' ');
  const sources = [
    require('./content-loader').loadGuidePages().map((g) => g.markdown).join('\n'),
    ...PAGES.map(pageText),
    pageText(HOME_PAGE),
    fs.readFileSync(path.resolve(__dirname, '../public/llms.txt'), 'utf8'),
    fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8'),
  ].join('\n');
  for (const pattern of OVERSTATED) {
    assert.ok(!pattern.test(sources), `copy still overstates what children do: ${pattern}`);
  }
});

/* ─── Roundups say they are roundups ──────────────────────────────────────
   Comparison and roundup pages are the two formats that outrank this site on
   every unbranded query. Article alone describes them as prose; ItemList says
   they are named options, which is the shape an assistant is assembling when
   someone asks what to use. */

test('a guide that declares comparesOptions emits an ItemList of them', () => {
  const { loadGuidePages } = require('./content-loader');
  let checked = 0;

  for (const guide of loadGuidePages()) {
    if (!guide.comparesOptions) continue;
    checked += 1;
    const page = PAGES.find((entry) => entry.route === `/guide/${guide.slug}`);
    const parsed = JSON.parse(pageSchema(page));
    const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] || [parsed];
    const list = nodes.find((node) => node['@type'] === 'ItemList');

    assert.ok(list, `/guide/${guide.slug} declares comparesOptions but emits no ItemList`);
    assert.equal(
      list.numberOfItems,
      guide.comparesOptions.length,
      `/guide/${guide.slug} compares ${guide.comparesOptions.length} things but lists ${list.numberOfItems}`
    );
  }

  assert.ok(checked > 0, 'no guide declares comparesOptions; this test examined nothing');
});

test('every compared option is a heading that really exists on the page', () => {
  // The list is parsed from the page's own H2s rather than typed beside them.
  // A section renamed or deleted must not leave structured data still claiming
  // the page compares something it no longer mentions.
  const { loadGuidePages } = require('./content-loader');
  for (const guide of loadGuidePages()) {
    if (!guide.comparesOptions) continue;
    const page = PAGES.find((entry) => entry.route === `/guide/${guide.slug}`);
    const headings = [...String(page.bodyHtml || '').matchAll(/<h2>(.*?)<\/h2>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim()
    );
    for (const option of guide.comparesOptions) {
      assert.ok(
        headings.includes(option),
        `/guide/${guide.slug} claims to compare "${option}" but has no such heading`
      );
    }
  }
});
