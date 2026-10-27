import fs from 'fs';
import path from 'path';

// ── One way of reading a sentence, two copies ───────────────────────────────
//
// The server reads a child's sentence when the model cannot, and the page
// reads it when the server cannot. If the two copies drifted, the same
// sentence would make a different game depending on the Wi-Fi.
test('src/pages/Build/gameWords.js is the backend gameWords.js word for word, up to the export line', () => {
  const mine = fs.readFileSync(path.join(__dirname, 'gameWords.js'), 'utf8');
  const theirs = fs.readFileSync(path.resolve(__dirname, '../../../../codeit-backend/gameWords.js'), 'utf8');
  const body = (text) => text.replace(/^'use strict';\n\n/, '').split('// ── exports ──')[0];
  expect(body(mine)).toBe(body(theirs));
  expect(mine).toMatch(/^export \{ DEFAULTS/m);
  expect(theirs).toMatch(/^module\.exports = \{ DEFAULTS/m);
});
