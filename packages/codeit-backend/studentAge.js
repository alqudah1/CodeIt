'use strict';

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return { year, month, day };
}

function ageOnDate(dob, now = new Date()) {
  const birth = parseDateOnly(dob);
  if (!birth || !(now instanceof Date) || Number.isNaN(now.getTime())) return null;

  const current = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
  let age = current.year - birth.year;
  if (current.month < birth.month || (current.month === birth.month && current.day < birth.day)) age -= 1;
  return age;
}

// Who may hold their own learner account.
//
// Until 2 September 2026 this refused anyone over 18 and told them to use the
// Parent or Educator option. A 23-year-old who wanted to learn to code was
// therefore offered two doors, neither of which was his: he is not a child and
// he is not a parent, and the account he was pushed into is built around
// managing somebody else's learning. He said so, and he was right.
//
// The rule that matters is the one under 13, which is the law. Above 13 there
// is no reason to ask a person's age before letting them learn.
function studentAgeEligibility(dob, now = new Date()) {
  const age = ageOnDate(dob, now);
  if (age === null || age < 0) return { allowed: false, reason: 'invalid', age: null };
  if (age < 13) return { allowed: false, reason: 'parent_required', age };
  return { allowed: true, reason: 'eligible', age };
}

function learningModeForAge(age) {
  if (!Number.isInteger(age) || age < 0) return 'independent';
  if (age <= 7) return 'early';
  if (age <= 12) return 'guided';
  return 'independent';
}

module.exports = { ageOnDate, learningModeForAge, parseDateOnly, studentAgeEligibility };
