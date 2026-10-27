// ── The sprites: eight drawn things, in the brand's colours, no stock art ────
//
// Every game object a child can pick is an inline SVG defined here once. The
// Build page shows them as choices, and the generated game draws them on its
// canvas from the same data URIs, so the thing a child tapped is exactly the
// thing that moves. Nothing here is licensed from anyone; they are ours.
//
// A recipe names things as emoji. The generic ones (🚀, 👾, 💣, 💎, 🪙,
// ⭐) become these drawn sprites; anything more particular (a samosa, a
// fork, a cat) is drawn as itself, because that is what the child asked for.

const INK = '#35220E';
const ORANGE = '#FF7A00';
const VIOLET = '#7C5CFF';
const MINT = '#17C08B';
const SUN = '#FFC93C';
const SKY = '#3EB7F8';
const CORAL = '#FF6B6B';
const PAPER = '#FFFDFA';

const spark = (colour) => `<path d="M50 8c20 0 36 14 36 34 0 22-16 50-36 50S14 64 14 42C14 22 30 8 50 8z" fill="${colour}"/><circle cx="38" cy="40" r="7" fill="#fff"/><circle cx="62" cy="40" r="7" fill="#fff"/><circle cx="40" cy="41" r="3.2" fill="${INK}"/><circle cx="64" cy="41" r="3.2" fill="${INK}"/><path d="M40 58q10 8 20 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;

export const SPRITE_SVG = Object.freeze({
  hero: spark(ORANGE),
  pink: spark(CORAL),
  skyguy: spark(SKY),
  blob: spark(VIOLET),
  alien: spark(MINT),
  ship: `<path d="M50 6c14 14 18 38 12 62H38C32 44 36 20 50 6z" fill="${PAPER}"/><path d="M38 60 20 76l12 2zM62 60l18 16-12 2z" fill="${CORAL}"/><circle cx="50" cy="40" r="8" fill="${SKY}"/><path d="M42 70h16l-8 22z" fill="${SUN}"/>`,
  rock: `<path d="M30 20l40-6 18 30-12 36-42 4-18-28z" fill="#8A7A6A"/><path d="M40 30l22-3 9 16-7 20-24 2-10-16z" fill="#A99888"/>`,
  bomb: `<circle cx="48" cy="58" r="30" fill="${INK}"/><path d="M60 30l8-14" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="70" cy="14" r="6" fill="${SUN}"/><circle cx="38" cy="48" r="7" fill="rgba(255,255,255,.25)"/>`,
  sun: `<circle cx="50" cy="50" r="24" fill="${SUN}"/><g stroke="${ORANGE}" stroke-width="6" stroke-linecap="round"><path d="M50 8v12M50 80v12M8 50h12M80 50h12M20 20l9 9M71 71l9 9M20 80l9-9M71 29l9-9"/></g>`,
  coin: `<circle cx="50" cy="50" r="34" fill="${SUN}"/><circle cx="50" cy="50" r="24" fill="none" stroke="#E0A800" stroke-width="5"/><rect x="46" y="34" width="8" height="32" rx="4" fill="#B07800"/>`,
  carrot: `<path d="M50 94 26 40h48z" fill="${ORANGE}"/><path d="M40 40c0-14 4-22 10-30 6 8 10 16 10 30z" fill="${MINT}"/><path d="M36 56h28M40 70h20" stroke="#D96000" stroke-width="3" stroke-linecap="round"/>`,
  gem: `<path d="M30 30h40l16 20-36 42-36-42z" fill="${VIOLET}"/><path d="M30 30l20 20 20-20M14 50h72M50 50v42" stroke="rgba(255,255,255,.5)" stroke-width="3" fill="none"/>`,
  star: `<path d="m50 8 12 27 29 3-22 19 7 29-26-15-26 15 7-29L9 38l29-3z" fill="${SUN}" stroke="#E0A800" stroke-width="3" stroke-linejoin="round"/>`,
});

export const SPRITE_NAMES = Object.freeze(Object.keys(SPRITE_SVG));

/** Who you can be, what comes at you, what you collect: the three menus. */
export const PLAYERS = Object.freeze(['hero', 'ship', 'alien', 'pink', 'skyguy', 'blob']);
export const ENEMIES = Object.freeze(['rock', 'bomb', 'alien', 'sun']);
export const TREASURES = Object.freeze(['coin', 'gem', 'carrot', 'star']);

export const SPRITE_LABEL = Object.freeze({
  hero: 'Bunny', pink: 'Pinky', skyguy: 'Sky', blob: 'Blob', alien: 'Alien', ship: 'Ship',
  rock: 'Rocks', bomb: 'Bombs', sun: 'Fireballs', coin: 'Coins', carrot: 'Carrots', gem: 'Gems', star: 'Stars',
});

export const EMOJI_TO_SPRITE = Object.freeze({
  '🚀': 'ship', '👾': 'alien', '☄️': 'rock', '🪨': 'rock', '💣': 'bomb', '💎': 'gem', '🪙': 'coin', '🥕': 'carrot', '⭐': 'star', '🌟': 'star',
});

/** A sprite name for anything the recipe might say: a name, an emoji, or noise. */
export function spriteNameFor(value, fallback = 'hero') {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  if (SPRITE_SVG[v]) return v;
  if (EMOJI_TO_SPRITE[v]) return EMOJI_TO_SPRITE[v];
  const first = Array.from(v)[0];
  if (first && EMOJI_TO_SPRITE[first]) return EMOJI_TO_SPRITE[first];
  const lower = v.toLowerCase();
  const byWord = SPRITE_NAMES.find((n) => lower.includes(n)) || Object.keys(SPRITE_LABEL).find((n) => lower.includes(SPRITE_LABEL[n].toLowerCase().replace(/s$/, '')));
  return byWord || fallback;
}

/** The sprite as an image source a canvas or an <img> can load. */
export function spriteUri(name) {
  const body = SPRITE_SVG[name] || SPRITE_SVG.hero;
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`)}`;
}

/** Every sprite as data URIs, for a game page to carry with it. */
export function spriteTable() {
  const out = {};
  for (const name of SPRITE_NAMES) out[name] = spriteUri(name);
  return out;
}
