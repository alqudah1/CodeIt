'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  KNOWN_QUESTIONS,
  MAX_QUESTIONS,
  MAX_TITLE,
  SKILL_FOR_QUESTION,
  normaliseAttempt,
  skillsFor,
  summarise,
} = require('./understandingRecords');

// ── The sentences are ours, not the client's ────────────────────────────────

test('a client cannot write its own evidence', () => {
  // The whole reason the browser posts ids instead of sentences. Anyone can
  // open dev tools; nobody should be able to decide what a parent reads.
  const forged = normaliseAttempt({
    projectKey: 'p1',
    projectTitle: 'My game',
    skills: ['Mastered advanced computer science'],
    questionIds: ['loop-count'],
  });
  assert.deepEqual(forged.skills, ['Worked out how many times a loop repeats']);
});

test('an invented question id claims nothing', () => {
  assert.deepEqual(skillsFor(['not-a-real-question']), []);
  assert.equal(normaliseAttempt({ projectKey: 'p1', questionIds: ['nope'] }), null);
});

test('a real id mixed with invented ones only counts the real one', () => {
  assert.deepEqual(skillsFor(['nope', 'clicks', 'also-nope']), [
    'Explained what makes code run when you click',
  ]);
});

test('the same question twice is one piece of evidence', () => {
  assert.equal(skillsFor(['clicks', 'clicks', 'clicks']).length, 1);
});

test('a flood of ids cannot inflate a record', () => {
  const flood = Array.from({ length: 500 }, (_, i) => KNOWN_QUESTIONS[i % KNOWN_QUESTIONS.length]);
  assert.ok(skillsFor(flood).length <= MAX_QUESTIONS);
  assert.ok(skillsFor(flood).length <= KNOWN_QUESTIONS.length);
});

test('nothing in, nothing out', () => {
  assert.deepEqual(skillsFor(null), []);
  assert.deepEqual(skillsFor('clicks'), []);
  assert.deepEqual(skillsFor([]), []);
});

// ── What every sentence is allowed to say ───────────────────────────────────

test('every sentence describes something that happened', () => {
  for (const sentence of Object.values(SKILL_FOR_QUESTION)) {
    assert.match(sentence, /^(Found|Explained|Worked out|Traced)/);
  }
});

test('no sentence grades a child', () => {
  for (const sentence of Object.values(SKILL_FOR_QUESTION)) {
    assert.doesNotMatch(sentence, /master|expert|level|advanced|proficien|gifted|talent/i);
  }
});

test('the sentences match the ones the browser shows', () => {
  // If these drift, a parent sees one thing on the device where the child
  // worked and a different thing everywhere else.
  assert.equal(SKILL_FOR_QUESTION['loop-count'], 'Worked out how many times a loop repeats');
  assert.equal(SKILL_FOR_QUESTION.clicks, 'Explained what makes code run when you click');
  assert.equal(KNOWN_QUESTIONS.length, 5);
});

// ── What is safe to store ───────────────────────────────────────────────────

test('a real attempt comes through intact', () => {
  const attempt = normaliseAttempt({
    projectKey: 'p1d7jde5',
    projectTitle: 'Catch the falling stars',
    questionIds: ['starting-value', 'loop-count'],
  });
  assert.equal(attempt.projectKey, 'p1d7jde5');
  assert.equal(attempt.projectTitle, 'Catch the falling stars');
  assert.equal(attempt.skills.length, 2);
});

test('an attempt that showed nothing is not stored', () => {
  // A row saying "explained nothing" would quietly inflate every count built
  // on this table.
  assert.equal(normaliseAttempt({ projectKey: 'p1', questionIds: [] }), null);
  assert.equal(normaliseAttempt({ projectKey: 'p1' }), null);
});

test('an attempt with no project is not stored', () => {
  assert.equal(normaliseAttempt({ questionIds: ['clicks'] }), null);
  assert.equal(normaliseAttempt({ projectKey: '   ', questionIds: ['clicks'] }), null);
});

test('nonsense bodies do not throw', () => {
  for (const body of [null, undefined, 'a string', 42, [], { projectKey: 5 }]) {
    assert.doesNotThrow(() => normaliseAttempt(body));
    assert.equal(normaliseAttempt(body), null);
  }
});

test('an untitled project still gets a name', () => {
  assert.equal(normaliseAttempt({ projectKey: 'p1', questionIds: ['clicks'] }).projectTitle, 'a project');
});

test('a very long title is cut, not rejected', () => {
  const attempt = normaliseAttempt({
    projectKey: 'p1',
    projectTitle: 'x'.repeat(5000),
    questionIds: ['clicks'],
  });
  assert.equal(attempt.projectTitle.length, MAX_TITLE);
});

test('a very long project key is cut, not rejected', () => {
  const attempt = normaliseAttempt({
    projectKey: 'k'.repeat(5000),
    questionIds: ['clicks'],
  });
  assert.ok(attempt.projectKey.length <= 80);
});

test('a title that looks like markup is kept as text, not stripped', () => {
  // It is stored as text and never rendered as markup by anything that reads
  // it. Silently mangling a child's title would be a worse surprise than
  // storing exactly what they typed.
  const attempt = normaliseAttempt({
    projectKey: 'p1',
    projectTitle: '<b>My game</b>',
    questionIds: ['clicks'],
  });
  assert.equal(attempt.projectTitle, '<b>My game</b>');
});

// ── The line a parent reads ─────────────────────────────────────────────────

test('one project, one thing', () => {
  assert.equal(
    summarise([{ skills: ['Worked out how many times a loop repeats'] }]),
    'Explained 1 project, showing 1 thing they understood about their own code.'
  );
});

test('several projects and several things', () => {
  assert.equal(
    summarise([
      { skills: ['Worked out how many times a loop repeats', 'Explained what makes code run when you click'] },
      { skills: ['Found the starting value of a variable in their own code'] },
    ]),
    'Explained 2 projects, showing 3 different things they understood about their own code.'
  );
});

test('the same thing in two projects is still one thing', () => {
  const same = ['Worked out how many times a loop repeats'];
  assert.match(summarise([{ skills: same }, { skills: same }]), /showing 1 thing/);
});

test('nothing yet says nothing, rather than "0 projects"', () => {
  assert.equal(summarise([]), null);
  assert.equal(summarise(null), null);
  assert.equal(summarise([{ skills: [] }]), null);
});

test('it never mentions a score, a rank or a percentage', () => {
  const line = summarise([{ skills: ['Worked out how many times a loop repeats'] }]);
  assert.doesNotMatch(line, /%|\bscore\b|\bpoints\b|\brank\b|\bgrade\b/i);
});
