// A school that cannot run CodeIt must be told why, by the page itself.
//
// 12 November 2026: a Head of Computing sent a screenshot of the playground
// as plain text. The app's script had not run on his network. Nothing said
// so, and our first fix had been a guess at what his filter blocked. These
// hold the three things that came out of it: a watcher that speaks when the
// app does not start, a page that tests a computer, and storage that cannot
// take the site down.

import fs from 'fs';
import path from 'path';
import { ensureStorage } from './utils/safeStorage';

const ROOT = path.join(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
const CHECK = fs.readFileSync(path.join(ROOT, 'public', 'check.html'), 'utf8');
const scriptOf = (html, marker) => {
  const start = html.indexOf(marker);
  const open = html.indexOf('>', start) + 1;
  return html.slice(open, html.indexOf('</script>', open));
};
const WATCH = scriptOf(INDEX, '<script id="codeit-boot-watch"');
const CHECK_SCRIPT = scriptOf(CHECK, '<script>');

describe('the watcher in index.html', () => {
  let sent;
  let added;
  beforeEach(() => {
    jest.useFakeTimers();
    // Each test starts its own watcher; the last test's must not still be listening.
    added = [];
    const add = window.addEventListener.bind(window);
    jest.spyOn(window, 'addEventListener').mockImplementation((type, fn, opts) => { added.push([type, fn, opts]); add(type, fn, opts); });
    document.body.innerHTML = '<div id="root"><main class="static-home-shell"><h1>Plain text</h1></main></div>';
    delete window.__codeitBoot;
    sent = [];
    window.XMLHttpRequest = function XHR() { this.open = (m, url) => { this.url = url; }; this.setRequestHeader = () => {}; this.send = (body) => sent.push([this.url, JSON.parse(body)]); };
    // eslint-disable-next-line no-new-func
    new Function(WATCH)();
  });
  afterEach(() => {
    for (const [type, fn, opts] of added) window.removeEventListener(type, fn, opts);
    jest.restoreAllMocks();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });
  const note = () => document.getElementById('codeit-boot-note');

  test('it sits in the head, so it is on every page and runs before the app', () => {
    expect(INDEX.indexOf('id="codeit-boot-watch"')).toBeGreaterThan(0);
    expect(INDEX.indexOf('id="codeit-boot-watch"')).toBeLessThan(INDEX.indexOf('</head>'));
  });

  test('it is written for a browser too old to run the app', () => {
    for (const modern of ['=>', 'const ', 'let ', '`', '?.', '??']) expect({ modern, used: WATCH.includes(modern) }).toEqual({ modern, used: false });
  });

  test('the app started: it says nothing', () => {
    document.getElementById('root').innerHTML = '<div class="app"><header>CodeIt</header></div>';
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(30000);
    expect(note()).toBeNull();
    expect(sent).toEqual([]);
  });

  test('the app never ran: it says so, points at the check page, and counts it once', () => {
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(4000);
    expect(note()).toBeNull();                       // not yet: a slow page is not a broken page
    jest.advanceTimersByTime(1500);
    expect(note()).toHaveTextContent('CodeIt could not start on this computer.');
    expect(note().querySelector('a').getAttribute('href')).toBe('/check.html');
    expect(sent).toEqual([['/api/analytics/event', { event_name: 'boot_failed', meta: 'no-start' }]]);
    jest.advanceTimersByTime(30000);
    expect(document.querySelectorAll('#codeit-boot-note')).toHaveLength(1);
    expect(sent).toHaveLength(1);
  });

  test('a script that did not arrive is named, and counted as blocked', () => {
    const script = document.createElement('script');
    script.src = '/static/js/main.abc123.js';
    document.body.appendChild(script);
    const failed = new Event('error');
    script.dispatchEvent(failed);                    // load errors do not bubble: the watcher listens on capture
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(5500);
    expect(note()).toHaveTextContent('did not arrive: ');
    expect(note()).toHaveTextContent('/static/js/main.abc123.js');
    expect(note()).toHaveTextContent('usually the web filter');
    expect(sent[0][1]).toEqual({ event_name: 'boot_failed', meta: 'script-blocked' });
  });

  test('an error before the first screen is shown in its own words', () => {
    const boom = new Event('error');
    boom.message = 'Unexpected token';
    boom.filename = 'https://codeitlearn.com/static/js/main.abc123.js';
    boom.lineno = 2;
    window.dispatchEvent(boom);
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(5500);
    expect(note()).toHaveTextContent('error: Unexpected token (main.abc123.js, line 2)');
    expect(sent[0][1].meta).toBe('script-error');
  });

  test('a block page sent in place of the script is a blocked file, not a coding error', () => {
    const boom = new Event('error');
    boom.message = "Uncaught SyntaxError: Unexpected token '<'";
    boom.filename = `${window.location.origin}/static/js/main.abc123.js`;
    boom.lineno = 1;
    window.dispatchEvent(boom);
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(5500);
    expect(note()).toHaveTextContent('did not arrive: /static/js/main.abc123.js (a web page came back in its place)');
    expect(note()).toHaveTextContent('usually the web filter');
    expect(sent[0][1].meta).toBe('script-blocked');
  });

  test('a blank page counts as not started too', () => {
    document.getElementById('root').innerHTML = '';
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(5500);
    expect(note()).not.toBeNull();
  });

  test('the three reasons it can send are the three the server accepts', () => {
    const server = fs.readFileSync(path.join(ROOT, '..', 'codeit-backend', 'analyticsEvents.js'), 'utf8');
    const allowed = /boot_failed: new Set\(\[([^\]]+)\]\)/.exec(server)[1].split(',').map((s) => s.trim().replace(/'/g, '')).sort();
    const used = Array.from(new Set(WATCH.match(/'(script-blocked|script-error|no-start)'/g).map((s) => s.replace(/'/g, '')))).sort();
    expect(used).toEqual(allowed);
  });
});

describe('the check page', () => {
  test('it is one file that needs nothing else: no stylesheet, no script file, no other host', () => {
    expect(CHECK).not.toMatch(/<link[^>]+stylesheet/i);
    expect(CHECK).not.toMatch(/<script[^>]+src=/i);
    const hosts = Array.from(new Set((CHECK.match(/https?:\/\/[a-z0-9.-]+/gi) || [])));
    expect(hosts).toEqual(['https://codeitlearn.com']);
    expect(CHECK).toMatch(/name="robots" content="noindex/);
  });

  test('it tests the same Python the lessons load', () => {
    const loader = fs.readFileSync(path.join(ROOT, 'src', 'utils', 'pyodideLoader.js'), 'utf8');
    const version = /PYODIDE_VERSION = '([^']+)'/.exec(loader)[1];
    expect(CHECK_SCRIPT).toContain(`'/pyodide/v${version}/full/'`);
  });

  test('it is written for an old browser as well', () => {
    for (const modern of ['=>', 'const ', 'let ', '`', '?.', '??']) expect({ modern, used: CHECK_SCRIPT.includes(modern) }).toEqual({ modern, used: false });
    // eslint-disable-next-line no-new-func
    expect(() => new Function(CHECK_SCRIPT)).not.toThrow();
  });

  test('it checks the app, the server, saving and Python, and the address has a short form', () => {
    for (const name of ['The app itself (its main script)', 'The rest of the app', 'CodeIt starts', 'The CodeIt server', 'Saving on this computer', 'The Python files', 'Python runs']) expect(CHECK_SCRIPT).toContain(name);
    const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, '..', '..', 'vercel.json'), 'utf8'));
    const short = vercel.rewrites.findIndex((r) => r.source === '/check' && r.destination === '/check.html');
    const spa = vercel.rewrites.findIndex((r) => r.destination === '/index.html');
    expect(short).toBeGreaterThanOrEqual(0);
    expect(short).toBeLessThan(spa);
  });
});

describe('storage that cannot take the site down', () => {
  const blocked = () => {
    const target = {};
    for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(target, name, { get() { throw new Error('Access is denied for this document.'); }, configurable: true });
    return target;
  };

  test('storage that throws is replaced by one that works for this tab', () => {
    const target = blocked();
    expect(ensureStorage(target)).toEqual(['localStorage', 'sessionStorage']);
    expect(target.localStorage.getItem('token')).toBeNull();
    target.localStorage.setItem('token', 'abc');
    target.localStorage.setItem('n', 5);
    expect(target.localStorage.getItem('token')).toBe('abc');
    expect(target.localStorage.getItem('n')).toBe('5');
    expect(target.localStorage.length).toBe(2);
    expect(target.localStorage.key(0)).toBe('token');
    target.localStorage.removeItem('token');
    expect(target.localStorage.getItem('token')).toBeNull();
    target.localStorage.clear();
    expect(target.localStorage.length).toBe(0);
    // The two are separate stores, as they are in a browser.
    target.sessionStorage.setItem('a', '1');
    expect(target.localStorage.getItem('a')).toBeNull();
  });

  test('storage that is missing or full is replaced too', () => {
    const none = { localStorage: null, sessionStorage: undefined };
    expect(ensureStorage(none)).toEqual(['localStorage', 'sessionStorage']);
    const full = { localStorage: { setItem() { throw new Error('QuotaExceededError'); }, removeItem() {} }, sessionStorage: window.sessionStorage };
    expect(ensureStorage(full)).toEqual(['localStorage']);
  });

  test('storage that works is left alone', () => {
    const real = window.localStorage;
    expect(ensureStorage(window)).toEqual([]);
    expect(window.localStorage).toBe(real);
  });

  test('it is the first thing the app loads', () => {
    const index = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
    const first = index.split('\n').find((line) => line.startsWith('import '));
    expect(first).toBe("import './utils/safeStorage';");
  });
});
