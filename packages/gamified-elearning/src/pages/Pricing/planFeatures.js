// ── What each plan says it gives you ────────────────────────────────────────
//
// Separated from the page so pricingClaims.test.js can read it without
// rendering React. The point of that test is in its own header: the pricing
// page is the one page where a wrong sentence takes money for nothing, and it
// has been wrong in the same way twice.

const FREE_FEATURES = [
  'Beginner Python lessons and coding games',
  'The browser-based Python playground',
  'Build, edit, save, and publish projects',
  'Explore, play and remix published projects',
];

const FOUNDING_FEATURES = [
  'Everything in the free plan',
  '20 new projects a month, built for you by AI',
  'Two children, one adult account',
  'One email a month: what your child made and understood',
  'We help you set it up, and you can write to us directly',
];

// ── What Plus actually unlocks ───────────────────────────────────────────────
//
// Every line here claims a family gets something they do not have. So every
// line names the entitlement it is selling, and pricingClaims.test.js checks
// that the free and paid plans really differ on it in the server's own
// entitlements module. A bullet that unlocks nothing is a bullet a parent pays
// for and does not receive.
//
// Publishing was taken off this list when it moved to the free plan, with a
// note saying that listing it here "would make Plus look like it unlocks
// something a family already has". One bullet below it, "See how many people
// played what your child made" was doing exactly that: play counts come from
// /api/today, which has no plan gate, and only four files in the backend read
// a plan at all. A free account has always seen them. It is gone now, and the
// test is what the note should have been.
//
// Two real differences is what there is, so two is what this says. The third
// line unlocks nothing and does not pretend to.
const PLUS_FEATURES = [
  {
    text: 'As many AI-built projects and changes as you want, instead of ten a month',
    unlocks: 'monthlyAiBuilds',
  },
  {
    text: 'Up to four children on one adult account, instead of one',
    unlocks: 'maxChildProfiles',
  },
  // Reassurance, not an unlock. Named as such so the test does not go looking
  // for a gate behind it, and so nobody later reads it as a feature.
  { text: 'Everything in the free plan stays free', unlocks: null },
];

export { FREE_FEATURES, FOUNDING_FEATURES, PLUS_FEATURES };
