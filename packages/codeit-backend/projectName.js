// ── Naming a child's project ─────────────────────────────────────────────────
//
// Watched in a real classroom, 1 September 2026: a nine-year-old typed
//
//   "build a game that requires 2 players and that shoots each other with guns
//    with an health bar and stamina and make it playable with WASD and arrow
//    buttons with a battleground- so i can play with my friends"
//
// and got a working two-player game. It was called "Game that requires 2
// players and". Another child's was "Youtube and you can click on". A third's
// was "Swemown got rete", which was the child's own typo.
//
// The old rule was the first six words of the prompt, full stop, which is why
// every name ended mid-sentence. This is the name of the thing a child is
// proud of and wants to hand to a friend, so it should read like a name.
//
// Rules, in order:
//   1. If the child named it ("a game called Rivals"), that is the name.
//   2. Otherwise cut at the first clause boundary, because everything after
//      "that", "so", "where" or a dash is description, not a name.
//   3. Cap the length, then trim trailing joining words, so it can never end
//      on "and", "with" or "the".
//   4. Never return an empty string. "My Project" beats "Untitled" because a
//      child made it and it is theirs.

var LEAD = /^(?:please\s+|can\s+you\s+|build\s+|make\s+|create\s+|generate\s+|design\s+|a\s+|an\s+|the\s+|me\s+|my\s+)+/i;
var CALLED = /\b(?:called|named)\s+([a-z0-9][a-z0-9' -]{0,38})/i;
var CLAUSE = /\s+(?:that|which|so|where|then|when|but|because|and\s+make|and\s+then)\s+|\s+[-—]+\s*|[,.;:!?]/i;
var TRAILING = /^(?:and|or|with|that|which|so|then|a|an|the|of|for|to|in|on|at|is|are|it|my|your|you|can|will|has|have|but|as|by|from)$/i;
var MAX_WORDS = 5;

function cleanWords(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function tidy(text) {
  var all = cleanWords(text);
  var words = all.slice(0, MAX_WORDS);
  var truncated = all.length > words.length;

  // A cut phrase that ends "... with bouncing" reads worse than one that stops
  // before the connector, so drop the whole trailing fragment.
  if (truncated && words.length > 2 && TRAILING.test(words[words.length - 2])) {
    words = words.slice(0, words.length - 2);
  }
  // Then trim joining words off the end so a name can never dangle.
  while (words.length && TRAILING.test(words[words.length - 1])) words.pop();
  if (!words.length) return '';
  var joined = words.join(' ');
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

function projectName(rawPrompt) {
  var raw = String(rawPrompt || '').trim();
  if (!raw) return 'My Project';

  // 1. The child named it themselves.
  var called = raw.match(CALLED);
  if (called) {
    // The name stops at the clause boundary too: "called Rivals where there
    // are guns" names a game Rivals, not "Rivals where there are guns".
    var named = tidy(String(called[1]).split(CLAUSE)[0]);
    if (named) return named;
  }

  var body = raw.replace(LEAD, '').trim();
  if (!body) return 'My Project';

  // 2. Everything after a clause boundary is description, not a name.
  var head = body.split(CLAUSE)[0] || '';
  var fromHead = tidy(head);
  if (fromHead.split(' ').length >= 2) return fromHead;

  // 3. A one-word head is usually too thin ("game"), so fall back to the
  //    capped-and-trimmed whole phrase, which still cannot dangle.
  var fromBody = tidy(body);
  return fromBody || fromHead || 'My Project';
}

module.exports = { projectName };
