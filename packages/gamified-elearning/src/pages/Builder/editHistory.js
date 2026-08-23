// ── Undo for edits a child makes by hand ─────────────────────────────────────
//
// The studio already had an undo, but only for AI edits: applyEdit kept a
// single `previousCode` snapshot. Everything a child did with their hands —
// dragging a button across the page, recolouring a heading, retyping a title —
// went straight into the code with no way back. That is the wrong way round.
// A prompt can be retyped; a drag cannot be un-dragged from memory, and a
// seven-year-old who moves something and hates it needs one button, not a
// lesson in Ctrl+Z regret.
//
// The model is snapshots, not diffs: each entry is the whole HTML as it was
// *before* a change. Diffing HTML properly is a project of its own, and the
// pages here are small enough that whole copies are cheap.
//
// Current code lives in React state, outside this structure. That keeps the two
// from disagreeing about what "now" is.

// Snapshots are whole pages, and this runs on school Chromebooks with not much
// memory. Both caps are deliberately modest — a child undoing more than a
// dozen steps is rebuilding, not correcting.
const MAX_ENTRIES = 20;
const MAX_BYTES = 4 * 1024 * 1024;

const EMPTY = Object.freeze({ past: [], future: [] });

function totalBytes(entries) {
  return entries.reduce((sum, entry) => sum + entry.html.length, 0);
}

/** Drop the oldest entries until the stack fits both caps. */
function trim(entries) {
  let kept = entries.slice(-MAX_ENTRIES);
  while (kept.length > 1 && totalBytes(kept) > MAX_BYTES) kept = kept.slice(1);
  return kept;
}

/**
 * Record what the page looked like before a change.
 *
 * `label` is what the undo button says it will undo — "Moved it", "Changed the
 * colour" — so a child knows what they are about to get back.
 *
 * Doing something new clears the redo stack, which is what every editor does
 * and what people expect.
 */
function remember(history, previousHtml, label) {
  if (typeof previousHtml !== 'string' || !previousHtml) return history;
  const past = history?.past || [];
  // Nothing changed, so there is nothing to undo. Without this, dragging an
  // element one pixel and back would leave two useless entries.
  if (past.length && past[past.length - 1].html === previousHtml) {
    return { past, future: [] };
  }
  return { past: trim([...past, { html: previousHtml, label: label || 'that change' }]), future: [] };
}

function canUndo(history) {
  return (history?.past?.length || 0) > 0;
}

function canRedo(history) {
  return (history?.future?.length || 0) > 0;
}

/** What the undo button should say it will undo, or '' when there is nothing. */
function undoLabel(history) {
  const past = history?.past || [];
  return past.length ? past[past.length - 1].label : '';
}

function redoLabel(history) {
  const future = history?.future || [];
  return future.length ? future[future.length - 1].label : '';
}

/**
 * Step back one change.
 *
 * Returns { history, html } — html is what the page should become, or null when
 * there was nothing to undo. `currentHtml` goes onto the redo stack so the step
 * can be taken again.
 */
function undo(history, currentHtml) {
  const past = history?.past || [];
  if (!past.length) return { history: history || EMPTY, html: null };
  const entry = past[past.length - 1];
  return {
    history: {
      past: past.slice(0, -1),
      future: trim([...(history.future || []), { html: currentHtml, label: entry.label }]),
    },
    html: entry.html,
  };
}

/** Step forward again, undoing the undo. */
function redo(history, currentHtml) {
  const future = history?.future || [];
  if (!future.length) return { history: history || EMPTY, html: null };
  const entry = future[future.length - 1];
  return {
    history: {
      past: trim([...(history.past || []), { html: currentHtml, label: entry.label }]),
      future: future.slice(0, -1),
    },
    html: entry.html,
  };
}

/** Starting over — a new project should not offer to undo into the old one. */
function clearHistory() {
  return { past: [], future: [] };
}

export {
  EMPTY,
  MAX_ENTRIES,
  canRedo,
  canUndo,
  clearHistory,
  redo,
  redoLabel,
  remember,
  undo,
  undoLabel,
};
