'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { PYTHON_QUESTS, pythonQuestFor, checkPythonQuest, dayNumber } = require('./pythonQuests');

test('every quest\'s own starter passes its own check when run as written', () => {
  // What each starter prints, by hand: the check must accept the honest answer.
  const expected = {
    'hello-name': 'Hello, Sam!', 'three-movies': 'Inception\nDune\nInterstellar',
    'count-to-ten': '1\n2\n3\n4\n5\n6\n7\n8\n9\n10', 'times-table': '5\n10\n15\n20\n25\n30\n35\n40\n45\n50',
    'big-or-small': 'big', 'sum-list': '50', 'stars': '*\n**\n***\n****',
    'even-numbers': '2\n4\n6\n8\n10\n12\n14\n16\n18\n20', 'shout': 'PIZZA', 'countdown': '5\n4\n3\n2\n1\nGo!',
    'password': 'Welcome', 'length': '9', 'squares': '1\n4\n9\n16\n25\n36', 'greet-all': 'Hi Maya\nHi Leo\nHi Sam',
  };
  for (const quest of PYTHON_QUESTS) {
    assert.ok(expected[quest.id] !== undefined, `no expected output for ${quest.id}`);
    assert.deepEqual(checkPythonQuest(quest, quest.starter, expected[quest.id]), { ok: true, reason: '' }, quest.id);
  }
});

test('a wrong answer is refused with a reason a child can act on', () => {
  const count = PYTHON_QUESTS.find((q) => q.id === 'count-to-ten');
  assert.match(checkPythonQuest(count, 'print(1)', '1').reason, /Use for/);
  assert.match(checkPythonQuest(count, 'for n in range(1, 5):\n    print(n)', '1\n2\n3\n4').reason, /"5"/);
  assert.match(checkPythonQuest(count, count.starter, '❌ NameError: name x is not defined').reason, /error/i);
  assert.match(checkPythonQuest(count, count.starter, '').reason, /Nothing was printed/);
  const shout = PYTHON_QUESTS.find((q) => q.id === 'shout');
  assert.equal(checkPythonQuest(shout, 'print("pizza".upper())', 'pizza').ok, false);
  assert.equal(checkPythonQuest(shout, 'print("pizza".upper())', 'PIZZA').ok, true);
});

test('the quest of the day is the same all day, changes tomorrow, and the bank is big enough', () => {
  assert.ok(PYTHON_QUESTS.length >= 14);
  const a = pythonQuestFor('2026-11-02T01:00:00Z'), b = pythonQuestFor('2026-11-02T23:00:00Z'), c = pythonQuestFor('2026-11-03T01:00:00Z');
  assert.equal(a.id, b.id); assert.notEqual(a.id, c.id);
  assert.equal(a.day, '2026-11-02'); assert.equal(a.xp, 15);
  assert.equal(dayNumber('2026-01-01T12:00:00Z'), 0);
  assert.equal(dayNumber('2026-11-02T12:00:00Z'), 305);
});

test('no quest text carries an em dash', () => {
  for (const q of PYTHON_QUESTS) assert.doesNotMatch(`${q.title} ${q.task} ${q.starter}`, /—/);
});
