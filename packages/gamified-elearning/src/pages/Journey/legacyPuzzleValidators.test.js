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

// ── Legitimate alternative solutions ─────────────────────────────────────────
//
// The risk with a source check is the exact opposite of the one it fixes. A
// regex that is too strict rejects a child who solved the puzzle a different
// way, and being told no for a correct answer is worse than being told yes for
// a wrong one: the first teaches a child that the site is broken, the second
// only fails to teach them something.
//
// Twenty alternatives, each a real way a child might write it. Outputs are what
// python3 actually prints for that code, captured rather than typed.
const ALTERNATIVES = [
  ['1-b', 'single quotes', 'print(\'Space mail delivered via Python!\')', 'Space mail delivered via Python!\n'],
  ['1-boss', 'literal dashes', 'print("----------")\nprint("My Mission")\nprint("----------")', '----------\nMy Mission\n----------\n'],
  ['2-a', 'variables then f-string', 'name="Alex"\nage=12\ncity="London"\nprint(f"{name}")\nprint(f"{age}")\nprint(f"{city}")', 'Alex\n12\nLondon\n'],
  ['2-boss', 'f-strings', 'name="Alex"\nage=12\ncity="London"\nprint(f"Name: {name}")\nprint(f"Age: {age}")\nprint(f"City: {city}")', 'Name: Alex\nAge: 12\nCity: London\n'],
  ['3-a', 'f-string join', 'first="Ada"\nlast="Lovelace"\nprint(f"{first} {last}")', 'Ada Lovelace\n'],
  ['3-a', 'comma print', 'first="Ada"\nlast="Lovelace"\nprint(first, last)', 'Ada Lovelace\n'],
  ['3-b', 'variable then print', 'word="python"\nbig=word.upper()\nn=len(word)\nprint(big)\nprint("Letters:", n)', 'PYTHON\nLetters: 6\n'],
  ['3-boss', 'upper on the whole thing', 'name="coder"\ngreeting=("Hello, " + name + "!").upper()\nprint(greeting)', 'HELLO, CODER!\n'],
  ['5-a', 'while-free, range only', 'for i in range(0, 5):\n    print(i)', '0\n1\n2\n3\n4\n'],
  ['5-b', 'range with step', 'for i in range(1, 6, 1):\n    print(i)', '1\n2\n3\n4\n5\n'],
  ['5-boss', 'f-string in loop', 'for i in range(1, 6):\n    print(f"Round {i}")', 'Round 1\nRound 2\nRound 3\nRound 4\nRound 5\n'],
  ['6-b', 'cases reordered', 'word = "Adventure"\nfor char in word:\n    if char in "AEIOUaeiou":\n        print(char)', 'A\ne\nu\ne\n'],
  ['6-b', 'lower() comparison', 'word = "Adventure"\nfor char in word:\n    if char.lower() in "aeiou":\n        print(char)', 'A\ne\nu\ne\n'],
  ['6-boss', 'count plus-equals', 'word = "Elephant"\ncount = 0\nfor char in word:\n    if char in "aeiouAEIOU":\n        count += 1\nprint("Vowels:", count)', 'Vowels: 3\n'],
  ['8-b', 'not less-than', 'scores = [75, 90, 60, 85, 80, 55, 95]\nfor score in scores:\n    if not score < 80:\n        print(score)', '90\n85\n80\n95\n'],
  ['8-boss', 'count plus-equals', 'scores = [75, 90, 60, 85, 80, 55, 95]\ncount = 0\nfor score in scores:\n    if score >= 80:\n        count += 1\nprint("High scores:", count)', 'High scores: 4\n'],
  ['9-a', 'blank line between calls', 'def say_hi():\n    print("Hello there!")\n\nsay_hi()\n\nsay_hi()\n\nsay_hi()', 'Hello there!\nHello there!\nHello there!\n'],
  ['9-boss', 'print(add(...)) directly', 'def add(a, b):\n    return a + b\nprint("Sum:", add(3, 4))', 'Sum: 7\n'],
  ['10-b', 'startswith', 'names = ["Alice", "Bob", "Anna", "Charlie", "Amy", "Mary-Anne"]\nfor name in names:\n    if name.startswith("A"):\n        print(name)', 'Alice\nAnna\nAmy\n'],
  ['10-boss', 'f-string greeting', 'def greet_all(names):\n    for n in names:\n        print(f"Hello, {n}!")\ngreet_all(["Alice", "Bob", "Charlie"])', 'Hello, Alice!\nHello, Bob!\nHello, Charlie!\n'],
];

describe('a child who solved it differently is not blocked', () => {
  test.each(ALTERNATIVES)('%s accepts: %s', (key, _label, code, output) => {
    const result = PUZZLE_CONFIGS[key].validator(output, code);
    expect(result.pass).toBe(true);
  });

  test('the source checks are narrow enough to have alternatives at all', () => {
    // If this list ever shrinks to only the hintCode shape, the checks have
    // been tightened past the point of being fair.
    expect(ALTERNATIVES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ALTERNATIVES.map(a => a[0])).size).toBeGreaterThanOrEqual(15);
  });
});

