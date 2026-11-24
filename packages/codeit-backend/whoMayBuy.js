'use strict';

// ── Who may buy CodeIt Plus ──────────────────────────────────────────────────
//
// CodeIt does not sell to children. Two rules said so: a managed profile
// never buys, and neither does anyone whose birthday makes them under 18.
//
// A pupil who joins a class has no birthday on record. The teacher is the
// adult; the child types a code and a first name. So the second rule had
// nothing to read, the answer came out "may buy", and every pupil in a class
// was shown "Get Plus" at the top of every page and "Subscribe for CA$12 a
// month" on the pricing page, with a checkout that would have opened
// (found 23 November 2026, walking the site as a class pupil with billing
// on).
//
// The third rule: a learner account with no birthday is not known to be an
// adult, and is not sold to. Adults who learn on a learner account gave a
// birthday when they made it, and adults on a parent or teacher account are
// not learner accounts, so neither is affected.
//
// One function, used by the question (/api/billing/status) and by the till
// (/api/billing/checkout), so the two cannot disagree.

const { studentAgeEligibility } = require('./studentAge');

const ADULT_AGE = 18;

function whoMayBuy({ managedProfile, role, dob } = {}, now = new Date()) {
  if (managedProfile) return { may: false, why: 'managed-profile' };
  const learner = String(role || '').trim().toLowerCase() === 'student';
  const birthday = dob ? String(dob instanceof Date ? dob.toISOString() : dob).slice(0, 10) : '';
  if (!birthday) return learner ? { may: false, why: 'learner-age-unknown' } : { may: true, why: 'adult-account' };
  const { age } = studentAgeEligibility(birthday, now);
  if (age === null) return learner ? { may: false, why: 'learner-age-unknown' } : { may: true, why: 'adult-account' };
  if (age < ADULT_AGE) return { may: false, why: 'under-18' };
  return { may: true, why: 'adult' };
}

module.exports = { ADULT_AGE, whoMayBuy };
