import { keepNamed, localRecipe, normaliseRecipe, looksLikeGame, keepTheirWord, titleFor, rollIdea, nameFor, IDEAS } from './recipeLocal';

test('a classroom sentence becomes a shooter in space with a ship, without a server', () => {
  const r = localRecipe('I want a ship game where you shoot at enemy ships with the button');
  expect(r.kind).toBe('shooter');
  expect(r.player).toBe('ship');
  // "Enemy ships" are ships, but not the same picture as you are.
  expect(r.enemy).toBe('🛸');
  expect(r.sky).toBe('space');
  expect(r.title).toBe('Ship Game');
  expect(r.lives).toBe(3);
});

test('words set the sky, the speed, the lives, the goal and the twist', () => {
  const r = localRecipe('a bunny that catches carrots at night, fast, one life, win at 30, and it gets faster');
  expect(r).toMatchObject({ kind: 'catch', player: '🐰', treasure: 'carrot', sky: 'night', speed: 3, lives: 1, winAt: 30, twist: 'faster' });
  expect(localRecipe('dodge five aliens at once in space').twist).toBe('waves');
});

test('websites, quizzes and tools are not games, and the child\'s word survives the no', () => {
  expect(looksLikeGame('a website about dogs')).toBe(false);
  expect(looksLikeGame('a quiz on planets')).toBe(false);
  expect(looksLikeGame('a dog that catches bones')).toBe(true);
  expect(keepTheirWord('a website about dogs')).toBe('dog');
  expect(keepTheirWord('something')).toBe('dragon');
});

test('whatever the server says is kept as the child said it, with sane numbers', () => {
  // Generic pictures become our drawn sprites; particular ones stay themselves.
  const r = normaliseRecipe({ kind: 'shooter', title: 'Ship Game', player: '🚀', enemy: '👾', treasure: '💎', sky: 'space', speed: 9, lives: 2, winAt: 1000 }, 'a ship game');
  expect(r).toMatchObject({ kind: 'shooter', player: 'ship', enemy: 'alien', treasure: 'gem', sky: 'space', speed: 3, lives: 3, winAt: 99, twist: 'none' });
  expect(normaliseRecipe({ kind: 'dodge', title: 'Samosa Dodge', player: '🥟', enemy: '🍴', treasure: '💎', sky: 'day' }, 'a samosa that has to dodge the fork')).toMatchObject({ player: '🥟', enemy: '🍴' });
  expect(normaliseRecipe(null, 'a bunny that catches carrots').player).toBe('🐰');
  // The new kinds come through, and a server title of "Game Game" never does.
  expect(normaliseRecipe({ kind: 'flyer', title: 'Game Game' }, 'a dragon that flies through the clouds')).toMatchObject({ kind: 'flyer', title: 'Dragon Flight', player: '🐉', enemy: '☁️' });
});

