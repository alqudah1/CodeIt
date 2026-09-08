// ── What a colour palette actually changes ───────────────────────────────────
//
// For months, tapping CodeIt / Arcade / Candy did one thing: it injected a
// `:root { --primary: …; --accent: …; … }` block into the project. That only
// repaints anything whose CSS reads those names. Eight of the eleven starter
// games paint on a canvas with `pen.fillStyle = starColour`, and the other
// three set element backgrounds from the same kind of constant. None of them
// reads a CSS variable. So on every starter, including the flagship on the
// front page, a palette repainted nothing, and a child said so: "ma 3am
// betghayaro", they are not changing.
//
// The fix is not to teach the games CSS variables a child cannot see. Every
// starter already opens with a block of named settings:
//
//     let fallSpeed  = 3;
//     let starColour = '#FFD84D';
//
// That block is the whole point of the product: it is the code the child can
// read, the code the Controls panel turns into sliders, and the code Prove It
// asks questions about. A palette should rewrite THOSE lines. "You picked
// Candy and starColour became #EC4899" is a lesson. A CSS variable is not.
//
// So: each starter declares which of its colour settings takes the palette's
// primary and which takes the accent. Any other project with colour settings
// at the top gets the same treatment in declaration order. A project with no
// colour settings at all (the generated ones, which do read --primary and
// friends) keeps the :root injection.
//
// Pure functions only. The studio does the IO.

import { readSettings, setSetting } from './gameSettings';

// Which named setting takes which palette colour, per starter. The first name
// is the thing a child watches most: the star they catch, the ship they fly,
// the snake they steer. Missing starters fall back to declaration order, and
// a test checks every starter is listed and every name really is declared.
const STARTER_PAINT = {
  'catch-stars':  { starColour: '--primary' },
  'penalty':      { goalColour: '--primary' },
  'dodge':        { shipColour: '--primary' },
  'pop-balloons': { balloonColour: '--primary' },
  'snake':        { snakeColour: '--primary', appleColour: '--accent' },
  'bricks':       { brickColour: '--primary' },
  'jumper':       { runnerColour: '--primary' },
  // The maze player wears the child's avatar, which covers playerColour, so
  // the walls (always on screen) take the primary.
  'maze':         { wallColour: '--primary', playerColour: '--accent' },
  'whack':        { moleColour: '--primary' },
  'memory':       { firstPad: '--primary', winColour: '--accent' },
  'cat-chase':    { trailColour: '--primary' },
  // Quizzes and shops are element pages, and until now had no colour setting
  // at all: the accent was baked into the CSS. Each has one now.
  'quiz-animals':  { quizColour: '--primary' },
  'quiz-space':    { quizColour: '--primary' },
  'quiz-football': { quizColour: '--primary' },
  'quiz-maths':    { quizColour: '--primary' },
  'quiz-creature': { quizColour: '--primary', barColour: '--accent' },
  'site-cupcakes':  { shopColour: '--primary' },
  'site-sneakers':  { shopColour: '--primary' },
  'site-dogs':      { shopColour: '--primary' },
  'site-games':     { shopColour: '--primary' },
  'site-bracelets': { shopColour: '--primary' },
};

// For a project that is not a known starter: its colour settings, in the
// order the author wrote them, take these palette colours in turn.
const ROLE_ORDER = ['--primary', '--accent', '--success'];

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** The colour settings declared at the top of a project, in order. */
function colourSettings(code) {
  return readSettings(code).filter((s) => s.type === 'colour');
}

/** The starter whose declared paint map is fully present in this code. */
function starterFor(settings) {
  const names = new Set(settings.map((s) => s.name));
  for (const [id, map] of Object.entries(STARTER_PAINT)) {
    if (Object.keys(map).every((name) => names.has(name))) return { id, map };
  }
  return null;
}

/** 1-based line of the declaration, for "starColour on line 12". */
function lineOf(code, name) {
  const pattern = new RegExp(`^[ \\t]*(?:let|const|var)[ \\t]+${name}[ \\t]*=`, 'm');
  const at = code.search(pattern);
  if (at === -1) return null;
  return code.slice(0, at).split('\n').length;
}

/**
 * What applying `vars` to this code would change: one entry per colour
 * setting that takes a palette colour and would actually end up different.
 * Empty means "this project has no colour settings; use the :root route".
 */
function paintPlan(code, vars) {
  if (typeof code !== 'string' || !vars) return [];
  const settings = colourSettings(code);
  if (!settings.length) return [];

  const starter = starterFor(settings);
  const roles = starter
    ? settings.map((s) => starter.map[s.name] || null)
    : settings.map((_, i) => ROLE_ORDER[i] || null);

  const plan = [];
  settings.forEach((setting, i) => {
    const role = roles[i];
    const to = role ? vars[role] : null;
    if (!to || !HEX.test(to)) return;
    if (to.toLowerCase() === String(setting.value).toLowerCase()) return;
    plan.push({ name: setting.name, from: setting.value, to, role, line: lineOf(code, setting.name) });
  });
  return plan;
}

/**
 * The code with the palette painted into its own settings, and what changed.
 * `code` comes back untouched (same string) when there was nothing to paint.
 */
function paintCode(code, vars) {
  const changes = paintPlan(code, vars);
  let next = code;
  for (const change of changes) next = setSetting(next, change.name, change.to);
  return { code: next, changes: next === code ? [] : changes };
}

/** "starColour is now #EC4899 (line 12)". The line a child can go and read. */
function describePaint(changes, themeName) {
  if (!changes.length) return '';
  const said = changes
    .map((c) => `${c.name} is now ${c.to}${c.line ? ` (line ${c.line})` : ''}`)
    .join(' and ');
  return `${themeName ? `${themeName}: ` : ''}${said}. Your project reloaded so you can see it.`;
}

export { STARTER_PAINT, ROLE_ORDER, colourSettings, describePaint, paintCode, paintPlan };
