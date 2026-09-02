import fs from 'fs';
import path from 'path';

// ── The links have to exist where a crawler can see them ─────────────────────
//
// The React page renders "The lessons behind this guide", but a crawler never
// runs React. This whole change exists to solve a crawl-budget problem, so a
// version living only in the rendered view is worth nothing.
//
// Verified immediately after the React block was written: all sixteen
// generated guide pages contained zero links to /lesson/N. The generator
// builds its HTML from the markdown, and the markdown does not know about
// relatedLessons. Caught by looking at the output rather than the code.
//
// This test reads the generator source rather than the build directory,
// because the build is not present in a fresh clone and a test that silently
// skips is not a test.
const GEN = fs.readFileSync(
  path.join(__dirname, '../../../scripts/generate-static-seo.js'), 'utf8');

describe('the static guide pages carry the lesson links', () => {
  test('the generator has a related-lessons renderer', () => {
    expect(GEN).toMatch(/function relatedLessonsHtml\(/);
  });

  test('it is appended to every guide body, not just declared', () => {
    expect(GEN).toMatch(/renderMarkdown\(guide\.markdown\) \+ relatedLessonsHtml\(guide\.relatedLessons\)/);
  });

  test('it emits real anchors to lesson URLs', () => {
    expect(GEN).toMatch(/href="\/lesson\/\$\{l\.id\}"/);
  });

  test('titles come from the lesson data, so static and React cannot disagree', () => {
    expect(GEN).toMatch(/LESSON_CONTENT\.get\(Number\(id\)\)/);
  });

  test('an unresolvable id is dropped rather than linked', () => {
    const fn = GEN.slice(GEN.indexOf('function relatedLessonsHtml('),
      GEN.indexOf('function relatedLessonsHtml(') + 1400);
    expect(fn).toMatch(/\.filter\(Boolean\)/);
    expect(fn).toMatch(/if \(!items\.length\) return '';/);
  });

  test('the title is escaped, because it is interpolated into HTML', () => {
    expect(GEN).toMatch(/escapeHtml\(l\.title\)/);
  });

  // There was a build-directory check here and it skipped, because the build
  // is not present in a fresh clone or after a rebuild that has not yet run
  // the generator. A test that quietly skips is worse than no test: it reports
  // green while asserting nothing. The six assertions above read the generator
  // source itself, and removing the one line that appends the block makes them
  // fail, which was verified before this file was trusted.
});
