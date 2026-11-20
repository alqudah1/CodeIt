'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { looksLikeGame, recipeFromRules, validRecipe, titleFor } = require('./recipeRules');

test('the sentence a child typed in class becomes a shooter in space, without a model', () => {
  const r = recipeFromRules('I want a ship game were you shoot at enemy ships with the button');
  assert.equal(r.kind, 'shooter');
  // Nobody is named before "shoot", so you are our ship; the enemy ships are
  // ships too, but not the same picture as you.
  assert.equal(r.player, 'ship');
  assert.equal(r.enemy, '🛸');
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

test('titles come from the child\'s own words', () => {
  assert.equal(titleFor('make me a zombie game with lasers'), 'Zombie Game');
  assert.equal(titleFor('a cat that catches pizza'), 'Cat Catch');
  assert.equal(titleFor('a samosa that has to dodge the fork'), 'Samosa Dodge');
  assert.equal(titleFor('a game where a cat catches falling pizza'), 'Cat Catch', 'never "Game Game"');
});

test('our snack challenge sentences keep their snacks, and say when no kind fits', () => {
  assert.deepEqual(recipeFromRules('a samosa that has to dodge the fork'), { kind: 'dodge', fits: true, title: 'Samosa Dodge', player: '🥟', enemy: '🍴', treasure: 'gem', sky: 'day', speed: 2, lives: 3, winAt: 15 });
  assert.equal(recipeFromRules('pizza that falls from the sky').treasure, '🍕');
  assert.equal(looksLikeGame('pizza that falls from the sky'), true);
  assert.equal(recipeFromRules('popcorn you catch in a bucket').player, '🪣');
  assert.equal(recipeFromRules('a unicorn').fits, false);
  assert.equal(recipeFromRules('a dragon that flies through the clouds').kind, 'flyer');
  for (const t of ['a samosa that has to dodge the fork', 'a maze where a mouse finds cheese', 'a pet puppy you feed']) assert.ok(validRecipe(recipeFromRules(t)), t);
});

test('the rules read what the child said, not a word inside another word', () => {
  assert.equal(recipeFromRules('a dragon that dodges fireballs').kind, 'dodge', 'fireballs are dodged, not shot');
  assert.equal(recipeFromRules('a runner that jumps over bombs and collects coins').kind, 'runner');
  assert.equal(recipeFromRules('an alien that dodges rocks at night').sky, 'night', 'the place they named wins');
  assert.equal(recipeFromRules('catch stars in the park').sky, 'day', 'stars are not a sky');
  assert.equal(recipeFromRules('catch stars on the beach').sky, 'ocean', 'a beach is by the sea');
  assert.equal(recipeFromRules('a ship that shoots asteroids').kind, 'shooter');
  assert.equal(recipeFromRules('a ship that shoots asteroids').sky, 'space');
});

// 28 October 2026, live: "tic tac toe" on /build was "not a game".
test('a game the child names by name is a game; one with its own rules goes to the studio', () => {
  for (const idea of ['tic tac toe', 'connect four against a friend', 'chess', 'hangman with animal words', 'rock paper scissors', 'a memory game', 'snake']) {
    assert.equal(looksLikeGame(idea), true, idea);
    const r = recipeFromRules(idea);
    assert.equal(r.fits, false, `${idea} is none of the nine`);
    assert.equal(r.ownRules, true, `${idea} has its own rules`);
  }
  for (const [idea, kind] of [['flappy bird with a cat', 'flyer'], ['pac man', 'maze'], ['whack a mole', 'pop']]) {
    const r = recipeFromRules(idea);
    assert.equal(r.kind, kind, idea);
    assert.equal(r.fits, true, idea);
    assert.equal(r.ownRules, undefined, idea);
  }
  // A snake in a sentence is a snake, not the game called Snake.
  assert.equal(recipeFromRules('a snake that eats apples').ownRules, undefined);
  assert.equal(recipeFromRules('a bunny that catches carrots').ownRules, undefined);
});

// 20 November 2026: "a cat that catches falling fish" came back as a bunny
// catching carrots. The prompt asks the model to use the child's own things;
// until now nothing checked that it had.
const { keepTheirThings } = require('./recipeRules');
const CAT = 'a cat that catches falling fish';
const bunny = { kind: 'catch', title: 'Bunny Catch', player: '🐰', enemy: '🦊', treasure: '🥕', sky: 'night', speed: 2, lives: 3, winAt: 15 };

test('a model that leaves out the things a child named is overruled, name and all', () => {
  const r = keepTheirThings(bunny, CAT);
  assert.equal(r.player, '🐱');
  assert.equal(r.treasure, '🐟');
  assert.equal(r.enemy, '🦊', 'what the child did not name is still the model\'s to invent');
  assert.equal(r.title, titleFor(CAT));
  // The name put back says the kind of game the model chose, which is the one on the screen.
  const samosa = keepTheirThings(bunny, 'a samosa that has to dodge the fork');
  assert.deepEqual([samosa.player, samosa.enemy, samosa.kind], ['🥟', '🍴', 'catch']);
  assert.match(samosa.title, /Samosa/);
  assert.doesNotMatch(samosa.title, /Dodge/);
  assert.doesNotMatch(r.title, /bunny/i);
  assert.equal(r.sky, 'night');
  assert.deepEqual(validRecipe(r), r, 'and it is still a recipe the engine accepts');
});

test('a model that keeps them is believed, including where it put them and what it called the game', () => {
  const faithful = { ...bunny, title: 'Fishy Feast', player: '🐱', treasure: '🐟', enemy: '🐙' };
  assert.deepEqual(keepTheirThings(faithful, CAT), faithful);
  // Different parts for the same things: the model's reading stands.
  const recast = { ...bunny, title: 'Fish Escape', player: '🐟', enemy: '🐱', treasure: '🪱' };
  assert.deepEqual(keepTheirThings(recast, CAT), recast);
});

test('the same picture with and without the picture mark is the same picture', () => {
  const asteroids = 'a ship that shoots asteroids and they get faster';
  const rules = recipeFromRules(asteroids);
  const bare = rules.enemy.replace(/️/g, '');
  const said = { ...bunny, kind: 'shooter', title: 'Rock Blaster', player: rules.player, enemy: bare, treasure: '💎', sky: 'space' };
  assert.equal(keepTheirThings(said, asteroids).title, 'Rock Blaster');
});

test('a sentence that names nothing leaves the whole cast and the name to the model', () => {
  assert.deepEqual(keepTheirThings(bunny, 'a fun catching game'), bunny);
});

test('an invented part never shows the same picture as a named one', () => {
  const r = keepTheirThings({ ...bunny, player: '🐰', enemy: '🐟', treasure: '🥕' }, CAT);
  assert.equal(new Set([r.player, r.enemy, r.treasure]).size, 3);
  assert.equal(r.player, '🐱');
  assert.equal(r.treasure, '🐟');
});
