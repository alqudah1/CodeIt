import GUIDE_PAGES from '../../data/guidePages';

// ── Four guides deliberately carry no link to us ─────────────────────────────
//
// publish-first-project, glitch-shutdown, glitch-for-classrooms and
// common-sense-education-paused-edtech-reviews each spend their length telling
// their specific reader that CodeIt is not the right answer for them:
// publishing under 13 should use Neocities or GitHub, a rescued Glitch project
// needs hosting we do not provide, we are not a schools product, and district
// buyers are wasting their time.
//
// Dropping a link into an argument that says "go elsewhere" is the one thing
// that would make those pages read as adverts, which is the exact failure the
// guides were written to avoid.
//
// This test exists because it already happened. Two of the twelve inline links
// were applied with a plain find-and-replace, which takes the first occurrence
// in the FILE rather than in the intended guide. Both sentences also appear in
// glitch-for-classrooms, which sits earlier, so both links landed there: the
// one guide that must not have one. Caught by counting per guide afterwards
// rather than trusting the edit.
//
// The structural block from round 58 still goes on all sixteen. It is
// navigation appended after the argument finishes, not a claim inserted into
// it, so it does not contradict a guide that has just recommended a
// competitor.
const NO_INLINE_LINK = [
  'publish-first-project',
  'glitch-shutdown',
  'glitch-for-classrooms',
  'common-sense-education-paused-edtech-reviews',
];

const OWN_PAGE = /\]\((\/(?:builder|lessons|playground|pricing|lesson\/\d+))\)/g;

function inlineLinks(guide) {
  return [...(guide.markdown || '').matchAll(OWN_PAGE)].map((m) => m[1]);
}

describe('inline links in guide prose', () => {
  test.each(NO_INLINE_LINK)('%s links to nothing of ours in its prose', (slug) => {
    const guide = GUIDE_PAGES.find((g) => g.slug === slug);
    expect(guide).toBeDefined();
    expect(inlineLinks(guide)).toEqual([]);
  });

  test('the other twelve each carry exactly one', () => {
    const others = GUIDE_PAGES.filter((g) => !NO_INLINE_LINK.includes(g.slug));
    expect(others).toHaveLength(12);
    for (const guide of others) {
      expect({ slug: guide.slug, links: inlineLinks(guide).length })
        .toEqual({ slug: guide.slug, links: 1 });
    }
  });

  test('every one of them still gets the structural block', () => {
    for (const guide of GUIDE_PAGES) {
      expect(Array.isArray(guide.relatedLessons)).toBe(true);
      expect(guide.relatedLessons.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('no guide links to a lesson that does not exist', () => {
    for (const guide of GUIDE_PAGES) {
      for (const href of inlineLinks(guide)) {
        const m = /^\/lesson\/(\d+)$/.exec(href);
        if (m) expect(Number(m[1])).toBeLessThanOrEqual(31);
      }
    }
  });
});
