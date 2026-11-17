'use strict';

// ── What a quiz answer is checked against, and what the child is told ───────
//
// Pure, so it can be read by a test without a database or a secret. The route
// (routes/quiz.js) reads the row; this decides what to say about it.

/** The text of the right option: correct_option is a letter, the page sends text. */
function correctText(row) {
  const map = {
    A: row.option_a,
    B: row.option_b,
    C: row.option_c,
    D: row.option_d,
  };
  return map[String(row.correct_option || '').trim().toUpperCase()] || null;
}

/**
 * What POST /api/quiz/check answers: the verdict, the right answer, and why.
 *
 * The explanation is sent with the verdict, never before it, like the answer
 * itself. A question with none sends null, and the page shows nothing.
 */
function checkAnswer(row, answer) {
  const ct = correctText(row);
  const why = typeof row.explanation === 'string' ? row.explanation.trim() : '';
  return { correct: answer === ct, correctAnswerText: ct, explanation: why || null };
}

module.exports = { correctText, checkAnswer };