// 20 November 2026: "a cat that catches falling fish" came back as a bunny
// catching carrots, under the line "You are the 🐰 cat. Catch the 🥕 fish".
describe('the things a child names are the things in the game', () => {
  const CAT = 'a cat that catches falling fish';
  const bunny = { kind: 'catch', title: 'Bunny Catch', player: '🐰', enemy: '🦊', treasure: '🥕', sky: 'night', speed: 2, lives: 3, winAt: 15 };

  test('a model that leaves them out is overruled, and its name for the game goes with it', () => {
    const r = normaliseRecipe(bunny, CAT);
    expect(r).toMatchObject({ player: '🐱', treasure: '🐟', title: localRecipe(CAT).title });
    expect(r.title).not.toMatch(/bunny/i);
    expect(r.words).toMatchObject({ player: 'cat', treasure: 'fish' });
    // What the child did not name is still the model's to invent.
    expect(r.enemy).toBe('🦊');
    expect(r.words.enemy).toBeNull();
    expect(r.sky).toBe('night');
  });

  test('a model that keeps them is believed, name and all', () => {
    const r = normaliseRecipe({ ...bunny, title: 'Fishy Feast', player: '🐱', treasure: '🐟', enemy: '🐙' }, CAT);
    expect(r).toMatchObject({ player: '🐱', treasure: '🐟', enemy: '🐙', title: 'Fishy Feast' });
    expect(r.words).toMatchObject({ player: 'cat', treasure: 'fish', enemy: null });
  });

  test('a model may give the named things different parts, and each word moves with its picture', () => {
    const swapped = keepNamed({ player: '🐟', enemy: '🦈', treasure: '🐱' }, { ...localRecipe(CAT) });
    expect(swapped).toMatchObject({ player: '🐟', treasure: '🐱', enemy: '🦈', kept: true });
    expect(swapped.words).toEqual({ player: 'fish', enemy: null, treasure: 'cat' });
    expect(swapped.named).toEqual({ player: true, enemy: false, treasure: true });
  });

  test('one named thing kept and one dropped: both go back where the rules put them', () => {
    // The fish was moved to the player and the cat was dropped.
    const r = keepNamed({ player: '🐟', enemy: '🦊', treasure: '🥕' }, localRecipe(CAT));
    expect(r).toMatchObject({ player: '🐱', treasure: '🐟', enemy: '🦊', kept: false });
    expect(r.words).toEqual({ player: 'cat', enemy: null, treasure: 'fish' });
  });

  test('an invented part never shows the same picture as a named one', () => {
    // The model used the fish as the enemy and dropped the cat.
    const rules = localRecipe(CAT);
    const r = keepNamed({ player: '🐰', enemy: '🐟', treasure: '🥕' }, rules);
    expect(r.player).toBe('🐱');
    expect(r.treasure).toBe('🐟');
    expect(r.enemy).toBe(rules.enemy);
    expect(new Set([r.player, r.enemy, r.treasure]).size).toBe(3);
  });

  test('a sentence that names nothing leaves the whole cast to the model', () => {
    const r = normaliseRecipe(bunny, 'a fun catching game');
    // (A carrot is one of our drawn sprites, so the picture becomes its name.)
    expect(r).toMatchObject({ player: '🐰', enemy: '🦊', treasure: 'carrot', title: 'Bunny Catch' });
    expect(r.words).toEqual({ player: null, enemy: null, treasure: null });
  });

  test('every example sentence on the page survives a model that answers with something else', () => {
    for (const idea of IDEAS) {
      const rules = localRecipe(idea);
      const r = normaliseRecipe({ ...bunny, kind: rules.kind, player: '🦄', enemy: '🧟', treasure: '🍩', title: 'Unicorn Party' }, idea);
      for (const part of ['player', 'enemy', 'treasure']) {
        if (rules.named[part]) expect([idea, part, r[part]]).toEqual([idea, part, rules[part]]);
      }
      if (Object.values(rules.named).some(Boolean)) expect(r.title).toBe(rules.title);
    }
  });
});

test('titles are short and end in Game; names come from the choices', () => {
  expect(titleFor('a bunny that catches carrots at night')).toBe('Bunny Catch');
  expect(titleFor('')).toBe('My Game');
  expect(nameFor({ player: 'ship', kind: 'shooter' })).toBe('Ship Blast');
  expect(nameFor({ player: 'ship', kind: 'shooter' }, () => 0)).toBe('Mega Ship Blast');
  expect(rollIdea(() => 0)).toEqual(['a bunny', 'that catches', 'carrots', 'in space']);
  for (const idea of IDEAS) expect(looksLikeGame(idea)).toBe(true);
});

