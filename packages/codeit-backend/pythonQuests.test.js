'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { PYTHON_QUESTS, pythonQuestFor, checkPythonQuest, dayNumber } = require('./pythonQuests');

// What each quest's starter and solution print, by hand. Where python3 is on
// the machine (it is on the test runner) both are also run for real, so this
// table cannot drift from what Python does.
const PRINTS = {
  'hello-name': ['Hello, your name!', 'Hello, Sam!'],
  'three-movies': ['Inception\nDune', 'Inception\nDune\nInterstellar'],
  'count-to-ten': ['1\n2\n3\n4\n5', '1\n2\n3\n4\n5\n6\n7\n8\n9\n10'],
  'times-table': ['2\n4\n6\n8\n10\n12\n14\n16\n18\n20', '5\n10\n15\n20\n25\n30\n35\n40\n45\n50'],
  'big-or-small': ['big', 'small'],
  'sum-list': ['3', '50'],
  'stars': ['*\n**', '*\n**\n***\n****'],
  'even-numbers': ['2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20', '2\n4\n6\n8\n10\n12\n14\n16\n18\n20'],
  'shout': ['pizza', 'PIZZA'],
  'countdown': ['5\n4\n3\n2\n1', '5\n4\n3\n2\n1\nGo!'],
  'password': ['No way', 'Welcome'],
  'length': ['Alexandra', '9'],
  'squares': ['1\n2\n3\n4\n5\n6', '1\n4\n9\n16\n25\n36'],
  'greet-all': ['Maya\nLeo\nSam', 'Hi Maya\nHi Leo\nHi Sam'],
};

function realPython(code) {
  const { spawnSync } = require('node:child_process');
  const ran = spawnSync('python3', ['-I', '-c', code], { encoding: 'utf8', timeout: 10000 });
  if (ran.error || ran.status === null) return null;   // no python3 here
  return ran.status === 0 ? ran.stdout.replace(/\n$/, '') : `Error: ${ran.stderr.trim().split('\n').pop()}`;
}

test('a quest is not done until the child changes something: the code as it came is refused', () => {
  for (const quest of PYTHON_QUESTS) {
    assert.ok(PRINTS[quest.id], `no expected output for ${quest.id}`);
    const [starterPrints] = PRINTS[quest.id];
    // Handed back untouched, it is refused, and the child is told why.
    const untouched = checkPythonQuest(quest, quest.starter, starterPrints);
    assert.equal(untouched.ok, false, quest.id);
    assert.match(untouched.reason, /That is the code as it came, and it runs\./, quest.id);
    // And a space added to dodge that still does not pass: the output decides.
    const dodged = checkPythonQuest(quest, `${quest.starter}\n# changed\n`, starterPrints);
    assert.equal(dodged.ok, false, `${quest.id}: the starter's own output must not pass`);
    assert.ok(dodged.reason.length > 10, quest.id);
  }
});

test('every quest can be finished: its solution passes, and differs from the starter by one small change', () => {
  for (const quest of PYTHON_QUESTS) {
    const [, solutionPrints] = PRINTS[quest.id];
    assert.deepEqual(checkPythonQuest(quest, quest.solution, solutionPrints), { ok: true, reason: '' }, quest.id);
    // One line is written or rewritten, and no more than one is taken away.
    const before = quest.starter.split('\n').filter(Boolean);
    const after = quest.solution.split('\n').filter(Boolean);
    const written = after.filter((line) => !before.includes(line)).length;
    const removed = before.filter((line) => !after.includes(line)).length;
    assert.equal(written, 1, `${quest.id}: ${written} lines to write, and a quest is one change`);
    assert.ok(removed <= 1, `${quest.id}: ${removed} lines removed`);
    assert.ok(quest.hint && quest.hint.length > 20 && quest.hint.length < 120, `${quest.id} has a clue a child can read`);
  }
});

test('in real Python the starters print what a child will see, and the solutions print what is asked', (t) => {
  if (realPython('print(1)') !== '1') { t.skip('no python3 on this machine'); return; }
  for (const quest of PYTHON_QUESTS) {
    const [starterPrints, solutionPrints] = PRINTS[quest.id];
    assert.equal(realPython(quest.starter), starterPrints, `${quest.id}: the starter runs, without an error`);
    assert.equal(realPython(quest.solution), solutionPrints, `${quest.id}: the solution`);
  }
});

test('the answer is not in what the page is handed', () => {
  const today = pythonQuestFor('2026-11-17T10:00:00Z');
  assert.equal(today.solution, undefined);
  assert.ok(today.starter && today.hint && today.task);
});

test('a wrong answer is refused with a reason a child can act on', () => {
  const count = PYTHON_QUESTS.find((q) => q.id === 'count-to-ten');
  assert.match(checkPythonQuest(count, 'print(1)', '1').reason, /Use for/);
  assert.match(checkPythonQuest(count, 'for n in range(1, 5):\n    print(n)', '1\n2\n3\n4').reason, /"5"/);
  assert.match(checkPythonQuest(count, 'for n in range(1, 11):\n    print(x)', '❌ NameError: name x is not defined').reason, /error/i);
  assert.match(checkPythonQuest(count, 'for n in range(1, 1):\n    print(n)', '').reason, /Nothing was printed/);
  const evens = PYTHON_QUESTS.find((q) => q.id === 'even-numbers');
  assert.match(checkPythonQuest(evens, 'for n in range(1, 21):\n    print(n)', Array.from({ length: 20 }, (_, i) => i + 1).join('\n')).reason, /printed 20 lines\. It should print 10/);
  const hello = PYTHON_QUESTS.find((q) => q.id === 'hello-name');
  assert.match(checkPythonQuest(hello, 'name = "your name"\nprint("Hello, " + name + "!!")', 'Hello, your name!!').reason, /still prints "your name"/);
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
  for (const q of PYTHON_QUESTS) assert.doesNotMatch(`${q.title} ${q.task} ${q.starter} ${q.solution} ${q.hint}`, /—/);
});
