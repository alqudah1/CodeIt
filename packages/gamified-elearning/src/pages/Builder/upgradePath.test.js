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
    expect(BUILDER).toMatch(/trackEvent\('upgrade_click', 'build-limit'/);
    expect(BUILDER).toMatch(/setLimitReached\(''\)/);
  });

  test('the offer is counted where it is shown, so the click has a denominator', () => {
    // The refusal itself is recorded by the server at the 402. What only the
    // browser knows is whether the panel was ever rendered for anyone.
    expect(BUILDER).toMatch(/trackEvent\('upgrade_prompt_shown', 'build-limit'/);
  });

  test('a new build clears the last panel', () => {
    expect(BUILDER).toMatch(/setError\(''\);\s*\n\s*setLimitReached\(''\);/);
  });
});

describe('the plan page is one tap from an adult account', () => {
  // This asserted the gate's exact expression, including !== "student". That
  // pinned the wrong rule: the backend and the pricing page decide who may buy
  // from date of birth, because an adult can hold a learner account, and the
  // header was the one surface still guessing from the role. Pinning the text
  // of a guess is how the guess outlived the thing it was standing in for.
  // What matters is the promise, so that is what is asserted now, and
  // scripts/who-may-buy.test.js keeps all three surfaces agreeing.
  test('the header only offers Get Plus to someone the server will sell to', () => {
    expect(HEADER).toMatch(/const showGetPlus = billing\.canSubscribe === true/);
    expect(HEADER).toMatch(/billing\.billingEnabled/);
    expect(HEADER).toMatch(/!isPlusMember\(billing\)/);
    // A managed profile is the one case the browser can rule out on its own,
    // and it is what decides whether to ask the server at all.
    expect(HEADER).toMatch(/!user\.managedProfile/);
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
