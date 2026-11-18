'use strict';

// /python-games-for-kids described the puzzles and never showed one. It now
// shows lesson 1's boss as the app defines it, with the replies its own check
// gives. This fails if that section disappears or quotes a reply the puzzle
// does not give.

const test = require('node:test');
const assert = require('node:assert');
const { PAGES } = require('./generate-static-seo');
const { loadPuzzleConfigs } = require('./content-loader');

test('the Python games page shows a real puzzle and its real replies', () => {
  const page = PAGES.find((p) => p.route === '/python-games-for-kids');
  const sections = page.sections || [];
  const boss = loadPuzzleConfigs()['1-boss'];
  const first = sections.find((s) => s.heading === `One puzzle, start to finish: ${boss.title}`);
  assert.ok(first, 'the puzzle example is missing');
  assert.ok(first.code.includes('print("----------")'));
  const reply = sections.find((s) => s.heading === 'What the puzzle says back');
  assert.ok(reply, 'the replies are missing');
  const said = (reply.after || []).join(' ');
  assert.ok(said.includes(boss.validator(reply.output).message), 'the success reply is not the one the puzzle gives');
});
