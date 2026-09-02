import { API_BASE_URL } from '../config/api';

// ── Talking to the billing API ───────────────────────────────────────────────
//
// The frontend never decides what a family may do. It asks the server, renders
// the answer, and sends people to Stripe's own pages for anything involving a
// card. Nothing here stores or even sees payment details.

const BILLING_BASE = `${API_BASE_URL}/api/billing`;

// What to show before the server answers, and what to fall back to if it never
// does: the free plan, with billing hidden entirely.
export const DEFAULT_BILLING_STATE = Object.freeze({
  billingEnabled: false,
  // Who may buy: an adult, on their own account, not a managed profile. The
  // server decides it from date of birth, because the role on the account
  // stopped meaning "child" the day an adult created a learner account.
  //
  // null is "not answered yet", and it is deliberately not false. The price
  // control is fail-closed (shown only on an explicit true, so a child is
  // never offered one) and the contact form is fail-open (blocked only on an
  // explicit false, so an adult is never turned away by a fetch that has not
  // come back).
  canSubscribe: null,
  plan: 'free',
  planLabel: 'Free',
  canPublish: true,
  unlimitedAi: false,
  monthlyAiBuilds: null,
  buildsThisMonth: 0,
  status: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  willLoseAccessAt: null,
});

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * What a signed-out visitor may know: whether subscriptions are open and what
 * they cost. Never fails the page — if it cannot be reached, the caller keeps
 * the default and simply shows less.
 */
export async function fetchPublicPlan() {
  const response = await fetch(`${BILLING_BASE}/plan`);
  if (!response.ok) throw new Error('Could not load plan information.');
  const data = await response.json();
  return {
    billingEnabled: !!data.billingEnabled,
    amount: data.amount ?? 12,
    currency: data.currency || 'CAD',
    interval: data.interval || 'month',
  };
}

export async function fetchBillingStatus(token) {
  if (!token) return { ...DEFAULT_BILLING_STATE };
  const response = await fetch(`${BILLING_BASE}/status`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load your plan.');
  const data = await response.json();
  return { ...DEFAULT_BILLING_STATE, ...data };
}

async function redirectTo(path, token) {
  const response = await fetch(`${BILLING_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url) {
    const error = new Error(data.error || 'Could not open the billing page.');
    error.code = data.code || null;
    throw error;
  }
  window.location.assign(data.url);
  return data.url;
}

/** Send a parent to Stripe Checkout. Access is granted by the webhook, not by the return trip. */
export function startCheckout(token) {
  return redirectTo('checkout', token);
}

/** Send a parent to the Stripe billing portal to change a card or cancel. */
export function openBillingPortal(token) {
  return redirectTo('portal', token);
}

/**
 * How many free AI builds are left, as something a person would say.
 * Returns null when there is nothing worth saying — an unlimited plan, or a
 * signed-out visitor.
 */
export function describeRemainingBuilds(state) {
  if (!state || state.unlimitedAi || state.monthlyAiBuilds == null) return null;
  const used = Number(state.buildsThisMonth) || 0;
  const remaining = Math.max(0, state.monthlyAiBuilds - used);
  if (remaining === 0) return 'No AI builds left this month';
  if (remaining === 1) return '1 AI build left this month';
  return `${remaining} AI builds left this month`;
}

/** True when the account is on a paid plan right now. */
export function isPlusMember(state) {
  return Boolean(state && state.plan === 'plus');
}
