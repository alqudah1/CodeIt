// ── Player Progression — single source of truth for the whole app ────────────
// LEVELS defines the non-linear XP thresholds. Used by Avatar Lab, MainPage,
// Journey Map, and the unlock system. Do not duplicate in other files.
//
// Items with no ITEM_UNLOCKS entry are always available (treated as level 1).
// Only outfits, accents, hair styles, and hair colors are gated.
// Skin tones, expressions, and gender are always available.

export const LEVELS = [
  { level: 1,  min: 0,    title: 'Beginner'  },
  { level: 2,  min: 200,  title: 'Explorer'  },
  { level: 3,  min: 500,  title: 'Coder'     },
  { level: 4,  min: 900,  title: 'Builder'   },
  { level: 5,  min: 1400, title: 'Developer' },
  { level: 6,  min: 2000, title: 'Hacker'    },
  { level: 7,  min: 2800, title: 'Engineer'  },
  { level: 8,  min: 3800, title: 'Architect' },
  { level: 9,  min: 5000, title: 'Master'    },
  { level: 10, min: 6500, title: 'Legend'    },
];

export const ITEM_UNLOCKS = {
  outfit: {
    astronaut: 1,
    explorer:  2,
    hacker:    4,
    artist:    7,
  },
  accent: {
    headphones: 1,
    none:       1,
    glasses:    3,
    cape:       6,
  },
  hairStyle: {
    wave:  1,
    crown: 1,
    bun:   2,
    curls: 3,
    pixie: 5,
  },
  hairColor: {
    mocha:    1,
    midnight: 1,
    copper:   1,
    gold:     2,
    ocean:    3,
    lavender: 5,
  },
};

// Returns the level number for a given total XP
export function getLevel(xp) {
  const safeXp = xp || 0;
  let cur = LEVELS[0];
  for (const l of LEVELS) {
    if (safeXp >= l.min) cur = l;
    else break;
  }
  return cur.level;
}

// Returns the title for a given level number
export function getLevelTitle(level) {
  return LEVELS.find(l => l.level === level)?.title ?? 'Beginner';
}

// XP needed to reach a given level (start of that level band)
export function getXpForLevel(level) {
  return LEVELS.find(l => l.level === level)?.min ?? 0;
}

// Full progress breakdown — used by Avatar Lab, MainPage, and usePlayerProgress.
// Returns: level, title, progress (XP into current level), needed (XP span of
// current level), pct / pctToNext (0-100%), xpToNext, hasNext.
export function getXpProgress(xp) {
  const safeXp  = xp || 0;
  const level   = getLevel(safeXp);
  const cur     = LEVELS.find(l => l.level === level) ?? LEVELS[0];
  const next    = LEVELS.find(l => l.level === level + 1) ?? null;
  const start   = cur.min;
  const end     = next ? next.min : cur.min + 1000; // sentinel for max level
  const progress = safeXp - start;
  const needed  = end - start;
  const pct     = Math.min(100, Math.round((progress / needed) * 100));
  const xpToNext = next ? next.min - safeXp : 0;
  return { level, title: cur.title, progress, needed, pct, pctToNext: pct, xpToNext, hasNext: !!next };
}

// Items newly unlocked when moving from fromLevel → toLevel
export function getNewlyUnlockedItems(fromLevel, toLevel) {
  const items = [];
  for (const [category, values] of Object.entries(ITEM_UNLOCKS)) {
    for (const [value, lvl] of Object.entries(values)) {
      if (lvl > fromLevel && lvl <= toLevel) {
        items.push({ category, value });
      }
    }
  }
  return items;
}

// Friendly display names for unlock items (used in hints / completion screens)
export const ITEM_DISPLAY_NAMES = {
  outfit:    { astronaut: 'Astronaut Outfit', explorer: 'Explorer Outfit', hacker: 'Hacker Outfit', artist: 'Artist Outfit' },
  accent:    { headphones: 'Headphones', glasses: 'Glasses', cape: 'Cape' },
  hairStyle: { wave: 'Wave Hair', crown: 'Crown Hair', bun: 'Bun Hair', curls: 'Curly Hair', pixie: 'Pixie Hair' },
  hairColor: { gold: 'Gold Hair', ocean: 'Blue Hair', lavender: 'Purple Hair' },
};

// Returns the next item unlocking above `level`, or null if all unlocked.
// Picks the item with the lowest unlock level above the current level.
export function getNextUnlock(level) {
  let best = null;
  for (const [category, values] of Object.entries(ITEM_UNLOCKS)) {
    for (const [value, lvl] of Object.entries(values)) {
      if (lvl > (level || 1) && (!best || lvl < best.atLevel)) {
        best = { category, value, atLevel: lvl };
      }
    }
  }
  return best; // { category, value, atLevel } or null
}

// Human-readable label for a next unlock item: "Gold Hair", "Explorer Outfit", etc.
export function getNextUnlockLabel(nextUnlock) {
  if (!nextUnlock) return null;
  return ITEM_DISPLAY_NAMES[nextUnlock.category]?.[nextUnlock.value] ?? nextUnlock.value;
}

// Is this item available at the given level?
export function isUnlocked(category, value, level) {
  const threshold = ITEM_UNLOCKS[category]?.[value];
  if (threshold === undefined) return true; // not in config = always unlocked
  return (level || 1) >= threshold;
}

// What level does this item unlock at? Returns 1 if always available.
export function unlockAt(category, value) {
  return ITEM_UNLOCKS[category]?.[value] ?? 1;
}
