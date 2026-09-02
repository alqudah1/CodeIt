import fs from 'fs';
import path from 'path';

// ── The path to subscribing ──────────────────────────────────────────────────
//
// CodeIt's first paying family said subscribing took too many buttons, and the
// code agreed with them in three places:
//
//   1. The server's 402 FREE_AI_LIMIT_REACHED fell into the studio's generic
//      `throw new Error(data.error)`. A parent whose child had just hit the
//      monthly wall — the moment they are most willing to pay — saw a red card
//      headed "We couldn't build that yet" with no button on it.
//   2. A signed-in adult reached the plan page in two taps, behind an avatar.
//   3. Every "See CodeIt Plus" link pointed at /pricing, and the fragment that
//      would have landed on the paid card was never scrolled to, because in a
//      single-page app the browser resolves the fragment before React renders.
//
// These are source-level assertions on purpose: the panel only appears after a
// real 402 from a real allowance check, which no unit test can produce.
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

const BUILDER = read('Builder.js');
const HEADER = read('../Header/Header.js');
const PRICING = read('../Pricing/Pricing.js');

describe('hitting the monthly AI limit', () => {
  test('the studio recognises the 402 before it throws', () => {
    expect(BUILDER).toMatch(/res\.status === 402 && data\.code === 'FREE_AI_LIMIT_REACHED'/);
    // The order matters: the generic throw must come after the 402 branch, or
    // the limit is an error again.
    expect(BUILDER.indexOf("FREE_AI_LIMIT_REACHED"))
      .toBeLessThan(BUILDER.indexOf("throw new Error(data.error || 'Something went wrong')"));
  });

  test('it renders its own panel, not the red error card', () => {
    expect(BUILDER).toMatch(/hasLimit && \(/);
    expect(BUILDER).toMatch(/bldr-limit-card/);
    // The panel is not reachable if the error card owns the same state.
    expect(BUILDER).toMatch(/const \[limitReached, setLimitReached\]/);
  });

  test('the panel offers a way forward and a way to stay', () => {
    expect(BUILDER).toMatch(/to="\/pricing#codeit-plus"/);
    expect(BUILDER).toMatch(/ai_limit_upgrade_click/);
    expect(BUILDER).toMatch(/setLimitReached\(''\)/);
  });

  test('reaching the wall is measured, so the upgrade rate has a denominator', () => {
    expect(BUILDER).toMatch(/trackEvent\('ai_limit_reached'/);
  });

  test('a new build clears the last panel', () => {
    expect(BUILDER).toMatch(/setError\(''\);\s*\n\s*setLimitReached\(''\);/);
  });
});

describe('the plan page is one tap from an adult account', () => {
  test('the header only offers Get Plus to an adult without a subscription', () => {
    expect(HEADER).toMatch(/const showGetPlus = isAdultAccount && billing\.billingEnabled && !isPlusMember\(billing\)/);
    expect(HEADER).toMatch(/!user\.managedProfile/);
    expect(HEADER).toMatch(/!== "student"/);
  });

  test('it lands on the paid card, not the top of the page', () => {
    expect(HEADER).toMatch(/to="\/pricing#codeit-plus"/);
  });

  test('Plan leaves the account menu when Get Plus is in the top bar', () => {
    expect(HEADER).toMatch(/!\(showGetPlus && link\.to === "\/pricing"\)/);
  });
});

describe('the fragment actually moves the page', () => {
  test('pricing scrolls to the hash once billing has answered', () => {
    expect(PRICING).toMatch(/const \{ hash \} = useLocation\(\)/);
    expect(PRICING).toMatch(/scrollIntoView/);
    expect(PRICING).toMatch(/\[hash, billing\.billingEnabled\]/);
  });
});
