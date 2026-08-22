// ── One place the price is written down ──────────────────────────────────────
//
// The site used to state the price four different ways: CA$12 on the pricing
// page, US$12 in the pilot card, "0" in the JSON-LD, and "billing not active"
// in llms.txt. A family comparing plans could not tell what CodeIt costs, and
// a contradiction on a pricing page is the kind of thing that ends trust before
// anyone reaches checkout.
//
// The server is still the authority on what an account may do — entitlements
// come from the Stripe subscription row, never from here. These constants are
// for display, and for the terms that describe the display.

const CURRENCY = 'CAD';
const CURRENCY_SYMBOL = 'CA$';
const AMOUNT = 12;
const INTERVAL = 'month';

/** "CA$12" — the price on its own, for a price heading. */
const PRICE = `${CURRENCY_SYMBOL}${AMOUNT}`;

/** "CA$12/month" — for running text and buttons. */
const PRICE_PER_INTERVAL = `${PRICE}/${INTERVAL}`;

// What the free plan allows, mirrored from the server's entitlements module so
// the terms can describe it accurately. If these ever disagree, the server wins.
const FREE_MONTHLY_AI_BUILDS = 10;

export {
  AMOUNT,
  CURRENCY,
  CURRENCY_SYMBOL,
  FREE_MONTHLY_AI_BUILDS,
  INTERVAL,
  PRICE,
  PRICE_PER_INTERVAL,
};
