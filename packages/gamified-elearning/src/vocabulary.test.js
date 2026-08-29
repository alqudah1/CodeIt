import fs from 'fs';
import path from 'path';

// ── One thing, one name ──────────────────────────────────────────────────────
//
// An audit of the product found seventeen different labels pointing at
// /builder: Build, Open studio, Start a project, Project studio, Project
// Studio, project studio, Open Project Studio, Try the project studio, See the
// builder in action, Build a free project, Use this in Project Studio, and
// more. The thing a child makes was a project, a build, a creation, work and a
// version, sometimes within one screen. The header said "My projects" and
// scrolled to a heading that said "My Creations".
//
// None of that came from carelessness. It came from twenty separate moments of
// writing one label without re-reading the other forty, which is exactly the
// kind of drift a person cannot hold in their head and a test can.
//
// So this file is the memory. It reads the source the way a reader reads the
// screen, and fails when a retired name comes back.
//
// ── Why it greps source instead of rendering pages ───────────────────────────
//
// Rendering finds only what a given test happens to mount. A string added to a
// page nobody wrote a test for is exactly the string that drifts. Reading the
// files catches it wherever it is written.

const SRC = path.join(__dirname);

const SKIP_DIRS = new Set(['node_modules', '__snapshots__']);

function sourceFiles(dir = SRC, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) out.push(full);
  }
  return out;
}

/**
 * Lines that a reader could see, with comments removed.
 *
 * Comments are excluded deliberately and it matters: several of these retired
 * names are quoted in comments explaining why they were retired, including in
 * this file's own neighbours. A guard that fails on its own explanation gets
 * deleted by the next person in a hurry.
 */
function visibleLines(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = [];
  let inBlock = false;
  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (inBlock) {
      if (trimmed.includes('*/')) inBlock = false;
      return;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlock = true;
      return;
    }
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    lines.push({ line, number: i + 1 });
  });
  return lines;
}

const FILES = sourceFiles();

/** Every place a retired name still appears, as "file:line  the line". */
function findings(pattern) {
  const hits = [];
  for (const file of FILES) {
    for (const { line, number } of visibleLines(file)) {
      if (pattern.test(line)) {
        hits.push(`${path.relative(SRC, file)}:${number}  ${line.trim().slice(0, 100)}`);
      }
    }
  }
  return hits;
}

// Each entry: the retired name, and the one word that replaced it.
const RETIRED = [
  ['project studio / Project Studio', /project studio/i, 'the studio'],
  ['My Creations',                    /My Creations/,     'My projects'],
  ['"creation" for a project',        /your creation\b/i, 'your project'],
  ['Lessons Map',                     /Lessons Map/,      'Lessons'],
  ['Back to Dashboard',               /Back to Dashboard/i, 'Back to your progress'],
  ['Learning Dashboard',              /Learning Dashboard/i, 'Your progress'],
  ['the magic helper',                /magic helper/i,    'Pixel'],
  ['CodeIt Guide',                    /CodeIt Guide/,     'Pixel'],
  ['"New build" for a new project',   /New build/,        'New project'],
  ['"this build" for a project',      /this build\b/i,    'this project'],
];

describe('one thing, one name', () => {
  test.each(RETIRED)('%s is gone, replaced by "%s"', (label, pattern, replacement) => {
    const hits = findings(pattern);
    expect(
      hits.length === 0 ? '' : `"${label}" should now be "${replacement}":\n  ${hits.join('\n  ')}`
    ).toBe('');
  });
});

// ── The two that a child meets first ─────────────────────────────────────────

describe('the header agrees with the pages it links to', () => {
  const header = fs.readFileSync(path.join(SRC, 'pages/Header/Header.js'), 'utf8');

  test('the header calls the studio the studio', () => {
    // The nav used to carry a "Studio" link four positions away from a button
    // that went to the same /builder — two controls, one destination, which
    // teaches a child that the words on this page are decoration. The link
    // went; the rule did not. A signed-in child's one route to /builder still
    // has to say "studio", and neither may ever say "Build".
    expect(header).toMatch(/user \? "Open studio" : "Start building"/);
    expect(header).not.toMatch(/label: "Build"/);
  });

  test('"My projects" leads to a heading that says My projects', () => {
    // It used to lead to one headed "My Creations". One click, two words, and a
    // child left wondering whether they had gone to the right place.
    expect(header).toMatch(/My projects/);
    const builder = fs.readFileSync(path.join(SRC, 'pages/Builder/Builder.js'), 'utf8');
    expect(builder).toMatch(/My projects/);
  });

  test('the nav word for /explore is the word on the page it opens', () => {
    // Written as the rule rather than the word. The heading used to be the bare
    // word "Explore" at 4.5rem with an eyebrow above it and a paragraph below,
    // and that heading was checked here by name — so rewording the page to say
    // what it actually holds broke a test that never cared about the wording,
    // only about the agreement.
    const explore = fs.readFileSync(path.join(SRC, 'pages/Builder/Explore.js'), 'utf8');
    const navLabel = header.match(/\{ to: "\/explore", label: "([^"]+)" \}/)?.[1];
    expect(navLabel).toBeTruthy();
    const heading = explore.match(/exp-hero__title">([^<]+)</)?.[1];
    expect(heading).toBeTruthy();
    expect(heading.toLowerCase()).toContain(navLabel.toLowerCase());
  });
});
