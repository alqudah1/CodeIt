import {
  MILESTONES, earnChest, hasPalette, levelChestsBetween, noteChangedBuild,
  openChest, openedRewards, pendingChests, readChests, rewardFor,
} from './chests';

// ── Chests yes, randomness no, gems no ───────────────────────────────────────

function store() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

describe('never random', () => {
  test('the same milestone gives the same reward to every child', () => {
    for (const id of Object.keys(MILESTONES)) {
      expect(rewardFor(id)).toEqual(rewardFor(id));
      expect(rewardFor(id).rewards.length).toBeGreaterThan(0);
    }
    expect(rewardFor('level-4').rewards.map((r) => r.label)).toEqual(['Hacker Outfit']);
    expect(rewardFor('level-2').rewards.map((r) => r.label)).toEqual(['Explorer Outfit', 'Bun Hair', 'Gold Hair']);
  });

  test('a level with nothing to wear gives its title, never nothing and never a surprise', () => {
    expect(rewardFor('level-9').rewards).toEqual([{ kind: 'title', id: 'title-9', label: 'Master' }]);
  });

  test('the source contains no randomness', () => {
    const src = require('fs').readFileSync(`${__dirname}/chests.js`, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(src).not.toMatch(/Math\.random|shuffle|roll|odds|\bgems?\b|purchase|buy/i);
  });
});

describe('no duplicates, and it waits', () => {
  test('a milestone is earned once', () => {
    const s = store();
    expect(earnChest(s, 7, 'first-build')).toBe(true);
    expect(earnChest(s, 7, 'first-build')).toBe(false);
    expect(pendingChests(s, 7)).toEqual(['first-build']);
  });

  test('earned chests wait until opened, oldest first', () => {
    const s = store();
    earnChest(s, 7, 'first-build', 1);
    earnChest(s, 7, 'level-2', 2);
    expect(pendingChests(s, 7)).toEqual(['first-build', 'level-2']);
    expect(openChest(s, 7, 'first-build').rewards[0].label).toBe('First build');
    expect(pendingChests(s, 7)).toEqual(['level-2']);
    expect(openedRewards(s, 7).map((r) => r.label)).toEqual(['First build']);
  });

  test('an unknown chest cannot be earned or opened', () => {
    const s = store();
    expect(earnChest(s, 7, 'mystery-box')).toBe(false);
    expect(openChest(s, 7, 'mystery-box')).toBeNull();
  });

  test('one child\'s chests are not another\'s', () => {
    const s = store();
    earnChest(s, 7, 'first-build');
    expect(pendingChests(s, 8)).toEqual([]);
    expect(readChests(s, 'guest').earned).toEqual([]);
  });
});

describe('what opens one', () => {
  test('the third CHANGED build, not the third build', () => {
    const s = store();
    expect(noteChangedBuild(s, 7, 'p1')).toBe(false);
    expect(noteChangedBuild(s, 7, 'p1')).toBe(false); // same project again is not a second one
    expect(noteChangedBuild(s, 7, 'p2')).toBe(false);
    expect(noteChangedBuild(s, 7, 'p3')).toBe(true);
    expect(pendingChests(s, 7)).toEqual(['third-changed-build']);
    expect(hasPalette(s, 7, 'sunset')).toBe(false);
    openChest(s, 7, 'third-changed-build');
    expect(hasPalette(s, 7, 'sunset')).toBe(true);
  });

  test('every level crossed gets a chest', () => {
    expect(levelChestsBetween(150, 550)).toEqual(['level-2', 'level-3']);
    expect(levelChestsBetween(550, 560)).toEqual([]);
  });
});
