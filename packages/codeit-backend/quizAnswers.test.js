'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { correctText, checkAnswer } = require('./quizAnswers');

// ── A wrong answer says why ──────────────────────────────────────────────────
//
// 17 November 2026, a quiz taken as a child: "Not quite. The correct answer is
// 60." and nothing else, on every wrong answer, and a result screen saying
// "read the explanations below" above no explanations. Every question has one
// in the database. The route never read the column.

const ROW = { option_a: '60', option_b: '0', option_c: '30', option_d: '10', correct_option: 'A', explanation: ' total grows each lap: 10, then 30, then 60. ' };

test('the right option is found from its letter, whatever its case', () => {
  assert.equal(correctText(ROW), '60');
  assert.equal(correctText({ ...ROW, correct_option: 'd' }), '10');
  assert.equal(correctText({ ...ROW, correct_option: 'b ' }), '0');
  assert.equal(correctText({ ...ROW, correct_option: '' }), null);
});

test('a wrong answer is told the right one and why', () => {
  assert.deepEqual(checkAnswer(ROW, '10'), { correct: false, correctAnswerText: '60', explanation: 'total grows each lap: 10, then 30, then 60.' });
});

test('a right answer is told why too: a lucky guess learns something', () => {
  assert.deepEqual(checkAnswer(ROW, '60'), { correct: true, correctAnswerText: '60', explanation: 'total grows each lap: 10, then 30, then 60.' });
});

test('a question with no explanation sends none, not an empty box', () => {
  assert.equal(checkAnswer({ ...ROW, explanation: null }, '60').explanation, null);
  assert.equal(checkAnswer({ ...ROW, explanation: '   ' }, '60').explanation, null);
  const { explanation, ...bare } = ROW;
  assert.equal(checkAnswer(bare, '60').explanation, null);
});

test('the route reads the explanation, and still checks answers on a database without the column', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes', 'quiz.js'), 'utf8');
  assert.match(route, /SELECT option_a, option_b, option_c, option_d, correct_option, explanation FROM Quiz_Questions WHERE question_id = \?/);
  assert.match(route, /SELECT option_a, option_b, option_c, option_d, correct_option FROM Quiz_Questions WHERE question_id = \?/);
  assert.match(route, /res\.json\(checkAnswer\(rows\[0\], answer\)\)/);
  // The questions route still sends neither the answer nor the reason.
  const questions = route.slice(route.indexOf("router.get('/:quizId/questions'"), route.indexOf('// POST /check'));
  assert.ok(questions.length > 200);
  assert.doesNotMatch(questions, /correct_option|explanation/);
});

test('every question that goes into the database has an explanation to send', () => {
  const dir = path.join(__dirname, '..', '..', 'supabase', 'migrations');
  const files = ['20260828040000_quiz_questions_1_to_16.sql', '20260820100000_curriculum_lessons_17_to_31.sql'];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    const inserts = sql.match(/insert into public\.quiz_questions \(([^)]*)\)/gi) || [];
    assert.ok(inserts.length > 0, `${file} inserts questions`);
    for (const insert of inserts) assert.match(insert, /explanation\)$/i, `${file}: every insert names the explanation column`);
  }
});
