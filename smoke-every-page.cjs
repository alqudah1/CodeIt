#!/usr/bin/env node
'use strict';

// ── Open every page. That is the whole idea. ─────────────────────────────────
//
// On 1 September a one-character mistake blanked all 31 lesson pages, and the
// test written to guard that exact change stayed green for a day, because it
// read the component as a string. So did every other test in this repo:
// nothing here had ever opened a page.
//
//   node smoke-every-page.cjs                       # against localhost:3000
//   node smoke-every-page.cjs https://codeitlearn.com
//   node smoke-every-page.cjs http://localhost:4599
//
// Exit 0 if every page rendered, 1 if any did not. Roughly four minutes.
//
// A route is BROKEN if it throws, shows a build-error overlay, or paints fewer
// than five words. Deliberately crude: this exists to catch "the page is
// blank", which is the failure that actually reached children. Anything
// subtler belongs in a test that can say what it means.
//
// The route list is derived from the data files, not typed in here. The
// seventeenth guide and the thirty-second lesson are covered the day they land
// and nobody has to remember.
const fs = require('fs');
const path = require('path');
const http = require('http');
const babel = require('@babel/core');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'packages', 'gamified-elearning', 'src');
const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

const DEVICES = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1280, height: 800, mobile: false },
];

// ── Loading the app's own data from a plain node script ──────────────────────
//
// These files are ESM and some of them are large. Rather than re-typing their
// contents here (which is how a route list goes stale), they are compiled to
// CommonJS in memory and evaluated. Babel is already a dependency.
const moduleCache = new Map();

function resolveFile(candidate) {
  for (const suffix of ['', '.js', '.jsx', '/index.js']) {
    const attempt = candidate + suffix;
    if (fs.existsSync(attempt) && fs.statSync(attempt).isFile()) return attempt;
  }
  throw new Error(`smoke: cannot resolve ${candidate}`);
}

function loadModule(relative) {
  const file = resolveFile(path.join(SRC, relative));
  if (moduleCache.has(file)) return moduleCache.get(file);
  const code = fs.readFileSync(file, 'utf8');
  const out = babel.transformSync(code, {
    filename: file,
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
    plugins: [],
  }).code;
  const module_ = { exports: {} };
  moduleCache.set(file, module_.exports);
  const fn = new Function('module', 'exports', 'require', out);
  fn(module_, module_.exports, (id) => {
    // Data files import from each other; resolve those, refuse anything else
    // so a stray import cannot drag React into this process.
    if (id.startsWith('.')) return loadModule(path.relative(SRC, path.resolve(path.dirname(file), id)));
    throw new Error(`smoke: refusing to load "${id}" from ${relative}`);
  });
  moduleCache.set(file, module_.exports);
  return module_.exports;
}

