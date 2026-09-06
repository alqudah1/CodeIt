const fs = require('fs');
const path = require('path');

// ── Message 75: /builder?prompt=... links are nofollow ───────────────────────
//
// Search Console showed /builder?prompt=<a lesson's prompt>&from=lesson-27 in
// "Crawled, currently not indexed". Every one of the 31 lesson pages carries
// such a link with a different prompt, and so does /first-game-challenge.
// Each is /builder with a query string and no content of its own; Google is
// right to skip them, and every crawl spent on one is a crawl not spent on a
// guide we want indexed. The href stays (middle-click, open in new tab); the
// anchor says nofollow so the URL is not queued.

const SRC = path.join(__dirname);
function read(rel) { return fs.readFileSync(path.join(SRC, rel), 'utf8'); }

test('every crawlable link that builds /builder?prompt= carries rel="nofollow"', () => {
  const files = [
    'components/InteractiveLessonTemplate/InteractiveLessonTemplate.js',
    'pages/Challenge/FirstGameChallenge.js',
  ];
  for (const rel of files) {
    const src = read(rel);
    // Every <a href=...> or <Link to=...> whose target is a builder prompt URL.
    const anchors = [...src.matchAll(/<(?:a|Link)\b[\s\S]*?>/g)].map((m) => m[0])
      .filter((tag) => /\/builder\?prompt=|builderLink\(/.test(tag));
    expect(anchors.length).toBeGreaterThan(0);
    for (const tag of anchors) expect(tag).toMatch(/rel="nofollow"/);
  }
});

test('the sitemap never lists a builder URL with a query string', () => {
  const gen = read('../scripts/generate-static-seo.js');
  expect(gen).not.toMatch(/\/builder\?/);
});
