// ── Evidence a parent can actually read ──────────────────────────────────────
//
// This is the part that decides whether CodeIt is worth paying for.
//
// A parent does not pay £12 a month for their child to have fun; free games
// exist. They pay for learning they can see. And the thing every parent is
// quietly worried about right now is the obvious one: the machine wrote the
// code, so what did my child actually do?
//
// "Finished a project" is not an answer to that question. Neither is a streak,
// a badge, or minutes spent. The only honest answer is: here is a thing your
// child was asked about their own code, and here is the fact that they got it
// right.
//
// So this module holds two small things, and refuses to hold anything else:
//
//   * what a child has demonstrated, project by project, in plain sentences
//   * when they demonstrated it
//
// Not a score, not a level, not a percentage. A percentage invites comparison
// between children and tells a parent nothing about what their own child can
// do. A sentence — "worked out how many times a loop runs, in a game they
// wrote" — tells them everything.

const RECORD_KEY = 'codeit.understood.v1';
const MAX_RECORDS = 40;

/**
 * What each question actually demonstrates, said the way a parent would say it.
 *
 * Deliberately specific. "Understands loops" is a claim; "worked out how many
 * times a loop in their own game runs" is a description of something that
 * happened, which is the only kind of claim this module is allowed to make.
 */
const SKILL_FOR_QUESTION = {
  'starting-value': 'Found the starting value of a variable in their own code',
  increment: 'Explained what a line that adds to the score does',
  'loop-count': 'Worked out how many times a loop repeats',
  clicks: 'Explained what makes code run when you click',
  background: 'Traced a colour in the stylesheet to what it changes on screen',
};

function skillFor(questionId) {
  return SKILL_FOR_QUESTION[questionId] || null;
}

/**
 * The plain-English list of what a child showed, for one attempt.
 *
 * Only questions they got right. A question they were asked and missed is not
 * evidence of anything, and quietly counting it would make the whole record
 * worthless.
 */
function skillsShown(questions, wrongIds = []) {
  const missed = new Set(wrongIds);
  return (questions || [])
    .filter(question => question && !missed.has(question.id))
    .map(question => skillFor(question.id))
    .filter(Boolean);
}

function readRecords(storage) {
  try {
    const raw = storage.getItem(RECORD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(entry => entry && typeof entry.projectId === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Remember that a child explained a project.
 *
 * One record per project — explaining the same game twice is not two pieces of
 * evidence, and a list that fills up with the same project teaches a parent
 * nothing.
 */
function recordUnderstanding(storage, attempt, now = Date.now()) {
  // Not a destructured parameter: `recordUnderstanding(store, null)` would
  // throw before any guard could run, and a caller with nothing to record is
  // exactly the case this has to survive.
  const { projectId, projectTitle, skills } = attempt || {};
  if (!projectId || !Array.isArray(skills) || !skills.length) return null;

  const entry = {
    projectId: String(projectId).slice(0, 60),
    projectTitle: String(projectTitle || 'a project').slice(0, 120),
    skills: skills.filter(skill => typeof skill === 'string').slice(0, 8),
    at: now,
  };

  const kept = [entry, ...readRecords(storage).filter(old => old.projectId !== entry.projectId)]
    .slice(0, MAX_RECORDS);

  try {
    storage.setItem(RECORD_KEY, JSON.stringify(kept));
    return entry;
  } catch {
    // No storage. The child still saw that they got it right, which is the part
    // that matters to them; only the parent-facing record is lost.
    return null;
  }
}

/** Everything this child has explained, newest first. */
function listUnderstanding(storage) {
  return readRecords(storage).sort((a, b) => (b.at || 0) - (a.at || 0));
}

function hasUnderstood(storage, projectId) {
  if (!projectId) return false;
  return readRecords(storage).some(entry => entry.projectId === projectId);
}

/**
 * The one-line summary for a parent.
 *
 * Counts projects and distinct skills rather than questions answered, because
 * "explained 3 projects" is a fact about their child and "answered 9 questions"
 * is a fact about our quiz.
 */
function summarise(records) {
  const list = records || [];
  if (!list.length) return null;

  const skills = new Set();
  list.forEach(entry => (entry.skills || []).forEach(skill => skills.add(skill)));

  const projects = list.length === 1 ? '1 project' : `${list.length} projects`;
  const things = skills.size === 1 ? '1 thing' : `${skills.size} different things`;
  return `Explained ${projects}, showing ${things} they understood about their own code.`;
}

function clearUnderstanding(storage) {
  try { storage.removeItem(RECORD_KEY); } catch {}
}

export {
  MAX_RECORDS,
  RECORD_KEY,
  SKILL_FOR_QUESTION,
  clearUnderstanding,
  hasUnderstood,
  listUnderstanding,
  recordUnderstanding,
  skillFor,
  skillsShown,
  summarise,
};
