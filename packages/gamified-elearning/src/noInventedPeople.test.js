import fs from 'fs';
import path from 'path';

// ── Nobody who does not exist may appear on this site ────────────────────────
//
// The home page carried a mock parent progress email announcing that "Sam
// published My Space Quiz". No Sam, no quiz. It sat in the one place on the
// page that looked like proof.
//
// This is not a style rule. A fabricated child on a children's product is the
// single fastest way to lose a parent who checks, and the site's whole argument
// is that it tells the truth about what it is.
const SRC = __dirname;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Named people who were invented, and the projects attributed to them. Kept as
// a list rather than a pattern: the point is that these exact fictions were on
// the live site, and the test names them so nobody puts them back by habit.
const INVENTED = [
  'My Space Quiz',
  'Sam published',
  'Sam built an interactive quiz',
];

const offenders = [];
for (const file of walk(SRC)) {
  // The starter projects and the AI prompts are allowed to contain example
  // content: they are templates a child fills in, not claims about a person.
  const rel = path.relative(SRC, file);
  if (/starter(Games|Sites|Quizzes|Projects)/.test(rel)) continue;
  // Comments stripped first. The comment explaining why the fake child was
  // deleted quotes his name, and a guard that fails on its own explanation is
  // the same mistake as a guard that asserts the presence of a bug.
  const text = fs.readFileSync(file, 'utf8')
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
    .split('\n')
    .filter(line => !line.trim().startsWith('//'))
    .join('\n');
  for (const phrase of INVENTED) {
    if (text.includes(phrase)) offenders.push(`${rel}: ${phrase}`);
  }
}

describe('people on the site', () => {
  test('the scan reads real files', () => {
    expect(walk(SRC).length).toBeGreaterThan(100);
  });

  test('no invented student appears anywhere', () => {
    expect(offenders).toEqual([]);
  });

  test('the home page is not carrying a fake testimonial either', () => {
    const home = fs.readFileSync(path.join(SRC, 'pages', 'Home', 'Home.js'), 'utf8');
    // Nothing true to put in any of these yet, and a fake one is worse than an
    // empty page.
    expect(home).not.toMatch(/trusted by|\d+,\d+ students|★|5 stars|testimonial/i);
  });
});
