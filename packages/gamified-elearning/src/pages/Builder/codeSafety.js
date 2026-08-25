// ── Never lose a project that worked ─────────────────────────────────────────
//
// Letting a child type into real code is the whole point of a code view, and it
// is also the moment they can destroy an afternoon's work with one deleted
// bracket. Undo helps, but a child who has typed twenty characters since it
// broke does not know how many times to press it.
//
// So the studio quietly keeps the versions that ran clean, and offers one
// button that says exactly what it does: put it back to the last version that
// worked.
//
// ── Why this keeps a list and not just the last one ──────────────────────────
//
// The obvious design — remember the current code once it has run for a second
// without throwing — is wrong, and a browser test caught it. Most bugs in a
// child's game do not fire on load. They fire on the first click:
//
//     document.getElementById('hit').addEventListener('click', function () {
//       scoreboard.textContent = score;      // only throws when you play it
//     });
//
// That version sits there looking perfectly healthy for as long as nobody
// presses the button, gets recorded as the good one, and then the child plays
// it, breaks it, and the safety net offers to restore the broken version.
//
// So a version that has run quietly is only a *candidate*. When an error
// finally arrives, the version it came from is struck off the list, and the
// button falls back to the one before it — which really did work.
//
// Rules this module keeps:
//
//   * A version is never treated as good once it has thrown, no matter how long
//     it looked fine first.
//   * Restoring is offered only when it would change something. A button that
//     does nothing teaches a child that buttons do nothing.

/** How many candidate versions to keep. Enough to survive a run of bad edits. */
const MAX_KEPT = 6;

const EMPTY = { working: [], brokenSince: null };

function normalise(state) {
  if (!state || !Array.isArray(state.working)) return EMPTY;
  return state;
}

/**
 * The preview ran this code and has not complained.
 *
 * A candidate, not a promise — see the note above. It stays on the list until
 * something proves otherwise.
 */
function rememberWorking(state, code) {
  const current = normalise(state);
  if (typeof code !== 'string' || !code.trim()) return current;
  if (current.working[current.working.length - 1] === code) {
    return current.brokenSince === null ? current : { ...current, brokenSince: null };
  }
  const working = [...current.working.filter(kept => kept !== code), code].slice(-MAX_KEPT);
  return { working, brokenSince: null };
}

/**
 * The preview reported an error while running this code.
 *
 * Strikes it off the candidate list however long it had been sitting there
 * looking fine. This is the line that makes a click-time bug behave.
 */
function markBroken(state, code) {
  const current = normalise(state);
  if (typeof code !== 'string') return current;
  const working = current.working.filter(kept => kept !== code);
  if (working.length === current.working.length && current.brokenSince === code) return current;
  return { working, brokenSince: code };
}

/** The newest version that worked and is not the one on screen. */
function lastWorking(state, currentCode) {
  const current = normalise(state);
  for (let i = current.working.length - 1; i >= 0; i -= 1) {
    if (current.working[i] !== currentCode) return current.working[i];
  }
  return null;
}

/**
 * Is there somewhere worth going back to?
 *
 * Three things have to be true: something has worked, the project is broken
 * right now, and going back would actually change it.
 */
function canRestore(state, currentCode) {
  const current = normalise(state);
  if (current.brokenSince === null) return false;
  return lastWorking(current, currentCode) !== null;
}

/** The code to go back to, or null when there is nothing to go back to. */
function restore(state, currentCode) {
  return canRestore(state, currentCode) ? lastWorking(state, currentCode) : null;
}

/**
 * How much of the project going back would undo.
 *
 * Shown on the button, because "restore" with no idea of the cost is a scary
 * thing for a child to press. Counted in lines, which they can see.
 */
function costOfRestoring(state, currentCode) {
  const good = restore(state, currentCode);
  if (good === null) return 0;

  const goodLines = good.split('\n');
  const nowLines = (currentCode || '').split('\n');

  let same = 0;
  while (same < goodLines.length && same < nowLines.length && goodLines[same] === nowLines[same]) {
    same += 1;
  }
  let sameFromEnd = 0;
  while (
    sameFromEnd < goodLines.length - same
    && sameFromEnd < nowLines.length - same
    && goodLines[goodLines.length - 1 - sameFromEnd] === nowLines[nowLines.length - 1 - sameFromEnd]
  ) {
    sameFromEnd += 1;
  }
  return Math.max(goodLines.length, nowLines.length) - same - sameFromEnd;
}

export {
  EMPTY,
  MAX_KEPT,
  canRestore,
  costOfRestoring,
  lastWorking,
  markBroken,
  rememberWorking,
  restore,
};
