// ── The improvement ladder ───────────────────────────────────────────────────
//
// A child builds a game and, until now, the session ended there. This hands
// them one small challenge that makes their own game better. They do it. THEN
// we name what they just used and offer the lesson behind it.
//
// The order matters and it is the reverse of a lesson: challenge, they do it,
// then the concept. "This challenge is about variables" up front is a lesson
// wearing a costume and a nine-year-old reads it that way. "The number you just
// changed is called a variable", said after the ball is already falling faster,
// lands on something they have felt.
//
// Not a model call per project: expensive, slow, and sometimes impossible,
// which is worse than dull. The challenge is chosen by what the project is
// MISSING, from facts the studio already reads (proveIt.readProject and
// codeConcepts.conceptsIn), so it costs nothing per build and can be tested.
//
// Every challenge here is checkable: the same read that generates the
// comprehension questions confirms the change. A challenge we could not verify
// is a to-do list, and it is not in this file. Five that verify beat twenty
// that do not.
//
// Rules, so it does not become a chore: one at a time, never a list; always
// dismissible and dismissing costs nothing; never blocks building, publishing
// or leaving; and after three dismissals in a row it stops offering for the
// session.

import { readProject } from './proveIt';
import { conceptsIn } from './codeConcepts';

const FRIENDLY = [
  { match: /speed|velocity|fall/i, noun: 'speed' },
  { match: /score|point/i, noun: 'score' },
  { match: /^lives?$|life/i, noun: 'lives' },
  { match: /time|timer|seconds|countdown/i, noun: 'timer' },
  { match: /size|width|height|radius/i, noun: 'size' },
];

function friendly(name) {
  const known = FRIENDLY.find((entry) => entry.match.test(name));
  return known ? known.noun : name;
}

function numericVariables(facts) {
  return facts.variables.filter((v) => /^-?\d+(\.\d+)?$/.test(v.value) && Number(v.value) !== 0);
}

/** The variable a child would most enjoy changing: speed, then score, then any. */
function bestVariable(facts) {
  const numeric = numericVariables(facts);
  if (!numeric.length) return null;
  for (const entry of FRIENDLY) {
    const hit = numeric.find((v) => entry.match.test(v.name));
    if (hit) return hit;
  }
  return numeric[0];
}

