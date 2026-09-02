// ── Prove you understand what you built ──────────────────────────────────────
//
// The data says the lessons are used and the studio is not: of 283 learners,
// 230 started lesson 1, 11 finished the course, and 19 ever saved a project.
// But the deeper problem is the one every teacher now has — when a machine can
// write the code, finishing a project proves nothing about whether the child
// understood a line of it.
//
// So a project does not become "yours" because the AI finished it. It becomes
// yours when you can answer questions about it.
//
// The questions here are generated from the child's OWN code, not from a bank.
// "What is the starting value of score?" is only asked when their project
// really has a variable called score, and the right answer is really what they
// wrote. That is what makes it evidence rather than a quiz: it cannot be
// answered by someone who did not read their own project, and it cannot be
// passed by a child whose sibling did the last one.
//
// Two rules this module never breaks:
//
//   1. Never ask a question the code does not support. Every generator returns
//      null rather than inventing something plausible. Three good questions
//      beat five, and a wrong answer key teaches the wrong thing.
//   2. No randomness. Same project, same questions — so a child cannot reroll
//      until they get easy ones, and so this is testable at all.

// ── Deterministic shuffling ──────────────────────────────────────────────────
//
// Choices must not always appear in the order they were generated, or the
// answer would always be first. But Math.random would mean a child could
// refresh for a different arrangement, and no test could pin it down. The
// project's own text is the seed.

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleWithSeed(items, seed) {
  const out = [...items];
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build a question with the right answer placed by seed, not by position. */
function makeQuestion({ id, kind, question, code, correctAnswer, distractors, explain, seedText }) {
  const unique = [];
  [correctAnswer, ...distractors].forEach(choice => {
    const value = String(choice);
    if (!unique.some(existing => existing === value)) unique.push(value);
  });
  // A question with nothing to choose between is not a question.
  if (unique.length < 3) return null;

  const choices = shuffleWithSeed(unique.slice(0, 4), hash(`${id}:${seedText || question}`));
  return {
    id,
    kind,
    question,
    code: code || '',
    choices,
    correct: choices.indexOf(String(correctAnswer)),
    explain,
  };
}

// ── Reading the child's project ──────────────────────────────────────────────

function sectionsOf(html) {
  const source = typeof html === 'string' ? html : '';
  const scripts = [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    // The editor bridge is injected by CodeIt, not written by the child.
    .filter(js => !js.includes('CODEIT_CMD'))
    .join('\n');
  const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1]).join('\n');
  return { source, scripts, styles };
}

/**
 * Everything we can say about a project with certainty.
 *
 * Deliberately conservative — a fact we are unsure of becomes no question at
 * all, and the child is never marked wrong for our bad parse.
 */