// ── The three open-ended puzzles ─────────────────────────────────────────────
//
// 1-a says "say anything you like". 7-b says "one more fruit of your choice".
// 7-boss says "any three items". The answer is genuinely the child's, so there
// is no expected output and an output match cannot work. These check the code
// for the one thing each goal names, and the output wherever it still means
// something.
//
// Two ways round 7-b that a correct-looking printed list does not reveal:
// editing the literal at the top so cherry was never appended, and building a
// new list with +. And one round 7-boss: three appends onto a list that was
// already populated satisfies "use .append() three times" while never building
// the list up from nothing, which is what the puzzle is for.
const OPEN_ENDED_CHEATS = [
  ['7-b', 'literal edited, no append', 'fruits = ["apple", "banana", "cherry", "mango"]\nprint(fruits)', '[\'apple\', \'banana\', \'cherry\', \'mango\']\n'],
  ['7-b', 'plus concatenation', 'fruits = ["apple", "banana"]\nfruits = fruits + ["cherry", "mango"]\nprint(fruits)', '[\'apple\', \'banana\', \'cherry\', \'mango\']\n'],
  ['7-b', 'cherry typed, mango appended', 'fruits = ["apple", "banana", "cherry"]\nfruits.append("mango")\nfruits.append("kiwi")\nprint(fruits)', '[\'apple\', \'banana\', \'cherry\', \'mango\', \'kiwi\']\n'],
  ['7-boss', 'list started populated', 'items = ["sword", "map", "rope"]\nitems.append("a")\nitems.append("b")\nitems.append("c")\nprint(items)\nprint("Count:", len(items))', '[\'sword\', \'map\', \'rope\', \'a\', \'b\', \'c\']\nCount: 6\n'],
];

// Counting .append( occurrences in the source blocked the loop below, and a
// loop is a better answer than three separate lines: one call site, three
// appends. What the goal requires is that the items were appended rather than
// typed, and the printed list already proves how many arrived.
const OPEN_ENDED_ALTERNATIVES = [
  ['7-b', 'other order', 'fruits = ["apple", "banana"]\nfruits.append("mango")\nfruits.append("cherry")\nprint(fruits)', '[\'apple\', \'banana\', \'mango\', \'cherry\']\n'],
  ['7-boss', 'loop appends four', 'items = []\nfor x in ["a","b","c","d"]:\n    items.append(x)\nprint(items)\nprint("Count:", len(items))', '[\'a\', \'b\', \'c\', \'d\']\nCount: 4\n'],
  ['7-boss', 'numbers appended', 'items = []\nitems.append(1)\nitems.append(2)\nitems.append(3)\nprint(items)\nprint("Count:", len(items))', '[1, 2, 3]\nCount: 3\n'],
];

describe('the open-ended three', () => {
  test.each(OPEN_ENDED_CHEATS)('%s rejects: %s', (key, _label, code, output) => {
    expect(PUZZLE_CONFIGS[key].validator(output, code).pass).toBe(false);
  });

  test.each(OPEN_ENDED_ALTERNATIVES)('%s accepts: %s', (key, _label, code, output) => {
    expect(PUZZLE_CONFIGS[key].validator(output, code).pass).toBe(true);
  });
});

// ── Two boss puzzles that rejected children who were right ───────────────────
//
// Reported live, 3 September 2026.
//
// Lesson 1 boss told a child to add "your title", its own hint said to type
// print("My Title"), and the check demanded the literal string "My Mission". A
// child who copied the puzzle's hint was told they were wrong, and so was every
// child who did what the goal asked and used a title of their own.
//
// Lesson 9 boss said "call it with two numbers" and demanded exactly "Sum: 7",
// so print(add(5, 5)) failed, and print(add(3, 4)) failed too because the label
// was never mentioned anywhere.
//
// The two are fixed in opposite directions on purpose. A puzzle may check an
// exact line, or it may leave the answer open. It may not do one and say the
// other.
describe('the two boss puzzles that rejected correct work', () => {
  const banner = PUZZLE_CONFIGS['1-boss'].validator;
  const fn = PUZZLE_CONFIGS['9-boss'].validator;

  test('lesson 1 boss accepts the title the hint tells a child to type', () => {
    expect(banner('----------\nMy Title\n----------', '').pass).toBe(true);
  });

  test('lesson 1 boss accepts a title of the child\'s own', () => {
    expect(banner('----------\nSAMS SPACE MISSION\n----------', '').pass).toBe(true);
    expect(banner('----------\nMy Mission\n----------', '').pass).toBe(true);
  });

  test('lesson 1 boss still needs both dividers and a title between them', () => {
    expect(banner('----------\n----------', '').pass).toBe(false);
    expect(banner('My Title', '').pass).toBe(false);
    expect(banner('==========\nMy Title\n==========', '').pass).toBe(false);
    expect(banner('----------\n----------\n----------', '').pass).toBe(false);
    expect(banner('----------\nMy Title\n----------\nextra', '').pass).toBe(false);
  });

  test('lesson 9 boss now names the numbers and the label it checks for', () => {
    const config = PUZZLE_CONFIGS['9-boss'];
    expect(config.story).toMatch(/3 and 4/);
    expect(config.goals.join(' ')).toMatch(/Sum: 7/);
    expect(config.hints.join(' ')).toMatch(/print\("Sum:", add\(3, 4\)\)/);
  });

  test('lesson 9 boss passes the answer its own hints produce', () => {
    const code = 'def add(a, b):\n    return a + b\n\nprint("Sum:", add(3, 4))';
    expect(fn('Sum: 7', code).pass).toBe(true);
  });

  test('lesson 9 boss still requires a function that returns', () => {
    expect(fn('Sum: 7', 'print("Sum:", 3 + 4)').pass).toBe(false);
    expect(fn('Sum: 7', 'def add(a, b):\n    print(a + b)').pass).toBe(false);
  });
});
