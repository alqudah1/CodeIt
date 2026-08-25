// ── The knobs a child can actually turn ──────────────────────────────────────
//
// Every starter game opens its script with a block of plain declarations:
//
//   // ── Change these and watch what happens ──
//   let fallSpeed  = 3;
//   let starColour = '#FFD84D';
//   let startLives = 3;
//
// Those five lines are the whole game as far as a nine-year-old is concerned.
// They are also the only part of the file that can be changed without
// understanding any of the rest of it.
//
// ── Why this module exists ───────────────────────────────────────────────────
//
// Until now the only ways to change `fallSpeed` were to type it in the code
// editor or to ask the AI in English and wait for a model round-trip. The
// studio did have a "Gameplay" slider promising "drag to preview instantly",
// but it poked variables called `spawnDelay`, `speed` and `gameSpeed` — and no
// starter game declares any of them. It moved nothing, on any of the three
// games on the front page, and its Apply button then asked a model to guess.
//
// A slider that does nothing is worse than no slider. So the controls are
// generated from the child's own file instead of guessed at: whatever they
// named it is what appears, and changing it rewrites that one line.
//
// ── Why the variable name is shown next to the friendly label ────────────────
//
// "Fall speed" is what a child understands. `fallSpeed` is what they will have
// to recognise five minutes later when the studio asks them, in Prove It, what
// `fallSpeed` starts out as — and what they will read in the code tab. Showing
// both is the cheapest teaching moment in the product: the slider they just
// dragged and the word in the file are the same thing.
//
// Pure functions only. No React, no network, no AI. The studio does the IO.

// Names that are the machinery rather than the knobs. If a marker comment is
// missing we fall back to reading the first run of declarations, and these are
// the ones that would otherwise sneak in and offer a child a slider for the
// canvas width.
const NOT_A_SETTING = new Set([
  'width', 'height', 'canvas', 'ctx', 'pen', 'score', 'best', 'playing',
  'paused', 'frame', 'now', 'time', 'x', 'y', 'i', 'j', 'k', 'message',
]);

const MAX_SETTINGS = 8;
const MAX_TEXT = 40;

/** "fallSpeed" → "Fall speed". The child's own word, made readable. */
function labelFor(name) {
  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * One short line saying which way is which.
 *
 * Only returned when the name makes it genuinely obvious. A confident-sounding
 * guess about someone else's variable is worse than saying nothing, and a
 * child who reads "Bigger = faster" under a control that makes things smaller
 * learns to distrust the whole panel.
 */
function helpFor(name, type) {
  if (type === 'colour') return 'Pick any colour you like';
  const n = name.toLowerCase();
  if (n.includes('speed')) return 'Bigger number = faster';
  if (n.includes('size') || n.includes('wide') || n.includes('big')) return 'Bigger number = bigger';
  if (n.includes('chance')) return 'Bigger number = happens more often';
  if (n.includes('delay') || n.includes('gap') || n.includes('wait')) return 'Bigger number = slower';
  if (n.includes('lives') || n.includes('shots') || n.includes('tries')) return 'How many you get';
  if (n.includes('gravity')) return 'Bigger number = falls harder';
  return null;
}

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * A range a child cannot break the game with.
 *
 * The rules matter more than they look. `0` for a lives count is a game that
 * ends before it starts; `0` for a speed is a game that never moves. Both are
 * technically valid numbers and both feel, to the child who just dragged the
 * slider, like they broke it. So whole numbers that start at 1 or above keep a
 * floor of 1.
 *
 * Fractions below 1 (rockChance = 0.04) get their own treatment, because
 * 0 to 0.12 in steps of 0.01 is a usable control and 0 to 1 in steps of 1 is
 * not.
 */
function rangeFor(value) {
  if (!Number.isFinite(value)) return null;

  if (value > 0 && value < 1) {
    const max = Math.min(1, roundNice(value * 3));
    const step = stepBelowOne(value);
    return { min: 0, max: Math.max(max, value + step), step };
  }

  const whole = Number.isInteger(value);
  const step = whole ? 1 : 0.1;
  const floor = whole && value >= 1 ? 1 : 0;

  if (Math.abs(value) <= 10) {
    return { min: floor, max: Math.max(10, Math.ceil(value * 3)), step };
  }
  return {
    min: Math.max(floor, Math.round(value / 4)),
    max: Math.ceil(value * 3),
    step,
  };
}

function roundNice(n) {
  return Math.round(n * 1000) / 1000;
}

/** 0.04 → 0.01, 0.5 → 0.05. One order of magnitude finer than the value. */
function stepBelowOne(value) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return roundNice(magnitude / (value >= magnitude * 5 ? 2 : 1) / 5) || 0.01;
}

/** The first `<script>` body, or the whole document if there isn't one. */
function scriptBody(html) {
  const source = typeof html === 'string' ? html : '';
  const match = source.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
  return match ? match[1] : source;
}