test('the sentence decides, not a word hiding inside another word', () => {
  // "catches" has "cat" in it; the bunny stays a bunny.
  expect(localRecipe('a robot that catches gems').player).toBe('🤖');
  expect(localRecipe('a bunny that catches carrots').player).toBe('🐰');
  // The player is who the sentence is about; the aliens here are enemies.
  expect(localRecipe('a shooter with five aliens at once')).toMatchObject({ player: 'ship', enemy: '👽' });
  expect(localRecipe('an alien that catches stars')).toMatchObject({ player: '👽', enemy: 'bomb', treasure: 'star' });
  expect(localRecipe('dodge the bombs in space').enemy).toBe('bomb');
  // Jumping wins over collecting.
  expect(localRecipe('a runner that jumps over bombs and collects coins').kind).toBe('runner');
  // A place the child named beats a guess from a word.
  expect(localRecipe('a pink cat that dodges fireballs in candy land').sky).toBe('candy');
  expect(localRecipe('an alien that shoots bombs at night').sky).toBe('night');
  expect(localRecipe('a dragon that dodges fireballs').sky).toBe('sunset');
  // Titles stop before the details and never carry double spaces.
  expect(titleFor('catch coins under the sea, win at 30')).toBe('Coin Catch');
  expect(titleFor('catch stars, not bombs, at sunset')).toBe('Star Catch');
  expect(titleFor('dodge the bombs in space')).toBe('Bomb Dodge');
});

// ── Our own Instagram challenge, 26 October 2026 ────────────────────────────
//
// "Pizza that falls from the sky. A samosa that has to dodge the fork.
// Popcorn you catch in a bucket." On 27 October the first came back as not
// a game and the second as a rocket dodging aliens. These are the examples
// we posted, so they are the first thing a parent will type.
test('the sentences from our own snack challenge become the games we promised', () => {
  expect(localRecipe('pizza that falls from the sky')).toMatchObject({ kind: 'catch', treasure: '🍕', player: '🧺', title: 'Pizza Catch', fits: true });
  expect(localRecipe('a samosa that has to dodge the fork')).toMatchObject({ kind: 'dodge', player: '🥟', enemy: '🍴', title: 'Samosa Dodge' });
  expect(localRecipe('popcorn you catch in a bucket')).toMatchObject({ kind: 'catch', player: '🪣', treasure: '🍿', title: 'Popcorn Catch' });
  expect(localRecipe('a game where a cat catches falling pizza')).toMatchObject({ kind: 'catch', player: '🐱', treasure: '🍕', title: 'Cat Catch' });
  for (const s of ['pizza that falls from the sky', 'a samosa that has to dodge the fork', 'popcorn you catch in a bucket']) expect(looksLikeGame(s)).toBe(true);
});

test('nine kinds of game, chosen by what the child says they do', () => {
  expect(localRecipe('a dragon that flies through the clouds')).toMatchObject({ kind: 'flyer', player: '🐉', enemy: '☁️' });
  expect(localRecipe('a maze where a mouse finds cheese')).toMatchObject({ kind: 'maze', player: '🐭', treasure: '🧀', enemy: '🐱' });
  expect(localRecipe('a race car that passes the trucks')).toMatchObject({ kind: 'racer', enemy: '🚚' });
  expect(localRecipe('pop the balloons but not the bombs')).toMatchObject({ kind: 'pop', treasure: '🎈', enemy: 'bomb' });
  expect(localRecipe('a pet puppy you feed and play with')).toMatchObject({ kind: 'pet', player: '🐶', treasure: '🦴' });
  expect(localRecipe('a frog that catches flies')).toMatchObject({ kind: 'catch', player: '🐸', treasure: '🦟' });
  expect(localRecipe('my brother as a zombie chasing me')).toMatchObject({ kind: 'dodge', enemy: '🧟' });
});

test('when no word says which kind of game, the recipe says so instead of pretending', () => {
  expect(localRecipe('a unicorn').fits).toBe(false);
  expect(localRecipe('a unicorn').player).toBe('🦄');
  expect(localRecipe('a cat that catches pizza').fits).toBe(true);
  // A kind the child picks wins, and the sentence is read again for that kind.
  expect(localRecipe('a unicorn', 'flyer')).toMatchObject({ kind: 'flyer', fits: true, player: '🦄' });
  // Tic tac toe is a game, just none of the nine: it says so, and the page
  // sends it to the studio (round 139; it used to be "not a game").
  expect(looksLikeGame('tic tac toe')).toBe(true);
  expect(localRecipe('tic tac toe')).toMatchObject({ fits: false, ownRules: true });
});
