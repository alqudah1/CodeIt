import fs from 'fs';
import path from 'path';

// ── A parser error is not an error message ───────────────────────────────────
//
// A screenshot of /explore with the API answering HTML, taken 3 September:
//
//   Unexpected token '<', "<!doctype "... is not valid JSON
//
// printed in the middle of the page where the projects should be. Five places
// in the app were passing a thrown error's own words to the screen, so any of
// them could do the same on a bad day: the public project page, three places in
// the studio, and the admin funnel.
//
// Every catch site that shows something to a person now goes through
// reportFailure, which logs the real error and returns a sentence.
const SRC = __dirname;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    if (line.trim().startsWith('//')) return;
    // A raw thrown message handed to a state setter that a screen renders.
    if (/set[A-Z]\w*Error\(\s*(err|error|e)\.message\s*\)/.test(line)
      || /set[A-Z]\w*\(\s*(err|error|e)\.message\s*\)/.test(line)) {
      offenders.push(`${path.relative(SRC, file)}:${index + 1} ${line.trim()}`);
    }
  });
}

describe('error copy', () => {
  test('the scan reads real files', () => {
    expect(walk(SRC).length).toBeGreaterThan(100);
  });

  test('no screen is handed a thrown error\'s own words', () => {
    expect(offenders).toEqual([]);
  });

  test('the places that used to do it go through the helper', () => {
    for (const file of ['pages/Builder/Explore.js', 'pages/Builder/PublicProject.js',
      'pages/Builder/Builder.js', 'pages/Admin/AdminFunnel.js']) {
      const text = fs.readFileSync(path.join(SRC, file), 'utf8');
      expect(text).toMatch(/reportFailure\(/);
    }
  });
});
