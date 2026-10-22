// ── The twelve powers ────────────────────────────────────────────────────────
//
// The curriculum as twelve things a game can do, each named by what it lets
// the game do and not by the computer science word for it. Every power is
// three minutes inside the child's own game: change one line and run, change
// it again, then the check, where the child writes the line with the
// highlight gone. Pass and the power turns green and the line stays on in
// every game they build after.
//
// This file is identical in the backend (powers.js) and the frontend
// (src/pages/Powers/powers.js) apart from the export line at the bottom, and
// a test keeps it that way: the server checks a pass with exactly the rule
// the page showed the child.

const POWER_XP = 40;
const LESSON_BASE = 100; // Student_Lesson_Progress rows 101 to 112 are powers

const LOOKS = ['hero', 'ship', 'alien', 'pink', 'skyguy', 'blob', 'rock', 'bomb', 'sun', 'coin', 'gem', 'carrot', 'star'];
const SKIES = ['space', 'night', 'ocean', 'candy', 'day', 'sunset'];

const POWERS = [
  {
    n: 1, slug: 'numbers', name: 'Numbers', does: 'change how fast', key: 'speed',
    intro: 'Your game keeps its speed in a box called speed. Change the number in the box and the whole game changes.',
    engine: "if (keys.ArrowRight) playerX += 7 + speed;",
    steps: [
      { say: 'Change the {from} to a {to}. Run it.', value: 3, alt: 4 },
      { say: 'Now make it calm. Make it {to}.', value: 1, alt: 2 },
    ],
    check: { say: 'Set speed to a number from 1 to 5 that is not what it was.', test: (a, b) => isNum(a.speed, 1, 5) && a.speed !== b.speed },
  },
  {
    n: 2, slug: 'words', name: 'Words', does: 'name things', key: 'gameTitle',
    intro: "Words in code live between quotes. gameTitle is a word box, and the game shows whatever you put in it.",
    engine: "document.getElementById('titleLabel').textContent = gameTitle;",
    steps: [
      { say: "Change the title to '{to}'. Run it.", value: 'Rock Storm', alt: 'Star Storm' },
      { say: 'Put your own name in the title.', value: 'My Game', alt: 'Our Game' },
    ],
    check: { say: 'Give the game a new title, at least three letters long.', test: (a, b) => typeof a.gameTitle === 'string' && a.gameTitle.trim().length >= 3 && a.gameTitle !== b.gameTitle },
  },
  {
    n: 3, slug: 'looks', name: 'Looks', does: 'pick who is in it', key: 'enemyLook',
    intro: 'enemyLook and playerLook choose the pictures. The game knows these names: hero, ship, alien, pink, skyguy, blob, rock, bomb, sun, coin, gem, carrot, star.',
    engine: "const enemyImg = spriteFor(enemyLook, 'rock');",
    steps: [
      { say: "Change enemyLook to '{to}'. Run it and look at the bad things.", value: 'bomb', alt: 'sun' },
      { say: "Now '{to}'.", value: 'alien', alt: 'rock' },
    ],
    check: { say: 'Pick a new look for the bad things from the names the game knows.', test: (a, b) => LOOKS.includes(a.enemyLook) && a.enemyLook !== b.enemyLook },
  },
  {
    n: 4, slug: 'lives', name: 'Lives', does: 'decide how many chances', key: 'startLives',
    intro: 'startLives is how many hearts you start with. Every hit takes one. At zero the game ends.',
    engine: 'lives -= 1;\nif (lives <= 0) endGame(false);',
    steps: [
      { say: 'Give yourself {to} lives. Run it.', value: 5, alt: 6 },
      { say: 'Now {to}. Hard mode.', value: 1, alt: 2 },
    ],
    check: { say: 'Set the lives to a number from 1 to 9 that is not what it was.', test: (a, b) => isNum(a.startLives, 1, 9) && a.startLives !== b.startLives },
  },
  {
    n: 5, slug: 'score', name: 'Score', does: 'count points', key: 'pointsPer',
    intro: 'Every catch adds pointsPer to the score. That plus sign is the whole idea of a score: a number that grows.',
    engine: 'score += pointsPer;',
    steps: [
      { say: 'Make every catch worth {to}. Run it and watch the score.', value: 2, alt: 3 },
      { say: 'Now {to} a catch.', value: 5, alt: 4 },
    ],
    check: { say: 'Make a catch worth between 2 and 10 points.', test: (a) => isNum(a.pointsPer, 2, 10) },
  },
  {
    n: 6, slug: 'winning', name: 'Winning', does: 'say when you win', key: 'winAt',
    intro: 'winAt is the score that wins. The game checks it after every point: if the score is big enough, you win.',
    engine: 'if (score >= winAt) endGame(true);',
    steps: [
      { say: 'Win fast: set winAt to {to}. Run it.', value: 5, alt: 6 },
      { say: 'Now a long game. {to}.', value: 30, alt: 25 },
    ],
    check: { say: 'Set a winning score of 5 or more that is not what it was.', test: (a, b) => isNum(a.winAt, 5, 999) && a.winAt !== b.winAt },
  },
  {
    n: 7, slug: 'ifthen', name: 'If, then', does: 'react to things', key: 'twist',
    intro: "An if asks a question. If twist is 'faster', then the speed grows with the score. Otherwise nothing changes.",
    engine: "let s = speed;\nif (twist === 'faster') s += score / 8;",
    steps: [
      { say: "Switch the if on: change twist to '{to}'. Run it and score a few.", value: 'faster', alt: 'waves' },
      { say: "Switch it off again: '{to}'.", value: 'none', alt: 'faster' },
    ],
    check: { say: "Turn the if on. Make twist say 'faster'.", test: (a) => a.twist === 'faster' },
  },
  {
    n: 8, slug: 'loops', name: 'Loops', does: 'make waves', key: 'waveSize',
    intro: 'A loop does the same thing again and again. The game spawns one bad thing with a loop that runs waveSize times. Change the number, change the wave.',
    engine: 'for (let k = 0; k < waveSize; k += 1) {\n  things.push(newThing());\n}',
    steps: [
      { say: 'Make waves of {to}. Run it.', value: 3, alt: 4 },
      { say: 'Now {to}. The biggest wave the game allows.', value: 6, alt: 5 },
    ],
    check: { say: 'Make the loop spawn between 2 and 6 bad things a wave.', test: (a) => isNum(a.waveSize, 2, 6) },
  },
  {
    n: 9, slug: 'timers', name: 'Timers', does: 'change things over time', key: 'speedUpEvery',
    intro: 'The game counts ticks, sixty a second. speedUpEvery turns that count into a timer: every that-many seconds, a bit faster.',
    engine: 's += Math.floor(ticks / 60 / speedUpEvery) * 0.5;',
    steps: [
      { say: 'Speed up every {to} seconds. Run it and wait.', value: 5, alt: 4 },
      { say: 'Every {to} seconds. Feel the difference.', value: 2, alt: 3 },
    ],
    check: { say: 'Set a timer between 1 and 30 seconds.', test: (a) => isNum(a.speedUpEvery, 1, 30) },
  },
  {
    n: 10, slug: 'sound', name: 'Sound', does: 'make a noise', key: 'soundOn',
    intro: 'soundOn is true or false. True and every catch blips. The blip is made from numbers, no file, no download.',
    engine: 'if (!soundOn) return;\no.frequency.setValueAtTime(good ? 660 : 160, audio.currentTime);',
    steps: [
      { say: 'Flip soundOn to {to}. Run it and catch something.', value: true, alt: false },
      { say: 'And now: {to}.', value: false, alt: true },
    ],
    check: { say: 'Turn the sound on.', test: (a) => a.soundOn === true },
  },
  {
    n: 11, slug: 'levels', name: 'Levels', does: 'go up a level', key: 'levelEvery',
    intro: 'levelEvery is points per level. The game divides your score by it and that is your level. Each level is a little faster.',
    engine: 'const next = Math.floor(score / levelEvery) + 1;\nif (next > level) level = next;',
    steps: [
      { say: 'A new level every {to} points. Run it.', value: 3, alt: 4 },
      { say: 'Every {to} points.', value: 5, alt: 6 },
    ],
    check: { say: 'Set levels of between 2 and 20 points each.', test: (a) => isNum(a.levelEvery, 2, 20) },
  },
  {
    n: 12, slug: 'boss', name: 'Boss', does: 'bring the boss', key: 'bossAt',
    intro: 'bossAt is the score where the boss comes: a big one that takes three hits. Zero means never.',
    engine: 'if (bossAt > 0 && !bossCame && score >= bossAt) {\n  things.push({ boss: true, hp: 3 });\n}',
    steps: [
      { say: 'Bring the boss at {to} points. Run it.', value: 5, alt: 6 },
      { say: 'Make them wait: {to}.', value: 10, alt: 12 },
    ],
    check: { say: 'Bring the boss at a score between 3 and 50.', test: (a) => isNum(a.bossAt, 3, 50) },
  },
];

