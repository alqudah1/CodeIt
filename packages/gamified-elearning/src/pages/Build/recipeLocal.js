// ── A recipe without a server ───────────────────────────────────────────────
//
// The server's /api/builder/recipe answers in about two seconds with a Haiku
// call and falls back to rules. When the network is slow, the call fails, or
// the child is on a school connection that drops, this file builds the same
// shape of recipe from the sentence alone, so the game still appears. It is
// the same idea as recipeRules.js on the server, kept small and local.

import { spriteNameFor } from './sprites';

export const SKY_NAMES = ['space', 'night', 'ocean', 'candy', 'day', 'sunset'];
export const TWISTS = ['none', 'faster', 'waves'];

const NOT_GAME = /\b(website|web site|webpage|home ?page|quiz|calculator|chat ?bot|story|blog|portfolio|slideshow|essay)\b/i;

/** Does this sound like a game at all? Sites, quizzes and tools are not games. */
export function looksLikeGame(text) {
  const t = String(text || '').trim();
  if (t.length < 3) return false;
  return !NOT_GAME.test(t);
}

/** The noun a child used, so a "try this instead" can keep their word. */
export function keepTheirWord(text) {
  const m = String(text || '').match(/\b(dog|cat|space|dragon|car|pizza|ninja|robot|unicorn|shark|bunny|rabbit|alien|ship|rocket|star|coin|bomb|gem|carrot|football|cake|horse|frog)s?\b/i);
  return m ? m[1].toLowerCase() : 'dragon';
}

const PLAYER_WORDS = [[/ship|rocket|spaceship|plane|jet/, 'ship'], [/bunny|rabbit|dog|puppy|hero|kid|boy|girl|me\b/, 'hero'], [/alien|frog|green/, 'alien'], [/pink|cat|unicorn|princess/, 'pink'], [/blue|sky|bird|chick/, 'skyguy'], [/robot|dragon|purple|monster/, 'blob']];
const ENEMY_WORDS = [[/asteroid|rock|meteor|spike|stone/, 'rock'], [/bomb|mine|explosive/, 'bomb'], [/alien|ufo|ghost|zombie|enemy ship/, 'alien'], [/fire|lava|sun|flame|fireball|laser/, 'sun']];
const GOOD_WORDS = [[/carrot/, 'carrot'], [/coin|gold|money|treasure/, 'coin'], [/star/, 'star'], [/gem|diamond|crystal|ruby/, 'gem']];
const pick = (list, s, fallback) => (list.find(([re]) => re.test(s)) || [null, fallback])[1];

export function titleFor(text) {
  let t = String(text || '').trim();
  for (let i = 0; i < 3; i += 1) t = t.replace(/^(i want|i would like|please|make|build|me|a|an|the)\s+/i, '');
  t = t.split(/\s+(where|that|which|with|in|at|and|who|were)\s+/i)[0].trim().slice(0, 22);
  if (!t) t = 'My Game';
  t = t.split(/\s+/).map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  return /game$/i.test(t) ? t : `${t} Game`;
}

/** The nine lines of a game, from a sentence, with no network at all. */
export function localRecipe(text) {
  const s = String(text || '').toLowerCase();
  let kind = 'dodge';
  if (/shoot|shot|laser|blast|fire at/.test(s)) kind = 'shooter';
  else if (/catch|collect|eat|grab|pick up/.test(s)) kind = 'catch';
  else if (/jump|run|runner|obby|parkour|platform/.test(s)) kind = 'runner';
  const sky = /space|alien|asteroid|rocket|planet|galaxy/.test(s) ? 'space' : /night|dark|moon|zombie|ghost/.test(s) ? 'night' : /ocean|sea|under ?water|fish|shark/.test(s) ? 'ocean' : /sunset|fire|lava|volcano/.test(s) ? 'sunset' : /candy|pink|sweet|cake/.test(s) ? 'candy' : 'day';
  const goal = s.match(/win at (\d+)/);
  return {
    kind,
    title: titleFor(text),
    player: pick(PLAYER_WORDS, s, kind === 'shooter' ? 'ship' : 'hero'),
    enemy: pick(ENEMY_WORDS, s, kind === 'catch' ? 'bomb' : 'rock'),
    treasure: pick(GOOD_WORDS, s, 'gem'),
    sky,
    speed: /fast|hard|crazy|turbo/.test(s) ? 3 : /slow|easy|calm/.test(s) ? 1 : 2,
    lives: /one life|1 life/.test(s) ? 1 : /five lives|5 lives/.test(s) ? 5 : 3,
    winAt: goal ? Math.max(5, Math.min(99, Number(goal[1]))) : 15,
    twist: /faster|harder|speed up|gets? fast/.test(s) ? 'faster' : /wave|five|5 at once|lots of|swarm/.test(s) ? 'waves' : 'none',
  };
}

/** Whatever the server said, as sprite names and sane numbers. */
export function normaliseRecipe(r, text = '') {
  const base = localRecipe(text);
  const kind = ['shooter', 'dodge', 'catch', 'runner'].includes(r?.kind) ? r.kind : base.kind;
  return {
    kind,
    title: (typeof r?.title === 'string' && r.title.trim()) ? r.title.trim().slice(0, 24) : base.title,
    player: spriteNameFor(r?.player, base.player),
    enemy: spriteNameFor(r?.enemy, base.enemy),
    treasure: spriteNameFor(r?.treasure, base.treasure),
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
  'dodge the bombs in space, one life',
  'a runner that jumps over bombs and collects coins',
  'catch stars, not bombs, at sunset',
  'a shooter with five aliens at once',
  'catch coins under the sea, win at 30',
  'a pink cat that dodges fireballs in candy land',
];

/** Four reels for "Roll an idea". */
export const REELS = [
  ['a bunny', 'a ship', 'an alien', 'a pink cat', 'a robot', 'a dragon'],
  ['that catches', 'that shoots', 'that dodges', 'that runs from'],
  ['carrots', 'asteroids', 'bombs', 'gems', 'stars', 'coins'],
  ['in space', 'at night', 'at sunset', 'in candy land', 'under the sea', 'in the day'],
];

export function rollIdea(random = Math.random) {
  return REELS.map((reel) => reel[Math.floor(random() * reel.length)]);
}

const NAME_HERO = { hero: 'Bunny', ship: 'Ship', alien: 'Alien', pink: 'Pinky', skyguy: 'Sky', blob: 'Blob' };
const NAME_KIND = { catch: 'Catch', dodge: 'Dodge', shooter: 'Blast', runner: 'Run' };
const ADJ = ['Mega', 'Super', 'Turbo', 'Wild', 'Lucky', 'Rocket'];

/** A name for a game built from choices, and another one when asked. */
export function nameFor(recipe, random = null) {
  const base = `${NAME_HERO[recipe.player] || 'Hero'} ${NAME_KIND[recipe.kind] || 'Game'}`;
  return random ? `${ADJ[Math.floor(random() * ADJ.length)]} ${base}` : base;
}
