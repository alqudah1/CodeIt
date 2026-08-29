'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { looksWrapped, problemsWith, scriptsIn, syntaxErrorIn, willRun } =
  require('./generatedCode');

// ── The gap this closes ──────────────────────────────────────────────────────
//
// Before this, the server decided a generated project was good by searching its
// text for words. A game had to contain "score", and one of
// "restart|startGame|newGame", and one of "setInterval|setTimeout|
// requestAnimationFrame". Nothing anywhere asked whether the JavaScript parsed.

const PASSES_THE_OLD_CHECKS_AND_CANNOT_RUN = `<!doctype html>
<html><head><style>body { margin: 0 }</style></head>
<body><canvas id="c"></canvas>
<script>
let scor = 0;
document.addEventListener('click', tick);
function tick() {
  score = score + 1;
  setInterval(draw, 16)
  restart(
}
<\/script>
</body></html>`;

test('the shape of failure that reached children', () => {
  const html = PASSES_THE_OLD_CHECKS_AND_CANNOT_RUN;

  // Every one of the old checks is satisfied.
  assert.ok(html.trim().length > 200);
  assert.match(html, /<body/i);
  assert.match(html, /<style/i);
  assert.match(html, /<\/html>/i);
  assert.match(html, /<script[\s\S]*?>[\s\S]{80,}<\/script>/i);
  assert.match(html, /addEventListener/i);
  assert.match(html, /score/i);
  assert.match(html, /restart|startGame|newGame/i);
  assert.match(html, /setInterval|setTimeout|requestAnimationFrame/i);

  // And it will not start.
  assert.equal(willRun(html), false);
  assert.equal(problemsWith(html)[0].kind, 'syntax');
});

// ── Reading the scripts out ──────────────────────────────────────────────────

test('it finds the code a project runs', () => {
  const html = '<body><script>let a = 1;<\/script><script>let b = 2;<\/script></body>';
  assert.deepEqual(scriptsIn(html), ['let a = 1;', 'let b = 2;']);
});

test('an external script has no body to check', () => {
  const html = '<body><script src="https://example.com/x.js"><\/script><script>let a = 1;<\/script></body>';
  assert.deepEqual(scriptsIn(html), ['let a = 1;']);
});

test('an empty script block is not a problem to report', () => {
  assert.deepEqual(scriptsIn('<body><script>   <\/script></body>'), []);
});

test('nonsense in, empty out', () => {
  for (const input of [null, undefined, 42, {}, []]) {
    assert.deepEqual(scriptsIn(input), []);
    assert.ok(Array.isArray(problemsWith(input)));
  }
});

// ── Parsing, without running ─────────────────────────────────────────────────

test('working code parses', () => {
  assert.equal(syntaxErrorIn('<script>let a = 1; function go() { return a + 1; }<\/script>'), null);
});

test('it says which script broke, when there are several', () => {
  const html = '<script>let a = 1;<\/script><script>function b( {<\/script>';
  const found = syntaxErrorIn(html);
  assert.equal(found.script, 2);
  assert.equal(found.of, 2);
});

test('compiling is not running', () => {
  // The point of new Function over eval: a project that would delete something
  // or loop forever is parsed and then dropped, never called.
  const dangerous = '<script>while (true) {} document.body.innerHTML = "";<\/script>';
  assert.equal(syntaxErrorIn(dangerous), null);
});

test('modern syntax a model actually writes is not a false alarm', () => {
  const modern = `<script>
    const items = [1, 2, 3];
    const doubled = items.map(n => n * 2);
    const { a = 1, ...rest } = { a: 2, b: 3 };
    class Thing { #secret = 1; get value() { return this.#secret; } }
    async function go() { for await (const x of []) {} }
    const maybe = rest?.b ?? 0;
    label: for (const x of items) { if (x) continue label; }
  <\/script>`;
  assert.equal(syntaxErrorIn(modern), null);
});

// ── The model talking instead of writing a file ──────────────────────────────

test('a code fence at the top of the file is caught', () => {
  assert.equal(looksWrapped('```html\n<!doctype html><html></html>'), true);
  assert.equal(looksWrapped("Here's your game!\n<!doctype html>"), true);
  assert.equal(looksWrapped('<!doctype html><html></html>'), false);
  assert.equal(looksWrapped('\n\n  <html></html>'), false);
});

test('a project with nothing that runs is reported', () => {
  const flat = '<!doctype html><html><body><h1>hello</h1></body></html>';
  assert.equal(problemsWith(flat)[0].kind, 'no-script');
});

test('an empty answer is reported as one thing, not five', () => {
  assert.deepEqual(problemsWith(''), [{ kind: 'empty', detail: 'no project was returned' }]);
});

// ── The project a child gets when generation fails twice ─────────────────────
//
// getRichFallback is the safe path: hand-written HTML returned when the model
// produced something unusable two attempts running. If a fallback itself did
// not parse, then the code that exists to rescue a broken project would be
// shipping one — and it would do it silently, on exactly the occasions when
// something has already gone wrong.

test('every fallback project parses', () => {
  const source = fs.readFileSync(path.join(__dirname, 'routes', 'builder.js'), 'utf8');

  // The fallbacks are functions returning one template literal each. Read them
  // out and compile what is inside their <script> tags.
  const builders = [...source.matchAll(/function (build\w*Fallback\w*)\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g)];
  assert.ok(builders.length >= 4, `found ${builders.length} fallback builders`);

  let checked = 0;
  for (const [, name, body] of builders) {
    for (const literal of body.matchAll(/`([\s\S]*?<script[\s\S]*?)`/g)) {
      const html = literal[1].replace(/\$\{[^}]*\}/g, '0');
      const problem = syntaxErrorIn(html);
      assert.equal(problem, null, `${name} will not parse: ${problem && problem.message}`);
      checked += 1;
    }
  }
  assert.ok(checked >= 1, 'no fallback HTML was actually examined');
});
