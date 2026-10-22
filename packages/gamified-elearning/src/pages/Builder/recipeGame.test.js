import { recipeGame, recipePowers, recipeSettings, POWER_DEFAULTS, RECIPE_KINDS, RECIPE_TWISTS } from './recipeGame';

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

// ── The powers block ─────────────────────────────────────────────────────────
//
// Six lines after the settings, one per power learned on /powers. A fresh
// game has them all off, so nothing changes for a child who has not learned
// them; a power page turns one on in the child's own game, and the engine
// honours every one of them.
test('every game carries the six power lines, off by default, and the engine reads each one', () => {
  const html = recipeGame(SHIP);
  const powers = recipePowers({});
  expect(html).toContain('// ── Powers: each line wakes up when you learn it ──\n' + powers);
  expect(powers.split('\n')).toHaveLength(6);
  expect(powers).toContain('let waveSize     = 1;');
  expect(powers).toContain('let pointsPer    = 1;');
  expect(powers).toContain('let speedUpEvery = 0;');
  expect(powers).toContain('let soundOn      = false;');
  expect(powers).toContain('let levelEvery   = 0;');
  expect(powers).toContain('let bossAt       = 0;');
  for (const key of Object.keys(POWER_DEFAULTS)) expect(html).toMatch(new RegExp(`\\b${key}\\b[^\\n]*\\n[\\s\\S]*\\b${key}\\b`)); // declared, then used
  expect(html).toContain('function blip(good)');
  expect(html).toContain('function scorePoints()');
  expect(html).toContain('boss: true, hp: 3');
});

test('power values are bounded and the on values come through', () => {
  const on = recipePowers({ waveSize: 99, pointsPer: 3, speedUpEvery: 10, soundOn: 'true', levelEvery: 5, bossAt: 12 });
  expect(on).toContain('let waveSize     = 6;');
  expect(on).toContain('let pointsPer    = 3;');
  expect(on).toContain('let speedUpEvery = 10;');
  expect(on).toContain('let soundOn      = true;');
  expect(on).toContain('let levelEvery   = 5;');
  expect(on).toContain('let bossAt       = 12;');
  expect(recipePowers({ waveSize: 0, pointsPer: -4 })).toContain('let waveSize     = 1;');
  expect(recipePowers({ waveSize: 0, pointsPer: -4 })).toContain('let pointsPer    = 1;');
});
