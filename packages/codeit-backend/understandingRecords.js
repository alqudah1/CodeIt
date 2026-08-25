'use strict';

// ── Evidence that survives the browser ───────────────────────────────────────
//
// A child explains their own project and the studio records what they showed.
// Until now that record lived in one localStorage key: it vanished when a
// school wiped the browser, it could not be seen on a parent's phone, and
// nobody could count it. A claim that cannot be counted is not evidence, it is
// a feeling.
//
// ── Why the client does not send the sentences ───────────────────────────────
//
// The obvious design is for the browser to post the sentences it already has:
// "Worked out how many times a loop repeats". That would be wrong, and not for
// a subtle reason — anyone can open dev tools and post whatever sentence they
// like, and the record a parent reads would be whatever a child felt like
// typing.
//
// So the browser posts question IDs, and the sentences are written here. The
// worst a forged request can do is claim a real question that was really asked,
// which is the same thing an honest client claims. The wording of the evidence
// is ours.
//
// This mirrors stepXp.js: the browser asks, the server decides.

// The sentences. Deliberately descriptions of something that happened rather
// than claims about a child — "worked out how many times a loop repeats", not
// "understands loops". The first is a fact; the second is a grade.
const SKILL_FOR_QUESTION = {
  'starting-value': 'Found the starting value of a variable in their own code',
  increment: 'Explained what a line that adds to the score does',
  'loop-count': 'Worked out how many times a loop repeats',
  clicks: 'Explained what makes code run when you click',
  background: 'Traced a colour in the stylesheet to what it changes on screen',
};

const KNOWN_QUESTIONS = Object.keys(SKILL_FOR_QUESTION);

// A single attempt cannot show more than the studio can ask.
const MAX_QUESTIONS = 8;
const MAX_TITLE = 120;
const MAX_KEY = 80;

/** The sentences for a set of question ids. Unknown ids claim nothing. */
function skillsFor(questionIds) {
  if (!Array.isArray(questionIds)) return [];
  const seen = new Set();
  const skills = [];
  for (const id of questionIds.slice(0, MAX_QUESTIONS)) {
    const sentence = SKILL_FOR_QUESTION[id];
    if (!sentence || seen.has(sentence)) continue;
    seen.add(sentence);
    skills.push(sentence);
  }
  return skills;
}

/**
 * Turn a request body into something safe to store, or null.
 *
 * Null means "do not record this" rather than "record something empty": an
 * attempt that demonstrated nothing is not evidence, and a row saying so would
 * quietly inflate every count built on this table.
 */
function normaliseAttempt(body) {
  const source = body && typeof body === 'object' ? body : {};

  const projectKey = typeof source.projectKey === 'string'
    ? source.projectKey.trim().slice(0, MAX_KEY)
    : '';
  if (!projectKey) return null;

  const skills = skillsFor(source.questionIds);
  if (!skills.length) return null;

  // The title is the child's own words and is stored as text. It is never
  // interpolated into SQL or rendered as markup by anything that reads it.
  const rawTitle = typeof source.projectTitle === 'string' ? source.projectTitle.trim() : '';
  const projectTitle = (rawTitle || 'a project').slice(0, MAX_TITLE);

  return { projectKey, projectTitle, skills };
}

/**
 * The line a parent reads.
 *
 * Counts projects and distinct things rather than questions answered, because
 * "explained 3 projects" is a fact about their child and "answered 9 questions"
 * is a fact about our quiz. No score, no percentage: a percentage invites
 * comparison between children and says nothing about their own.
 */
function summarise(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return null;

  const skills = new Set();
  list.forEach(row => {
    const rowSkills = Array.isArray(row?.skills) ? row.skills : [];
    rowSkills.forEach(skill => skills.add(skill));
  });
  if (!skills.size) return null;

  const projects = list.length === 1 ? '1 project' : `${list.length} projects`;
  const things = skills.size === 1 ? '1 thing' : `${skills.size} different things`;
  return `Explained ${projects}, showing ${things} they understood about their own code.`;
}

module.exports = {
  KNOWN_QUESTIONS,
  MAX_QUESTIONS,
  MAX_TITLE,
  SKILL_FOR_QUESTION,
  normaliseAttempt,
  skillsFor,
  summarise,
};
