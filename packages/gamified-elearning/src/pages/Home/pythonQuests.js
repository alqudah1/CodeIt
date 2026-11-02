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

const PYTHON_QUESTS = [
  {
    id: 'hello-name', title: 'Say hello to yourself',
    task: 'Change the name to your own and print a greeting.',
    starter: 'name = "Sam"\nprint("Hello, " + name + "!")\n',
    mustPrint: ['Hello, '], mustUse: ['print'],
  },
  {
    id: 'three-movies', title: 'Three favourite things',
    task: 'Make a list of your 3 favourite movies and print each one on its own line.',
    starter: 'movies = ["Inception", "Dune", "Interstellar"]\nfor movie in movies:\n    print(movie)\n',
    minLines: 3, mustUse: ['for', 'print'],
  },
  {
    id: 'count-to-ten', title: 'Count to ten',
    task: 'Print the numbers 1 to 10, one per line, with a loop.',
    starter: 'for n in range(1, 11):\n    print(n)\n',
    mustPrint: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], mustUse: ['for', 'range'],
  },
  {
    id: 'times-table', title: 'The 5 times table',
    task: 'Print 5, 10, 15, up to 50, one per line.',
    starter: 'for n in range(1, 11):\n    print(n * 5)\n',
    mustPrint: ['5', '10', '15', '20', '25', '30', '35', '40', '45', '50'], mustUse: ['for'],
  },
  {
    id: 'big-or-small', title: 'Big or small?',
    task: 'Set a number. Print "big" if it is over 100, otherwise print "small".',
    starter: 'number = 250\nif number > 100:\n    print("big")\nelse:\n    print("small")\n',
    mustPrintOneOf: ['big', 'small'], mustUse: ['if', 'else'],
  },
  {
    id: 'sum-list', title: 'Add them up',
    task: 'Add up the scores in the list and print the total.',
    starter: 'scores = [12, 30, 8]\ntotal = 0\nfor s in scores:\n    total = total + s\nprint(total)\n',
    mustPrint: ['50'], mustUse: ['for'],
  },
  {
    id: 'stars', title: 'A staircase of stars',
    task: 'Print 1 star, then 2, then 3, then 4, each on its own line.',
    starter: 'for n in range(1, 5):\n    print("*" * n)\n',
    mustPrint: ['*', '**', '***', '****'], mustUse: ['for'],
  },
  {
    id: 'even-numbers', title: 'Only the even ones',
    task: 'Print the even numbers from 2 to 20, one per line.',
    starter: 'for n in range(2, 21, 2):\n    print(n)\n',
    mustPrint: ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'], mustUse: ['for'],
  },
  {
    id: 'shout', title: 'SHOUT IT',
    task: 'Print your favourite word in capital letters using .upper().',
    starter: 'word = "pizza"\nprint(word.upper())\n',
    mustUse: ['upper', 'print'], outputMatches: '^[^a-z]*[A-Z][^a-z]*$',
  },
  {
    id: 'countdown', title: 'Countdown',
    task: 'Count down from 5 to 1, then print "Go!".',
    starter: 'for n in range(5, 0, -1):\n    print(n)\nprint("Go!")\n',
    mustPrint: ['5', '4', '3', '2', '1', 'Go!'], mustUse: ['for'],
  },
  {
    id: 'password', title: 'The secret word',
    task: 'If the guess matches the secret, print "Welcome". Otherwise print "No way".',
    starter: 'secret = "dragon"\nguess = "dragon"\nif guess == secret:\n    print("Welcome")\nelse:\n    print("No way")\n',
    mustPrintOneOf: ['Welcome', 'No way'], mustUse: ['if', '=='],
  },
  {
    id: 'length', title: 'How long is it?',
    task: 'Print how many letters are in your name, using len().',
    starter: 'name = "Alexandra"\nprint(len(name))\n',
    mustUse: ['len', 'print'], outputMatches: '^\\s*\\d+\\s*$',
  },
  {
    id: 'squares', title: 'Square numbers',
    task: 'Print the squares of 1 to 6: 1, 4, 9, 16, 25, 36.',
    starter: 'for n in range(1, 7):\n    print(n * n)\n',
    mustPrint: ['1', '4', '9', '16', '25', '36'], mustUse: ['for'],
  },
  {
    id: 'greet-all', title: 'Greet everyone',
    task: 'Say hello to each friend in the list, like "Hi Maya".',
    starter: 'friends = ["Maya", "Leo", "Sam"]\nfor friend in friends:\n    print("Hi " + friend)\n',
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
  return { ...PYTHON_QUESTS[index], day: dayKey(now), xp: QUEST_XP };
}

const lines = (output) => String(output || '').split('\n').map((l) => l.trim()).filter(Boolean);

/**
 * Did this code and output do the task? Pure: the same answer in the browser
 * (so the child sees the tick at once) and on the server (so the XP is real).
 * Returns { ok, reason }.
 */
function checkPythonQuest(quest, code, output) {
  const src = String(code || '');
  const out = lines(output);
  if (/^❌|Traceback|Error:/.test(String(output || '').trim())) return { ok: false, reason: 'The program stopped with an error. Read the red line, fix it, and run again.' };
  for (const token of quest.mustUse || []) {
    if (!src.includes(token)) return { ok: false, reason: `Use ${token} in your code.` };
  }
  if (!out.length) return { ok: false, reason: 'Nothing was printed. Press Run.' };
  if (quest.minLines && out.length < quest.minLines) return { ok: false, reason: `Print at least ${quest.minLines} lines.` };
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
export { PYTHON_QUESTS, QUEST_XP, pythonQuestFor, checkPythonQuest, dayNumber, dayKey };
