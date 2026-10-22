import fs from 'fs';
import path from 'path';

// ── One rule book, two copies ────────────────────────────────────────────────
//
// The server checks a power with the file in codeit-backend; the page shows
// the child the file here. If they ever drift, a child could be told "right"
// by the page and "wrong" by the server. So the two files are the same text
// up to the export line.
test('src/pages/Powers/powers.js is the backend powers.js word for word, up to the export line', () => {
  const mine = fs.readFileSync(path.join(__dirname, 'powers.js'), 'utf8');
  const theirs = fs.readFileSync(path.resolve(__dirname, '../../../../codeit-backend/powers.js'), 'utf8');
  const body = (text) => text.replace(/^'use strict';\n\n/, '').split('// ── exports ──')[0];
  expect(body(mine)).toBe(body(theirs));
  expect(mine).toMatch(/^export \{ LESSON_BASE/m);
  expect(theirs).toMatch(/^module\.exports = \{ LESSON_BASE/m);
});
