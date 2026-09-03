/**
 * competitorPrices.js — every price this site states about somebody else.
 *
 * Why this exists. On 31 August 2026 three guides disagreed about what
 * CodeMonkey costs. Two said $8 individual and $13 family; the newest and most
 * confident one said US$7 and US$12, on a page that opens by saying the prices
 * were read from each product's own pricing page. The page it cites says $8
 * and $13. So the guide that made the most of having checked was the one with
 * the wrong number, and a reader who read two of our guides would have caught
 * us contradicting ourselves about a competitor.
 *
 * The existing price guards could not see it. They ask whether a stated price
 * is ours, or declared in that guide's quotedPrices. Both spellings passed:
 * one page declared US$7 truthfully as "not our price", the others wrote a
 * bare "$8", and an unmarked dollar amount is not read as a second currency at
 * all. Nothing compared the two pages to each other.
 *
 * So: one entry per competitor, with the source it came from and the date it
 * was read. Guides keep writing prose; the guard in
 * scripts/competitor-prices.test.js checks that every amount a guide states
 * beside a vendor's name is a number that vendor's entry actually contains.
 * Comparison is on the number alone, so "$8", "US$8" and "US$8/month" are the
 * same claim, which is the point: that is how the wrong one hid.
 *
 * A guide may quote a subset. Mentioning only Tynker's yearly price is fine.
 * Quoting a number that is not in the list is not fine, and neither is leaving
 * a number in this file that no page uses any more.
 *
 * `checked` is the date the amounts below were last read from `source`, not
 * the date a guide was edited. Move it only when you have actually looked.
 */

// codeSpark is deliberately absent. codespark.com now redirects to
// beginlearning.com/codespark/pdp, the product is sold under Begin Learning,
// and that page publishes no price. Three guides quoted 7.99 a month from the
// old site. A price we cannot see on the seller's own page does not belong in
// a file whose entire purpose is that every number here was read from source,
// so the guides now say the price is not published rather than repeating a
// number none of us can check.
const COMPETITOR_PRICES = {
  Tynker: {
    source: 'https://www.tynker.com/pricing/',
    // Read again on 3 September 2026 for the coding-games comparison. Same
    // five amounts, same 40% discount showing, same three-child limit.
    checked: '2026-09-03',
    note: 'Family plans, up to three children, 30-day money-back guarantee. A 40% discount was applied on the page at the time of checking.',
    prices: [18, 54, 15, 180, 468],
  },
  CodeMonkey: {
    source: 'https://app.codemonkey.com/home-plans',
    checked: '2026-08-31',
    note: 'US dollars. Billed yearly: individual 8, family 13 for three children, homeschool 20 for five. Billed quarterly: 11, 20, 27.',
    prices: [8, 13, 20, 11, 27],
  },
  Kodable: {
    source: 'https://www.kodable.com/parents',
    checked: '2026-08-31',
    note: 'Families pay. Three guides said "free tier, 99.99 a year"; the parent page says a seven-day trial and then 24.99 a month, 119.99 a year, or 199.99 once, for up to four children. The free Kickstart plan people remember is on the school plans page (kodable.com/plans), where the paid tiers are 1750 Premium, 2500 Premium+ and 3500 All Access per site per year. A school free tier is not a family free tier.',
    prices: [24.99, 119.99, 199.99, 1750, 2500, 3500],
  },
  'Create & Learn': {
    source: 'https://www.create-learn.us/pricing',
    checked: '2026-08-31',
    note: 'A free one-hour intro class, then 94.50 for four 55-minute group sessions (down from 105) or 240.00 for four 1:1 sessions (down from 260). The homepage shows no prices; this is the pricing page.',
    prices: [94.50, 240.00],
  },
  Codecademy: {
    source: 'https://www.codecademy.com/',
    checked: '2026-08-23',
    note: 'Monthly. Their terms require users to be 16 or older, which matters more than the price.',
    prices: [14.99],
  },
};

export default COMPETITOR_PRICES;
