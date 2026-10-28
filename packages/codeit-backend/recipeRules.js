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

// The sentence is read by gameWords.js, the same file the page uses, so the
// server and the page make the same game from the same words.
const words = require('./gameWords');

const KINDS = words.KINDS;
const SKIES = ['space', 'night', 'ocean', 'candy', 'day', 'sunset'];

/** Is this sentence asking for a game at all? Websites, quizzes and tools go the slow way. */
function looksLikeGame(text) {
  return words.looksLikeGame(text);
}

/** The game's name from the child's own words: "Samosa Dodge", "Pizza Catch". */
function titleFor(text) {
  return words.recipeFromIdea(text).title;
}

/** The rules-only recipe. Always returns a valid recipe for any text. */
function recipeFromRules(text) {
  const r = words.recipeFromIdea(text);
  return { kind: r.kind, fits: r.fits, title: r.title, player: r.player, enemy: r.enemy, treasure: r.treasure, sky: r.sky, speed: r.speed, lives: r.lives, winAt: r.winAt, ...(r.ownRules ? { ownRules: true } : {}) };
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
  const out = { kind: r.kind, title, player: r.player, enemy: r.enemy, treasure: r.treasure, sky: r.sky, speed, lives: Math.round(lives), winAt: Math.round(winAt) };
  if (typeof r.fits === 'boolean') out.fits = r.fits;
  return out;
}

const RECIPE_PROMPT = `You turn a child's game idea into a short JSON recipe for a small game engine. Reply with ONLY the JSON object, no prose.
Fields:
kind: the one that fits best:
  "catch" (things fall, you catch the good ones), "dodge" (things come at you, avoid them, collect treasure),
  "shooter" (you at the bottom shoot things coming down), "runner" (side-scrolling, jump over things),
  "flyer" (tap to flap through gaps, like a bird), "racer" (three lanes, swap lanes past traffic),
  "maze" (move through a maze collecting things, avoid what roams), "pop" (things pop up, tap the good ones),
  "pet" (look after a pet: feed it and play with it).
fits: true if one of those kinds really is the game the child described, false if none of them is (for example a board game or a story).
title: 2 to 4 words, fun, in the child's language.
player: ONE emoji for who the child is. enemy: ONE emoji for the bad thing. treasure: ONE emoji for the good thing.
Use the child's own things: if they say a samosa, the player is 🥟; if they say forks, the enemy is 🍴. Only invent one when they named none.
sky: one of "space", "night", "ocean", "candy", "day", "sunset".
speed: 1, 2 or 3. lives: 1 to 5. winAt: 5 to 50.
Keep everything kind and age-appropriate for a 10-year-old; no weapons other than the game's "shoot", no gore.`;

module.exports = { KINDS, SKIES, looksLikeGame, recipeFromRules, validRecipe, titleFor, RECIPE_PROMPT };
