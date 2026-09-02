import { PUZZLE_CONFIGS } from './puzzleConfigs';
import fs from 'fs';
import path from 'path';

// ── The thirty puzzles for lessons 1 to 10 ───────────────────────────────────
//
// Live for months. Until 2 September 2026, twenty of the twenty-four that are
// meant to test something did not test it: they asked whether the right text
// appeared somewhere in the output rather than whether the output was right.
//
// The two that mattered most are the ones a child reaches last.
//   print(1)                    cleared the lesson 9 boss (define a function,
//                               return from it, call it)
//   print("hello") three times  cleared the lesson 10 boss, the final puzzle of
//                               the journey, and printed "Journey finished!"
//
// The outputs below were produced by running each puzzle's own hintCode with
// python3 rather than typed by hand, which is how the originals drifted from
// what the lessons teach.
const DEMOS = ['4-a', '4-b', '6-a', '7-a', '8-a', '10-a'];

// One cheat per fixed puzzle: the answer a child could hand in without doing
// the thing the puzzle exists to teach. Output is what python3 actually prints
// for that code.
const CHEATS = [
  ['9-boss',  'print(1)', '1\n'],
  ['10-boss', 'print("hello")\nprint("hello")\nprint("hello")', 'hello\nhello\nhello\n'],
  ['3-boss',  'print("Hello, Coder!")', 'Hello, Coder!\n'],
  ['3-a',     'print("Ada")\nprint("Lovelace")', 'Ada\nLovelace\n'],
  ['2-b',     'print("Alex years old")', 'Alex years old\n'],
  ['6-boss',  'print("Vowels: 30")', 'Vowels: 30\n'],
  ['8-boss',  'print("High scores: 13")', 'High scores: 13\n'],
  ['8-b',     'print([90, 85, 95])', '[90, 85, 95]\n'],
  ['10-b',    'print(["Alice", "Anna", "Amy"])', "['Alice', 'Anna', 'Amy']\n"],
  ['5-boss',  'for i in range(5):\n    print("Round 9")', 'Round 9\nRound 9\nRound 9\nRound 9\nRound 9\n'],
  ['2-boss',  'print("Name:")\nprint("Age:")\nprint("City:")', 'Name:\nAge:\nCity:\n'],
  ['9-a',     'print("Hello there!")\nprint("Hello there!")\nprint("Hello there!")', 'Hello there!\nHello there!\nHello there!\n'],
  ['5-a',     'for i in range(1, 6):\n    print(i)', '1\n2\n3\n4\n5\n'],
  ['9-boss',  'def add(a, b):\n    print("Sum:", a + b)\nadd(3, 4)', 'Sum: 7\n'],
  ['1-boss',  'print("-" * 10)\nprint("My Mission")\nprint("-" * 10)\nprint("extra")', '----------\nMy Mission\n----------\nextra\n'],
  ['1-a',     'print("hi")\nprint("hi")\nprint("hi")', 'hi\nhi\nhi\n'],
];

// A child who did the work correctly but chose their own names or wording must
// still pass. Replacing a validator that accepts wrong answers with one that
// rejects right ones is the worse of the two failures.
const CORRECT_VARIANTS = [
  ['9-b', 'def greet(name):\n    print("Hello, " + name + "!")\ngreet("Zoe")\ngreet("Kim")\ngreet("Raj")',
    'Hello, Zoe!\nHello, Kim!\nHello, Raj!\n'],
  ['10-boss', 'def greet_all(names):\n    for n in names:\n        print("Hello, " + n + "!")\ngreet_all(["Zoe", "Kim", "Raj", "Ada", "Sam"])',
    'Hello, Zoe!\nHello, Kim!\nHello, Raj!\nHello, Ada!\nHello, Sam!\n'],
  ['2-b', 'name = "Alex"\nage = 12\nprint(name + " has been coding since he was 12 years old.")',
    'Alex has been coding since he was 12 years old.\n'],
  ['1-a', 'print("Hello from Python!")\nprint("I like cats")\nprint("Bye")',
    'Hello from Python!\nI like cats\nBye\n'],
];

