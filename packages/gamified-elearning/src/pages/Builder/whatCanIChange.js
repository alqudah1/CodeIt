// ── Naming one real thing in the child's own project ─────────────────────────
//
// "How do I edit and what can I edit" — asked out loud, by children, in a room.
//
// Thirteen of the twenty starters can be edited piece by piece and a browser
// check proves it. Nothing on the screen said so. Reaching the editor took two
// steps — open the Change page, then press a button labelled "Edit elements" —
// and a seven-year-old does not know what an element is.
//
// A general sentence does not fix that. "You can edit anything!" is the kind of
// thing a screen says when it has nothing specific to offer. What works is
// pointing at one actual thing the child is looking at, by name:
//
//     See the words "How well do you know animals?" — tap them to change them.
//
// So this reads the child's own file and finds the most obvious thing in it.

// ── Things that are on the page but not on the screen ────────────────────────
//
// Every canvas game here carries a real <h2>Game over!</h2>, sitting inside a
// panel the stylesheet hides until the child loses. It is genuine markup and it
// is invisible, so the first version of this file cheerfully told a child to go
// and tap words that were not there.
//
// So: read the stylesheet for anything hidden, find where those blocks start and
// end, and refuse to point inside them.

/** Class names the project's own stylesheet hides, now or shortly. */
function hiddenClasses(code) {
  const found = new Set();
  const styles = [...String(code).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(m => m[1]).join('\n');

  // Animations that end invisible. Every game here has a first-time tip that
  // fades out after three seconds — real markup, genuinely editable, and gone
  // by the time a child goes looking for it. Telling them to tap something that
  // has faded away is the same lie as telling them to tap something hidden,
  // just slower.
  const vanishing = new Set();
  // The inner block first, then the closing brace of the @keyframes itself.
  // A previous version required a newline before that brace and so matched
  // nothing at all in `@keyframes fadeTip { to { opacity: 0; } }`.
  for (const frames of styles.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
    if (/opacity\s*:\s*0\b/.test(frames[2])) vanishing.add(frames[1]);
  }

  for (const rule of styles.split('}')) {
    const animation = /animation\s*:\s*([\w-]+)/.exec(rule);
    const fades = animation && vanishing.has(animation[1]);
    // pointer-events: none settles it outright — the element is on the screen
    // and cannot be tapped, so it is not something a child can change.
    const untappable = /pointer-events\s*:\s*none/i.test(rule);
    if (!/display\s*:\s*none/i.test(rule) && !fades && !untappable) continue;
    for (const cls of rule.match(/\.([a-zA-Z][\w-]*)/g) || []) {
      found.add(cls.slice(1));
    }
  }
  return found;
}

/** Where each hidden block begins and ends, so candidates inside can be skipped. */
function hiddenRegions(body, classes) {
  if (!classes.size) return [];
  const regions = [];
  const opening = /<(\w+)\b([^>]*)>/g;
  let match;
  while ((match = opening.exec(body)) !== null) {
    const [whole, tag, attrs] = match;
    const cls = /class\s*=\s*["']([^"']*)["']/i.exec(attrs);
    const id = /id\s*=\s*["']([^"']*)["']/i.exec(attrs);
    const names = (cls ? cls[1].split(/\s+/) : []).concat(id ? [id[1]] : []);
    if (!names.some(n => classes.has(n))) continue;

    // Walk forward to this tag's own closing tag, counting nesting.
    let depth = 1;
    const walker = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    walker.lastIndex = match.index + whole.length;
    let step;
    while (depth > 0 && (step = walker.exec(body)) !== null) {
      depth += step[1] === '/' ? -1 : 1;
    }
    regions.push([match.index, step ? walker.lastIndex : body.length]);
  }
  return regions;
}

/** Text that is visible to a child, with the tags and entities taken out. */
function readable(html) {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// In the order a child's eye lands on them. A heading first, because it is the
// biggest words on the page and the ones they are most likely to want to own.
const LOOK_FOR = [
  { tag: 'h1', what: 'the big title' },
  { tag: 'h2', what: 'the title' },
  { tag: 'button', what: 'that button' },
  { tag: 'h3', what: 'the heading' },
  { tag: 'p', what: 'that line' },
];

/**
 * The most obvious changeable thing in a project, or null.
 *
 * Returns null rather than guessing when a project has no ordinary elements to
 * point at — a canvas game is one picture as far as the page is concerned, and
 * telling a child to tap a heading that is painted rather than written would
 * send them looking for something they cannot find.
 */
function whatCanIChange(code) {
  if (typeof code !== 'string' || !code) return null;

  // Everything inside <script> and <style> is not on the screen, and a canvas
  // game's world is not made of elements at all.
  const body = code
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  const hidden = hiddenRegions(body, hiddenClasses(code));
  const isHidden = at => hidden.some(([start, end]) => at >= start && at < end);

  for (const { tag, what } of LOOK_FOR) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
    let match;
    while ((match = pattern.exec(body)) !== null) {
      if (isHidden(match.index)) continue;
      const text = readable(match[1]);
      // Too short to recognise, or too long to quote back at a child.
      if (text.length < 3 || text.length > 46) continue;
      // Skip anything that is only a number or a symbol: score badges, timers,
      // the × on a close button. A child cannot tell one "0" from another.
      if (!/[a-z]{3}/i.test(text)) continue;
      return { tag, what, text };
    }
  }
  return null;
}

// ── Projects whose pieces have no words on them ──────────────────────────────
//
// The maze is built from elements on purpose — walls, coins, a door — so the
// studio's editor can move them. Not one of them contains a word, so the search
// above finds nothing and stays silent, which is right for a canvas game and
// wrong here: the maze is the most editable project in the whole set.
//
// What those projects do have is many copies of one shape, and a class name
// that is usually the English word for it: wall, coin, hole, pad. That is a
// noun a child can be pointed at.

/** A shape the project repeats, if it has one worth naming. */
function repeatedPiece(code) {
  if (typeof code !== 'string' || !code) return null;
  const body = String(code)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  const counts = new Map();
  for (const m of body.matchAll(/<div\b[^>]*class\s*=\s*["']([^"']+)["']/gi)) {
    for (const name of m[1].split(/\s+/)) {
      // A plain English word, not a generated hash and not a state flag.
      if (!/^[a-z]{3,12}$/.test(name)) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }

  let best = null;
  for (const [name, n] of counts) {
    // Three or more of the same thing is a pattern a child can see.
    if (n >= 3 && (!best || n > best.count)) best = { name, count: n };
  }
  return best;
}

/** The whole sentence, ready to put on the screen. */
function changeInvitation(code) {
  const found = whatCanIChange(code);
  if (found) {
    return `See where it says “${found.text}”? Tap it and you can change the words, the colour or the size.`;
  }

  const piece = repeatedPiece(code);
  if (piece) {
    return `See the ${piece.name}s? Tap one and you can drag it somewhere else, or change its colour.`;
  }

  return null;
}

export { changeInvitation, repeatedPiece, whatCanIChange };
