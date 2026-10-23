import { localRecipe, normaliseRecipe, looksLikeGame, keepTheirWord, titleFor, rollIdea, nameFor, IDEAS } from './recipeLocal';

test('a classroom sentence becomes a shooter in space with a ship, without a server', () => {
  const r = localRecipe('I want a ship game where you shoot at enemy ships with the button');
  expect(r.kind).toBe('shooter');
  expect(r.player).toBe('ship');
  expect(r.sky).toBe('day');
  expect(r.title).toBe('Ship Game');
  expect(r.lives).toBe(3);
});

test('words set the sky, the speed, the lives, the goal and the twist', () => {
  const r = localRecipe('a bunny that catches carrots at night, fast, one life, win at 30, and it gets faster');
  expect(r).toMatchObject({ kind: 'catch', player: 'hero', treasure: 'carrot', sky: 'night', speed: 3, lives: 1, winAt: 30, twist: 'faster' });
  expect(localRecipe('dodge five aliens at once in space').twist).toBe('waves');
});

test('websites, quizzes and tools are not games, and the child\'s word survives the no', () => {
  expect(looksLikeGame('a website about dogs')).toBe(false);
  expect(looksLikeGame('a quiz on planets')).toBe(false);
  expect(looksLikeGame('a dog that catches bones')).toBe(true);
  expect(keepTheirWord('a website about dogs')).toBe('dog');
  expect(keepTheirWord('something')).toBe('dragon');
});

test('whatever the server says is normalised to sprite names and sane numbers', () => {
  const r = normaliseRecipe({ kind: 'shooter', title: 'Ship Game', player: '🚀', enemy: '👾', treasure: '💎', sky: 'space', speed: 9, lives: 2, winAt: 1000 }, 'a ship game');
  expect(r).toMatchObject({ kind: 'shooter', player: 'ship', enemy: 'alien', treasure: 'gem', sky: 'space', speed: 3, lives: 3, winAt: 99, twist: 'none' });
  expect(normaliseRecipe(null, 'a bunny that catches carrots').player).toBe('hero');
});

test('titles are short and end in Game; names come from the choices', () => {
  expect(titleFor('a bunny that catches carrots at night')).toBe('Bunny Game');
  expect(titleFor('')).toBe('My Game');
  expect(nameFor({ player: 'ship', kind: 'shooter' })).toBe('Ship Blast');
  expect(nameFor({ player: 'ship', kind: 'shooter' }, () => 0)).toBe('Mega Ship Blast');
  expect(rollIdea(() => 0)).toEqual(['a bunny', 'that catches', 'carrots', 'in space']);
  for (const idea of IDEAS) expect(looksLikeGame(idea)).toBe(true);
});

test('the sentence decides, not a word hiding inside another word', () => {
  // "catches" has "cat" in it; the bunny stays a bunny.
  expect(localRecipe('a robot that catches gems').player).toBe('blob');
  expect(localRecipe('a bunny that catches carrots').player).toBe('hero');
  // The player is who the sentence is about; the aliens here are enemies.
  expect(localRecipe('a shooter with five aliens at once')).toMatchObject({ player: 'ship', enemy: 'alien' });
  expect(localRecipe('an alien that catches stars')).toMatchObject({ player: 'alien', enemy: 'bomb' });
  expect(localRecipe('dodge the bombs in space').enemy).toBe('bomb');
  // Jumping wins over collecting.
  expect(localRecipe('a runner that jumps over bombs and collects coins').kind).toBe('runner');
  // A place the child named beats a guess from a word.
  expect(localRecipe('a pink cat that dodges fireballs in candy land').sky).toBe('candy');
  expect(localRecipe('an alien that shoots bombs at night').sky).toBe('night');
  expect(localRecipe('a dragon that dodges fireballs').sky).toBe('sunset');
  // Titles stop before the details and never carry double spaces.
  expect(titleFor('catch coins under the sea, win at 30')).toBe('Catch Coins Game');
  expect(titleFor('catch stars, not bombs, at sunset')).toBe('Catch Stars Game');
  expect(titleFor('dodge the bombs in space')).toBe('Dodge Bombs Game');
});
