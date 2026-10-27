// ── A recipe without a server ───────────────────────────────────────────────
//
// The server's /api/builder/recipe answers in about two seconds with a Haiku
// call and falls back to rules. When the network is slow, the call fails, or
// the model is out of credit, this file builds the same shape of recipe from
// the sentence alone, so the game still appears. Both sides read the sentence
// with the same rules (gameWords.js), so the page and the server agree about
// what a child asked for.

import { KINDS, emojiForWord, isEmojiLook, looksLikeGame as soundsLikeGame, nounsIn, recipeFromIdea } from './gameWords';
import { EMOJI_TO_SPRITE, SPRITE_NAMES, spriteNameFor } from './sprites';

export const SKY_NAMES = ['space', 'night', 'ocean', 'candy', 'day', 'sunset'];
export const TWISTS = ['none', 'faster', 'waves'];

/** Does this sound like a game at all? Sites, quizzes and tools are not games. */
export function looksLikeGame(text) {
  return soundsLikeGame(text);
}

/** The thing a child named, so a "try this instead" can keep their word. */
export function keepTheirWord(text) {
  const first = nounsIn(text)[0];
  return first ? first.word : 'dragon';
}

/** A name for a game from a sentence: "Samosa Dodge", "Pizza Catch". */
export function titleFor(text) {
  if (!String(text || '').trim()) return 'My Game';
  return localRecipe(text).title;
}

/** The recipe from a sentence, with no network at all. */
export function localRecipe(text, kind) {
  const r = recipeFromIdea(text, kind);
  return {
    kind: r.kind,
    fits: r.fits,
    title: r.title,
    player: lookFor(r.player, 'hero'),
    enemy: lookFor(r.enemy, 'rock'),
    treasure: lookFor(r.treasure, 'gem'),
    sky: r.sky,
    speed: r.speed,
    lives: r.lives,
    winAt: r.winAt,
    twist: r.twist,
    named: r.named,
    words: r.words,
  };
}

/** A look the engine can draw: one of our sprite names, or a picture (emoji). */
export function lookFor(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const v = value.trim();
  if (SPRITE_NAMES.includes(v)) return v;
  // The page and the game must show the same thing: a generic emoji is our sprite.
  if (EMOJI_TO_SPRITE[v]) return EMOJI_TO_SPRITE[v];
  if (isEmojiLook(v)) return Array.from(v).length <= 8 ? v : fallback;
  return emojiForWord(v) || spriteNameFor(v, fallback);
}

/** Whatever the server said, kept as the child said it, with sane numbers. */
export function normaliseRecipe(r, text = '') {
  const base = localRecipe(text, KINDS.includes(r?.kind) ? r.kind : undefined);
  const kind = KINDS.includes(r?.kind) ? r.kind : base.kind;
  const title = typeof r?.title === 'string' ? r.title.replace(/[<>"'&]/g, '').trim().slice(0, 24) : '';
  return {
    ...base,
    kind,
    fits: typeof r?.fits === 'boolean' ? r.fits : base.fits,
    // The server's own fallback title ("Game Game") never beats ours.
    title: title.length > 2 && !/^(game\s*)+$/i.test(title) ? title : base.title,
    player: lookFor(r?.player, base.player),
    enemy: lookFor(r?.enemy, base.enemy),
    treasure: lookFor(r?.treasure, base.treasure),
    sky: SKY_NAMES.includes(r?.sky) ? r.sky : base.sky,
    speed: Math.max(1, Math.min(3, Number(r?.speed) || base.speed)),
    lives: [1, 3, 5].includes(Number(r?.lives)) ? Number(r.lives) : base.lives,
    winAt: Math.max(5, Math.min(99, Number(r?.winAt) || base.winAt)),
    twist: TWISTS.includes(String(r?.twist || '').toLowerCase()) ? String(r.twist).toLowerCase() : base.twist,
  };
}

/** Example sentences. A child who freezes at a blank box taps one. */
export const IDEAS = [
  'a ship that shoots asteroids and they get faster',
  'a bunny that catches carrots at night',
  'a dragon that flies through the clouds',
  'a maze where a mouse finds cheese',
  'a samosa that has to dodge the fork',
  'a race car that passes the trucks',
  'pop the balloons but not the bombs',
  'a pet puppy you feed and play with',
  'dodge the bombs in space, one life',
  'a runner that jumps over bombs and collects coins',
  'pizza that falls from the sky',
  'catch coins under the sea, win at 30',
];

/** Four reels for "Roll an idea". */
export const REELS = [
  ['a bunny', 'a dragon', 'a samosa', 'a race car', 'a puppy', 'a robot', 'a cat', 'an alien'],
  ['that catches', 'that dodges', 'that flies past', 'that jumps over', 'that shoots'],
  ['carrots', 'forks', 'clouds', 'asteroids', 'cupcakes', 'pizza', 'stars', 'balloons'],
  ['in space', 'at night', 'at sunset', 'in candy land', 'under the sea', 'in the day'],
];

export function rollIdea(random = Math.random) {
  return REELS.map((reel) => reel[Math.floor(random() * reel.length)]);
}

const NAME_HERO = { hero: 'Bunny', ship: 'Ship', alien: 'Alien', pink: 'Pinky', skyguy: 'Sky', blob: 'Blob' };
const NAME_KIND = { catch: 'Catch', dodge: 'Dodge', shooter: 'Blast', runner: 'Run', flyer: 'Flight', racer: 'Race', maze: 'Maze', pop: 'Pop', pet: 'Pal' };
const ADJ = ['Mega', 'Super', 'Turbo', 'Wild', 'Lucky', 'Rocket'];

/** A name for a game built from choices, and another one when asked. */
export function nameFor(recipe, random = null) {
  const base = `${NAME_HERO[recipe.player] || 'Hero'} ${NAME_KIND[recipe.kind] || 'Game'}`;
  return random ? `${ADJ[Math.floor(random() * ADJ.length)]} ${base}` : base;
}