/**
 * What a step asks for, given the value the line has right now: the step's
 * value, or its alternative when the game already has it, so "change the 2
 * to a 3" is never said to a game that is already on 3.
 */
function stepFor(power, index, current) {
  const step = power.steps[index];
  const to = step.value === current ? step.alt : step.value;
  const show = (v) => (typeof v === 'string' ? v : String(v));
  return { to, say: step.say.replace(/\{to\}/g, show(to)).replace(/\{from\}/g, show(current)) };
}

function isNum(v, lo, hi) { return typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi; }

function powerBySlug(slug) { return POWERS.find((p) => p.slug === String(slug || '').toLowerCase()) || null; }
function lessonIdFor(power) { return LESSON_BASE + power.n; }
function powerByLessonId(id) { return POWERS.find((p) => lessonIdFor(p) === Number(id)) || null; }

/** The settings a game page declares: every `let name = value;` at the top. */
function readSettings(code) {
  const out = {};
  const re = /^\s*let\s+([A-Za-z_]\w*)\s*=\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|true|false|-?\d+(?:\.\d+)?)\s*;/gm;
  let m;
  while ((m = re.exec(String(code || '')))) {
    const raw = m[2];
    if (raw === 'true') out[m[1]] = true;
    else if (raw === 'false') out[m[1]] = false;
    else if (raw[0] === "'" || raw[0] === '"') out[m[1]] = raw.slice(1, -1);
    else out[m[1]] = Number(raw);
  }
  return out;
}