describe('legacy puzzle validators', () => {
  test('all thirty puzzles are present', () => {
    expect(Object.keys(PUZZLE_CONFIGS)).toHaveLength(30);
  });

  test.each(CHEATS)('%s rejects the cheat', (key, code, output) => {
    const result = PUZZLE_CONFIGS[key].validator(output, code);
    expect(result.pass).toBe(false);
    // A rejection with no explanation is barely better than a wrong pass.
    expect(result.message.length).toBeGreaterThan(20);
  });

  test.each(CORRECT_VARIANTS)('%s accepts a correct answer with the child s own values', (key, code, output) => {
    expect(PUZZLE_CONFIGS[key].validator(output, code).pass).toBe(true);
  });

  test('the demonstration puzzles still accept any output', () => {
    for (const key of DEMOS) {
      expect(PUZZLE_CONFIGS[key].validator('anything at all\n', 'print(1)').pass).toBe(true);
    }
  });

  test('nothing passes on empty output', () => {
    for (const [key, cfg] of Object.entries(PUZZLE_CONFIGS)) {
      expect(cfg.validator('', '').pass).toBe(false);
      expect(cfg.validator('   \n', '').pass).toBe(false);
    }
  });

  test('no validator uses a lookbehind, which older Safari cannot parse', () => {
    const src = fs.readFileSync(path.join(__dirname, 'puzzleConfigs.js'), 'utf8');
    expect(src).not.toMatch(/\(\?<[=!]/);
  });

  test('the puzzle page passes the code through, not just the output', () => {
    const page = fs.readFileSync(path.join(__dirname, 'JourneyPuzzle.js'), 'utf8');
    expect(page).toMatch(/useCallback\(\(output, code\)/);
    expect(page).toMatch(/config\.validator\(lastOutput, lastCode\)/);
  });
});

// ── Data defects, which no validator can recover ─────────────────────────────
//
// Separate from the validator problem. These puzzles would have failed to catch
// their own misconception even with a perfect validator, because the test data
// could not tell the right rule from the plausible wrong one.
//
//   8-b / 8-boss  scores were [75, 90, 60, 85, 55, 95] with no 80 in the list,
//                 so `score > 80` and `score >= 80` printed the same thing. The
//                 puzzle teaches the boundary and removed the boundary from the
//                 data. 80 added.
//   10-b          names had no capital A anywhere except first, so `"A" in name`
//                 and `name[0] == "A"` agreed. The puzzle is about indexing and
//                 a child who never indexed passed. "Mary-Anne" added. Ana,
//                 Sasha, Noah, Aaron and Dana all fail to separate them,
//                 because a lowercase a does not match "A".
//   6-b / 6-boss  found by applying the same question to the rest: the words
//                 had no capital vowel, so the "aeiouAEIOU" the hint asks for
//                 was indistinguishable from "aeiou". "Python" also had a
//                 single vowel, so `char == "o"` passed a vowel puzzle.
//                 Now "Adventure" and "Elephant".
//
// The question to ask of any puzzle teaching a boundary or a position: does the
// data contain the case that separates the right rule from the plausible wrong
// one. A >= needs an equal value present. A name[0] needs a mid-string match.
const MISCONCEPTIONS = [
  ['8-b', 'score > 80 rather than >= 80',
    'scores = [75, 90, 60, 85, 80, 55, 95]\nfor score in scores:\n    if score > 80:\n        print(score)',
    '90\n85\n95\n'],
  ['8-boss', 'score > 80 rather than >= 80',
    'scores = [75, 90, 60, 85, 80, 55, 95]\ncount = 0\nfor score in scores:\n    if score > 80:\n        count = count + 1\nprint("High scores:", count)',
    'High scores: 3\n'],
  ['10-b', '"A" in name rather than name[0] == "A"',
    'names = ["Alice", "Bob", "Anna", "Charlie", "Amy", "Mary-Anne"]\nfor name in names:\n    if "A" in name:\n        print(name)',
    'Alice\nAnna\nAmy\nMary-Anne\n'],
  ['6-b', 'lowercase vowels only, capital missed',
    'word = "Adventure"\nfor char in word:\n    if char in "aeiou":\n        print(char)',
    'e\nu\ne\n'],
  ['6-boss', 'lowercase vowels only, capital missed',
    'word = "Elephant"\ncount = 0\nfor char in word:\n    if char in "aeiou":\n        count = count + 1\nprint("Vowels:", count)',
    'Vowels: 2\n'],
];

describe('the data separates the right rule from the wrong one', () => {
  test.each(MISCONCEPTIONS)('%s rejects: %s', (key, _label, code, output) => {
    expect(PUZZLE_CONFIGS[key].validator(output, code).pass).toBe(false);
  });

  test('the boundary value is actually present in the scores list', () => {
    const src = fs.readFileSync(path.join(__dirname, 'puzzleConfigs.js'), 'utf8');
    expect(src).toMatch(/scores = \[75, 90, 60, 85, 80, 55, 95\]/);
  });

  test('a capital A appears somewhere other than first', () => {
    const src = fs.readFileSync(path.join(__dirname, 'puzzleConfigs.js'), 'utf8');
    expect(src).toMatch(/"Mary-Anne"/);
  });

  test('the vowel words contain a capital vowel', () => {
    const src = fs.readFileSync(path.join(__dirname, 'puzzleConfigs.js'), 'utf8');
    expect(src).toMatch(/word = "Adventure"/);
    expect(src).toMatch(/word = "Elephant"/);
  });
});
