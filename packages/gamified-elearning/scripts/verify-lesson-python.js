#!/usr/bin/env node
/**
 * Run every Python sample the lessons show a child, and check the promises hold.
 *
 * The unit tests check the grading logic. This checks the *content*: that the
 * code in each step actually runs, and that what a step claims will happen is
 * what really happens. Three things only running the code can find:
 *
 *   1. a sample that does not run at all — a typo, a bad indent
 *   2. a sample that runs but prints something other than the step's
 *      expectedOutput, so a child who does it correctly is marked wrong
 *   3. a multiple-choice step whose marked-correct answer is not what the code
 *      prints, which teaches the wrong thing and marks the right answer wrong
 *
 * The third is the one that matters most and the one a human proofread misses.
 *
 * Usage:  node scripts/verify-lesson-python.js
 * Needs:  python3 on PATH. Exits 0 with a notice if there isn't one, so this
 *         never becomes the reason a build fails on a machine without Python.
 */

'use strict';

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const LESSON_DIR = path.join(__dirname, '..', 'src', 'pages', 'Lessons', 'lessonData');
const PYTHON = process.env.PYTHON || 'python3';
const TIMEOUT_MS = 30_000;

function havePython() {
  try {
    execFileSync(PYTHON, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Load an ES-module lesson file into this CommonJS script. */
function loadLesson(file) {
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), {
    presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
    filename: file,
    configFile: false,
    babelrc: false,
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
  return mod.exports.default || mod.exports;
}

function run(code) {
  const result = spawnSync(PYTHON, ['-c', code], { encoding: 'utf8', timeout: TIMEOUT_MS });
  return { status: result.status, stdout: (result.stdout || '').trim(), stderr: (result.stderr || '').trim() };
}

function main() {
  if (!havePython()) {
    console.log(`Skipping: no ${PYTHON} on PATH. Lesson code was not checked.`);
    return 0;
  }

  const files = fs.readdirSync(LESSON_DIR)
    .filter(name => /^lesson\d+\.js$/.test(name))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));

  const problems = [];
  let checked = 0;

  for (const name of files) {
    const lesson = loadLesson(path.join(LESSON_DIR, name));
    (lesson.steps || []).forEach((step, index) => {
      if (!step.code) return;
      const where = `lesson ${lesson.id} step ${index} (${step.id || step.type})`;

      // A fragment is a couple of lines lifted out of a bigger program so the
      // child can look at them. Running it on its own proves nothing.
      if (step.fragment) return;

      checked += 1;
      const { status, stdout, stderr } = run(step.code);

      if (step.expectsError) {
        // The lesson's answer is "this crashes". If it stops crashing, the
        // answer key is wrong and a correct child gets marked down.
        if (status === 0) problems.push(`${where}: expected a crash, but it ran and printed ${JSON.stringify(stdout.slice(0, 60))}`);
        return;
      }

      if (status !== 0) {
        problems.push(`${where}: crashed — ${stderr.split('\n').pop()}`);
        return;
      }

      const check = step.expectedOutput || step.successPattern;
      if (check && !check.test(stdout)) {
        problems.push(`${where}: ${check} did not match the real output ${JSON.stringify(stdout.slice(0, 80))}`);
      }

      // A step cannot demand a keyword its own sample does not contain, or a
      // child who copies the answer exactly is told they are wrong.
      (step.expectedKeywords || []).forEach(keyword => {
        if (!step.code.toLowerCase().includes(String(keyword).toLowerCase())) {
          problems.push(`${where}: requires ${JSON.stringify(keyword)}, which is not in its own starter code`);
        }
      });

      if (step.type === 'predict' && Array.isArray(step.choices) && step.correct != null) {
        // Some predict steps are answered in words ("It crashes with an error")
        // rather than by quoting the output, so "the key must equal stdout" is
        // too strong. But if the real output IS one of the choices, then that
        // choice is the answer — and anything else marked correct is a lesson
        // telling a child the truth is wrong.
        //
        // An earlier version of this check guessed from the shape of the text
        // and let a wrong key through when every choice was plain words.
        const trimmed = step.choices.map(choice => String(choice).trim());
        const realIndex = trimmed.indexOf(stdout);
        if (realIndex !== -1 && realIndex !== step.correct) {
          problems.push(
            `${where}: marks choice ${step.correct} (${JSON.stringify(trimmed[step.correct])}) correct, `
            + `but the code prints ${JSON.stringify(stdout)}, which is choice ${realIndex}`
          );
        }
      }
    });
  }

  console.log(`Ran ${checked} Python samples from ${files.length} lessons.`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n`);
    problems.forEach(problem => console.error(`  ${problem}`));
    return 1;
  }
  console.log('Every sample runs and matches what its lesson promises.');
  return 0;
}

process.exit(main());
