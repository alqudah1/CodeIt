'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { shrinkForModel, parseEdits, applyEdits, looseFind, LONG_LINE } = require('./editPatches');

const GAME = [
  '<script>',
  '// ── Change these and watch what happens ──',
  'let speed = 2;',
  'let lives = 3;',
  `const SPRITES = {"hero":"${'x'.repeat(LONG_LINE + 10)}"};`,
  'function startGame() {',
  '  score = 0;',
  '}',
  '</script>',
].join('\n');

test('long picture data is hidden from the model and put back afterwards', () => {
  const shrunk = shrinkForModel(GAME);
  assert.equal(shrunk.kept, 1);
  assert.ok(shrunk.text.length < 300, 'the model reads a short file');
  assert.match(shrunk.text, /^const SPRITES = __KEPT_1__$/m, 'it still says what the line was');
  const back = shrunk.restore(shrunk.text.replace('let speed = 2;', 'let speed = 3;'));
  assert.deepEqual(back.lost, []);
  assert.equal(back.code, GAME.replace('let speed = 2;', 'let speed = 3;'));
});

test('an edit that deletes the picture line is reported, not shipped', () => {
  const shrunk = shrinkForModel(GAME);
  const back = shrunk.restore(shrunk.text.replace(/^const SPRITES.*$/m, ''));
  assert.deepEqual(back.lost, ['__KEPT_1__']);
});

test('edits and the summary are read out of a reply', () => {
  const { edits, summary } = parseEdits(`Sure.
<EDIT>
<FIND>
let speed = 2;
</FIND>
<REPLACE>
let speed = 4;
</REPLACE>
</EDIT>
<EDIT>
<FIND>
let lives = 3;
</FIND>
<REPLACE>
let lives = 5;
</REPLACE>
</EDIT>
<SUMMARY>We made the carrots fall faster and gave you five lives.</SUMMARY>`);
  assert.equal(edits.length, 2);
  assert.deepEqual(edits[0], { find: 'let speed = 2;', replace: 'let speed = 4;' });
  assert.equal(summary, 'We made the carrots fall faster and gave you five lives.');
});

test('an exact edit applies once, in order, and later edits see earlier ones', () => {
  const out = applyEdits(GAME, [
    { find: 'let speed = 2;', replace: 'let speed = 4;' },
    { find: 'let speed = 4;', replace: 'let speed = 5;' },
  ]);
  assert.deepEqual(out.misses, []);
  assert.match(out.code, /let speed = 5;/);
});

test('a re-indented FIND still lands, on the right lines', () => {
  const out = applyEdits(GAME, [{ find: 'function startGame() {\nscore = 0;', replace: 'function startGame() {\n  score = 0;\n  lives = 3;' }]);
  assert.deepEqual(out.misses, []);
  assert.match(out.code, /score = 0;\n  lives = 3;\n}/);
});

test('a FIND that is missing or ambiguous is reported, never guessed', () => {
  const twice = `${GAME}\nlet speed = 2;`;
  const out = applyEdits(twice, [
    { find: 'let speed = 2;', replace: 'let speed = 9;' },
    { find: 'let gravity = 1;', replace: 'let gravity = 2;' },
    { find: '   ', replace: 'x' },
  ]);
  assert.deepEqual(out.misses.map((m) => m.edit), [1, 2, 3]);
  assert.equal(out.code, twice, 'nothing was changed');
  assert.equal(looseFind('a\n b\na\n b', 'a\nb'), null, 'two loose matches is no match');
});