/** The same code with one setting changed in place; comments and spacing stay. */
function writeSetting(code, key, value) {
  const re = new RegExp(`^(\\s*let\\s+${key}\\s*=\\s*)('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*"|true|false|-?\\d+(?:\\.\\d+)?)(\\s*;)`, 'm');
  const literal = typeof value === 'string' ? `'${value.replace(/\\/g, '').replace(/'/g, '')}'` : String(value);
  return String(code || '').replace(re, `$1${literal}$3`);
}

/** Does this code pass the power's check, given the code it started from? */
function passes(power, code, beforeCode) {
  if (!power) return false;
  try { return !!power.check.test(readSettings(code), readSettings(beforeCode)); } catch { return false; }
}

/** The map: every power with whether it is done, and which one is next. */
function powerStates(doneSlugs) {
  const done = new Set(doneSlugs || []);
  let nextFound = false;
  return POWERS.map((p) => {
    const isDone = done.has(p.slug);
    const state = isDone ? 'done' : nextFound ? 'later' : 'next';
    if (state === 'next') nextFound = true;
    return { n: p.n, slug: p.slug, name: p.name, does: p.does, key: p.key, state };
  });
}

// ── exports ──
export { LESSON_BASE, LOOKS, POWERS, POWER_XP, SKIES, lessonIdFor, passes, powerByLessonId, powerBySlug, powerStates, readSettings, stepFor, writeSetting };
