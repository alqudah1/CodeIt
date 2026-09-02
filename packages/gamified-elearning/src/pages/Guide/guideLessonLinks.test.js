import GUIDE_PAGES from '../../data/guidePages';
import { TOTAL_LESSONS, getLessonEntry } from '../Lessons/lessonRegistry';
import fs from 'fs';
import path from 'path';

// ── Guides must point at lessons ─────────────────────────────────────────────
//
// Search Console, read 2 September 2026: 49 pages indexed, 77 not. Thirty-seven
// sat in "Discovered - currently not indexed", eighteen of them lesson pages,
// and /lesson/1 reported no crawl at all despite being first in the sequence.
//
// Across all sixteen guide bodies there were four internal links and not one
// pointed at a lesson. The lesson pages are not the problem: /lesson/25 serves
// a full static page with unique prose and runnable examples. Google had no
// reason to walk to it.
//
// This does not fix indexing on its own. Authority comes from citations on
// sites we do not own. It is the half we control.
describe('every guide points at the lessons behind it', () => {
  test('all sixteen guides declare related lessons', () => {
    expect(GUIDE_PAGES.length).toBe(16);
    const without = GUIDE_PAGES.filter(g => !Array.isArray(g.relatedLessons) || !g.relatedLessons.length);
    expect(without.map(g => g.slug)).toEqual([]);
  });

  test('every id resolves to a real lesson', () => {
    const bad = [];
    for (const g of GUIDE_PAGES) {
      for (const id of g.relatedLessons) {
        if (!Number.isInteger(id) || id < 1 || id > TOTAL_LESSONS || !getLessonEntry(id)) {
          bad.push(`${g.slug} -> ${id}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  test('two or three per guide, never a sitemap dump', () => {
    for (const g of GUIDE_PAGES) {
      expect(g.relatedLessons.length).toBeGreaterThanOrEqual(2);
      expect(g.relatedLessons.length).toBeLessThanOrEqual(3);
    }
  });

  test('no guide repeats a lesson within its own list', () => {
    for (const g of GUIDE_PAGES) {
      expect(new Set(g.relatedLessons).size).toBe(g.relatedLessons.length);
    }
  });

  // The whole point of storing ids alone. Two labels in the original mapping
  // were already stale when it was written: lesson 19 is "Import and Random.
  // Borrowing Superpowers" and lesson 20 is "Dictionaries. Labels, Not
  // Numbers". A stored label would have shipped both wrong.
  test('titles are read from the registry, never stored beside the id', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../data/guidePages.js'), 'utf8');
    const decls = src.match(/relatedLessons:\s*\[[^\]]*\]/g) || [];
    expect(decls.length).toBe(16);
    for (const d of decls) {
      expect(d).not.toMatch(/['"`]/);
    }
    const page = fs.readFileSync(path.join(__dirname, 'GuidePage.js'), 'utf8');
    expect(page).toMatch(/getLessonEntry\(id\)/);
  });

  test('the footer no longer claims four of thirty-one lessons are the ones that matter', () => {
    const footer = fs.readFileSync(
      path.join(__dirname, '../../components/SiteFooter/SiteFooter.js'), 'utf8');
    expect(footer).not.toMatch(/\/lesson\/\$\{/);
    expect(footer).toMatch(/All beginner lessons/);
  });

  test('the guides between them reach a spread of lessons, not just lesson 1', () => {
    const reached = new Set(GUIDE_PAGES.flatMap(g => g.relatedLessons));
    expect(reached.size).toBeGreaterThanOrEqual(8);
  });
});
