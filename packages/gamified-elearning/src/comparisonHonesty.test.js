import BLOG_POSTS from './data/blogPosts';
import COMPETITOR_PRICES from './data/competitorPrices';

// ── A roundup that names only its own product is an advertisement ────────────
//
// /blog/best-coding-games-for-kids sat at position 36 for "best coding games
// for kids": page 4, 104 impressions and zero clicks in 28 days. Every result
// on page 1 for that query is a comparison of several products. Ours was titled
// like a roundup and named exactly one product, CodeIt, across five sections,
// mentioning Scratch only to say it has a ceiling.
//
// Google can tell the difference. So can a parent, and so can any assistant
// asked to recommend a coding game: a page about ourselves is not linkable and
// will not be quoted. These tests are about keeping this page a comparison,
// including the parts that are uncomfortable.
const post = BLOG_POSTS.find((p) => p.slug === 'best-coding-games-for-kids');
const text = post.sections.map((s) => `${s.heading}\n${s.body.join('\n')}`).join('\n');
const NAMED = ['Scratch', 'Blockly Games', 'CodeAI', 'Tynker', 'CodeCombat', 'CodeIt'];

describe('the coding games comparison', () => {
  test('it names six products, not one', () => {
    for (const name of NAMED) expect(text).toContain(name);
  });

  test('CodeIt is fifth of the six, not first', () => {
    const productHeadings = post.sections
      .map((s) => s.heading)
      .filter((h) => NAMED.some((n) => h.includes(n)));
    expect(productHeadings.length).toBe(6);
    expect(productHeadings[0]).not.toContain('CodeIt');
    expect(productHeadings.findIndex((h) => h === 'CodeIt')).toBe(4);
  });

  test('every product gets a sentence on where it is weakest, ours included', () => {
    const weakest = post.sections.filter((s) => s.body.some((b) => b.startsWith('Weakest at:')));
    expect(weakest.length).toBe(6);
    const ours = post.sections.find((s) => s.heading === 'CodeIt').body.join(' ');
    // A real limitation, not a humblebrag about caring too much.
    expect(ours).toMatch(/no school rostering|no teacher dashboard|Python only/);
  });

  test('at least one recommendation is honestly not CodeIt', () => {
    const pick = post.sections.find((s) => s.heading === 'Which one to pick');
    expect(pick).toBeTruthy();
    expect(pick.body[0]).toMatch(/use Scratch/);
    expect(pick.body[0]).not.toContain('CodeIt');
  });

  test('the table says when it was checked', () => {
    const table = post.sections.find((s) => s.heading.includes('one table'));
    expect(table.body.join(' ')).toMatch(/read from each product's own site on \d+ \w+ 2026/);
  });

  // The rule that matters more than the ranking. A wrong price about somebody
  // else is the fastest way to lose the page, and an invented number is worse
  // than no table at all.
  test('every price it states is one that was read from a source', () => {
    const stated = [...text.matchAll(/\$(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    const ourOwn = [12];
    const known = new Set([
      ...ourOwn,
      ...Object.values(COMPETITOR_PRICES).flatMap((v) => v.prices),
    ]);
    expect(stated.filter((n) => !known.has(n))).toEqual([]);
    expect(stated.length).toBeGreaterThan(0);
  });

  test('CodeCombat carries no price, because none could be read', () => {
    const section = post.sections.find((s) => s.heading === 'CodeCombat').body.join(' ');
    expect(section).not.toMatch(/\$\d/);
    expect(section).toMatch(/not printing a price|could not read the number/);
  });
});
