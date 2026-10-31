import { LEVELS as UNLOCKS, getLevel, getLevelTitle } from '../../data/unlocks';
import { LEVELS, levelFor } from './today';

// ── One level, everywhere ───────────────────────────────────────────────────
//
// Home and Me read their level from GET /api/today (codeit-backend/today.js)
// and, before it answers, from ./today. The header menu, avatar unlocks,
// lessons and puzzles read data/unlocks.js. Until 31 October 2026 these were
// two tables: a child with 150 XP was "Level 2, Tinkerer" on Home and
// "Level 1" in the header. This pins all three to one.

const backend = require('../../../../codeit-backend/today');

test('the page table is the unlocks table', () => {
  expect(LEVELS).toEqual(UNLOCKS.map((l) => ({ n: l.level, at: l.min, title: l.title })));
});

test('the server table is the same table', () => {
  expect(backend.LEVELS.map((l) => ({ ...l }))).toEqual(LEVELS);
});

test('any XP gives the same level and title on every side', () => {
  for (const xp of [0, 1, 150, 199, 200, 420, 899, 900, 5000, 6499, 6500, 99999]) {
    const page = levelFor(xp);
    const server = backend.levelFor(xp);
    expect(server).toEqual(page);
    expect(page.n).toBe(getLevel(xp));
    expect(page.title).toBe(getLevelTitle(getLevel(xp)));
  }
});
