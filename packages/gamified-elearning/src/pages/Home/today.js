// ── Today, for a child without an account ───────────────────────────────────
//
// The server answers GET /api/today for a signed-in child from the projects
// table. A guest's games live on the shelf in this browser, so their streak
// is read from the shelf's dates with the same rule the server uses: a run
// of days with something made, weekends never break it, and yesterday's
// streak stays alive until midnight. Keep this in step with today.js on the
// backend; the tests pin the same cases on both sides.

const DAY_MS = 24 * 60 * 60 * 1000;

export function dayKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
const addDays = (key, n) => dayKey(new Date(`${key}T00:00:00Z`).getTime() + n * DAY_MS);
const isWeekend = (key) => { const d = new Date(`${key}T00:00:00Z`).getUTCDay(); return d === 0 || d === 6; };

export function streakFrom(madeOn, now = Date.now()) {
  const days = new Set((madeOn || []).map(dayKey).filter(Boolean));
  const today = dayKey(now);
  const builtToday = days.has(today);
  let cursor = builtToday ? today : addDays(today, -1);
  let streak = 0;
  for (;;) {
    if (days.has(cursor)) { streak += 1; cursor = addDays(cursor, -1); continue; }
    if (isWeekend(cursor)) { cursor = addDays(cursor, -1); continue; }
    break;
  }
  return { streak, builtToday };
}

export const LEVELS = [
  { n: 1, at: 0, title: 'Rookie' }, { n: 2, at: 100, title: 'Tinkerer' }, { n: 3, at: 220, title: 'Builder' }, { n: 4, at: 380, title: 'Game Designer' },
  { n: 5, at: 600, title: 'Level Maker' }, { n: 6, at: 900, title: 'Studio Boss' }, { n: 7, at: 1300, title: 'Legend' },
];

export function levelFor(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let current = LEVELS[0];
  for (const level of LEVELS) if (xp >= level.at) current = level;
  const next = LEVELS.find((level) => level.at > xp) || null;
  return { n: current.n, title: current.title, xp, next: next ? next.at : null, toNext: next ? next.at - xp : 0 };
}

/** The same bank as the server, for the moment before its answer arrives. */
export const QUESTS = [
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
];

export function questFor(now = Date.now()) {
  const key = dayKey(now) || '1970-01-01';
  const dayOfYear = Math.floor((new Date(`${key}T00:00:00Z`).getTime() - Date.UTC(2026, 0, 1)) / DAY_MS);
  const index = ((dayOfYear % QUESTS.length) + QUESTS.length) % QUESTS.length;
  return { ...QUESTS[index], day: key };
}
