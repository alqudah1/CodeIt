'use strict';
// ── A game recipe from a child's sentence, without a model ──────────────────
//
// The instant builder does not ask the model to write a game. It asks for a
// nine-line recipe (what kind of game, who you are, who the enemies are, how
// fast) and a game engine in the page turns the recipe into a game at once.
// These rules are the floor under that: they turn a sentence into a recipe in
// zero milliseconds, so the model is an improvement on the result rather than
// a condition for getting one. When the model is slow, down or out of credit,
// a child still gets their ship game, not a "could not build it" card.

const KINDS = ['shooter', 'dodge', 'catch', 'runner'];
const SKIES = ['space', 'night', 'ocean', 'candy', 'day'];

const PLAYERS = [
  [/space\s*ship|spaceship|rocket|ship\b|space/, '🚀'], [/plane|jet/, '✈️'], [/\bcar\b|race/, '🏎️'], [/\bcat\b|kitten/, '🐱'], [/\bdog\b|puppy/, '🐶'],
  [/dragon/, '🐲'], [/robot/, '🤖'], [/ninja/, '🥷'], [/knight|sword/, '🛡️'], [/frog/, '🐸'], [/\bbird\b/, '🐦'], [/fish|shark/, '🐟'],
  [/unicorn/, '🦄'], [/dino/, '🦖'], [/pizza/, '🍕'], [/basket/, '🧺'], [/wizard|magic/, '🧙'], [/\bbee\b/, '🐝'], [/penguin/, '🐧'],
];
const ENEMIES = [
  [/enemy ship|alien|ufo|invader/, '👾'], [/zombie/, '🧟'], [/ghost/, '👻'], [/asteroid|rock|meteor/, '☄️'], [/monster/, '👹'], [/bomb/, '💣'],
  [/dragon/, '🐉'], [/spider/, '🕷️'], [/\bbat\b/, '🦇'], [/shark/, '🦈'], [/robot/, '🤖'], [/enem/, '👾'], [/\bbird\b/, '🦅'], [/snake/, '🐍'], [/skull|death/, '💀'],
];
const GOODS = [[/star/, '⭐'], [/coin|gold|money/, '🪙'], [/gem|diamond/, '💎'], [/apple|fruit/, '🍎'], [/pizza/, '🍕'], [/heart/, '❤️'], [/candy|sweet/, '🍬'], [/fish/, '🐟'], [/battery/, '🔋'], [/cookie/, '🍪']];

const first = (list, s, fallback) => (list.find(([re]) => re.test(s)) || [null, fallback])[1];

/** Is this sentence asking for a game at all? Websites, quizzes and tools go the slow way. */
function looksLikeGame(text) {
  const s = String(text || '').toLowerCase();
  if (/quiz|trivia|question|website|web page|webpage|portfolio|shop|store|calculator|timer|flashcard|blog|page about/.test(s)) return false;
  return /game|shoot|dodge|avoid|catch|collect|jump|run|runner|obby|platform|enemy|enemies|zombie|alien|asteroid|survive|escape|play|score|level|boss|ship|race|fly/.test(s);
}

function titleFor(text) {
  let t = String(text || '').trim().replace(/^(i want|i wanna|make me|make|build me|build|create|can you make|please make)\s+/i, '').replace(/^(a|an|the)\s+/i, '');
  const m = t.match(/^(.*?)\s+game\b/i);
  t = (m ? m[1] : t.split(/\s+(where|were|that|which|with|and|so|in which)\s+/i)[0]).trim().slice(0, 22);
  t = t.split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  return t.length > 2 ? `${t} Game` : 'My Game';
}

/** The rules-only recipe. Always returns a valid recipe for any text. */
function recipeFromRules(text) {
  const s = String(text || '').toLowerCase();
  let kind = 'dodge';
  if (/shoot|shot|fire|laser|blast|gun|cannon|invader/.test(s)) kind = 'shooter';
  else if (/catch|collect|basket|grab|falling|pick up|eat/.test(s)) kind = 'catch';
  else if (/jump|run|runner|obby|obstacle|platform|parkour/.test(s)) kind = 'runner';
  else if (/dodge|avoid|escape|survive|zombie|asteroid/.test(s)) kind = 'dodge';
  const player = first(PLAYERS, s, kind === 'catch' ? '🧺' : kind === 'runner' ? '🐱' : '🚀');
  const enemy = first(ENEMIES, s, kind === 'catch' ? '💣' : '👾');
  const treasure = first(GOODS, s, kind === 'catch' ? '⭐' : '💎');
  const sky = /space|ship|alien|star|rocket|planet/.test(s) ? 'space' : /night|dark|zombie|ghost|spooky|halloween/.test(s) ? 'night' : /sea|ocean|fish|shark|water|under/.test(s) ? 'ocean' : /candy|pink|unicorn|sweet/.test(s) ? 'candy' : 'day';
  const speed = /fast|hard|crazy|insane|extreme/.test(s) ? 3 : /slow|easy|baby/.test(s) ? 1 : 2;
  return { kind, title: titleFor(text), player, enemy, treasure, sky, speed, lives: 3, winAt: kind === 'runner' ? 20 : 15 };
}

/** Accept a model's recipe only if every field is sane; otherwise null. */
function validRecipe(r) {
  if (!r || typeof r !== 'object') return null;
  const emoji = (v) => typeof v === 'string' && v.length >= 1 && v.length <= 8 && !/[<>"'&]/.test(v);
  if (!KINDS.includes(r.kind) || !SKIES.includes(r.sky)) return null;
  if (!emoji(r.player) || !emoji(r.enemy) || !emoji(r.treasure)) return null;
  const speed = Number(r.speed), lives = Number(r.lives), winAt = Number(r.winAt);
  if (![1, 2, 3].includes(speed) || !(lives >= 1 && lives <= 5) || !(winAt >= 5 && winAt <= 50)) return null;
  const title = String(r.title || '').replace(/[<>"'&]/g, '').trim().slice(0, 28);
  if (title.length < 2) return null;
  return { kind: r.kind, title, player: r.player, enemy: r.enemy, treasure: r.treasure, sky: r.sky, speed, lives: Math.round(lives), winAt: Math.round(winAt) };
}

const RECIPE_PROMPT = `You turn a child's game idea into a short JSON recipe for a small game engine. Reply with ONLY the JSON object, no prose.
Fields:
kind: one of "shooter" (player at the bottom shoots things coming down), "dodge" (avoid things coming down, collect treasure), "catch" (catch treasure falling, avoid the bad thing), "runner" (side-scrolling, jump over things).
title: 2 to 4 words, fun, in the child's language, ends with "Game" if that reads well.
player: ONE emoji for the player. enemy: ONE emoji for the bad thing. treasure: ONE emoji for the good thing.
sky: one of "space", "night", "ocean", "candy", "day".
speed: 1, 2 or 3. lives: 1 to 5. winAt: 5 to 50.
Keep everything kind and age-appropriate for a 10-year-old; no weapons other than the game's "shoot", no gore.`;

module.exports = { KINDS, SKIES, looksLikeGame, recipeFromRules, validRecipe, titleFor, RECIPE_PROMPT };
