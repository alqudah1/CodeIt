'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// ── Reading the quiz questions before a child does ───────────────────────────
//
// Sixty questions go into the database in one paste, and once they are in, a
// wrong `correct_option` is invisible: the quiz runs, the child answers
// correctly, and the screen says they are wrong. Nobody debugs that. They just
// decide they are bad at it.
//
// So the questions get read here, mechanically, before they are ever run.

const SQL = fs.readFileSync(
  path.join(__dirname, '..', '..', 'supabase', 'migrations',
    '20260820100000_curriculum_lessons_17_to_31.sql'),
  'utf8');

/** Split a SQL value list on commas that are not inside a quoted string. */
function splitValues(line) {
  const out = [];
  let current = '';
  let inString = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inString) {
      if (ch === "'" && line[i + 1] === "'") { current += "'"; i += 1; continue; }
      if (ch === "'") { inString = false; continue; }
      current += ch;
    } else if (ch === "'") {
      inString = true;
    } else if (ch === ',') {
      out.push(current.trim()); current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

const QUESTIONS = [...SQL.matchAll(
  /insert into public\.quiz_questions \([^)]*\)\s*\nselect ([\s\S]*?)\nwhere not exists/g)]
  .map(match => {
    const [quizId, text, a, b, c, d, correct, explanation] = splitValues(match[1]);
    return {
      quizId: Number(quizId),
      text,
      options: { A: a, B: b, C: c, D: d },
      correct,
      explanation,
    };
  });

const LESSON_IDS = [...SQL.matchAll(/^values \((\d+), '/gm)].map(m => Number(m[1]));

// ── Coverage ────────────────────────────────────────────────────────────────

test('every lesson from 17 to 31 gets a row', () => {
  assert.deepEqual(LESSON_IDS, Array.from({ length: 15 }, (_, i) => i + 17));
});

test('every one of those lessons ends in a real quiz', () => {
  assert.equal(QUESTIONS.length, 60, `parsed ${QUESTIONS.length} questions`);
  for (let quizId = 17; quizId <= 31; quizId += 1) {
    const mine = QUESTIONS.filter(q => q.quizId === quizId);
    assert.equal(mine.length, 4, `quiz ${quizId} has ${mine.length} questions, expected 4`);
  }
});

// ── Every question is answerable, and answerable correctly ──────────────────

test('the right answer is a letter that exists', () => {
  for (const q of QUESTIONS) {
    assert.match(q.correct, /^[ABCD]$/, `quiz ${q.quizId}: correct_option is "${q.correct}"`);
  }
});

test('the right answer points at an option that has words in it', () => {
  for (const q of QUESTIONS) {
    const answer = q.options[q.correct];
    assert.ok(answer && answer.length > 0,
      `quiz ${q.quizId}: option ${q.correct} is empty — "${q.text}"`);
  }
});

test('no question has two identical options', () => {
  // Two options reading the same thing means one correct answer is marked wrong.
  for (const q of QUESTIONS) {
    const values = Object.values(q.options);
    assert.equal(new Set(values).size, 4,
      `quiz ${q.quizId} repeats an option — "${q.text}"`);
  }
});

test('no question is asked twice in the same quiz', () => {
  for (let quizId = 17; quizId <= 31; quizId += 1) {
    const texts = QUESTIONS.filter(q => q.quizId === quizId).map(q => q.text);
    assert.equal(new Set(texts).size, texts.length, `quiz ${quizId} repeats a question`);
  }
});

test('the right answer is not always in the same place', () => {
  // Written by hand, forty-five of these sixty answers were B and not one was
  // D. A child who spots that scores three quarters without reading a single
  // question, and Prove It stops being evidence of anything.
  const spread = {};
  for (const q of QUESTIONS) spread[q.correct] = (spread[q.correct] || 0) + 1;
  for (const letter of ['A', 'B', 'C', 'D']) {
    assert.ok((spread[letter] || 0) >= 12,
      `only ${spread[letter] || 0} of 60 answers are ${letter}: ${JSON.stringify(spread)}`);
  }
});

test('no single quiz leans on one letter either', () => {
  // Four questions is a small enough sample that "it is always C" can be true
  // by accident inside one quiz even when the whole set is balanced.
  for (let quizId = 17; quizId <= 31; quizId += 1) {
    const letters = QUESTIONS.filter(q => q.quizId === quizId).map(q => q.correct);
    const most = Math.max(...['A', 'B', 'C', 'D']
      .map(letter => letters.filter(l => l === letter).length));
    assert.ok(most <= 2, `quiz ${quizId}'s answers are ${letters.join('')}`);
  }
});

// ── Being wrong has to teach something ──────────────────────────────────────

test('every question explains itself', () => {
  for (const q of QUESTIONS) {
    assert.ok(q.explanation && q.explanation.length > 25,
      `quiz ${q.quizId} explains nothing: "${q.text}"`);
  }
});

test('the questions are written for children, not for a spec', () => {
  const jargon = /instantiate|immutable|idempotent|invoke the|dereference|parameterised/i;
  for (const q of QUESTIONS) {
    assert.ok(!jargon.test(q.text), `quiz ${q.quizId} uses jargon: "${q.text}"`);
    assert.ok(q.text.length > 15, `quiz ${q.quizId} question is too short: "${q.text}"`);
  }
});

// ── Nothing in here may touch existing data ─────────────────────────────────

test('the migration cannot damage anything already in the database', () => {
  const dangerous = /\b(drop\s+(table|column|index|constraint)|truncate|delete\s+from|update\s+public\.)/i;
  const withoutComments = SQL.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');
  assert.ok(!dangerous.test(withoutComments), 'the migration contains a destructive statement');
  assert.ok(/^begin;$/m.test(SQL) && /^commit;$/m.test(SQL), 'it is not wrapped in a transaction');
});

test('running it twice does not double the questions', () => {
  const guards = (SQL.match(/where not exists/g) || []).length;
  assert.equal(guards, 60, `${guards} of 60 question inserts are guarded`);
  const lessonGuards = (SQL.match(/on conflict \(id\) do nothing/g) || []).length;
  assert.equal(lessonGuards, 15, `${lessonGuards} of 15 lesson inserts are guarded`);
});
