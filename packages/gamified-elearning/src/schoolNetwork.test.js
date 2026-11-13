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
  let asked;
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
    asked = [];
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/playground');
    // What it posts is kept in `sent`; what it asks for (the small-files
    // version's list of files) waits in `asked` for the test to answer.
    window.XMLHttpRequest = function XHR() {
      this.open = (method, url) => { this.method = method; this.url = url; };
      this.setRequestHeader = () => {};
      this.send = (body) => { if (this.method === 'GET') asked.push(this); else sent.push([this.url, JSON.parse(body)]); };
    };
    start();
  });
  // eslint-disable-next-line no-new-func
  const start = () => new Function(WATCH)();
  const SMALL = { files: { 'main.js': '/lite/static/js/main.small1.js', 'main.css': '/lite/static/css/main.small1.css' } };
  const answer = (request, body) => { request.responseText = JSON.stringify(body); request.onload(); };
  const stopFile = (src) => {
    const script = document.createElement('script');
    script.src = src;
    document.body.appendChild(script);
    script.dispatchEvent(new Event('error'));          // load errors do not bubble: the watcher listens on capture
    return script;
  };
  afterEach(() => {
    document.head.querySelectorAll('script[src*="/lite/"], link[href*="/lite/"]').forEach((node) => node.remove());
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/');
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

  test('the app\'s files are stopped: the small-files version is started in their place', () => {
    stopFile('/static/js/2627.abc123.chunk.js');
    expect(asked.map((request) => request.url)).toEqual(['/lite/asset-manifest.json']);
    expect(window.__codeitBoot.small).toBe(true);     // the main entry file reads this and stands aside
    answer(asked[0], SMALL);
    expect(document.head.querySelector('script[src="/lite/static/js/main.small1.js"]')).not.toBeNull();
    expect(document.head.querySelector('link[rel="stylesheet"][href="/lite/static/css/main.small1.css"]')).not.toBeNull();
    expect(sent).toEqual([['/api/analytics/event', { event_name: 'boot_failed', meta: 'small-files' }]]);
    // It starts, and nothing more is said.
    document.getElementById('root').innerHTML = '<div class="app"><header>CodeIt</header></div>';
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(60000);
    expect(note()).toBeNull();
    expect(sent).toHaveLength(1);
  });

  test('it is asked for once, however many files are stopped', () => {
    stopFile('/static/js/2627.abc123.chunk.js');
    stopFile('/static/js/579.abc123.chunk.js');
    stopFile('/static/js/9137.abc123.chunk.js');
    expect(asked).toHaveLength(1);
  });

  test('it is remembered for the rest of the visit, so the next page does not wait for files that will not come', () => {
    stopFile('/static/js/2627.abc123.chunk.js');
    expect(window.sessionStorage.getItem('codeit.small-files')).toBe('1');
    asked = [];
    delete window.__codeitBoot;
    start();                                           // the next page load in the same tab
    expect(asked.map((request) => request.url)).toEqual(['/lite/asset-manifest.json']);
    expect(window.__codeitBoot.small).toBe(true);
  });

  test('an app that is already running is never joined by a second one', () => {
    window.__codeitBoot.app = true;                    // boot.js says this before it draws anything
    stopFile('/static/js/6042.abc123.chunk.js');       // a later page's file is stopped
    expect(asked).toEqual([]);
    expect(window.__codeitBoot.small).toBe(false);
  });

  test('a guide gets it too: the articles are in small files now', () => {
    window.history.pushState({}, '', '/guide/scratch-vs-python');
    stopFile('/static/js/2627.abc123.chunk.js');
    expect(asked.map((request) => request.url)).toEqual(['/lite/asset-manifest.json']);
  });

  test('if the small-files version is stopped as well, it says so, names the file, and counts it as blocked', () => {
    stopFile('/static/js/2627.abc123.chunk.js');
    answer(asked[0], SMALL);
    stopFile('/lite/static/js/main.small1.js');
    expect(note()).toHaveTextContent('CodeIt could not start on this computer.');
    expect(note()).toHaveTextContent('did not arrive: /static/js/2627.abc123.chunk.js');
    expect(note()).toHaveTextContent('/lite/static/js/main.small1.js');
    expect(note()).toHaveTextContent('usually the web filter');
    expect(sent.map((one) => one[1].meta)).toEqual(['small-files', 'script-blocked']);
  });

  test('if its list of files does not arrive, that is said too', () => {
    stopFile('/static/js/main.abc123.js');
    asked[0].onerror();
    expect(note()).toHaveTextContent('did not arrive: /static/js/main.abc123.js');
    expect(note()).toHaveTextContent('usually the web filter');
    expect(sent[0][1]).toEqual({ event_name: 'boot_failed', meta: 'script-blocked' });
  });

  test('a small-files version that never draws anything is not waited for for ever', () => {
    stopFile('/static/js/2627.abc123.chunk.js');
    answer(asked[0], SMALL);
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(6000);
    expect(note()).toBeNull();                         // it has been asked for: give it time
    jest.advanceTimersByTime(30000);
    expect(note()).toHaveTextContent('CodeIt could not start on this computer.');
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
    expect(asked).toHaveLength(1);                     // the small-files version is tried for this too
    asked[0].onerror();
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

  test('the reasons it can send are the ones the server accepts', () => {
    const server = fs.readFileSync(path.join(ROOT, '..', 'codeit-backend', 'analyticsEvents.js'), 'utf8');
    const allowed = /boot_failed: new Set\(\[([^\]]+)\]\)/.exec(server)[1].split(',').map((s) => s.trim().replace(/'/g, '')).sort();
    const used = Array.from(new Set(WATCH.match(/'(script-blocked|script-error|no-start|small-files)'/g).map((s) => s.replace(/'/g, '')))).sort();
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
    for (const name of ['The app\\\'s first file (its entry script)', 'The app itself (lessons, playground, studio)', 'The small-files version', 'Test scripts with nothing in them but numbers', 'CodeIt starts', 'The CodeIt server', 'Saving on this computer', 'The Python files', 'Python runs']) expect(CHECK_SCRIPT).toContain(name);
    const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, '..', '..', 'vercel.json'), 'utf8'));
    const short = vercel.rewrites.findIndex((r) => r.source === '/check' && r.destination === '/check.html');
    const spa = vercel.rewrites.findIndex((r) => r.destination === '/index.html');
    expect(short).toBeGreaterThanOrEqual(0);
    expect(short).toBeLessThan(spa);
  });
});

// 13 November 2026: the first run of the check page at the school said "6 of
// 73 pieces did not arrive. First: ...: The server answered 403." That named
// one file of six and nothing about why, so the next fix was again partly a
// guess. A run now has to settle it: every stopped file, its size, what the
// network sent back in its place, and whether the answer came from us.
describe('what one run of the check page settles', () => {
  test('every stopped file is listed with its real size, and where the line falls', () => {
    expect(CHECK_SCRIPT).toContain("'/check-files.json'");
    expect(CHECK_SCRIPT).toContain('The largest that arrived is ');
    expect(CHECK_SCRIPT).toContain('The smallest that was stopped is ');
    expect(CHECK_SCRIPT).toContain("'stopped: '");
  });

  test('it reports what came back in place of a file, and who wrote it', () => {
    expect(CHECK_SCRIPT).toContain("'x-vercel-id'");
    expect(CHECK_SCRIPT).toContain('It says: "');
    expect(CHECK_SCRIPT).toContain('something on the network wrote it');
  });

  test('it tests the small-files version, and scripts that are large but hold only numbers', () => {
    expect(CHECK_SCRIPT).toContain("'/lite/asset-manifest.json'");
    expect(CHECK_SCRIPT).toContain('the filter is judging what is inside');
    expect(CHECK_SCRIPT).toContain('stops scripts by how big they are');
    const build = fs.readFileSync(path.join(ROOT, 'scripts', 'build.js'), 'utf8');
    expect(build).toContain('check-files.json');
    expect(build).toContain('size-test-');
  });
});

// ── Two builds ──────────────────────────────────────────────────────────────
//
// What the school's check run showed: every script up to 68 KB arrived and
// six larger ones were answered 403. Three things in the app cannot be made
// small by cutting: React (130 KB in one module), the coloured code editor
// (185 KB) and the studio page. So the site is built twice. The second build
// uses Preact in place of React and the plain editor in place of the coloured
// one, and a page switches to it by itself when the first is stopped.
describe('the small-files version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  // eslint-disable-next-line global-require
  const build = require('../scripts/build');

  test('the build command is the script that makes both versions', () => {
    expect(pkg.scripts.build).toBe('node scripts/build.js');
    expect(pkg.dependencies.preact).toBeDefined();
    expect(pkg.dependencies['preact-render-to-string']).toBeDefined();
  });

  test('scripts are cut into parts no bigger than 50 KB, and stylesheets are left alone', () => {
    const config = build.smallFiles({ optimization: {} });
    const parts = config.optimization.splitChunks.cacheGroups.parts;
    expect(parts.maxSize).toBe(50000);
    expect(parts.chunks).toBe('async');
    expect('x.css'.match(parts.type)).toBeNull();
    expect(parts.type.test('javascript/auto')).toBe(true);
    expect(parts.type.test('css/mini-extract')).toBe(false);
  });

  test('it swaps React for Preact everywhere React is asked for, and keeps its chunks apart from the main build\'s', () => {
    const config = build.smallVersion({ resolve: { alias: { other: 'kept' } }, output: {} });
    expect(config.resolve.alias).toMatchObject({ other: 'kept', react: 'preact/compat', 'react-dom': 'preact/compat', 'react-dom/client': 'preact/compat/client', 'react/jsx-runtime': 'preact/jsx-runtime' });
    expect(config.output.chunkLoadingGlobal).not.toBe('webpackChunk_e_learning_gamified_elearning');
    expect(config.output.chunkLoadingGlobal).toMatch(/small/);
  });

  test('the main entry stands aside when the small-files version has been started', () => {
    const index = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
    expect(index).toContain("if (process.env.REACT_APP_LITE === '1' || !(window.__codeitBoot && window.__codeitBoot.small)) import('./boot');");
    const boot = fs.readFileSync(path.join(ROOT, 'src', 'boot.js'), 'utf8');
    expect(boot.indexOf('window.__codeitBoot.app = true')).toBeGreaterThan(0);
    expect(boot.indexOf('window.__codeitBoot.app = true')).toBeLessThan(boot.indexOf('createRoot('));
  });

  test('nothing every page asks for is one large file: each starter game is a file of its own', () => {
    const dir = path.join(ROOT, 'src', 'pages', 'Builder', 'starterGames');
    const games = fs.readdirSync(dir).filter((name) => name.endsWith('.js'));
    expect(games.length).toBeGreaterThanOrEqual(12);   // eleven games and what they share
    for (const name of games) expect({ name, small: fs.statSync(path.join(dir, name)).size < 20000 }).toEqual({ name, small: true });
    expect(fs.statSync(path.join(ROOT, 'src', 'pages', 'Builder', 'starterGames.js')).size).toBeLessThan(20000);
  });

  test('the coloured editor is its own file, asked for separately, and not part of the small-files version', () => {
    const runner = fs.readFileSync(path.join(ROOT, 'src', 'components', 'CodeRunnerPython.js'), 'utf8');
    expect(runner).not.toMatch(/from '@uiw\/react-codemirror'|from '@codemirror/);
    const loader = fs.readFileSync(path.join(ROOT, 'src', 'components', 'editorLoader.js'), 'utf8');
    expect(loader).toContain("process.env.REACT_APP_LITE === '1'");
    expect(loader).toContain("import('./PythonEditor')");
  });
});

// ── So that it cannot come back unnoticed ───────────────────────────────────
describe('what stops a large file from coming back', () => {
  // eslint-disable-next-line global-require
  const build = require('../scripts/build');
  const os = require('os');

  test('the build stops if anything but the studio is over the limit in the small-files version', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeit-small-'));
    fs.mkdirSync(path.join(dir, 'static', 'js'), { recursive: true });
    const write = (name, text) => fs.writeFileSync(path.join(dir, 'static', 'js', name), text);
    write('1.chunk.js', 'x'.repeat(40000));                                  // a normal part
    write('2.chunk.js', build.STUDIO_MARK + 'x'.repeat(150000));             // the studio page
    expect(build.tooBig(dir)).toEqual([]);
    write('3.chunk.js', 'y'.repeat(build.SMALL_LIMIT + 1));                  // something that grew
    expect(build.tooBig(dir).map((file) => file.name)).toEqual(['3.chunk.js']);
    expect(build.SMALL_LIMIT).toBeLessThan(68000);                           // under the largest script seen to arrive
    const source = fs.readFileSync(path.join(ROOT, 'scripts', 'build.js'), 'utf8');
    expect(source).toMatch(/const bad = tooBig\([^)]*\)\);\s*if \(bad\.length\) \{[\s\S]*?process\.exit\(1\);/);
  });

  test('the guides are in parts, none of them large', () => {
    const dir = path.join(ROOT, 'src', 'data', 'guides');
    const parts = fs.readdirSync(dir).filter((name) => name.endsWith('.js'));
    expect(parts.length).toBeGreaterThanOrEqual(4);
    for (const name of parts) expect({ name, small: fs.statSync(path.join(dir, name)).size < 45000 }).toEqual({ name, small: true });
    expect(fs.statSync(path.join(ROOT, 'src', 'data', 'guidePages.js')).size).toBeLessThan(5000);
  });

  test('there is a check that plays the school\'s filter against the real build, and it is one of the checks that are run', () => {
    const checks = path.join(ROOT, '..', '..', 'ops', 'checks');
    const check = fs.readFileSync(path.join(checks, 'school-filter.js'), 'utf8');
    expect(check).toContain('const LIMIT = 68 * 1000;');
    expect(check).toContain("res.writeHead(403");
    expect(fs.readFileSync(path.join(checks, 'run-all.sh'), 'utf8')).toContain('run school-filter.js');
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
    // And the app comes after it, as its own file.
    expect(index.indexOf("import('./boot')")).toBeGreaterThan(index.indexOf("import './utils/safeStorage';"));
  });
});

// ── What a school filter reads ──────────────────────────────────────────────
//
// A school web filter scores the words in every file it lets through and
// drops a file whose score is too high. Measured on 12 November 2026 against
// the open phrase lists that UK school filters grew out of (e2guardian,
// ukenglish): the playground page scored 5 and arrived; the single script
// holding the whole site scored 135, where the limit suggested for children
// is 50, and did not. Fifty of those points were one sentence on the home
// page, "I am an adult", which the list files under pornography. Sixty were
// pairs of unrelated words that only met because everything was in one file.
//
// Two rules came out of it. The entry file stays empty, so the site arrives as
// many files that are each about one thing. And the sentences that cost the
// most, for nothing, stay out.
describe('what a school filter reads', () => {
  const read = (dir, out = []) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) read(full, out);
      else if (/\.(js|html)$/.test(name) && !/\.test\.js$/.test(name)) out.push(full);
    }
    return out;
  };
  const served = [...read(path.join(ROOT, 'src')), ...read(path.join(ROOT, 'public')), path.join(ROOT, 'scripts', 'generate-static-seo.js')];

  test('the entry file holds no words: it makes storage safe and asks for the app', () => {
    const index = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
    const code = index.split('\n').filter((line) => line.trim() && !line.trim().startsWith('//'));
    expect(code).toEqual(["import './utils/safeStorage';", "if (process.env.REACT_APP_LITE === '1' || !(window.__codeitBoot && window.__codeitBoot.small)) import('./boot');"]);
  });

  test('the sentences that cost the most on a filter are not in anything we serve', () => {
    // phrase: what the open lists file it under, and what it cost.
    const costly = {
      'i am an adult': 'pornography, 50',
      'do not enter': 'pornography, 50 with "age" and "18" on the same page',
      'sexual content': 'pornography, 20',
      ' betting ': 'gambling, 30',
      'a shooting game': 'weapons, 15',
      'adventure game': 'games, 30',
      ' in action': 'games, 30 on any page that also says game',
      'repeating actions': 'games, 30 on any page that also says game',
    };
    const found = [];
    for (const file of served) {
      const text = fs.readFileSync(file, 'utf8').toLowerCase();
      for (const phrase of Object.keys(costly)) if (text.includes(phrase)) found.push(`${path.relative(ROOT, file)}: "${phrase}" (${costly[phrase]})`);
    }
    expect(found).toEqual([]);
  });
});
