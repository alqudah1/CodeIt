'use strict';

// ── One small Python task a day ─────────────────────────────────────────────
//
// Two minutes, three lines, a Run button: the thing a child can do every day
// on a phone, which a game build is not. Each quest names what the program
// must print, so it can be checked from its output alone, in the browser and
// again on the server, with no Python on the server.
//
// Kept word for word with src/pages/Home/pythonQuests.js on the frontend
// (pythonQuestsParity.test.js), so the day's quest is the same on both sides.

const DAY_MS = 24 * 60 * 60 * 1000;

const QUEST_XP = 15;

// Every quest is one small change to code that already runs. The starter does
// something close to the task and stops short of it; the child reads it, sees
// what it prints, and changes one thing.
//
// Until 17 November 2026 every starter was the finished answer. A child
// pressed Run on code they had not read and was paid 15 XP and a day on the
// streak, every day, under a card that says "Today's Python". The lessons ask
// a child to change a line and make their own; the quest asked them to press
// a button. So: `starter` is where the child begins and must not pass,
// `solution` is one way to finish (never sent to the browser by the server:
// see pythonQuestFor), and `hint` is the clue shown after a run that is not
// there yet. pythonQuests.test.js runs both in real Python.
const PYTHON_QUESTS = [
  {
    id: 'hello-name', title: 'Say hello to yourself',
    task: 'Put your own name in the quotes, then run it.',
    starter: 'name = "your name"\nprint("Hello, " + name + "!")\n',
    solution: 'name = "Sam"\nprint("Hello, " + name + "!")\n',
    hint: 'Line 1: swap the words your name for the name people call you. Keep the quotes.',
    mustPrint: ['Hello, '], mustNotPrint: ['your name'], mustUse: ['print'],
  },
  {
    id: 'three-movies', title: 'Three favourite things',
    task: 'The list has 2 movies. Add a third, so 3 lines are printed.',
    starter: 'movies = ["Inception", "Dune"]\nfor movie in movies:\n    print(movie)\n',
    solution: 'movies = ["Inception", "Dune", "Interstellar"]\nfor movie in movies:\n    print(movie)\n',
    hint: 'Line 1: after "Dune" type a comma, then your movie in quotes, before the ].',
    minLines: 3, mustUse: ['for', 'print'],
  },
  {
    id: 'count-to-ten', title: 'Count to ten',
    task: 'This counts to 5. Make it count to 10.',
    starter: 'for n in range(1, 6):\n    print(n)\n',
    solution: 'for n in range(1, 11):\n    print(n)\n',
    hint: 'range(1, 6) stops just before 6. Which number should it stop before, to reach 10?',
    mustPrint: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], mustUse: ['for', 'range'],
  },
  {
    id: 'times-table', title: 'The 5 times table',
    task: 'This prints the 2 times table. Make it the 5 times table: 5, 10, 15, up to 50.',
    starter: 'for n in range(1, 11):\n    print(n * 2)\n',
    solution: 'for n in range(1, 11):\n    print(n * 5)\n',
    hint: 'Line 2: n * 2 is what makes it the 2 times table. Change one number.',
    mustPrint: ['5', '10', '15', '20', '25', '30', '35', '40', '45', '50'], mustUse: ['for'],
  },
  {
    id: 'big-or-small', title: 'Big or small?',
    task: 'It prints big, because 250 is over 100. Change the number so it prints small.',
    starter: 'number = 250\nif number > 100:\n    print("big")\nelse:\n    print("small")\n',
    solution: 'number = 50\nif number > 100:\n    print("big")\nelse:\n    print("small")\n',
    hint: 'Line 1: pick any number that is not over 100.',
    mustPrint: ['small'], mustUse: ['if', 'else'],
  },
  {
    id: 'sum-list', title: 'Add them up',
    task: 'This adds 1 each lap, so it prints 3. Make it add the score, so it prints 50.',
    starter: 'scores = [12, 30, 8]\ntotal = 0\nfor s in scores:\n    total = total + 1\nprint(total)\n',
    solution: 'scores = [12, 30, 8]\ntotal = 0\nfor s in scores:\n    total = total + s\nprint(total)\n',
    hint: 'Line 4: s is the score in your hand on this lap. Add s, not 1.',
    mustPrint: ['50'], mustUse: ['for'],
  },
  {
    id: 'stars', title: 'A staircase of stars',
    task: 'This staircase stops at 2 stars. Make it 4 rows: 1 star, then 2, then 3, then 4.',
    starter: 'for n in range(1, 3):\n    print("*" * n)\n',
    solution: 'for n in range(1, 5):\n    print("*" * n)\n',
    hint: 'range(1, 3) stops just before 3. Which number should it stop before, to reach 4?',
    mustPrint: ['*', '**', '***', '****'], mustUse: ['for'],
  },
  {
    id: 'even-numbers', title: 'Only the even ones',
    task: 'This prints every number from 2 to 20. Make it print only the even ones.',
    starter: 'for n in range(2, 21):\n    print(n)\n',
    solution: 'for n in range(2, 21, 2):\n    print(n)\n',
    hint: 'range can take a third number, the size of each jump: range(2, 21, 2).',
    mustPrint: ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'], maxLines: 10, mustUse: ['for'],
  },
  {
    id: 'shout', title: 'SHOUT IT',
    task: 'This says pizza quietly. Use .upper() to shout it in capital letters.',
    starter: 'word = "pizza"\nprint(word)\n',
    solution: 'word = "pizza"\nprint(word.upper())\n',
    hint: 'Line 2: write word.upper() inside the print brackets.',
    mustUse: ['upper', 'print'], outputMatches: '^[^a-z]*[A-Z][^a-z]*$',
  },
  {
    id: 'countdown', title: 'Countdown',
    task: 'It counts down from 5 to 1 and stops. Add a last line that prints "Go!".',
    starter: 'for n in range(5, 0, -1):\n    print(n)\n',
    solution: 'for n in range(5, 0, -1):\n    print(n)\nprint("Go!")\n',
    hint: 'On a new line under the loop, with no spaces in front: print("Go!")',
    mustPrint: ['5', '4', '3', '2', '1', 'Go!'], mustUse: ['for'],
  },
  {
    id: 'password', title: 'The secret word',
    task: 'The guess is wrong, so it prints No way. Change the guess so it prints Welcome.',
    starter: 'secret = "dragon"\nguess = "frog"\nif guess == secret:\n    print("Welcome")\nelse:\n    print("No way")\n',
    solution: 'secret = "dragon"\nguess = "dragon"\nif guess == secret:\n    print("Welcome")\nelse:\n    print("No way")\n',
    hint: 'Line 2: the guess has to be exactly the same word as the secret.',
    mustPrint: ['Welcome'], mustUse: ['if', '=='],
  },
  {
    id: 'length', title: 'How long is it?',
    task: 'This prints the name. Make it print how many letters are in it, using len().',
    starter: 'name = "Alexandra"\nprint(name)\n',
    solution: 'name = "Alexandra"\nprint(len(name))\n',
    hint: 'Line 2: put name inside len( ), inside the print brackets: print(len(name))',
    mustUse: ['len', 'print'], outputMatches: '^\\s*\\d+\\s*$',
  },
  {
    id: 'squares', title: 'Square numbers',
    task: 'This prints 1 to 6. Make it print each number times itself: 1, 4, 9, 16, 25, 36.',
    starter: 'for n in range(1, 7):\n    print(n)\n',
    solution: 'for n in range(1, 7):\n    print(n * n)\n',
    hint: 'Line 2: a number times itself is n * n.',
    mustPrint: ['1', '4', '9', '16', '25', '36'], mustUse: ['for'],
  },
  {
    id: 'greet-all', title: 'Greet everyone',
    task: 'This prints the three names. Make it say hello to each one, like "Hi Maya".',
    starter: 'friends = ["Maya", "Leo", "Sam"]\nfor friend in friends:\n    print(friend)\n',
    solution: 'friends = ["Maya", "Leo", "Sam"]\nfor friend in friends:\n    print("Hi " + friend)\n',
    hint: 'Line 3: inside the brackets, put "Hi " + in front of friend.',
    minLines: 3, mustPrint: ['Hi '], mustUse: ['for'],
  },
];

function dayKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Days since 1 January 2026, the number a day's XP is filed under. */
function dayNumber(now = Date.now()) {
  const key = dayKey(now) || '2026-01-01';
  return Math.floor((new Date(`${key}T00:00:00Z`).getTime() - Date.UTC(2026, 0, 1)) / DAY_MS);
}

/** Today's quest. Offset by half the bank so it never lands on the same day as the game quest's twin. */
function pythonQuestFor(now = Date.now()) {
  const n = dayNumber(now) + 7;
  const index = ((n % PYTHON_QUESTS.length) + PYTHON_QUESTS.length) % PYTHON_QUESTS.length;
  // One way to finish is kept here for the tests. It is not part of what the
  // page is handed, so today's answer is not sitting in the response.
  const { solution, ...quest } = PYTHON_QUESTS[index];
  return { ...quest, day: dayKey(now), xp: QUEST_XP };
}

const lines = (output) => String(output || '').split('\n').map((l) => l.trim()).filter(Boolean);

/** The same program, whatever the spaces at the ends of its lines. */
const sameCode = (a, b) => {
  const tidy = (text) => String(text || '').replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').trim();
  return tidy(a) === tidy(b);
};

/**
 * Did this code and output do the task? Pure: the same answer in the browser
 * (so the child sees the tick at once) and on the server (so the XP is real).
 * Returns { ok, reason }.
 */
