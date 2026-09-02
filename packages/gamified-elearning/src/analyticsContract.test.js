import fs from 'fs';
import path from 'path';

// ── Every event the browser fires must be an event the server accepts ────────
//
// A read-only audit on 1 September 2026 found eleven trackEvent names that had
// never been added to the server's EVENT_META, and five more whose meta value
// was outside the allowed set. Every one of those calls fired an HTTP request,
// the ingest route answered 400, and nothing was written. Nobody noticed,
// because a rejected analytics event looks exactly like a thing nobody did.
//
// Two of them were the measurement for the studio-door change shipped the same
// morning. The read-out promised for 8 September would have reported zero, and
// the silence would have been read as a null result rather than a broken pipe.
//
// This test exists so that can never happen again. It reads the real allowlist
// from the real server file and checks every literal trackEvent call in the
// browser against it.
const SRC = path.join(__dirname);
const SERVER = path.join(__dirname, '../../codeit-backend/analyticsEvents.js');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// The server file is CommonJS and this suite is ESM under jsdom, so the
// allowlists are read as source rather than imported. Reading the real file
// is the point: a copy of the list here would drift and the test would pass
// while production rejected everything.
const serverSrc = fs.readFileSync(SERVER, 'utf8');

const metaBlock = serverSrc.slice(
  serverSrc.indexOf('const EVENT_META'),
  serverSrc.indexOf('const CLIENT_REPORTED_EVENTS'),
);
const EVENT_NAMES = new Set(
  [...metaBlock.matchAll(/^\s{2}([a-z_]+):\s*new Set\(/gm)].map(m => m[1]),
);
const ALLOWED_META = {};
for (const m of metaBlock.matchAll(/^\s{2}([a-z_]+):\s*new Set\(\[([\s\S]*?)\]\)/gm)) {
  ALLOWED_META[m[1]] = new Set([...m[2].matchAll(/'([^']+)'/g)].map(x => x[1]));
}

const clientBlock = serverSrc.slice(serverSrc.indexOf('const CLIENT_REPORTED_EVENTS'));
const CLIENT_ALLOWED = new Set(
  [...clientBlock.slice(0, clientBlock.indexOf(']')).matchAll(/'([^']+)'/g)].map(m => m[1]),
);

// Only literal first arguments can be checked. A computed name is invisible
// here, which is itself a reason to keep event names literal.
const CALL = /trackEvent\(\s*(['"])([a-z_]+)\1\s*(?:,\s*(?:(['"])([^'"]*)\3|([^,)]+)))?/g;

const calls = [];
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(CALL)) {
    calls.push({
      file: path.relative(SRC, file),
      name: m[2],
      literalMeta: m[3] ? m[4] : null,
    });
  }
}

describe('the browser and the server agree on analytics', () => {
  test('there are trackEvent calls to check, so a broken scan cannot pass silently', () => {
    expect(calls.length).toBeGreaterThan(20);
  });

  test('every event name the browser fires exists on the server', () => {
    const unknown = calls
      .filter(c => !EVENT_NAMES.has(c.name))
      .map(c => `${c.name} (${c.file})`);
    expect(unknown).toEqual([]);
  });

  test('every event the browser fires is allowed to come from a browser', () => {
    const notClient = calls
      .filter(c => EVENT_NAMES.has(c.name) && !CLIENT_ALLOWED.has(c.name))
      .map(c => `${c.name} (${c.file})`);
    expect(notClient).toEqual([]);
  });

  test('every literal meta value the browser sends is in the allowed set', () => {
    const bad = calls
      .filter(c => c.literalMeta !== null && ALLOWED_META[c.name])
      .filter(c => !ALLOWED_META[c.name].has(c.literalMeta.trim().toLowerCase()))
      .map(c => `${c.name}="${c.literalMeta}" (${c.file})`);
    expect(bad).toEqual([]);
  });

  test('an event that requires a meta is never fired without one', () => {
    const missing = calls
      .filter(c => ALLOWED_META[c.name] && ALLOWED_META[c.name].size > 0)
      .filter(c => c.literalMeta === null)
      .map(c => `${c.name} (${c.file})`);
    // A non-literal meta is allowed here; only an outright missing one fails.
    const trulyMissing = missing.filter(entry => {
      const [name, where] = entry.split(' (');
      const file = fs.readFileSync(path.join(SRC, where.replace(')', '')), 'utf8');
      return new RegExp(`trackEvent\\(\\s*['"]${name}['"]\\s*\\)`).test(file);
    });
    expect(trulyMissing).toEqual([]);
  });

  test('the studio door is measurable, because that is the whole point of it', () => {
    for (const name of ['lesson_to_studio', 'quiz_to_studio', 'project_played']) {
      expect(EVENT_NAMES.has(name)).toBe(true);
      expect(CLIENT_ALLOWED.has(name)).toBe(true);
      expect(calls.some(c => c.name === name)).toBe(true);
    }
  });
});
