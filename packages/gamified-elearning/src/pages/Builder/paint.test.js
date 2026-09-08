import { STARTER_PROJECTS as STARTER_GAMES } from './starterProjects';
import { readSettings } from './gameSettings';
import { STARTER_PAINT, colourSettings, describePaint, paintCode, paintPlan } from './paint';

// ── Message 77: a palette has to change something the child can see ──────────
//
// The old mechanism injected `:root { --primary: … }`. Not one starter reads a
// CSS variable, so on every starter a palette repainted nothing. Now a palette
// rewrites the starter's own colour settings, which is the code the child can
// read, and the game repaints from them.

const CANDY = { '--primary': '#EC4899', '--accent': '#A855F7', '--success': '#10B981', '--bg': '#FFF0F6', '--text': '#38291F' };
const OCEAN = { '--primary': '#0EA5E9', '--accent': '#06B6D4', '--success': '#22C55E', '--bg': '#E8F4FD' };

const byId = Object.fromEntries(STARTER_GAMES.map((g) => [g.id, g]));

// STARTER_GAMES here is every starter: 11 games, 5 quizzes, 5 shops.
test('every starter is in the paint map, and every mapped name is a colour setting it really declares', () => {
  expect(Object.keys(STARTER_PAINT).sort()).toEqual(STARTER_GAMES.map((g) => g.id).sort());
  for (const [id, map] of Object.entries(STARTER_PAINT)) {
    const declared = colourSettings(byId[id].code).map((s) => s.name);
    for (const name of Object.keys(map)) expect(declared).toContain(name);
    expect(Object.values(map)).toContain('--primary');
  }
});

test('every mapped colour is used to draw, not only declared', () => {
  for (const [id, map] of Object.entries(STARTER_PAINT)) {
    const body = byId[id].code;
    for (const name of Object.keys(map)) {
      const uses = body.split(new RegExp(`\\b${name}\\b`)).length - 1;
      expect({ id, name, uses }).toEqual({ id, name, uses: expect.any(Number) });
      expect(uses).toBeGreaterThanOrEqual(2);
      // Read somewhere that paints: a fillStyle, a style property, or handed
      // to a drawing helper. Never only declared.
      expect(body).toMatch(new RegExp(`(fillStyle|strokeStyle|\\.background|\\.color)\\s*=\\s*[^;]*\\b${name}\\b|\\w+\\([^)]*\\b${name}\\b`));
    }
  }
});

test('on every starter, Candy rewrites the primary setting in the code itself', () => {
  for (const game of STARTER_GAMES) {
    const { code, changes } = paintCode(game.code, CANDY);
    const primary = changes.find((c) => c.role === '--primary');
    expect({ id: game.id, primary: !!primary }).toEqual({ id: game.id, primary: true });
    expect(code).toMatch(new RegExp(`^[ \\t]*let[ \\t]+${primary.name}[ \\t]*=[ \\t]*'#EC4899';`, 'm'));
    expect(code).not.toContain('codeit-color-override');
    expect(primary.line).toBeGreaterThan(1);
    expect(code.split('\n')[primary.line - 1]).toContain(primary.name);
    // The rest of the game is untouched.
    expect(code.length - game.code.length).toBeLessThanOrEqual(2 * changes.length);
  }
});

test('the snake and the maze take two colours: primary and accent', () => {
  const snake = paintPlan(byId.snake.code, OCEAN);
  expect(snake.map((c) => [c.name, c.to])).toEqual([['snakeColour', '#0EA5E9'], ['appleColour', '#06B6D4']]);
  const maze = paintPlan(byId.maze.code, OCEAN);
  expect(maze.map((c) => [c.name, c.to])).toEqual([['playerColour', '#06B6D4'], ['wallColour', '#0EA5E9']]);
});

test('a palette the game already wears changes nothing, and says so', () => {
  const orange = { '--primary': '#FF7A00', '--accent': '#A855F7' };
  const { code, changes } = paintCode(byId.dodge.code, orange); // shipColour starts orange
  expect(changes).toEqual([]);
  expect(code).toBe(byId.dodge.code);
  expect(describePaint([], 'CodeIt')).toBe('');
});

test('a project that is not a starter but has colour settings takes them in declaration order', () => {
  const html = `<!doctype html><html><body><canvas></canvas><script>
// ── Change these and watch what happens ──
let speed = 4;
let heroColour = '#111111';
let foeColour = '#222222';

let score = 0;
function draw(pen) { pen.fillStyle = heroColour; pen.fillRect(0,0,1,1); pen.fillStyle = foeColour; }
draw({});
<\/script></body></html>`;
  const plan = paintPlan(html, OCEAN);
  expect(plan.map((c) => [c.name, c.role, c.to])).toEqual([
    ['heroColour', '--primary', '#0EA5E9'],
    ['foeColour', '--accent', '#06B6D4'],
  ]);
  expect(plan[0].line).toBe(4);
});

test('a project with no colour settings is left for the :root route', () => {
  const html = '<!doctype html><html><head><style>:root{--primary:#FF7A00}</style></head><body><script>let n = 3;<\/script></body></html>';
  expect(paintPlan(html, CANDY)).toEqual([]);
  expect(paintCode(html, CANDY).code).toBe(html);
});

test('what the child is told names the setting, the colour and the line', () => {
  const changes = paintPlan(byId['catch-stars'].code, CANDY);
  const said = describePaint(changes, 'Candy');
  expect(said).toMatch(/^Candy: starColour is now #EC4899 \(line \d+\)\. Your project reloaded so you can see it\.$/);
  const line = Number(said.match(/line (\d+)/)[1]);
  expect(byId['catch-stars'].code.split('\n')[line - 1]).toMatch(/let starColour/);
});

test('the Controls panel still reads the same settings after a palette', () => {
  const before = readSettings(byId['catch-stars'].code).map((s) => s.name);
  const after = readSettings(paintCode(byId['catch-stars'].code, CANDY).code).map((s) => s.name);
  expect(after).toEqual(before);
});
