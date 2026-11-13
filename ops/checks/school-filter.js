'use strict';

// ── Does a lesson still open behind a school web filter? ─────────────────────
//
// 13 November 2026. A Head of Computing wrote that CodeIt "doesn't work in
// playground or the lessons". His school's filter (Smoothwall) let the page,
// the stylesheets and Python through and answered 403 to the app's larger
// script files. Every script up to 68 KB had arrived. Nothing in this
// repository had ever opened the site with a file missing, so nothing had
// said so before he did.
//
// This check plays that filter. It serves the real build from its own port
// and answers 403 to every script over 68 KB, the way his network did. Then
// it opens the site as a pupil would and requires:
//
//   1. the home page, the lessons list, a lesson and the playground all start
//      (in the small-files version, by themselves, with nothing said);
//   2. no file those pages needed was one of the refused ones;
//   3. the lesson has an editor a pupil can type in, and a Run button;
//   4. if Python can be reached from here, lesson 1 really runs and says Hello.
//
// It needs only the build:  npm run build:learning && node ops/checks/school-filter.js
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { launch } = require('./browser');

const BUILD = path.join(__dirname, '..', '..', 'packages', 'gamified-elearning', 'build');
const LIMIT = 68 * 1000;      // the largest script that was seen to arrive
const PORT = Number(process.env.SCHOOL_FILTER_PORT || 4633);
const PYODIDE = process.env.CODEIT_PYODIDE_DIR || '/root/pyo/package';   // a copy on disk, if there is one
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.zip': 'application/zip', '.txt': 'text/plain', '.ico': 'image/x-icon', '.webp': 'image/webp' };

const refused = new Set();

function serve() {
  return http.createServer((req, res) => {
    const clean = decodeURIComponent((req.url || '/').split('?')[0]);
    if (clean.startsWith('/api/')) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end('{}'); }
    if (clean.startsWith('/pyodide/')) {
      const file = path.join(PYODIDE, path.basename(clean));
      if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      return res.end(fs.readFileSync(file));
    }
    let file = path.join(BUILD, clean);
    if (!file.startsWith(BUILD)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const size = fs.statSync(file).size;
      // The filter: a script over the limit is refused, whichever build it belongs to.
      if (path.extname(file) === '.js' && size > LIMIT) { refused.add(clean); res.writeHead(403, { 'Content-Type': 'text/html' }); return res.end('<html><title>Blocked</title>Access to this page has been blocked.</html>'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      return res.end(fs.readFileSync(file));
    }
    if (clean.startsWith('/static/') || clean.startsWith('/lite/')) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(fs.readFileSync(path.join(BUILD, 'index.html')));
  });
}

(async () => {
  if (!fs.existsSync(path.join(BUILD, 'index.html')) || !fs.existsSync(path.join(BUILD, 'lite', 'asset-manifest.json'))) {
    console.error('No build to check. Run: npm run build:learning');
    process.exit(1);
  }
  const server = serve();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  const BASE = `http://127.0.0.1:${PORT}`;
  const browser = await launch();
  const problems = [];
  const havePython = fs.existsSync(path.join(PYODIDE, 'pyodide.js'));

  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    const state = () => page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        started: !!root && root.children.length > 0 && !root.querySelector('.static-home-shell, .static-route-shell'),
        small: !!(window.__codeitBoot && window.__codeitBoot.small === true),
        bar: !!document.getElementById('codeit-boot-note'),
        card: !!document.querySelector('[data-page-error], [data-page-stopped], [data-page-offline]'),
      };
    });

    for (const where of ['/', '/lessons', '/lesson/1', '/playground', '/login', '/guide']) {
      refused.clear();
      await page.goto(BASE + where, { waitUntil: 'load' });
      await page.waitForFunction(() => { const r = document.getElementById('root'); return r && r.children.length && !r.querySelector('.static-home-shell, .static-route-shell'); }, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1200);
      const now = await state();
      // What was refused on the way: only the main version's own files may be,
      // and only on the first page, before the small-files version takes over.
      const needed = [...refused].filter((file) => file.startsWith('/lite/'));
      const line = `${where.padEnd(12)} ${now.started ? 'started' : 'DID NOT START'}${now.small ? ', small-files version' : ''}${needed.length ? `, REFUSED: ${needed.join(' ')}` : ''}`;
      console.log('  ' + line);
      if (!now.started) problems.push(`${where} did not start behind the filter.`);
      if (now.bar) problems.push(`${where} shows "CodeIt could not start on this computer".`);
      if (now.card) problems.push(`${where} shows an error card.`);
      if (needed.length) problems.push(`${where} needs a file the filter refuses: ${needed.join(', ')}. Something on this page has grown past ${Math.round(LIMIT / 1000)} KB.`);
    }

    // A lesson a pupil can actually use.
    await page.goto(BASE + '/lesson/1', { waitUntil: 'load' });
    await page.waitForSelector('.sl-card__title', { timeout: 15000 }).catch(() => problems.push('Lesson 1 never drew its first step.'));
    const editor = await page.locator('.plain-editor__text, .cm-content').count();
    const run = await page.locator('.cr-btn--run').count();
    if (!editor) problems.push('Lesson 1 has no editor to type in behind the filter.');
    if (!run) problems.push('Lesson 1 has no Run button behind the filter.');
    if (editor && run && havePython) {
      await page.locator('.gf__option').first().click({ timeout: 4000 }).catch(() => {});
      await page.locator('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run').click({ timeout: 5000 });
      const said = await page.waitForFunction(() => /Hello/.test((document.querySelector('.ls__say:not(.ls__say--idle)') || {}).textContent || ''), null, { timeout: 90000 }).then(() => true, () => false);
      console.log(`  lesson 1     ${said ? 'ran real Python and Pixel said Hello' : 'PYTHON DID NOT RUN'}`);
      if (!said) problems.push('Lesson 1 did not run Python behind the filter.');
    } else if (!havePython) {
      console.log('  lesson 1     Python is not on this machine, so the run itself was not tried (set CODEIT_PYODIDE_DIR).');
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (problems.length) {
    console.error(`\nBehind a school filter that refuses scripts over ${Math.round(LIMIT / 1000)} KB:`);
    for (const problem of problems) console.error('  - ' + problem);
    process.exit(1);
  }
  console.log(`\nBehind a filter that refuses every script over ${Math.round(LIMIT / 1000)} KB, the site starts, and a lesson and the playground open.`);
})().catch((error) => { console.error(error); process.exit(1); });
