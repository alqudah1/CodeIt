import { recipeGame, recipeSettings, RECIPE_KINDS, RECIPE_TWISTS } from './recipeGame';

// ── A recipe becomes a game in the shape the studio already understands ──────

const SHIP = { kind: 'shooter', title: 'Ship Game', player: '🚀', enemy: '👾', treasure: '💎', sky: 'space', speed: 2, lives: 3, winAt: 15 };

test('the settings block is plain, readable and first: the first code a child changes', () => {
  const html = recipeGame(SHIP);
  const settings = recipeSettings(SHIP);
  expect(html).toContain('// ── Change these and watch what happens ──\n' + settings);
  expect(settings.split('\n')).toHaveLength(10);
  expect(settings).toContain("let twist      = 'none';");
  expect(settings).toContain("let gameKind   = 'shooter';");
  expect(settings).toContain("let playerLook = '🚀';");
  expect(settings).toContain('let speed      = 2;');
  expect(settings).toContain('let winAt      = 15;');
});

test('it is a whole game page like the starters: HUD, canvas, loop, play again, score, a way to lose', () => {
  const html = recipeGame(SHIP);
  expect(html).toMatch(/<!DOCTYPE html>/);
  expect(html).toMatch(/<\/html>\s*$/);
  expect(html).toContain('id="scoreLabel"');
  expect(html).toContain('<canvas id="screen">');
  expect(html).toContain('requestAnimationFrame(draw)');
  expect(html).toContain('onclick="startGame()"');
  expect(html).toContain('addEventListener');
  expect(html).toContain('lives -= 1');
  expect(html).toContain('endGame(true)');
  expect(html).toContain('<title>Ship Game</title>');
  expect(html.length).toBeGreaterThan(200);
});

test('every kind of game and sky renders, and quotes in a title cannot break the code', () => {
  for (const kind of RECIPE_KINDS) for (const sky of ['space', 'night', 'ocean', 'candy', 'day']) {
    const html = recipeGame({ ...SHIP, kind, sky, title: "Bob's 'Cat' Game" });
    expect(html).toContain(`let gameKind   = '${kind}';`);
    expect(html).toContain("let gameTitle  = 'Bobs Cat Game';");
  }
  expect(RECIPE_KINDS).toEqual(['shooter', 'dodge', 'catch', 'runner']);
});

test('the player can be the child\'s own avatar when the studio provides one', () => {
  expect(recipeGame(SHIP)).toContain('window.CODEIT_PLAYER_SPRITE');
});

test('a twist is one of three words and anything else becomes none', () => {
  expect(RECIPE_TWISTS).toEqual(['none', 'faster', 'waves']);
  expect(recipeSettings({ ...SHIP, twist: 'Waves' })).toContain("let twist      = 'waves';");
  expect(recipeSettings({ ...SHIP, twist: 'banana' })).toContain("let twist      = 'none';");
});

test('the page draws our own sprites, and still understands an emoji in the settings', () => {
  const html = recipeGame(SHIP);
  expect(html).toContain('const SPRITES = {');
  expect(html).toContain('"ship":"data:image/svg+xml');
  expect(html).toContain('"🚀":"ship"');
  expect(html).not.toContain('drawEmoji');
  expect(html).toContain('devicePixelRatio');
});
