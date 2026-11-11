'use strict';

// ── Why a thrown build failed, in four words the dashboard can act on ───────
//
// 'error' was the outer catch-all and it swallowed the dominant failure. Read
// on 11 November: of 62 studio builds, 10 produced an AI project and 52 fell
// back, and 42 of those 52 were logged as 'error'. Four in five failures, one
// word, no way to tell an overloaded model from a bug in this file from a
// rate limit on the account. The message is in the Vercel log; the dashboard
// cannot see it and nobody reads a log to find a rate.
//
// Four classes, each a different fix:
//   overloaded  the API said it was busy. Back off, or route to a tier that
//               is not. Not our bug and not the child's fault.
//   rate-limit  this account's own limit. A billing or concurrency decision.
//   api         the API refused for some other reason. Read the status.
//   error       nothing came back from the API at all, so it is this code.
//
// Deliberately coarse and closed: analyticsEvents.js allowlists every meta
// value, because an unbounded one is how eleven events were silently rejected
// into a 400 for weeks. No message text, no status code, no prompt.
function buildFailureClass(err) {
  const status = Number(err?.status ?? err?.statusCode ?? err?.response?.status) || null;
  const type = String(err?.error?.type || err?.type || '').toLowerCase();
  if (status === 529 || type.includes('overloaded')) return 'overloaded';
  if (status === 429 || type.includes('rate_limit')) return 'rate-limit';
  if (status) return 'api';
  return 'error';
}

module.exports = { buildFailureClass };
