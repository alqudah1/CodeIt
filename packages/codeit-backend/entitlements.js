'use strict';

// ── What a CodeIt plan allows ────────────────────────────────────────────────
//
// Free keeps the whole learning path open: every lesson, unlimited manual
// editing in the studio, private saved projects, and publishing. A classroom
// must never hit a paywall mid-lesson.
//
// ── Why publishing became free ───────────────────────────────────────────────
//
// It was a Plus feature, and the pricing page had said "Build, edit, save, and
// publish projects" in the free column the whole time. So the site promised it
// and the server refused it, and children in a real classroom pressed Share and
// got nothing. Two ways to fix a contradiction like that; this is the one the
// owner chose, and it is the one that matches what families were told.
//
// It also costs nothing to run. Publishing writes a row and hands back a link.
// The AI generation cap is where the money actually goes, and that is what Plus
// is for.
//
// The under-13 rule below is untouched and always wins: a paid plan never makes
// a younger child's work public.
//
// This module is pure. Entitlement is derived from a subscription row that only
// the Stripe webhook ever writes — never from anything the browser sends.

const PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    monthlyAiBuilds: 10,
    canPublish: true,
    maxChildProfiles: 1,
  },
  plus: {
    id: 'plus',
    label: 'CodeIt Plus',
    priceLabel: 'CA$12/month',
    monthlyAiBuilds: Infinity,
    canPublish: true,
    maxChildProfiles: 4,
  },
};

// Stripe statuses that should keep a family's access on. `past_due` is
// deliberately included: a failed card should not lock a child out of work they
// already published while a parent sorts the payment out. Stripe retries, and
// the subscription moves to `canceled`/`unpaid` if it never recovers.
const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

function isSubscriptionActive(subscription, now = new Date()) {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return false;
  // A cancelled-at-period-end subscription stays active until the period ends.
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  if (periodEnd && !Number.isNaN(periodEnd.getTime()) && periodEnd < now) return false;
  return true;
}

function planForSubscription(subscription, now = new Date()) {
  return isSubscriptionActive(subscription, now) ? PLANS.plus : PLANS.free;
}

/**
 * Everything the frontend needs to describe a family's access, with no Stripe
 * identifiers in it. Safe to return from an API and to render.
 */
function entitlementsFor(subscription, now = new Date()) {
  const plan = planForSubscription(subscription, now);
  const active = plan.id === 'plus';
  return {
    plan: plan.id,
    planLabel: plan.label,
    canPublish: plan.canPublish,
    monthlyAiBuilds: plan.monthlyAiBuilds === Infinity ? null : plan.monthlyAiBuilds,
    unlimitedAi: plan.monthlyAiBuilds === Infinity,
    maxChildProfiles: plan.maxChildProfiles,
    status: subscription?.status || null,
    // Surfaced so a parent can be told "renews on…" or "ends on…".
    currentPeriodEnd: subscription?.current_period_end || null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    willLoseAccessAt: active && subscription?.cancel_at_period_end
      ? subscription.current_period_end || null
      : null,
  };
}

/**
 * Can this account start another AI build this month?
 * Returns a reason code rather than a bare boolean so the UI can say something
 * specific and offer a useful alternative.
 */
function checkAiBuildAllowance(subscription, buildsThisMonth, now = new Date()) {
  const plan = planForSubscription(subscription, now);
  if (plan.monthlyAiBuilds === Infinity) {
    return { allowed: true, remaining: null, unlimited: true };
  }
  const used = Number.isFinite(buildsThisMonth) && buildsThisMonth > 0 ? Math.floor(buildsThisMonth) : 0;
  const remaining = Math.max(0, plan.monthlyAiBuilds - used);
  if (remaining > 0) return { allowed: true, remaining, unlimited: false };
  return {
    allowed: false,
    remaining: 0,
    unlimited: false,
    code: 'FREE_AI_LIMIT_REACHED',
    // Never a dead end: the studio's instant controls need no AI at all.
    message: 'You have used this month\'s free AI builds. You can still open, '
      + 'change and save every project with the studio tools, and every lesson stays free.',
  };
}

/**
 * Publishing is a paid feature, but the age rule wins over the billing rule:
 * a child under 13 on a managed profile is never publishable, paid or not.
 */
function checkPublishAllowance(subscription, { managedProfile = false, studentAge = null } = {}, now = new Date()) {
  if (managedProfile || (studentAge !== null && Number(studentAge) < 13)) {
    return {
      allowed: false,
      code: 'MANAGED_PROFILE_PRIVATE',
      message: 'Projects on a family profile stay private. Share it with your grown-up or teacher instead.',
    };
  }
  if (!planForSubscription(subscription, now).canPublish) {
    return {
      allowed: false,
      code: 'PLAN_UPGRADE_REQUIRED',
      message: 'Publishing to a public CodeIt link is part of CodeIt Plus. Your project stays saved and private until then.',
    };
  }
  return { allowed: true };
}

module.exports = {
  ACTIVE_STATUSES,
  PLANS,
  checkAiBuildAllowance,
  checkPublishAllowance,
  entitlementsFor,
  isSubscriptionActive,
  planForSubscription,
};