function checkPythonQuest(quest, code, output) {
  const src = String(code || '');
  const out = lines(output);
  // The code as it was handed over: it runs, and the task has not been done.
  if (quest.starter && sameCode(src, quest.starter)) return { ok: false, reason: 'That is the code as it came, and it runs. Now make the change the task asks for.' };
  if (/^❌|Traceback|Error:/.test(String(output || '').trim())) return { ok: false, reason: 'The program stopped with an error. Read the red line, fix it, and run again.' };
  for (const token of quest.mustUse || []) {
    if (!src.includes(token)) return { ok: false, reason: `Use ${token} in your code.` };
  }
  if (!out.length) return { ok: false, reason: 'Nothing was printed. Press Run.' };
  if (quest.minLines && out.length < quest.minLines) return { ok: false, reason: `Print at least ${quest.minLines} lines.` };
  if (quest.maxLines && out.length > quest.maxLines) return { ok: false, reason: `That printed ${out.length} lines. It should print ${quest.maxLines}.` };
  for (const banned of quest.mustNotPrint || []) {
    if (out.some((l) => l.includes(banned))) return { ok: false, reason: `It still prints "${banned}". Change that part.` };
  }
  for (const want of quest.mustPrint || []) {
    if (!out.some((l) => l === want || l.includes(want))) return { ok: false, reason: `The output should include "${want}".` };
  }
  if (quest.mustPrintOneOf && !quest.mustPrintOneOf.some((want) => out.some((l) => l.includes(want)))) {
    return { ok: false, reason: `Print one of: ${quest.mustPrintOneOf.map((w) => `"${w}"`).join(' or ')}.` };
  }
  if (quest.outputMatches && !out.some((l) => new RegExp(quest.outputMatches).test(l))) {
    return { ok: false, reason: 'The output is not quite right yet. Run it and look at what it prints.' };
  }
  return { ok: true, reason: '' };
}

// ── exports ──
module.exports = { PYTHON_QUESTS, QUEST_XP, pythonQuestFor, checkPythonQuest, dayNumber, dayKey };