function valueOf(facts, name) {
  const found = facts.variables.find((v) => v.name === name);
  return found ? found.value : null;
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

// Each entry: what it needs the project to already have, what it must be
// missing (`introduces`), the words for THIS project, a hint, a check on the
// before-and-after code, and the concept named afterwards.
export const LADDER = [
  {
    id: 'change-a-number',
    concept: 'variables',
    lesson: 2,
    introduces: null,
    fits: (facts) => Boolean(bestVariable(facts)),
    prompt: (facts) => {
      const v = bestVariable(facts);
      const noun = friendly(v.name);
      const doubled = Number(v.value) * 2;
      return noun === v.name
        ? `Make ${v.name} start at ${doubled} instead of ${v.value}.`
        : `Make the ${noun} ${doubled} instead of ${v.value}.`;
    },
    hint: (facts) => {
      const v = bestVariable(facts);
      return `Look for the line that says ${v.name} = ${v.value}. That number is the one to change.`;
    },
    check: (before, after) => {
      const v = bestVariable(before);
      if (!v) return false;
      const now = valueOf(after, v.name);
      return now !== null && now !== v.value;
    },
    thenSay: (facts) => {
      const v = bestVariable(facts);
      return `The number you just changed is a variable. Yours is called ${v.name}, and the game reads it every time it needs that number.`;
    },
  },
  {
    id: 'rename-the-title',
    concept: 'strings',
    lesson: 3,
    introduces: null,
    fits: (facts) => facts.headings.length > 0,
    prompt: (facts) => `Change the title from “${facts.headings[0]}” to your own words.`,
    hint: (facts) => `The title is inside quotes somewhere near the top: “${facts.headings[0]}”. Change what is between the quotes.`,
    check: (before, after) => {
      const was = before.headings[0];
      return Boolean(was) && after.headings.length > 0 && !after.headings.includes(was);
    },
    thenSay: () => 'Words inside quotes are a string. Change the words, and everywhere the game shows them changes too.',
  },
  {
    id: 'add-a-rule',
    concept: 'if',
    lesson: 4,
    introduces: 'if',
    fits: (facts) => facts.increments.length > 0,
    prompt: (facts) => {
      const counter = friendly(facts.increments[0].name);
      return `Add a rule: when the ${counter} reaches 10, show “You win!”.`;
    },
    hint: () => 'On the Change tab, ask for it in those words. Then look for the new line that starts with if.',
    check: (before, after) => countMatches(after.scripts, /\bif\s*\(/g) > countMatches(before.scripts, /\bif\s*\(/g),
    thenSay: () => 'You just added an if statement: a rule the game checks every time, and acts on only when it is true.',
  },
  {
    id: 'repeat-it',
    concept: 'forLoops',
    lesson: 5,
    introduces: 'forLoops',
    // Something to repeat: a game with variables and a script, not a page.
    fits: (facts) => facts.scripts.trim().length > 0 && facts.variables.length > 0,
    prompt: () => 'Make three of them appear at the start instead of one.',
    hint: () => 'On the Change tab, ask for three at the start. The new code will say for, and count 0, 1, 2.',
    check: (before, after) => countMatches(after.scripts, /\bfor\s*\(/g) > countMatches(before.scripts, /\bfor\s*\(/g),
    thenSay: () => 'That repeat is a loop. Instead of writing the same line three times, the game counts and does it once per count.',
  },
  {
    id: 'keep-a-list',
    concept: 'lists',
    lesson: 7,
    introduces: 'lists',
    fits: (facts) => facts.increments.length > 0,
    prompt: () => 'Keep the last five scores and show them at the end.',
    hint: () => 'On the Change tab, ask for it in those words. Look for square brackets [ ] in the new code.',
    check: (before, after) => countMatches(after.scripts, /=\s*\[/g) > countMatches(before.scripts, /=\s*\[/g),
    thenSay: () => 'The square brackets are a list: one name that holds several values, in order.',
  },
];

function safeRead(html) {
  try { return readProject(html); } catch { return null; }
}

function conceptIds(html) {
  try { return new Set(conceptsIn(html).map((c) => c.id)); } catch { return new Set(); }
}

/**
 * The one challenge to offer for this project right now, or null.
 *
 * Chosen by what the project is missing: a challenge that introduces a
 * concept the project already has is skipped, so the ladder teaches in
 * order. `skip` is the ids already done or dismissed this session.
 */
export function nextChallenge(html, { skip = [] } = {}) {
  const facts = safeRead(html);
  if (!facts) return null;
  const has = conceptIds(html);
  for (const rung of LADDER) {
    if (skip.includes(rung.id)) continue;
    if (rung.introduces && has.has(rung.introduces)) continue;
    let fits = false;
    try { fits = rung.fits(facts); } catch { fits = false; }
    if (!fits) continue;
    const variable = rung.id === 'change-a-number' ? bestVariable(facts)?.name || null : null;
    return {
      id: rung.id,
      concept: rung.concept,
      lesson: rung.lesson,
      prompt: rung.prompt(facts),
      hint: rung.hint(facts),
      variable,
    };
  }
  return null;
}

/** Did the child do the challenge? Read both versions of the file and say. */
export function challengeDone(id, beforeHtml, afterHtml) {
  const rung = LADDER.find((r) => r.id === id);
  if (!rung || !beforeHtml || !afterHtml || beforeHtml === afterHtml) return false;
  const before = safeRead(beforeHtml);
  const after = safeRead(afterHtml);
  if (!before || !after) return false;
  try { return Boolean(rung.check(before, after)); } catch { return false; }
}

/** The sentence said AFTER it is done. Named as a reward, not as a label. */
export function conceptSentence(id, beforeHtml) {
  const rung = LADDER.find((r) => r.id === id);
  if (!rung) return '';
  const facts = safeRead(beforeHtml);
  if (!facts) return '';
  try { return rung.thenSay(facts); } catch { return ''; }
}

export const MAX_DISMISSALS = 3;
