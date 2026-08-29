// Every quiz, answered through the API the way a child answers it.
//
// Quizzes 1 to 16 existed only in production: no migration in this repository
// held a single one of their questions, so a database rebuilt from this repo
// came back with sixteen lessons whose quizzes said "no questions found". That
// is the kind of gap nothing notices until a restore, so this check exists to
// notice it.
//
// It also checks the thing that made the first draft of those questions
// useless: written naturally, 49 of 64 correct answers landed on B and none on
// D, so a child who picks B every time scores 77% and the quiz measures
// nothing.
//
//   node ops/checks/quizzes-check.js
//
// Needs the backend running against a database with the migrations applied, and
// a learner token in /tmp/token.txt. See screen-share.js for the setup.
const { Pool } = require('pg');

const API = process.env.CHECK_API || 'http://localhost:5000';
const DSN = process.env.DATABASE_URL || 'postgresql://postgres:localdev@localhost:5432/codeit_local';
const LETTERS = ['A', 'B', 'C', 'D'];

const problems = [];

async function main() {
  const token = require('fs').readFileSync(process.env.CODEIT_TOKEN_FILE || '/tmp/codeit-check-token', 'utf8').trim();
  const pool = new Pool({ connectionString: DSN, ssl: false });

  const { rows: lessons } = await pool.query('select id from lessons order by id');
  const { rows: bank } = await pool.query(
    'select quiz_id, question_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation from quiz_questions order by quiz_id, question_id'
  );

  // ── Every lesson has a quiz behind it ──────────────────────────────────────
  const byQuiz = new Map();
  for (const row of bank) {
    if (!byQuiz.has(row.quiz_id)) byQuiz.set(row.quiz_id, []);
    byQuiz.get(row.quiz_id).push(row);
  }
  for (const { id } of lessons) {
    const rows = byQuiz.get(id);
    if (!rows) { problems.push(`lesson ${id} has no quiz questions at all`); continue; }
    if (rows.length < 4) problems.push(`quiz ${id} has only ${rows.length} question(s)`);
  }

  // ── Each question is answerable ────────────────────────────────────────────
  for (const row of bank) {
    const options = [row.option_a, row.option_b, row.option_c, row.option_d];
    const where = `quiz ${row.quiz_id} q${row.question_id}`;
    if (options.some(o => !o || !String(o).trim())) problems.push(`${where}: an empty option`);
    if (new Set(options.map(o => String(o).trim())).size !== 4) problems.push(`${where}: two options are the same`);
    if (!LETTERS.includes(String(row.correct_option).trim().toUpperCase())) {
      problems.push(`${where}: correct_option is "${row.correct_option}"`);
    }
    if (!row.explanation || !String(row.explanation).trim()) problems.push(`${where}: no explanation`);
    if (!row.question_text || !String(row.question_text).trim()) problems.push(`${where}: no question`);
  }

  // ── Guessing one letter must not pass ──────────────────────────────────────
  // 25% is perfect and unreachable; the bar is that no letter is common enough
  // to carry a child over a pass mark on its own.
  const spread = { A: 0, B: 0, C: 0, D: 0 };
  for (const row of bank) spread[String(row.correct_option).trim().toUpperCase()] += 1;
  const worst = Math.max(...Object.values(spread));
  const share = worst / bank.length;
  if (share > 0.4) {
    problems.push(`answering the same letter every time scores ${Math.round(share * 100)}% — the spread is ${JSON.stringify(spread)}`);
  }

  // ── The API agrees with the database ───────────────────────────────────────
  // Answer every question of every quiz correctly, through the endpoint the
  // studio calls. A question the API cannot mark right is a question no child
  // can get right.
  let asked = 0;
  for (const [quizId, rows] of [...byQuiz.entries()].sort((a, b) => a[0] - b[0])) {
    for (const row of rows) {
      const letter = String(row.correct_option).trim().toUpperCase();
      const answer = row[`option_${letter.toLowerCase()}`];
      const res = await fetch(`${API}/api/quiz/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId: row.question_id, answer }),
      });
      if (!res.ok) { problems.push(`quiz ${quizId} q${row.question_id}: check returned ${res.status}`); continue; }
      const body = await res.json();
      if (body.correct !== true) {
        problems.push(`quiz ${quizId} q${row.question_id}: the stored correct answer is marked wrong by the API`);
      }
      asked += 1;
    }
  }

  await pool.end();

  console.log(`  ${lessons.length} lessons, ${byQuiz.size} quizzes, ${bank.length} questions`);
  console.log(`  answer spread A/B/C/D: ${spread.A}/${spread.B}/${spread.C}/${spread.D} — best single guess scores ${Math.round(share * 100)}%`);
  console.log(`  ${asked} answers marked right by the API`);

  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const problem of problems.slice(0, 25)) console.log(`  - ${problem}`);
    process.exit(1);
  }
  console.log('\nEvery lesson has a quiz, every question is answerable, and no letter carries a pass.');
  process.exit(0);
}

main().catch(error => { console.error(error.message); process.exit(1); });
