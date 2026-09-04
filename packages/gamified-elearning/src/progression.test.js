import fs from 'fs';
import path from 'path';
import { getLevel, getLevelTitle } from './data/unlocks';

// ── One level system, and only the honest pop-up ─────────────────────────────
//
// data/unlocks.js opens with "single source of truth for the whole app. Do
// not duplicate in other files." Two files duplicated it anyway: the header
// and the profile each kept `XP_PER_LEVEL = 100` and a flat formula. At 500 XP
// the header said Level 6; the unlock system said Level 3, Coder; and the
// Avatar Lab refused the level-4 outfit to a child who had just been told
// they were level 6.
//
// The other half: rewards. Our own parent guide argues in public that lessons
// completed and levels cleared are attendance records. A product that pays XP
// for streaks and daily logins is the product that page criticises. So XP is
// paid most for explaining a line of your own code, and exactly one pop-up
// rewards anything: the level-up, because something genuinely changed.

const SRC = __dirname;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(full, out); }
    else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\.js$/.test(entry.name)) out.push(full);
  }
  return out;
}
const FILES = walk(SRC);
const read = (f) => fs.readFileSync(f, 'utf8');
const rel = (f) => path.relative(SRC, f);

describe('one level system', () => {
  test('XP_PER_LEVEL does not exist anywhere in the app', () => {
    const offenders = FILES.filter((f) => /XP_PER_LEVEL/.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });

  test('no file computes a level with its own arithmetic', () => {
    const offenders = FILES.filter((f) => /Math\.floor\([^)]*totalXP[^)]*\/\s*\d+\)\s*\+\s*1/.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });

  test('500 XP is level 3, Coder, everywhere', () => {
    expect(getLevel(500)).toBe(3);
    expect(getLevelTitle(3)).toBe('Coder');
    for (const f of ['pages/Header/Header.js', 'pages/Profile/Profile.js']) {
      expect(read(path.join(SRC, f))).toMatch(/getXpProgress/);
    }
  });

  test('the profile keeps no private list of level titles', () => {
    expect(read(path.join(SRC, 'pages/Profile/Profile.js'))).not.toMatch(/LEVEL_TITLES/);
  });
});

describe('the rewards say what we value', () => {
  test('the profile tells the truth about what pays, and the biggest number is understanding', () => {
    const profile = read(path.join(SRC, 'pages/Profile/Profile.js'));
    expect(profile).toMatch(/Explain a line of your own code, first try[\s\S]*?\+50 XP/);
    const amounts = [...profile.matchAll(/xp: '\+(\d+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...amounts)).toBe(50);
  });

  test('nothing nags about streaks or daily logins', () => {
    const nag = /keep your streak|start your streak|day streak|daily login reward|you have not been here|come back tomorrow/i;
    const offenders = FILES.filter((f) => {
      const src = read(f).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      return nag.test(src);
    }).map(rel);
    expect(offenders).toEqual([]);
  });

  test('the chest is the one reward pop-up, mounted once, and it never opens itself', () => {
    const app = read(path.join(SRC, 'App.js'));
    expect((app.match(/<ChestTray \/>/g) || []).length).toBe(1);
    expect(app).not.toMatch(/<LevelUp/);
    const tray = read(path.join(SRC, 'components/Chest/ChestTray.js'));
    // It waits in the corner until tapped, and the button after it goes to
    // where the reward lives.
    expect(tray).toMatch(/A chest is waiting/);
    expect(tray).toMatch(/navigate\('\/character'\)/);
    // Crossing a level earns a chest wherever XP arrives.
    const ctx = read(path.join(SRC, 'context/CharacterContext.js'));
    expect(ctx).toMatch(/levelChestsBetween\(before, after\)/);
    expect(ctx).toMatch(/awardChest\(chest\)/);
  });

  test('every place XP arrives tells the context, so a level-up can fire anywhere', () => {
    for (const f of [
      'pages/Builder/Builder.js',
      'components/InteractiveLessonTemplate/InteractiveLessonTemplate.js',
      'pages/Quizzes/Quiz.js',
      'pages/Journey/JourneyPuzzle.js',
    ]) {
      expect(read(path.join(SRC, f))).toMatch(/awardXP\(/);
    }
  });
});
