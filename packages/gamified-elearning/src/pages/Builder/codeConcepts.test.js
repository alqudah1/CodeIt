import { CONCEPTS, conceptSummary, conceptsIn } from './codeConcepts';
import { STARTER_GAMES } from './starterGames';

const TINY = `<!doctype html>
<html><body>
<script>
let score = 0;
let colour = '#ff0000';
function start() {
  for (let i = 0; i < 5; i++) {
    if (score > 3 && score < 10) {
      score = score + 1;
    }
  }
}
<\/script>
</body></html>`;

// ── It reports what is there, not what was asked for ────────────────────────

test('it finds only concepts the code actually contains', () => {
  const ids = conceptsIn(TINY).map(c => c.id);
  expect(ids).toContain('variables');
  expect(ids).toContain('if');
  expect(ids).toContain('forLoops');
  expect(ids).toContain('functions');
  expect(ids).toContain('logic');

  // Nothing in TINY does any of these. The old code would have claimed them
  // anyway, because it read the child's prompt and not their file.
  expect(ids).not.toContain('whileLoops');
  expect(ids).not.toContain('random');
  expect(ids).not.toContain('errors');
});

test('an empty project claims nothing', () => {
  expect(conceptsIn('<html><body><p>hi</p></body></html>')).toEqual([]);
  expect(conceptsIn('')).toEqual([]);
  expect(conceptsIn(null)).toEqual([]);
});

test('nonsense input does not throw', () => {
  for (const input of [null, undefined, 42, {}, [], '<script>']) {
    expect(() => conceptsIn(input)).not.toThrow();
    expect(Array.isArray(conceptsIn(input))).toBe(true);
  }
});

// ── The studio's own injected code must never be counted ────────────────────

test('the bridge and the storage shim are not the child’s work', () => {
  // The preview has three scripts spliced into it, all full of loops and
  // conditionals. Counting them would tell a seven-year-old they had written a
  // hundred if statements, and the proof would be a line they had never seen.
  const withInjected = `<html><body>
<script>window.__codeit_storage__ = function(){ for (var i=0;i<9;i++){ if (i) try { x(); } catch(e){} } };<\/script>
<script>
let speed = 4;
<\/script>
</body></html>`;
  const ids = conceptsIn(withInjected).map(c => c.id);
  expect(ids).toContain('variables');
  expect(ids).not.toContain('errors');
  expect(ids).not.toContain('whileLoops');
  expect(ids).not.toContain('forLoops');
});

test('comments are not code', () => {
  const html = `<script>
// if you want a for loop, try while (true)
let x = 1;
<\/script>`;
  const ids = conceptsIn(html).map(c => c.id);
  expect(ids).not.toContain('if');
  expect(ids).not.toContain('whileLoops');
  expect(ids).not.toContain('forLoops');
});

// ── Every claim comes with the child's own line ─────────────────────────────

test('each concept points at a real line of their code', () => {
  for (const concept of conceptsIn(TINY)) {
    expect(concept.line).toBeGreaterThan(0);
    expect(concept.snippet.length).toBeGreaterThan(0);
    expect(TINY).toContain(concept.snippet);
  }
});

test('the example shown is the shortest one, not the first', () => {
  // A child looking for their first if statement should be shown the clearest
  // one, not a forty-character line with three things happening in it.
  const html = `<script>
if (a > 1 && b < 2 && c === 3 && somethingElse(d)) { doTheThing(); }
if (b) go();
<\/script>`;
  expect(conceptsIn(html).find(c => c.id === 'if').snippet).toBe('if (b) go();');
});

test('it counts how many times, so "one loop" and "nine loops" differ', () => {
  const one = conceptsIn(`<script>for (let i=0;i<3;i++) go();<\/script>`);
  expect(one.find(c => c.id === 'forLoops').count).toBe(1);
});

// ── Every concept leads somewhere real ──────────────────────────────────────

test('every concept names a lesson that exists', () => {
  // There are 31 lessons. A chip pointing at lesson 44 is a dead end, and the
  // curriculum has grown before.
  for (const concept of CONCEPTS) {
    expect(concept.lessonId).toBeGreaterThanOrEqual(1);
    expect(concept.lessonId).toBeLessThanOrEqual(31);
  }
});

test('every concept is honest about the language gap', () => {
  // The studio writes JavaScript and every lesson is Python. A child who taps
  // "If statements" after writing `if (x > 3) {` and lands on `if x > 3:`
  // deserves to have been told, not left thinking one of them is wrong.
  for (const concept of CONCEPTS) {
    expect(typeof concept.note).toBe('string');
    expect(concept.note.length).toBeGreaterThan(10);
  }
  expect(CONCEPTS.find(c => c.id === 'if').note).toMatch(/colon|Python/i);
});

test('every concept is described in words a child reads', () => {
  for (const concept of CONCEPTS) {
    expect(concept.what).toBeTruthy();
    expect(concept.what).not.toMatch(/instantiate|iterate|boolean expression|conditional statement|declaration/i);
  }
});

// ── The real games ──────────────────────────────────────────────────────────

describe.each(STARTER_GAMES.map(g => [g.label, g]))('%s', (label, game) => {
  test('reports several real concepts', () => {
    const found = conceptsIn(game.code);
    expect(found.length).toBeGreaterThanOrEqual(5);
  });

  test('every reported line is really in the file', () => {
    for (const concept of conceptsIn(game.code)) {
      expect(game.code).toContain(concept.snippet);
    }
  });
});

test('the summary counts things, not questions asked', () => {
  expect(conceptSummary([{ id: 'a' }])).toBe('You used 1 thing from the lessons in this project.');
  expect(conceptSummary([{ id: 'a' }, { id: 'b' }])).toMatch(/^You used 2 things/);
  expect(conceptSummary([])).toBeNull();
  expect(conceptSummary(null)).toBeNull();
});
