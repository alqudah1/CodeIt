// ── Chests: a reveal, not a lottery ──────────────────────────────────────────
//
// ITEM_UNLOCKS gates fourteen avatar items by level, and until now every one
// of them arrived silently: a child crossed a threshold and the curls hair
// style quietly became selectable. Nobody noticed, so a system we had built
// did no work. A chest turns that invisible state change into a moment.
//
// Three rules, and they are the whole design:
//
//   NEVER RANDOM.      Same milestone, same reward, every child. A chest whose
//                      contents are unknown until it opens is a loot box, and
//                      "randomised rewards for kids" is the phrase a journalist
//                      would use about us. Our own parent guide says other
//                      products dress engagement up as learning; we do not get
//                      to publish that and ship a slot machine.
//   NEVER PURCHASABLE. No gems, no keys, no timers money skips. XP is the one
//                      currency and it is not for sale.
//   OPENABLE LATER.    A chest that arrives mid-build waits. It never
//                      interrupts work.
//
// And no duplicates: a child never opens a chest and gets something they have.
//
// Contents cost nothing and mean something: the avatar item a level unlocked,
// a badge on the profile, an extra colour palette in the studio.

import { LEVELS, getNewlyUnlockedItems, ITEM_DISPLAY_NAMES, getLevelTitle } from '../data/unlocks';

const KEY_PREFIX = 'codeit_chests:';

// Fixed contents. Same milestone, same reward, every child.
export const MILESTONES = Object.freeze({
  'first-build': {
    title: 'Your first build',
    why: 'You made something that runs.',
    reward: { kind: 'badge', id: 'first-build', label: 'First build' },
  },
  'lesson-1': {
    title: 'Lesson 1 finished',
    why: 'You wrote a line of Python and Python answered.',
    reward: { kind: 'badge', id: 'hello-world', label: 'Hello, World' },
  },
  'third-changed-build': {
    title: 'Three projects, changed',
    why: 'Three things you built, and you changed every one of them.',
    reward: { kind: 'palette', id: 'sunset', label: 'The Sunset palette, in the Colours tool' },
  },
  'first-publish': {
    title: 'Published',
    why: 'Something you made is on the internet, with a link.',
    reward: { kind: 'badge', id: 'published', label: 'Published' },
  },
});

export const PALETTE_UNLOCKS = Object.freeze({
  sunset: 'third-changed-build',
});

function key(who) {
  return `${KEY_PREFIX}${who || 'guest'}`;
}

function empty() {
  return { earned: [], opened: [], changedBuilds: [] };
}

export function readChests(storage, who) {
  try {
    const raw = storage.getItem(key(who));
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      opened: Array.isArray(parsed.opened) ? parsed.opened : [],
      changedBuilds: Array.isArray(parsed.changedBuilds) ? parsed.changedBuilds : [],
    };
  } catch {
    return empty();
  }
}

function write(storage, who, state) {
  try { storage.setItem(key(who), JSON.stringify(state)); } catch { /* private mode */ }
  return state;
}

export function isLevelChest(id) {
  return /^level-\d+$/.test(String(id));
}

/** The fixed contents of a chest. Level chests carry what that level unlocked. */
export function rewardFor(id) {
  if (isLevelChest(id)) {
    const level = Number(id.slice('level-'.length));
    const items = getNewlyUnlockedItems(level - 1, level)
      .map((item) => ({
        kind: 'avatar',
        category: item.category,
        value: item.value,
        label: ITEM_DISPLAY_NAMES[item.category]?.[item.value] || item.value,
      }));
    return {
      title: `Level ${level}: ${getLevelTitle(level)}`,
      why: items.length
        ? 'This was locked in the Avatar Lab. It is yours now.'
        : 'Nothing new to wear this level. The title is yours.',
      rewards: items.length ? items : [{ kind: 'title', id: `title-${level}`, label: getLevelTitle(level) }],
    };
  }
  const milestone = MILESTONES[id];
  if (!milestone) return null;
  return { title: milestone.title, why: milestone.why, rewards: [milestone.reward] };
}

/**
 * Record that a milestone happened. Idempotent: the same chest is never
 * earned twice, so a child never gets something they already have.
 * Returns true only the first time.
 */
export function earnChest(storage, who, id, at = Date.now()) {
  if (!rewardFor(id)) return false;
  const state = readChests(storage, who);
  if (state.earned.some((c) => c.id === id)) return false;
  state.earned.push({ id, at });
  write(storage, who, state);
  return true;
}

/** Chests earned and not yet opened, oldest first. They wait. */
export function pendingChests(storage, who) {
  const state = readChests(storage, who);
  const opened = new Set(state.opened);
  return state.earned.filter((c) => !opened.has(c.id)).map((c) => c.id);
}

export function openChest(storage, who, id) {
  const state = readChests(storage, who);
  if (!state.earned.some((c) => c.id === id)) return null;
  if (!state.opened.includes(id)) {
    state.opened.push(id);
    write(storage, who, state);
  }
  return rewardFor(id);
}

/** Every reward this child has opened. Badges for the profile, palettes for the studio. */
export function openedRewards(storage, who) {
  const state = readChests(storage, who);
  return state.opened.flatMap((id) => (rewardFor(id)?.rewards || []));
}

export function hasPalette(storage, who, paletteId) {
  const milestone = PALETTE_UNLOCKS[paletteId];
  if (!milestone) return true; // not gated
  return readChests(storage, who).opened.includes(milestone);
}

/**
 * A build the child actually changed, not one they generated. Three untouched
 * builds is three prompts typed. The third CHANGED one earns the chest.
 */
export function noteChangedBuild(storage, who, projectKey, at = Date.now()) {
  if (!projectKey) return false;
  const state = readChests(storage, who);
  if (!state.changedBuilds.includes(projectKey)) {
    state.changedBuilds.push(projectKey);
    write(storage, who, state);
  }
  if (state.changedBuilds.length >= 3) return earnChest(storage, who, 'third-changed-build', at);
  return false;
}

/** Levels crossed between two XP totals, as chest ids. */
export function levelChestsBetween(beforeXp, afterXp) {
  return LEVELS
    .filter((l) => l.min > (beforeXp || 0) && l.min <= (afterXp || 0))
    .map((l) => `level-${l.level}`);
}

// ── Wiring ───────────────────────────────────────────────────────────────────

/** The child this browser is signed in as, or 'guest'. */
export function whoAmI() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'guest';
    const user = JSON.parse(raw);
    return user?.user_id || user?.id || 'guest';
  } catch {
    return 'guest';
  }
}

export const CHEST_EVENT = 'codeit:chests';

/** Earn a chest for the signed-in child (or guest) and tell the tray. */
export function awardChest(id) {
  if (typeof window === 'undefined') return false;
  const fresh = earnChest(window.localStorage, whoAmI(), id);
  if (fresh) window.dispatchEvent(new Event(CHEST_EVENT));
  return fresh;
}

/** Same, for a changed build. */
export function recordChangedBuild(projectKey) {
  if (typeof window === 'undefined') return false;
  const fresh = noteChangedBuild(window.localStorage, whoAmI(), projectKey);
  if (fresh) window.dispatchEvent(new Event(CHEST_EVENT));
  return fresh;
}