function routes() {
  const list = [];
  const add = (url, label) => list.push({ url, label: label || url });

  // Static routes, read out of App.js rather than remembered. Parameterised
  // routes are expanded below from their own data.
  const appSrc = fs.readFileSync(path.join(SRC, 'App.js'), 'utf8');
  const staticPaths = [...appSrc.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map(m => m[1])
    .filter(p => !p.includes(':') && p !== '*' && !p.startsWith('/admin'));
  for (const p of staticPaths) add(p, `route ${p}`);

  // Lessons.
  const { TOTAL_LESSONS } = loadModule('pages/Lessons/lessonRegistry.js');
  for (let id = 1; id <= TOTAL_LESSONS; id += 1) add(`/lesson/${id}`, `lesson ${id}`);

  // Journey puzzles: every key in the real config map.
  const { PUZZLE_CONFIGS } = loadModule('pages/Journey/puzzleConfigs.js');
  for (const key of Object.keys(PUZZLE_CONFIGS)) {
    const [lessonId, slot] = key.split('-');
    add(`/journey/puzzle/${lessonId}/${slot}`, `puzzle ${key}`);
  }

  // Guides and blog posts, by their own slugs.
  const guides = loadModule('data/guidePages.js');
  const guideList = guides.GUIDE_PAGES || guides.guidePages || guides.default || [];
  for (const g of guideList) if (g && g.slug) add(`/blog/${g.slug}`, `guide ${g.slug}`);

  const blog = loadModule('data/blogPosts.js');
  const posts = blog.BLOG_POSTS || blog.blogPosts || blog.default || [];
  for (const p of posts) if (p && p.slug) add(`/blog/${p.slug}`, `post ${p.slug}`);

  // A URL that should not exist. A 404 that renders nothing is still a blank
  // page to whoever followed the link.
  add('/this-page-does-not-exist', '404');

  const seen = new Set();
  const unique = list.filter(r => (seen.has(r.url) ? false : seen.add(r.url)));
  // SMOKE_ONLY=lesson narrows a run while you are working on one area. The
  // default is everything, because the point of this script is that nobody has
  // to choose what to check.
  const only = process.env.SMOKE_ONLY;
  return only ? unique.filter(r => r.label.includes(only) || r.url.includes(only)) : unique;
}

// ── The eleven starter games ─────────────────────────────────────────────────
//
// What a child taps first. Each one is a complete HTML document, so it is
// served over http rather than handed to setContent: setContent gives the page
// an opaque origin, localStorage throws there, and two of these games save a
// high score. They are not broken; the studio hands the sandboxed frame a
// working localStorage of its own (see previewStorage.js). A checker that
// reports working games as broken is worth less than no checker.
function starterGames() {
  const mod = loadModule('pages/Builder/starterGames.js');
  return (mod.STARTER_GAMES || []).map(g => ({ id: g.id, html: g.html || g.code }));
}

function serve(games) {
  const server = http.createServer((req, res) => {
    const id = decodeURIComponent((req.url || '').replace(/^\/|\?.*$/g, ''));
    const game = games.find(g => g.id === id);
    if (!game) { res.writeHead(404); res.end('no'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(game.html);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function inspect(page, url, device) {
  const errors = [];
  const onError = e => errors.push(String(e && e.message ? e.message : e));
  page.on('pageerror', onError);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // Long enough for a lazy route chunk and a first paint, short enough that
    // 237 checks finish inside a coffee.
    await page.waitForTimeout(1200);
  } catch (e) {
    errors.push(`navigation: ${e.message}`);
  }
  const seen = await page.evaluate(() => {
    const overlay = document.querySelector('#webpack-dev-server-client-overlay, iframe[src*="webpack-dev-server"], .runtime-error-overlay');
    // The app's own error boundary. It turns a crash into a readable card,
    // which is exactly what a person should see and exactly what would hide
    // the crash from a checker that only looks for a blank page.
    const boundary = document.querySelector('[data-page-error]');
    const text = (document.body && document.body.innerText ? document.body.innerText : '').trim();
    return {
      overlay: Boolean(overlay),
      boundary: Boolean(boundary),
      words: text ? text.split(/\s+/).length : 0,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      sample: text.slice(0, 60).replace(/\s+/g, ' '),
    };
  }).catch(() => ({ overlay: false, boundary: false, words: 0, scrollWidth: 0, innerWidth: 0, sample: '' }));
  page.off('pageerror', onError);

  const broken = errors.length > 0 || seen.overlay || seen.boundary || seen.words < 5;
  // 2px of tolerance: a sub-pixel layout rounds up on some engines and a false
  // "wide" every run is how people learn to ignore the output.
  const wide = device.mobile && seen.scrollWidth > seen.innerWidth + 2;
  return { broken, wide, errors, ...seen };
}

async function main() {
  const { chromium } = require('playwright-core');
  const executablePath = process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium';
  const browser = await chromium.launch(
    fs.existsSync(executablePath) ? { executablePath } : {}
  );

  const pages = routes();
  const games = starterGames();
  const gameServer = await serve(games);
  const gamePort = gameServer.address().port;

  let checks = 0;
  const brokenList = [];
  const wideList = [];

  for (const device of DEVICES) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.mobile,
      hasTouch: device.mobile,
    });
    const page = await context.newPage();

    for (const route of pages) {
      const result = await inspect(page, `${BASE}${route.url}`, device);
      checks += 1;
      if (result.broken) {
        const why = result.errors[0]
          || (result.boundary ? 'the page crashed and the error boundary caught it' : '')
          || (result.overlay ? 'build error overlay' : `only ${result.words} words`);
        brokenList.push(`${device.name} ${route.label}: ${why}`);
        console.log(`BROKEN  ${device.name.padEnd(7)} ${route.label}`);
        if (result.errors[0]) console.log(`        ${result.errors[0].slice(0, 160)}`);
        else if (result.boundary) console.log('        the page crashed and the error boundary caught it');
      } else {
        if (result.wide) {
          wideList.push(`${route.label} (${result.scrollWidth}px on ${result.innerWidth}px)`);
          console.log(`wide    ${device.name.padEnd(7)} ${route.label}  ${result.scrollWidth}px`);
        } else {
          console.log(`ok      ${device.name.padEnd(7)} ${route.label}`);
        }
      }
    }
    await context.close();
  }

  // The starter games, on a phone only. They are one screen by design and the
  // phone is where a child meets them.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  const page = await context.newPage();
  for (const game of games) {
    const result = await inspect(page, `http://127.0.0.1:${gamePort}/${game.id}`, DEVICES[0]);
    checks += 1;

    // Playable without a keyboard? pointermove counts: dragging a finger is
    // exactly that event, and the first version of this check called the dodge
    // game unplayable because it steers on pointermove alone.
    const touchable = /addEventListener\(\s*['"](?:click|pointerdown|pointermove|touchstart|touchmove|mousedown)/.test(
      games.find(g => g.id === game.id).html
    );

    if (result.broken) {
      brokenList.push(`game ${game.id}: ${result.errors[0] || `only ${result.words} words`}`);
      console.log(`BROKEN  game    ${game.id}: ${result.errors[0] || `${result.words} words`}`);
    } else if (result.wide) {
      wideList.push(`game ${game.id} (${result.scrollWidth}px on ${result.innerWidth}px)`);
      console.log(`wide    game    ${game.id}  ${result.scrollWidth}px`);
    } else if (!touchable) {
      brokenList.push(`game ${game.id}: no pointer or touch input, keyboard only`);
      console.log(`BROKEN  game    ${game.id}: keyboard only`);
    } else {
      console.log(`ok      game    ${game.id}`);
    }
  }
  await context.close();

  await browser.close();
  gameServer.close();

  console.log('');
  console.log(`${pages.length} routes x ${DEVICES.length} devices, plus ${games.length} starter games = ${checks} checks, ${brokenList.length} broken`);
  if (wideList.length) {
    console.log(`${wideList.length} page(s) scroll sideways on a phone (not a failure, but somebody should look):`);
    for (const w of wideList) console.log(`  ${w}`);
  }
  if (brokenList.length) {
    console.log('');
    console.log('BROKEN:');
    for (const b of brokenList) console.log(`  ${b}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('smoke run failed:', err);
  process.exit(1);
});