function readProject(html) {
  const { source, scripts, styles } = sectionsOf(html);

  // let/const/var with a plain number or string.
  //
  // Anchored on a statement boundary rather than a line start: generated code
  // regularly puts several declarations on one line, and requiring \n meant
  // `let score = 0; let shots = 3;` found score and silently lost shots — so a
  // football game with three counters offered ideas about one of them.
  //
  // The trailing semicolon is deliberately NOT consumed. It is the boundary the
  // next declaration needs, and eating it made the matcher skip every second
  // one: score and goalieSpeed came back, shots did not.
  const variables = [...scripts.matchAll(/(?:^|[;{}\n])\s*(?:let|const|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(-?\d+(?:\.\d+)?|'[^']*'|"[^"]*")/g)]
    .map(match => ({ name: match[1], value: match[2].trim() }));

  // for (let i = 0; i < N; i++) — only the countable form.
  const loops = [...scripts.matchAll(/for\s*\(\s*(?:let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;/g)]
    .map(match => ({ name: match[1], from: Number(match[2]), to: Number(match[3]), text: match[0] }));

  // Both ways a generated project reacts to a click. Checked against the two
  // projects actually published on codeitlearn.com: the click-the-target game
  // uses five onclick attributes and not a single addEventListener, so looking
  // only for the listener form missed the entire mechanic of the game.
  const clickHandlers =
    [...scripts.matchAll(/addEventListener\(\s*['"]click['"]/g)].length
    + [...source.matchAll(/\bonclick\s*=/gi)].length;

  // Anything that increases a counter: score++, score += 5, score = score + 1
  const rawIncrements = [...scripts.matchAll(/([A-Za-z_$][\w$]*)\s*(?:\+\+|\+=\s*(\d+)|=\s*\1\s*\+\s*(\d+))/g)]
    .map(match => ({
      name: match[1],
      by: Number(match[2] ?? match[3] ?? 1),
      text: match[0].trim(),
    }));

  // Order matters: whatever appears first in the file is usually `i++` from a
  // loop, and "what does i++ do to i" is the least interesting question in the
  // project. A counter the child named and declared — score, coins, lives — is
  // the one worth asking about. Loop counters go last, never removed, because
  // a project whose only increment is a loop counter should still ask
  // something rather than nothing.
  const loopCounters = new Set(loops.map(loop => loop.name).filter(Boolean));
  const declared = new Set(variables.map(v => v.name));
  const increments = [...rawIncrements].sort((a, b) => {
    const rank = (inc) => (loopCounters.has(inc.name) ? 2 : declared.has(inc.name) ? 0 : 1);
    return rank(a) - rank(b);
  });

  const backgrounds = [...styles.matchAll(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|[a-z]+)\s*;/g)]
    .map(match => match[1].trim())
    .filter(colour => colour !== 'none' && colour !== 'transparent' && colour !== 'inherit');

  let buttons = 0;
  let headings = [];
  try {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    buttons = doc.querySelectorAll('button').length;
    headings = [...doc.querySelectorAll('h1, h2')]
      .map(node => (node.textContent || '').trim())
      .filter(Boolean);
  } catch {
    // No DOM available. Structure questions are skipped; the rest still work.
  }

  return { source, scripts, styles, variables, loops, clickHandlers, increments, backgrounds, buttons, headings };
}

// ── The generators ───────────────────────────────────────────────────────────
//
// Each takes the facts and returns one question, or null when the project does
// not contain what it needs.

function startingValueQuestion(facts) {
  const numeric = facts.variables.filter(v => /^-?\d+(\.\d+)?$/.test(v.value));
  if (!numeric.length) return null;
  const target = numeric[0];

  const otherNumbers = [
    ...numeric.slice(1).map(v => v.value),
    ...facts.loops.map(loop => String(loop.to)),
  ].filter(value => value !== target.value);

  const fallbacks = ['0', '1', '10', '100'].filter(value => value !== target.value);

  return makeQuestion({
    id: 'starting-value',
    kind: 'read',
    question: `In your project, what does ${target.name} start out as?`,
    code: `let ${target.name} = ${target.value};`,
    correctAnswer: target.value,
    distractors: [...otherNumbers, ...fallbacks].slice(0, 3),
    explain: `${target.name} starts at ${target.value}. That is the value it holds before anything in your project changes it.`,
    seedText: facts.source,
  });
}

function loopCountQuestion(facts) {
  const loop = facts.loops.find(l => l.to > l.from && l.to - l.from <= 1000);
  if (!loop) return null;
  const times = loop.to - loop.from;

  return makeQuestion({
    id: 'loop-count',
    kind: 'trace',
    question: 'How many times does this loop in your project repeat?',
    code: loop.text + ' ... }',
    correctAnswer: String(times),
    distractors: [String(times + 1), String(loop.to), String(Math.max(1, times - 1))],
    explain: `It runs ${times} times. It starts at ${loop.from} and keeps going while the counter is less than ${loop.to}. so ${loop.to} itself never happens.`,
    seedText: facts.source,
  });
}

function incrementQuestion(facts) {
  const bump = facts.increments[0];
  if (!bump) return null;

  return makeQuestion({
    id: 'increment',
    kind: 'read',
    question: `This line is in your project. What does it do to ${bump.name}?`,
    code: bump.text,
    correctAnswer: `Adds ${bump.by} to it`,
    distractors: [`Takes ${bump.by} away from it`, `Sets it back to 0`, `Multiplies it by ${bump.by}`],
    explain: `It adds ${bump.by} to ${bump.name} every time that line runs.`,
    seedText: facts.source,
  });
}

function clickQuestion(facts) {
  if (!facts.clickHandlers) return null;

  return makeQuestion({
    id: 'clicks',
    kind: 'structure',
    question: 'Your project listens for something. What makes its code run?',
    code: `addEventListener('click', ...)`,
    correctAnswer: 'Someone clicks or taps',
    distractors: ['The page finishes loading', 'A key is pressed', 'A timer runs out'],
    explain: 'addEventListener with "click" means that code waits until someone clicks or taps, and only then runs.',
    seedText: facts.source,
  });
}

function backgroundQuestion(facts) {
  const colour = facts.backgrounds[0];
  if (!colour) return null;
  const others = facts.backgrounds.slice(1).filter(c => c !== colour);
  if (others.length < 2) return null;

  return makeQuestion({
    id: 'background',
    kind: 'read',
    question: 'Which colour did your project use first for a background?',
    code: `background: ${colour};`,
    correctAnswer: colour,
    distractors: others.slice(0, 3),
    explain: `Your stylesheet sets ${colour} as the first background colour.`,
    seedText: facts.source,
  });
}

const GENERATORS = [
  startingValueQuestion,
  incrementQuestion,
  loopCountQuestion,
  clickQuestion,
  backgroundQuestion,
];

/**
 * Questions about this particular project.
 *
 * Returns fewer than `max` — or none at all — when the project does not contain
 * enough that we can ask about honestly. A caller that gets an empty list
 * should let the child through, not block them: the failure is ours.
 */
// A canned starter carries this marker, stamped by the server when it cannot
// reach the model and by the browser's own copies of the same templates.
//
// Between an unknown date and 21:45 on 1 September 2026 every build fell back
// to one of those templates, so every child received the same file. This
// engine read it and asked all of them the same questions about the same two
// variables, and the answers were written as evidence a parent could be sent.
// The evidence page tells that parent the questions "cannot be shared between
// two children"; for the length of the outage that was false.
//
// The panel already refuses to render on a fallback build. This is the second
// guard, at the engine, so it holds even if that flag is ever lost in a
// refactor. Two independent guards, because one was not enough to notice an
// outage that lasted weeks.
const STARTER_MARKER = 'codeit-starter-template';

function questionsFor(html, { max = 3 } = {}) {
  if (typeof html === 'string' && html.includes(STARTER_MARKER)) return [];
  const facts = readProject(html);
  const questions = [];
  for (const generate of GENERATORS) {
    if (questions.length >= max) break;
    let question = null;
    try {
      question = generate(facts);
    } catch {
      // A generator that cannot cope with an odd project asks nothing.
      question = null;
    }
    if (question) questions.push(question);
  }
  return questions;
}

/** Did this attempt show understanding? Every question has to be right. */
function gradeAttempt(questions, answers) {
  const asked = questions?.length || 0;
  if (!asked) return { passed: false, correct: 0, asked: 0, wrongIds: [] };

  const wrongIds = questions
    .filter((question, index) => Number(answers?.[index]) !== question.correct)
    .map(question => question.id);

  return {
    passed: wrongIds.length === 0,
    correct: asked - wrongIds.length,
    asked,
    wrongIds,
  };
}

/**
 * Is there enough here to claim a child understood their project?
 *
 * A one-page website with no JavaScript yields a single question about a
 * background colour — which is honest, but answering it proves nothing. Below
 * this bar the caller should let the child through without a badge rather than
 * award understanding nobody demonstrated. Measured on the real published
 * projects: the game yields three, the static website one.
 */
const MIN_QUESTIONS_TO_PROVE = 2;

function isEnoughToProve(questions) {
  return (questions?.length || 0) >= MIN_QUESTIONS_TO_PROVE;
}

export {
  MIN_QUESTIONS_TO_PROVE,
  STARTER_MARKER,
  gradeAttempt,
  isEnoughToProve,
  questionsFor,
  readProject,
};