const DECLARATION = /^\s*(?:let|const|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(-?\d*\.?\d+|'[^'\n]*'|"[^"\n]*"|true|false)\s*;?\s*(?:\/\/.*)?$/;

function parseLiteral(raw) {
  if (raw === 'true') return { type: 'boolean', value: true, quote: null };
  if (raw === 'false') return { type: 'boolean', value: false, quote: null };
  if (/^['"]/.test(raw)) {
    const quote = raw[0];
    const text = raw.slice(1, -1);
    return { type: HEX.test(text) ? 'colour' : 'text', value: text, quote };
  }
  return { type: 'number', value: Number(raw), quote: null };
}

/**
 * The settings a child may change, read out of their own file.
 *
 * Returns [] rather than guessing when there is nothing that clearly qualifies.
 * An empty panel is honest; a panel of controls wired to nothing is the bug
 * this module was written to remove.
 */
function readSettings(html) {
  const body = scriptBody(html);
  if (!body) return [];

  const lines = body.split('\n');

  // Prefer the marked block. Every starter game has one, and it is the author
  // saying "these are the knobs" rather than us inferring it.
  let start = lines.findIndex(line => /^\s*\/\/.*change these/i.test(line));
  let marked = start !== -1;
  if (marked) {
    start += 1;
  } else {
    // No marker: take the first unbroken run of literal declarations. In a file
    // that opens with `const canvas = document.getElementById(...)` this finds
    // nothing, which is the right answer.
    start = lines.findIndex(line => line.trim() !== '');
    if (start === -1) return [];
  }

  const settings = [];
  const seen = new Set();

  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') {
      if (settings.length) break;      // blank line ends the block
      continue;                         // but leading blanks are fine
    }
    const match = line.match(DECLARATION);
    if (!match) break;

    const [, name, raw] = match;
    if (seen.has(name)) continue;
    if (!marked && NOT_A_SETTING.has(name.toLowerCase())) continue;

    const literal = parseLiteral(raw);
    if (literal.type === 'number' && !Number.isFinite(literal.value)) continue;
    if (literal.type === 'text' && literal.value.length > MAX_TEXT) continue;

    seen.add(name);
    settings.push({
      name,
      label: labelFor(name),
      type: literal.type,
      value: literal.value,
      quote: literal.quote,
      help: helpFor(name, literal.type),
      ...(literal.type === 'number' ? rangeFor(literal.value) : {}),
    });

    if (settings.length >= MAX_SETTINGS) break;
  }

  return settings;
}

/** How a value goes back into the file, in the quotes it came out of. */
function formatValue(value, type, quote) {
  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    // Guard against 0.30000000000000004 ending up in a child's source file.
    return String(roundNice(n));
  }
  const q = quote || "'";
  const text = String(value);
  if (text.includes(q) || text.includes('\n')) return null;
  return q + text + q;
}

/**
 * Rewrite one declaration, and only the declaration.
 *
 * Anchored on the start of a line so a later use of the same name — the whole
 * point of the variable — is never touched. Returns the original html unchanged
 * if the setting is not found or the value cannot be written safely, so a
 * caller can compare and know nothing happened.
 */
function setSetting(html, name, value) {
  if (typeof html !== 'string' || !name) return html;

  const settings = readSettings(html);
  const setting = settings.find(s => s.name === name);
  if (!setting) return html;

  const formatted = formatValue(value, setting.type, setting.quote);
  if (formatted === null) return html;

  const pattern = new RegExp(
    `(^[ \\t]*(?:let|const|var)[ \\t]+${escapeName(name)}[ \\t]*=[ \\t]*)` +
    `(-?\\d*\\.?\\d+|'[^'\\n]*'|"[^"\\n]*"|true|false)`,
    'm'
  );

  let replaced = false;
  const next = html.replace(pattern, (whole, prefix) => {
    if (replaced) return whole;
    replaced = true;
    return prefix + formatted;
  });

  return replaced ? next : html;
}

function escapeName(name) {
  return String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A one-line script that pokes the running game, for feedback while dragging.
 *
 * The preview runs it through `new Function`, whose scope chain is the global
 * environment — which is where a top-level `let` in a classic script lives. So
 * this reaches the child's own variable even though it is not on `window`.
 *
 * Wrapped in typeof and try/catch because the running game may have been
 * reloaded, replaced or broken between the child picking up the slider and
 * letting go of it, and a thrown error inside the preview would surface to
 * them as if their game had crashed.
 */
function liveUpdateScript(name, value, type, quote) {
  const formatted = formatValue(value, type, quote);
  if (formatted === null || !name) return null;
  const safe = escapeName(name) === String(name) ? name : null;
  if (!safe) return null;
  return `try{if(typeof ${safe}!=='undefined'){${safe}=${formatted};}}catch(e){}`;
}

export {
  MAX_SETTINGS,
  MAX_TEXT,
  labelFor,
  liveUpdateScript,
  rangeFor,
  readSettings,
  setSetting,
};
