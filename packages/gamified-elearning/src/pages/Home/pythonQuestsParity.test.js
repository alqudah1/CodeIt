import fs from 'fs';
import path from 'path';

// One quest a day, two copies: the browser checks the output so the child
// sees the tick at once, the server checks it again so the XP is real.
test('src/pages/Home/pythonQuests.js is the backend pythonQuests.js word for word, up to the export line', () => {
  const mine = fs.readFileSync(path.join(__dirname, 'pythonQuests.js'), 'utf8');
  const theirs = fs.readFileSync(path.resolve(__dirname, '../../../../codeit-backend/pythonQuests.js'), 'utf8');
  const body = (text) => text.replace(/^'use strict';\n\n/, '').split('// ── exports ──')[0];
  expect(body(mine)).toBe(body(theirs));
  expect(mine).toMatch(/^export \{ PYTHON_QUESTS/m);
  expect(theirs).toMatch(/^module\.exports = \{ PYTHON_QUESTS/m);
});
