// ── A title that reads like a name ───────────────────────────────────────────
//
// Message 68: the Explore cards showed "Colorful one-page website with
// About,..." and "Click-the-target game where colorful circle..." Those are
// the sentences someone typed into the builder, saved as titles, and they
// truncate badly because they were never meant to be read at that length.
//
// The fix at the source is name-on-save (the studio asks). This is the fix
// for every project that already exists: the first few words, cut at a word
// boundary, so nothing is ever sliced mid-word. A short title passes through
// untouched, so "Mission Control Quiz" stays "Mission Control Quiz".

const MAX_WORDS = 4;
const MAX_CHARS = 28;
const TRAILING = /^(?:and|or|with|that|which|so|then|a|an|the|of|for|to|in|on|at|is|are|it|my|your|you|can|will|has|have|but|as|by|from|where|when)$/i;

export function displayTitle(raw, { maxWords = MAX_WORDS, maxChars = MAX_CHARS } = {}) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim().replace(/[\s,;:.!?-]+$/, '');
  if (!text) return 'My project';
  if (text.length <= maxChars && text.split(' ').length <= maxWords) return text;

  let words = text.split(' ').slice(0, maxWords);
  // Fit the character budget one whole word at a time.
  while (words.length > 1 && words.join(' ').length > maxChars) words.pop();
  // Never end on a joining word or a dangling punctuation mark.
  while (words.length > 1 && TRAILING.test(words[words.length - 1].replace(/[^a-z]/gi, ''))) words.pop();
  let joined = words.join(' ').replace(/[\s,;:.!?-]+$/, '');
  if (!joined) joined = text.slice(0, maxChars).trim();
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

export default displayTitle;
