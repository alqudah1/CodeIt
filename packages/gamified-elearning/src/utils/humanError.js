// ── What a person is allowed to be shown when something fails ────────────────
//
// Explore printed this to visitors, in the middle of the page, where the
// projects should have been:
//
//   Unexpected token '<', "<!doctype "... is not valid JSON
//
// That is a JavaScript parser talking to a parent. It cannot be acted on, and
// it makes a product that is merely offline look broken beyond repair.
//
// The rule is not "hide every error". Most of the messages that reach these
// screens were written by us, for people, and they are the most useful thing we
// can say: "That username is already taken", "Confirm the adult account email
// first". Those go straight through.
//
// What gets replaced is the machine's own words: the browser's network errors,
// the JSON parser's, an abort, or anything long enough to be a dump rather than
// a sentence. The real error still goes to the console for whoever is debugging.

/** Noise produced by the platform rather than by us. */
const MACHINE = /(failed to fetch|networkerror|network request failed|load failed|unexpected token|not valid json|json\.parse|is not a function|undefined is not|cannot read propert|aborted|timeout of \d|status code)/i;

/** Longer than a sentence a person would read on a card. */
const TOO_LONG = 220;

export const GENERIC_FAILURE = 'Something went wrong on our side. Please try again.';

export function humanError(error, fallback = GENERIC_FAILURE) {
  const raw = typeof error === 'string' ? error : String(error?.message || '');
  const message = raw.trim();
  if (!message) return fallback;
  if (MACHINE.test(message)) return fallback;
  if (message.length > TOO_LONG) return fallback;
  // A message that is all punctuation and brackets is not a sentence.
  if (!/[a-z]{3}/i.test(message)) return fallback;
  return message;
}

/**
 * Log the real thing, return the sayable thing. One call at every catch site,
 * so the console keeps everything and the screen keeps its manners.
 */
export function reportFailure(where, error, fallback = GENERIC_FAILURE) {
  console.error(`${where}:`, error);
  return humanError(error, fallback);
}
