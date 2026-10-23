'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { looksLikeGame, recipeFromRules, validRecipe, titleFor } = require('./recipeRules');

test('the sentence a child typed in class becomes a shooter in space, without a model', () => {
  const r = recipeFromRules('I want a ship game were you shoot at enemy ships with the button');
  assert.equal(r.kind, 'shooter');
  assert.equal(r.player, '🚀');
  assert.equal(r.enemy, '👾');
  assert.equal(r.sky, 'space');
  assert.equal(r.title, 'Ship Game');
  assert.deepEqual(validRecipe(r), r);
});

test('each kind of game is reachable from plain words', () => {
  assert.equal(recipeFromRules('dodge the zombies at night').kind, 'dodge');
  assert.equal(recipeFromRules('a cat that catches falling pizza').kind, 'catch');
  assert.equal(recipeFromRules('a unicorn jumping over bombs').kind, 'runner');
  assert.equal(recipeFromRules('dodge the zombies at night').sky, 'night');
  assert.equal(recipeFromRules('a cat that catches falling pizza').player, '🐱');
  assert.equal(recipeFromRules('a shark that eats fish in the ocean, fast').speed, 3);
});

test('not every idea is a game; websites, quizzes and tools take the full build', () => {
  assert.equal(looksLikeGame('a website for my dog walking business'), false);
  assert.equal(looksLikeGame('a quiz about planets'), false);
  assert.equal(looksLikeGame('a calculator'), false);
  assert.equal(looksLikeGame('a game where a frog jumps on lily pads'), true);
  assert.equal(looksLikeGame('shoot the asteroids'), true);
});

test('a model recipe is accepted only when every field is sane', () => {
  const good = { kind: 'catch', title: 'Pizza Cat Game', player: '🐱', enemy: '💣', treasure: '🍕', sky: 'day', speed: 2, lives: 3, winAt: 15 };
  assert.deepEqual(validRecipe(good), good);
  assert.equal(validRecipe({ ...good, kind: 'rpg' }), null);
  assert.equal(validRecipe({ ...good, speed: 9 }), null);
  assert.equal(validRecipe({ ...good, player: '<img onerror=x>' }), null);
  assert.equal(validRecipe({ ...good, title: '' }), null);
  assert.equal(validRecipe({ ...good, title: 'Hi <b>there</b>' }).title, 'Hi bthere/b');
  assert.equal(validRecipe(null), null);
});

test('titles are short, capitalised and end with Game', () => {
  assert.equal(titleFor('make me a zombie game with lasers'), 'Zombie Game');
  assert.equal(titleFor('a cat that catches pizza'), 'Cat Game');
  assert.equal(titleFor('x'), 'My Game');
});

test('the rules read what the child said, not a word inside another word', () => {
  assert.equal(recipeFromRules('a dragon that dodges fireballs').kind, 'dodge', 'fireballs are dodged, not shot');
  assert.equal(recipeFromRules('a runner that jumps over bombs and collects coins').kind, 'runner');
  assert.equal(recipeFromRules('an alien that dodges rocks at night').sky, 'night', 'the place they named wins');
  assert.equal(recipeFromRules('catch stars on the beach').sky, 'day', 'stars are not a sky');
  assert.equal(recipeFromRules('a ship that shoots asteroids').kind, 'shooter');
  assert.equal(recipeFromRules('a ship that shoots asteroids').sky, 'space');
});
