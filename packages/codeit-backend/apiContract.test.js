'use strict';

// ── Every address the website calls exists on the server ────────────────────
//
// On 31 October 2026 three pages were found calling routes that were never
// written: /game/1 to /game/10 asked /api/quiz/progress and every child was
// told "Complete Quiz 1 first" forever; a journey puzzle asked
// /api/puzzles/progress, which Express answered as puzzle id "progress", so
// a finished puzzle always opened as new. Nothing failed loudly: a 404 just
// looked like "not done yet".
//
// This loads the real app (no database is touched until a request arrives),
// lists every route it serves, then reads every /api/... address written in
// the frontend's source and checks that a route answers it. A `${...}` in an
// address stands for one path segment (an id), and a query string is ignored.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://contract@localhost:1/contract';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';

const FRONTEND = path.resolve(__dirname, '../gamified-elearning/src');

function mountOf(layer) {
  // Express 4 keeps the mount path only inside the layer's regexp:
  // /^\/api\/quiz\/?(?=\/|$)/i  ->  /api/quiz
  const source = layer.regexp.source;
  if (source === '^\\/?(?=\\/|$)') return '';
  const match = source.match(/^\^((?:\\\/[\w.-]+)+)\\\/\?\(\?=\\\/\|\$\)$/);
  return match ? match[1].replace(/\\\//g, '/') : null;
}

function serverRoutes() {
  const app = require('./test-quiz');
  const out = [];
  const walk = (stack, prefix) => {
    for (const layer of stack) {
      if (layer.route) {
        const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
        for (const p of paths) out.push(`${prefix}${p === '/' ? '' : p}` || '/');
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        const mount = mountOf(layer);
        if (mount !== null) walk(layer.handle.stack, prefix + mount);
      }
    }
  };
  walk((app._router || app.router).stack, '');
  return out;
}

// A route's ":id" answers a "${...}" in the address. It also answers a
// written word, but that is how /api/puzzles/progress passed for a route:
// /api/puzzles/:id took "progress" as an id. So a word only fills a ":param"
// when it has a digit in it, like a real id would.
function matches(route, address) {
  const r = route.split('/').filter(Boolean);
  const a = address.split('/').filter(Boolean);
  if (r.length !== a.length) return false;
  return r.every((part, i) => (part.startsWith(':') ? (a[i] === '*' || /\d/.test(a[i])) : (a[i] === '*' ? false : part === a[i])));
}

function walkFiles(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkFiles(full, out);
    else if (/\.js$/.test(name) && !/\.test\.js$/.test(name) && !/setupTests/.test(name)) out.push(full);
  }
  return out;
}

function frontendAddresses() {
  const found = [];
  for (const file of walkFiles(FRONTEND)) {
    const text = fs.readFileSync(file, 'utf8');
    // A file-level base, `const BILLING_BASE = \`${API_BASE_URL}/api/billing\``,
    // is checked through what is built on it: `${BILLING_BASE}/status`.
    for (const base of text.matchAll(/const (\w+) = `\$\{API_BASE_URL\}(\/api\/[^`?#]*)`/g)) {
      for (const use of text.matchAll(new RegExp(`\\$\\{${base[1]}\\}(\\/[^\`'"\\s?#]*)`, 'g'))) {
        // `${BILLING_BASE}/${path}` is named by its callers ('checkout',
        // 'portal'); the first test checks those two by name instead.
        if (/^\/\$\{[^}]*\}$/.test(use[1])) continue;
        const address = (base[2] + use[1]).replace(/\$\{[^}]*\}/g, '*').replace(/\/+$/, '');
        if (/\*[^/]|[^/]\*/.test(address)) continue;
        found.push({ address, where: `${path.relative(FRONTEND, file)}:${text.slice(0, use.index).split('\n').length}` });
      }
    }
    // `${API_BASE_URL}/api/...` in a template literal, or '/api/...' in quotes.
    const patterns = [/\$\{API_BASE_URL\}(\/api\/[^`'"\s?#]*)/g, /['"`](\/api\/[^`'"\s?#]*)/g];
    for (const pattern of patterns) {
      for (const m of text.matchAll(pattern)) {
        let address = m[1].replace(/\$\{[^}]*\}/g, '*').replace(/\/+$/, '');
        // An address that ends in a bare "${...}" glued to text (e.g. "/api/x-${id}") is left alone.
        if (/\*[^/]|[^/]\*/.test(address)) continue;
        // Something that builds on a prefix ("/api/builder/" + id) cannot be checked whole.
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + 2);
        if (/^['"`]\s*\+/.test(text.slice(m.index + m[0].length, m.index + m[0].length + 3)) || after.startsWith('${')) continue;
        const line = text.slice(0, m.index).split('\n').length;
        if (new RegExp(`const \\w+ = \`\\$\\{API_BASE_URL\\}${m[1].replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\``).test(text.split('\n')[line - 1] || '')) continue;
        found.push({ address, where: `${path.relative(FRONTEND, file)}:${line}` });
      }
    }
  }
  return found;
}

const ROUTES = serverRoutes();

test('the server lists its routes, so an empty list cannot pass', () => {
  assert.ok(ROUTES.length > 100, `only ${ROUTES.length} routes found`);
  assert.ok(ROUTES.includes('/api/journey/progress'));
  assert.ok(ROUTES.includes('/api/family'));
  assert.ok(ROUTES.includes('/api/billing/checkout') && ROUTES.includes('/api/billing/portal'));
  assert.ok(ROUTES.includes('/api/builder/pub/:publicId') || ROUTES.some((r) => /^\/api\/builder\/pub\/:\w+$/.test(r)));
});

test('every /api address in the website has a route that answers it', () => {
  const addresses = frontendAddresses();
  assert.ok(addresses.length > 80, `only ${addresses.length} addresses found in the frontend`);
  const missing = addresses.filter(({ address }) => !ROUTES.some((route) => matches(route, address)));
  assert.deepEqual(missing.map((m) => `${m.where} ${m.address}`), []);
});
