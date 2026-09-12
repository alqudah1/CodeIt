// ── Did a family actually use it? ────────────────────────────────────────────
//
// Three questions the existing events could not answer, and the event each
// one now has:
//
//   Did they start?   activity_start, meta python-run | game-play
//                     The first Python Run pressed, or the first real
//                     interaction inside a game (a tap, a key, a click).
//                     lesson_start stays what it was: a lesson page opened.
//
//   Did they finish?  activity_complete, meta python-first-run |
//                     python-change-message | game-changed-tested
//                     A successful first output on Lesson 1's example; the
//                     changed message run and submitted; a game changed and
//                     then played. Not "opened the page", not "tapped a swatch".
//
//   ...as a guest?    guest_lesson_complete, no meta
//                     A lesson finished by someone with no account. Signed-in
//                     completions are recorded by the server; guests had
//                     nothing, so a family that never signed up was invisible.
//
// Every event carries only an allowlisted name and an allowlisted word. No
// code, no message, no name, no email. Identity is the session journey the
// rest of the site already uses (sessionStorage, gone when the tab closes),
// so nothing here follows a child across days, and nothing here claims to.
//
// Deduplication happens twice: once here, so a repeated click or a re-run
// sends nothing, and once in the report, which counts at most one of each
// per journey whatever arrived.

import { trackEvent } from './trackEvent';

export const ACTIVITY_STARTS = Object.freeze(['python-run', 'game-play']);
export const ACTIVITY_COMPLETIONS = Object.freeze(['python-first-run', 'python-change-message', 'game-changed-tested']);

const PREFIX = 'codeit_activity:';

/** True the first time this key is seen in this browser session. */
function firstTimeThisSession(key) {
  try {
    const full = PREFIX + key;
    if (sessionStorage.getItem(full) === '1') return false;
    sessionStorage.setItem(full, '1');
    return true;
  } catch (_) {
    // No storage (private mode, blocked): send, and let the report dedupe.
    return true;
  }
}

export function trackActivityStart(kind, token = null) {
  if (!ACTIVITY_STARTS.includes(kind)) return Promise.resolve(false);
  if (!firstTimeThisSession(`start:${kind}`)) return Promise.resolve(false);
  return trackEvent('activity_start', kind, token);
}

export function trackActivityComplete(activity, token = null) {
  if (!ACTIVITY_COMPLETIONS.includes(activity)) return Promise.resolve(false);
  if (!firstTimeThisSession(`done:${activity}`)) return Promise.resolve(false);
  return trackEvent('activity_complete', activity, token);
}

/** Only for a visitor with no account: the server records the rest. */
export function trackGuestLessonComplete(lessonId, token = null) {
  if (token) return Promise.resolve(false);
  const id = Number(lessonId);
  if (!Number.isInteger(id) || id < 1) return Promise.resolve(false);
  if (!firstTimeThisSession(`guest-lesson:${id}`)) return Promise.resolve(false);
  return trackEvent('guest_lesson_complete', null, null);
}

/** For tests. */
export function resetActivityMemory() {
  try {
    Object.keys(sessionStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => sessionStorage.removeItem(k));
  } catch (_) { /* nothing to clear */ }
}
