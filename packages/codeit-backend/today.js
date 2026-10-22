'use strict';

// ── Today: the streak, the quest, the level ─────────────────────────────────
//
// The Home screen asks one question, "what do I do today", and answers it
// with three numbers that are all derived, none stored. The streak is read
// from the days a child made something (ai_projects.created_at), so there is
// no streak column to drift and no cron to forget. The quest of the day is a
// sentence picked by the date, the same for everyone in a class so a teacher
// can put it on the board. The level is a cut of total XP, which already has
// one definition (xpTotals.js).
//
// What a streak is: a run of days, ending today or yesterday, on which the
// child made or published something. Weekends never break it: Friday to
// Monday counts as consecutive, and a game made on a Saturday still counts.
// No XP is paid for the streak itself, in keeping with xpTotals.js: nothing
// is paid for showing up, only for making.

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD in UTC. All streak arithmetic happens on these keys. */
function dayKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function addDays(key, n) {
  return dayKey(new Date(`${key}T00:00:00Z`).getTime() + n * DAY_MS);
}

function isWeekend(key) {
  const day = new Date(`${key}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/** The previous day that can break a streak: skips Saturday and Sunday. */
function previousWorkingDay(key) {
  let k = addDays(key, -1);
  while (isWeekend(k)) k = addDays(k, -1);
  return k;
}

/**
 * The streak, from the dates a child made things.
 *
 * @param {Array<string|number|Date>} madeOn  timestamps of projects created
 * @param {Date|number|string} now
 * @returns {{ streak: number, builtToday: boolean, lastDay: string|null }}
 */
function streakFrom(madeOn, now = Date.now()) {
  const days = new Set((madeOn || []).map(dayKey).filter(Boolean));
  const today = dayKey(now);
  const builtToday = days.has(today);
  // A streak that was alive yesterday is still alive today until midnight.
  let cursor = builtToday ? today : addDays(today, -1);
  let streak = 0;
  let lastDay = null;
  for (;;) {
    if (days.has(cursor)) { streak += 1; lastDay = lastDay || cursor; cursor = addDays(cursor, -1); continue; }
    // An empty Saturday or Sunday is skipped, never counted against the child.
    if (isWeekend(cursor)) { cursor = addDays(cursor, -1); continue; }
    break;
  }
  return { streak, builtToday, lastDay };
}

/** The quest bank. Shown on Home as the sentence; typed into Build as the prompt. */
const QUESTS = Object.freeze([
  { text: 'Shoot the asteroids.', prompt: 'a ship that shoots asteroids and they get faster' },
  { text: 'Catch carrots at night.', prompt: 'a bunny that catches carrots at night and bombs fall' },
  { text: 'Dodge the spikes in space.', prompt: 'dodge spike balls in space, three lives' },
  { text: 'Run and jump over bombs.', prompt: 'a runner that jumps over bombs and collects coins' },
  { text: 'Make it harder every 10 points.', prompt: 'a shooter where enemies speed up every 10 points' },
  { text: 'A game with only one life.', prompt: 'dodge fireballs with one life, win at 20' },
  { text: 'Catch stars, not bombs.', prompt: 'catch falling stars and avoid bombs at sunset' },
  { text: 'Five enemies at once.', prompt: 'a shooter with five aliens at once' },
  { text: 'Win at 30.', prompt: 'catch coins, win at 30, fast' },
  { text: 'A game in candy land.', prompt: 'a runner in candy land collecting gems' },
  { text: 'Bombs that fall faster.', prompt: 'dodge bombs that fall faster every second' },
  { text: 'Under the sea.', prompt: 'catch gems under the sea and dodge the sharks' },
  { text: 'Two kinds of treasure.', prompt: 'catch coins and gems in space' },
  { text: 'A runner at sunset.', prompt: 'a bunny that runs and jumps at sunset collecting stars' },
]);

/** The same quest for everyone on the same day, and never the same one two days running. */
function questFor(now = Date.now()) {
  const key = dayKey(now) || '1970-01-01';
  const start = Date.UTC(2026, 0, 1);
  const dayOfYear = Math.floor((new Date(`${key}T00:00:00Z`).getTime() - start) / DAY_MS);
  const index = ((dayOfYear % QUESTS.length) + QUESTS.length) % QUESTS.length;
  return { ...QUESTS[index], day: key };
}

/** Levels: a cut of total XP. The titles are the ones a child sees. */
const LEVELS = Object.freeze([
  { n: 1, at: 0, title: 'Rookie' },
  { n: 2, at: 100, title: 'Tinkerer' },
  { n: 3, at: 220, title: 'Builder' },
  { n: 4, at: 380, title: 'Game Designer' },
  { n: 5, at: 600, title: 'Level Maker' },
  { n: 6, at: 900, title: 'Studio Boss' },
  { n: 7, at: 1300, title: 'Legend' },
]);

function levelFor(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let current = LEVELS[0];
  for (const level of LEVELS) if (xp >= level.at) current = level;
  const next = LEVELS.find((level) => level.at > xp) || null;
  return { n: current.n, title: current.title, xp, next: next ? next.at : null, toNext: next ? next.at - xp : 0 };
}

module.exports = { dayKey, streakFrom, questFor, levelFor, QUESTS, LEVELS, isWeekend, previousWorkingDay };
