import { closestStarter, kindFromPrompt, words } from './closestStarter';
import { STARTER_PROJECTS } from './starterProjects';

// ── What a child plays while they wait ───────────────────────────────────────
//
// Ten to twenty seconds is a long time at nine years old. Whatever fills it has
// to be real and it has to be close to what they asked for, or it reads as the
// site ignoring them.

test('a space game gets the space game', () => {
  expect(closestStarter('a space game where you dodge asteroids').id).toBe('dodge');
});

test('a snake game gets snake', () => {
  expect(closestStarter('i want a snake game').id).toBe('snake');
});

test('a maze gets the maze', () => {
  expect(closestStarter('a maze game with walls and coins').id).toBe('maze');
});

test('a quiz gets a quiz, not a game', () => {
  expect(closestStarter('a quiz about animals').kind).toBe('quiz');
  expect(closestStarter('a quiz about animals').id).toBe('quiz-animals');
});

test('a shop gets a shop, not a game that mentions score', () => {
  // The failure this guards: a snake game's blurb has "eat" and "longer" and a
  // shop request has none of that, but every game mentions a score. Kind has to
  // outweigh a single shared word.
  expect(closestStarter('a website to sell my cupcakes').kind).toBe('site');
  expect(closestStarter('a website to sell my cupcakes').id).toBe('site-cupcakes');
});

test('football finds the football quiz or a football game', () => {
  const found = closestStarter('a football quiz about the rules');
  expect(found.id).toBe('quiz-football');
});

test('something playable comes back for anything at all', () => {
  for (const prompt of ['', '   ', 'asdfgh', 'something cool', null, undefined, 42]) {
    const found = closestStarter(prompt);
    expect(found).toBeTruthy();
    expect(found.code).toContain('<!doctype html>');
  }
});

test('with no signal it picks a game, because a game explains itself', () => {
  expect(closestStarter('zzzz qqqq').kind).toBe('game');
});

// ── The pieces ───────────────────────────────────────────────────────────────

test('common words are not treated as signal', () => {
  expect(words('I want to make a game for my friend')).toEqual(['game', 'friend']);
});

test('it reads the kind a child is asking for', () => {
  expect(kindFromPrompt(words('a shop selling shoes'))).toBe('site');
  expect(kindFromPrompt(words('ten questions about space'))).toBe('quiz');
  expect(kindFromPrompt(words('a jumping game'))).toBe('game');
  expect(kindFromPrompt(words('something nice'))).toBeNull();
});

// ── Whatever it returns has to actually work ─────────────────────────────────

test('it can only ever return a project that runs', () => {
  // Everything here is opened in a real browser at two sizes on every build by
  // ops/checks/starters-run.js, which is the whole reason to show one of these
  // rather than a separate set of demo templates nothing checks.
  const ids = new Set(STARTER_PROJECTS.map(p => p.id));
  for (const prompt of ['a space game', 'a quiz', 'a shop', 'nonsense', '']) {
    expect(ids.has(closestStarter(prompt).id)).toBe(true);
  }
});
