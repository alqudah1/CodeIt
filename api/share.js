'use strict';

// ── The share shim ───────────────────────────────────────────────────────────
//
// A nine-year-old sending "play my game" to three friends is the only growth
// channel that compounds, and the moment it lives or dies is the unfurl: what
// WhatsApp, Discord or iMessage shows when the link lands. Those crawlers do
// not run JavaScript, so the SPA's per-project titles never reached them —
// every shared project unfurled as the generic homepage card.
//
// This function serves /project/:publicId. It returns the SAME built
// index.html the SPA always uses — the app boots identically — but with the
// title, description and share image swapped for this project's own before
// the bytes leave. No render, no headless browser: five string replacements.
//
// Fail-open on everything: if the project cannot be fetched, the untouched
// index.html goes out and the page behaves exactly as before this existed.

const fs = require('fs');
const path = require('path');

const INDEX_CANDIDATES = [
  path.join(process.cwd(), 'packages', 'gamified-elearning', 'build', 'index.html'),
  path.join(__dirname, '..', 'packages', 'gamified-elearning', 'build', 'index.html'),
];

let cachedIndex = null;
function loadIndex() {
  if (cachedIndex) return cachedIndex;
  for (const candidate of INDEX_CANDIDATES) {
    try {
      cachedIndex = fs.readFileSync(candidate, 'utf8');
      return cachedIndex;
    } catch (_) { /* try the next location */ }
  }
  return null;
}

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function shareImageFor(projectType) {
  const t = String(projectType || '').toLowerCase();
  if (t === 'quiz') return '/brand/share-quiz.png';
  if (['website', 'portfolio', 'restaurant', 'shop', 'sports', 'blog', 'landing'].includes(t)) {
    return '/brand/share-site.png';
  }
  return '/brand/share-game.png';
}

function setTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

module.exports = async (request, response) => {
  const html = loadIndex();
  if (!html) {
    response.statusCode = 404;
    response.end('Not found');
    return;
  }

  const rawId = request.query?.pub;
  const publicId = String(Array.isArray(rawId) ? rawId[0] : rawId || '').split('/')[0];

  let out = html;
  if (/^[A-Za-z0-9_-]{1,64}$/.test(publicId)) {
    try {
      const host = request.headers['x-forwarded-host'] || request.headers.host;
      const proto = request.headers['x-forwarded-proto'] || 'https';
      const api = `${proto}://${host}/api/builder/pub/${encodeURIComponent(publicId)}`;
      const res = await fetch(api, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const body = await res.json();
        const project = body?.project;
        if (project?.title) {
          const title = escapeHtml(`${project.title} — play it on CodeIt`);
          const creator = project.creator_name ? escapeHtml(project.creator_name) : null;
          const description = escapeHtml(
            creator
              ? `A real project ${creator} built on CodeIt. Play it, look at the code inside, then remix it into your own.`
              : 'A real project built by a young creator on CodeIt. Play it, look at the code inside, then remix it into your own.'
          );
          const image = `https://${host}${shareImageFor(project.project_type)}`;
          const url = `https://${host}/project/${escapeHtml(publicId)}`;

          out = setTag(out, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
          out = setTag(out, /<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`);
          out = setTag(out, /<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`);
          out = setTag(out, /<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${image}"`);
          out = setTag(out, /<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`);
          out = setTag(out, /<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`);
          out = setTag(out, /<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`);
          out = setTag(out, /<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`);
          out = setTag(out, /<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${image}"`);
        }
      }
    } catch (_) {
      // Fail open: the untouched page is always a correct answer.
    }
  }

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Fresh enough for a title edit to propagate, cached enough to cost nothing.
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  response.statusCode = 200;
  response.end(out);
};
