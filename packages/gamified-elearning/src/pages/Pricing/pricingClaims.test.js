import { FREE_FEATURES, PLUS_FEATURES } from './planFeatures';

const { PLANS } = require('../../../../codeit-backend/entitlements');

// ── Every paid promise has to be something a family does not already have ────
//
// The pricing page is the one page where a wrong sentence takes money for
// nothing. It has been wrong twice in the same way.
//
// The first time, publishing was listed as a Plus feature while the free column
// also promised it, and the server refused it. That was fixed by making
// publishing free, and the bullet was taken off the Plus list with a note: it
// "would make Plus look like it unlocks something a family already has".
//
// One bullet below that note, "See how many people played what your child made"
// was doing the same thing. Play counts come from /api/today, which has no plan
// gate at all. Four files in the whole backend read a plan: entitlements.js,
// familyAccounts.js (the child-profile cap), routes/billing.js and
// routes/builder.js (the AI build cap). Nothing else in the product is gated,
// so a free account had always seen its play counts, and a parent paying
// CA$12 for that bullet received nothing for it.
//
// A note in a comment did not catch the second instance, because a note cannot
// read the server. This can.
describe('what the paid plan promises', () => {
  test('every Plus bullet names an entitlement that free and paid differ on', () => {
    const selling = PLUS_FEATURES.filter((feature) => feature.unlocks !== null);
    expect(selling.length).toBeGreaterThan(0);

    for (const { unlocks } of selling) {
      expect(Object.prototype.hasOwnProperty.call(PLANS.plus, unlocks)).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(PLANS.free, unlocks)).toBe(true);

      // The whole point. If the two plans agree on it, the bullet is selling
      // something the family has for nothing.
      expect(PLANS.free[unlocks]).not.toEqual(PLANS.plus[unlocks]);
    }
  });

  test('a bullet that unlocks nothing says so, rather than being left to a reader', () => {
    // The alternative is a plain string, which is what both wrong bullets were.
    // A string cannot be checked, so it never was.
    for (const feature of PLUS_FEATURES) {
      expect(typeof feature).toBe('object');
      expect(typeof feature.text).toBe('string');
      expect(feature.text.length).toBeGreaterThan(0);
      expect('unlocks' in feature).toBe(true);
    }
  });

  test('nothing in the free column is also sold as a paid unlock', () => {
    // Not a word match. Both lists are short and read by the same person in the
    // same ten seconds, so an exact repeat is the failure mode that actually
    // happens: a line gets moved to free and left behind in Plus.
    const free = FREE_FEATURES.map((text) => text.toLowerCase().trim());
    for (const { text } of PLUS_FEATURES) {
      expect(free).not.toContain(text.toLowerCase().trim());
    }
  });

  test('the two things Plus really changes are both on the list', () => {
    // Read off the plans rather than written down here, so adding a gate to the
    // server fails this test until the page tells families about it. A paid
    // feature nobody is told about is as expensive to build as one they are.
    const gated = Object.keys(PLANS.plus).filter((key) => {
      if (!Object.prototype.hasOwnProperty.call(PLANS.free, key)) return false;
      return PLANS.free[key] !== PLANS.plus[key];
    }).filter((key) => key !== 'id' && key !== 'label' && key !== 'priceLabel');

    const sold = PLUS_FEATURES.map((feature) => feature.unlocks).filter(Boolean);
    for (const key of gated) {
      expect(sold).toContain(key);
    }
  });
});
