// Puzzle configurations for the Journey system
// id = lessonId * 100 + slot (1=A, 2=B, 3=Boss)
// validator(output) => { pass: bool, message: string }


// ── How these puzzles are checked ────────────────────────────────────────────
//
// The thirty puzzles for lessons 1 to 10 have been live for months, and until
// 2 September 2026 twenty of the twenty-four that are meant to test something
// did not test it. They asked whether the right text appeared somewhere in the
// output, not whether the output was right.
//
// The two worst were the ones a child reaches last:
//   print(1)                      cleared the lesson 9 boss, whose task is to
//                                 define a function, return from it, and call it
//   print("hello") three times    cleared the lesson 10 boss, the final puzzle
//                                 of the journey, and printed "Journey finished!"
//
// Others: 3-boss taught .upper() and accepted any single capital letter
// anywhere, so "Hello, Coder!" passed. 3-a had a dead branch that could never
// fire, so "Ada" and "Lovelace" on separate lines passed a puzzle about joining
// them. 6-boss and 8-boss counted three by looking for the character "3", so
// "Vowels: 30" passed. 8-b and 10-b asked for a loop with a condition and
// accepted the list printed whole.
//
// Every expected output below was DERIVED by running the puzzle's own hintCode,
// not typed by hand. Typing them is how the old ones drifted from what the
// lesson actually teaches.
//
// Two rules:
//   exact()    the output must be these lines, in this order, and nothing else.
//   requires   a source check, used only where the stated goal names something
//              the output cannot reveal: a function was defined, a value was
//              returned, a loop was written. Where the output can show it, the
//              output is what gets checked. A regex for "def" is easy to
//              satisfy without understanding, so it is the last resort rather
//              than the first.
//
// No lookbehind in any pattern. Safari support is recent and this runs on
// whatever a child's family owns.

const NO_OUTPUT = { pass: false, message: 'Run your code first. No output detected.' };

function cleanLines(output) {
  return String(output || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('\u274c'));
}

/**
 * Ordered, exact line matching with a diagnosis that names the wrong value.
 *
 * The first difference is reported BEFORE the line count. Checking the count
 * first meant three different mistakes that happen to produce the same number
 * of lines all got the same sentence back, which tells a child nothing about
 * which mistake they made.
 */
function exact(expected, concept, done = 'Puzzle complete! Great work.') {
  return (output, code = '') => {
    const lines = cleanLines(output);
    if (!lines.length) return NO_OUTPUT;
    const overlap = Math.min(lines.length, expected.length);
    for (let i = 0; i < overlap; i += 1) {
      if (lines[i] !== expected[i]) {
        return { pass: false, message: `Line ${i + 1} shows "${lines[i]}" but should show "${expected[i]}". ${concept}` };
      }
    }
    if (lines.length > expected.length) {
      return { pass: false, message: `Line ${expected.length + 1} shows "${lines[overlap]}" but nothing should print after line ${expected.length}. ${concept}` };
    }
    if (lines.length < expected.length) {
      return { pass: false, message: `Only ${lines.length} of ${expected.length} line(s) printed. The next one should be "${expected[overlap]}". ${concept}` };
    }
    return { pass: true, message: done };
  };
}

/** Source checks run before the output is looked at, so the advice matches the gap. */
function requires(checks, next) {
  return (output, code = '') => {
    const src = String(code || '');
    // With no source available the source checks are skipped rather than
    // failed. JourneyPuzzle passes it; a caller that does not must not be told
    // the child did nothing wrong in a way that blocks them.
    if (src.trim()) {
      for (const [pattern, message] of checks) {
        if (!pattern.test(src)) return { pass: false, message };
      }
    }
    return next(output, src);
  };
}

/**
 * "Defined but never called": strip the def lines, then look for the call.
 *
 * A helper that built the call regex was written alongside this and never
 * used, because each caller needs a slightly different shape. Deleted rather
 * than kept: an unused export is a thing the next person has to read and rule
 * out. CI catches it, which is why CI treats warnings as errors.
 */
function bodyWithoutDefs(code) {
  return String(code || '').replace(/^\s*def\s+.*$/gm, '');
}

const nonEmpty = (output) => {
  const lines = output.split('\n').filter(l => l.trim() && !l.startsWith('❌'));
  if (lines.length === 0) return { pass: false, message: 'Run your code first. No output detected.' };
  return { pass: true, message: 'Puzzle complete! Great work.' };
};

export const PUZZLE_CONFIGS = {

  // ──── LESSON 1: Hello Python ──────────────────────────────────────────────
  // Lesson teaches: print(), simple strings, output
  // Puzzle A: add 2 more print lines (basic print practice)
  // Puzzle B: fix a broken print string (read and fix)
  // Boss:     print a 3-line banner (combine multiple prints)

  '1-a': {
    id: 101,
    nextJourneyRoute: '/journey/puzzle/1/b?from=journey&node=puzzle1b',
    title: 'Hello World!',
    story: 'The first print is done. Add two more print lines below it. Say anything you like!',
    goals: [
      'Add two more print("...") lines below the first one',
      'See 3 different messages in the output',
    ],
    hints: [
      'Add more print() lines below.',
      'Each print() shows one line of output.',
      'Try: print("Hello again!")',
    ],
    hintCode: `print("Hello from Python!")\nprint("Hello again!")\nprint("One more!")`,
    starterCode: `print("Hello from Python!")\n# Add two more print lines below:\n`,
    validator: (output) => {
      const lines = cleanLines(output);
      if (!lines.length) return NO_OUTPUT;
      if (lines.length < 3) {
        return { pass: false, message: `Got ${lines.length} line(s). Add ${3 - lines.length} more print() line(s).` };
      }
      // "3 different messages" is the stated goal, so three copies of the same
      // line is not it.
      if (new Set(lines).size < 3) {
        return { pass: false, message: 'Three lines printed, but some are the same. Make each message different.' };
      }
      return { pass: true, message: 'Three messages sent! Great work.' };
    },
  },

  '1-b': {
    id: 102,
    nextJourneyRoute: '/journey/puzzle/1/boss?from=journey&node=boss1',
    title: 'Space Mail',
    story: 'The message is almost ready. Replace ___ with the word Python to fix it!',
    goals: [
      'Replace ___ inside the print with the word Python',
      'Output must read: Space mail delivered via Python!',
    ],
    hints: [
      'Find ___ and replace it.',
      'It goes inside the quotes.',
      'Change ___ to: Python',
    ],
    hintCode: `print("Space mail delivered via Python!")`,
    starterCode: `# Fix this line. Replace ___ with Python\nprint("Space mail delivered via ___!")\n`,
    validator: exact(['Space mail delivered via Python!'], 'print() shows exactly what is inside the quotes.', 'Message fixed!'),
  },

  '1-boss': {
    id: 103,
    nextJourneyRoute: '/lesson/2?from=journey&node=lesson2',
    title: 'Mission Banner',
    story: 'Print a 3-line banner: a divider line, your title message, then another divider line.',
    goals: [
      'The first divider is already there. Add your title on the next line',
      'Add another divider line at the end',
    ],
    hints: [
      'You need 3 print lines total.',
      'Add your title between the two dividers.',
      'Try: print("My Title")',
    ],
    hintCode: `print("----------")\nprint("My Mission")\nprint("----------")`,
    starterCode: `# A banner has 3 lines: divider, title, divider\nprint("----------")\n# Add your title here:\n\n# Add the closing divider here:\n`,
    validator: exact(['----------', 'My Mission', '----------'], 'Three print() lines: the dashes, the title, the dashes again.', 'Banner printed!'),
  },

  // ──── LESSON 2: Variables ─────────────────────────────────────────────────
  // Lesson teaches: store values in variables, print variables
  // Puzzle A: three variables given — print each one (basic variable printing)
  // Puzzle B: combine two variables into one sentence (slightly harder)
  // Boss:     print a profile card with labels (combines label strings + variables)

  '2-a': {
    id: 201,
    nextJourneyRoute: '/journey/puzzle/2/b?from=journey&node=puzzle2b',
    title: 'Variable Vault',
    story: 'Three variables hold the access codes. Print each one to unlock the vault.',
    goals: [
      'Use print(name) to print the name value',
      'Do the same for age and city',
    ],
    hints: [
      'Use the variable name inside print().',
      'No quotes. Write: print(name)',
      'Do the same for age and city.',
    ],
    hintCode: `name = "Alex"\nage = 12\ncity = "London"\n\nprint(name)\nprint(age)\nprint(city)`,
    starterCode: `name = "Alex"\nage = 12\ncity = "London"\n\n# Print all three variables below:\n`,
    validator: exact(['Alex', '12', 'London'], 'Store each value in a variable, then print the variable.', 'Variables stored!'),
  },

  '2-b': {
    id: 202,
    nextJourneyRoute: '/journey/puzzle/2/boss?from=journey&node=boss2',
    title: 'My Introduction',
    story: 'Use the name and age variables to print one sentence about yourself.',
    goals: [
      'Print one sentence that includes both name and age',
      'The output must include the phrase "years old"',
    ],
    hints: [
      'Print both variables in one line.',
      'Use commas: print(name, "is", age)',
      'Try: print(name, "is", age, "years old.")',
    ],
    hintCode: `name = "Alex"\nage = 12\n\nprint(name, "is", age, "years old.")`,
    starterCode: `name = "Alex"\nage = 12\n\n# Print one sentence using both variables.\n# Hint: print(name, "is", age, "years old.")\n`,
    // The values here are the CHILD'S OWN CHOICE, so an exact match against the
    // hintCode would replace a validator that accepts wrong answers with one
    // that rejects right ones. That is the worse of the two failures. Caught by
    // reading the stated goal rather than trusting the derived output.
    validator: (output) => {
      const lines = cleanLines(output);
      if (!lines.length) return NO_OUTPUT;
      if (lines.length !== 1) {
        return { pass: false, message: `Got ${lines.length} lines, expected 1. Print one sentence that uses both variables.` };
      }
      const line = lines[0];
      if (!line.includes('Alex')) {
        return { pass: false, message: `The sentence shows "${line}" with no name in it. Use the name variable.` };
      }
      if (!/\b12\b/.test(line)) {
        return { pass: false, message: `The sentence shows "${line}" with no age in it. Use the age variable rather than leaving it out.` };
      }
      if (!/years old/i.test(line)) {
        return { pass: false, message: `The sentence shows "${line}". It needs to include the phrase "years old".` };
      }
      return { pass: true, message: 'Sentence built!' };
    },
  },

  '2-boss': {
    id: 203,
    nextJourneyRoute: '/lesson/3?from=journey&node=lesson3',
    title: 'Profile Card',
    story: 'Build a profile card that shows Name, Age, and City. Each on its own labelled line.',
    goals: [
      'Print "Name:" followed by the name value',
      'Print "Age:" and "City:" with their values on separate lines',
    ],
    hints: [
      'Each line: label + variable.',
      'Try: print("Name:", name)',
      'Repeat for Age: and City:',
    ],
    hintCode: `name = "Alex"\nage = 12\ncity = "London"\n\nprint("Name:", name)\nprint("Age:", age)\nprint("City:", city)`,
    starterCode: `name = "Alex"\nage = 12\ncity = "London"\n\n# Print the profile card below:\n# Example first line: print("Name:", name)\n`,
    validator: exact(['Name: Alex', 'Age: 12', 'City: London'], 'Print a label and its variable on each line.', 'Profile card printed!'),
  },

  // ──── LESSON 3: Strings ───────────────────────────────────────────────────
  // Lesson teaches: string + concatenation, .upper(), .lower(), len()
  // Puzzle A: join two strings with + (fill in the blank)
  // Puzzle B: use .upper() on a name variable
  // Boss:     build a greeting string and print it UPPERCASE

  '3-a': {
    id: 301,
    nextJourneyRoute: '/journey/puzzle/3/b?from=journey&node=puzzle3b',
    title: 'String Joiner',
    story: 'Join a first name and last name into one full name. Use + to connect them!',
    goals: [
      'Use + to join first and last with a space in between',
      'Print the full name on one line',
    ],
    hints: [
      'Use + to join the two names.',
      'Add " " in the middle for a space.',
      'Try: print(first + " " + last)',
    ],
    hintCode: `first = "Ada"\nlast = "Lovelace"\n\nprint(first + " " + last)`,
    starterCode: `first = "Ada"\nlast = "Lovelace"\n\n# Join first + " " + last and print the result:\n`,
    validator: exact(['Ada Lovelace'], 'Join the two names with + and a space between them.', 'Names joined!'),
  },

  '3-b': {
    id: 302,
    nextJourneyRoute: '/journey/puzzle/3/boss?from=journey&node=boss3',
    title: 'String Tricks',
    story: 'Print the name in UPPERCASE, then print how many letters it has.',
    goals: [
      'Add print(name.upper()) to see the name in all caps',
      'Add print("Letters:", len(name)) to count the letters',
    ],
    hints: [
      'Call .upper() on the variable.',
      'Use len() to count the letters.',
      'Try: print(name.upper()) then print("Letters:", len(name))',
    ],
    hintCode: `name = "Python"\n\nprint(name.upper())\nprint("Letters:", len(name))`,
    starterCode: `name = "Python"\n\n# Print the name in UPPERCASE:\n\n# Print the number of letters:\n`,
    validator: requires([[/\.upper\s*\(/, 'Use .upper() to make the word uppercase.'], [/\blen\s*\(/, 'Use len() to count the letters.']], exact(['PYTHON', 'Letters: 6'], 'Use .upper() for the word and len() for the count.', 'String tools working!')),
  },

  '3-boss': {
    id: 303,
    nextJourneyRoute: '/quiz/11?from=journey&node=bigquiz1',
    title: 'Message Builder',
    story: 'Build a greeting message by joining strings, then print it in UPPERCASE.',
    goals: [
      'Join "Hello, " + name + "!" into one string',
      'Print the full greeting in UPPERCASE',
    ],
    hints: [
      'Join the parts with +.',
      'Call .upper() on the result.',
      'Try: greeting = "Hello, " + name + "!" then print(greeting.upper())',
    ],
    hintCode: `name = "Coder"\n\ngreeting = "Hello, " + name + "!"\nprint(greeting.upper())`,
    starterCode: `name = "Coder"\n\n# Build the greeting: "Hello, " + name + "!"\n# Then print it in UPPERCASE\n`,
    validator: requires([[/\.upper\s*\(/, 'The whole greeting has to be uppercase. Use .upper() on it.']], exact(['HELLO, CODER!'], 'Build the greeting first, then call .upper() on the whole thing.', 'Loud greeting sent!')),
  },

  // ──── LESSON 4: Conditionals ──────────────────────────────────────────────
  // Lesson teaches: if / elif / else
  // Puzzle A: complete if/elif/else code — run it and see how branching works
  // Puzzle B: complete grade checker — run it and observe elif chain
  // Boss:     loop + if/elif/else — add the missing Warm and Cold print lines

  '4-a': {
    id: 401,
    title: 'Weather Check',
    story: 'Run the code and watch Python choose Hot, Warm, or Cold based on the temperature.',
    goals: [
      'Click Run to see which message the if/elif/else prints',
      'Try changing the temperature number and run again',
    ],
    hints: [
      'Just click Run. No code to add.',
      'Change the temperature number.',
      'Try 10, 25, or 35 to see each branch.',
    ],
    starterCode: `temperature = 35\n\nif temperature > 30:\n    print("Hot!")\nelif temperature > 15:\n    print("Warm")\nelse:\n    print("Cold")`,
    validator: nonEmpty,
  },

  '4-b': {
    id: 402,
    title: 'Grade Checker',
    story: 'Run the code to see which grade the score earns. Then try a different score!',
    goals: [
      'Click Run to see the grade for score 85',
      'Change the score number and run again to see a different grade',
    ],
    hints: [
      'Just click Run.',
      'Change the score number.',
      'Try 95, 75, or 55.',
    ],
    starterCode: `score = 85\n\nif score >= 90:\n    print("Grade: A")\nelif score >= 80:\n    print("Grade: B")\nelif score >= 70:\n    print("Grade: C")\nelse:\n    print("Grade: F")`,
    validator: nonEmpty,
  },

  '4-boss': {
    id: 403,
    title: 'Temperature Report',
    story: 'Two temperatures need checking. Add the missing Warm and Cold messages.',
    goals: [
      'Add print("Warm day!") inside the first elif block',
      'Add print("Cold day!") inside the second else block',
    ],
    hints: [
      'Find the elif and else blocks.',
      'Add print("Warm day!") inside the elif.',
      'Add print("Cold day!") inside the else.',
    ],
    hintCode: `temp1 = 22\nif temp1 > 30:\n    print("Hot day!")\nelif temp1 > 15:\n    print("Warm day!")\n\ntemp2 = 8\nif temp2 > 30:\n    print("Hot day!")\nelif temp2 > 15:\n    print("Warm day!")\nelse:\n    print("Cold day!")`,
    starterCode: `temp1 = 22\nif temp1 > 30:\n    print("Hot day!")\nelif temp1 > 15:\n    # Add: print("Warm day!")\n\ntemp2 = 8\nif temp2 > 30:\n    print("Hot day!")\nelif temp2 > 15:\n    print("Warm day!")\nelse:\n    # Add: print("Cold day!")\n`,
    validator: exact(['Warm day!', 'Cold day!'], 'One if for the warm day and one for the cold day.', 'Both branches worked!'),
  },

  // ──── LESSON 5: Simple Repetition ────────────────────────────────────────
  // Lesson teaches: for i in range(n), for i in range(start, stop), using i
  // Puzzle A: add print(i) inside a ready loop
  // Puzzle B: count from 1 to 5 using range(1, 6)
  // Boss:     print "Round 1" through "Round 5" (loop + string + number)

  '5-a': {
    id: 501,
    title: 'Repeat It',
    story: 'The loop is ready. The print line is missing! Add print(i) inside it.',
    goals: [
      'Type print(i) inside the loop (indented with 4 spaces)',
      'See 5 numbers printed from 0 to 4',
    ],
    hints: [
      'Add a line inside the loop.',
      'The loop variable is called i.',
      'Type: print(i) indented 4 spaces.',
    ],
    hintCode: `for i in range(5):\n    print(i)`,
    starterCode: `for i in range(5):\n    # Type: print(i)\n`,
    validator: requires([[/\bfor\b[\s\S]*\bin\b/, 'Write a for loop. Printing the numbers one at a time is not a loop.']], exact(['0', '1', '2', '3', '4'], 'print(i) inside the loop prints the counter, 0 to 4.', 'Loop running!')),
  },

  '5-b': {
    id: 502,
    title: 'Count Up',
    story: 'Print the numbers 1 through 5. use range(1, 6) to start at 1.',
    goals: [
      'Use for i in range(1, 6) to count from 1 to 5',
      'Print i on each loop step',
    ],
    hints: [
      'Add print(i) inside the loop.',
      'range(1, 6) starts at 1.',
      'Type: print(i) indented under the for.',
    ],
    hintCode: `# Count from 1 to 5\nfor i in range(1, 6):\n    print(i)`,
    starterCode: `# Count from 1 to 5\nfor i in range(1, 6):\n    # Type: print(i)\n`,
    validator: requires([[/\bfor\b[\s\S]*\bin\b/, 'Write a for loop rather than five print lines.']], exact(['1', '2', '3', '4', '5'], 'range(1, 6) counts 1 to 5.', 'Counted to five!')),
  },

  '5-boss': {
    id: 503,
    title: 'Round Counter',
    story: 'Use a loop to print "Round 1", "Round 2", all the way to "Round 5".',
    goals: [
      'Use for i in range(1, 6) to count from 1 to 5',
      'Print "Round" and the number on each line',
    ],
    hints: [
      'Print inside the loop.',
      'i counts from 1 to 5.',
      'Try: print("Round", i)',
    ],
    hintCode: `for i in range(1, 6):\n    print("Round", i)`,
    starterCode: `# Print: Round 1, Round 2, Round 3, Round 4, Round 5\nfor i in range(1, 6):\n    # Add your print here\n`,
    validator: requires([[/\bfor\b[\s\S]*\bin\b/, 'Write a for loop rather than five print lines.']], exact(['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5'], 'Print the word Round and the counter together inside the loop.', 'Five rounds printed!')),
  },

  // ──── LESSON 6: For Loops ─────────────────────────────────────────────────
  // Lesson teaches: for char in string, loop + if
  // Puzzle A: loop through a string (run it, then try your name)
  // Puzzle B: loop + if — print only vowels
  // Boss:     count how many vowels are in a word

  '6-a': {
    id: 601,
    title: 'Letter Loop',
    story: 'Run the code to print each letter in a word, one per line.',
    goals: [
      'Click Run to see each letter printed',
      'Change "Python" to your own name and run again',
    ],
    hints: [
      'Just click Run. No code needed.',
      'Change the word and run again.',
      'Try your own name instead of "Python".',
    ],
    starterCode: `word = "Adventure"\nfor char in word:\n    print(char)`,
    validator: nonEmpty,
  },

  '6-b': {
    id: 602,
    title: 'Vowel Finder',
    story: 'Add the if check inside the loop to print only vowels.',
    goals: [
      'Add: if char in "aeiouAEIOU":',
      'Then: print(char) on the next line (indented)',
    ],
    hints: [
      'Add an if inside the loop.',
      'Check if char is in "aeiouAEIOU".',
      'Try: if char in "aeiouAEIOU": then print(char)',
    ],
    hintCode: `word = "Adventure"\nfor char in word:\n    if char in "aeiouAEIOU":\n        print(char)`,
    starterCode: `word = "Adventure"\nfor char in word:\n    # Add: if char in "aeiouAEIOU":\n    #         print(char)\n`,
    validator: requires([[/\bfor\b[\s\S]*\bin\b/, 'Loop through the letters rather than printing the answer.'], [/\bif\b/, 'Use an if inside the loop to pick out the vowels.']], exact(['A', 'e', 'u', 'e'], 'Loop through the word and print a letter only if it is a vowel.', 'Vowel found!')),
  },

  '6-boss': {
    id: 603,
    title: 'Vowel Counter',
    story: 'Count how many vowels are in the word. Add 1 to count each time you find a vowel.',
    goals: [
      'Start with count = 0',
      'Add 1 to count inside the loop when a vowel is found',
      'Print the final count',
    ],
    hints: [
      'Add 1 to count inside the if block.',
      'Write: count = count + 1',
      'Put it indented inside the if block.',
    ],
    hintCode: `word = "Elephant"\ncount = 0\n\nfor char in word:\n    if char in "aeiouAEIOU":\n        count = count + 1\n\nprint("Vowels:", count)`,
    starterCode: `word = "Elephant"\ncount = 0\n\nfor char in word:\n    if char in "aeiouAEIOU":\n        # Add: count = count + 1\n\nprint("Vowels:", count)\n`,
    validator: requires([[/\bfor\b[\s\S]*\bin\b/, 'Loop through the letters rather than printing the answer.'], [/\bif\b/, 'Use an if inside the loop to decide what to count.']], exact(['Vowels: 3'], 'Count in the loop, then print the total once at the end.', 'Vowels counted!')),
  },

  // ──── LESSON 7: Basic Lists ───────────────────────────────────────────────
  // Lesson teaches: list creation, index access, .append(), len()
  // Puzzle A: create a list and access items by index
  // Puzzle B: append items to a list (write 1–2 lines)
  // Boss:     build a list, append 2 items, print the length

  '7-a': {
    id: 701,
    title: 'List Creator',
    story: 'Run the code to create a list and print specific items by index.',
    goals: [
      'Click Run to see items printed by index',
      'Try changing an item in the list and run again',
    ],
    hints: [
      'Just click Run. No code needed.',
      'Change a color and run again.',
      'Try "purple" instead of "red".',
    ],
    starterCode: `colors = ["red", "green", "blue"]\nprint(colors[0])\nprint(colors[1])\nprint(colors[2])`,
    validator: nonEmpty,
  },

  '7-b': {
    id: 702,
    title: 'List Builder',
    story: 'Two items are in the list. Append two more, then print the whole list.',
    goals: [
      'Use .append() to add "cherry" to the list',
      'Use .append() to add one more fruit of your choice',
      'Print the list to see all items',
    ],
    hints: [
      'Use .append() to add an item.',
      'fruits.append("cherry") adds cherry.',
      'Do it again with another fruit.',
    ],
    hintCode: `fruits = ["apple", "banana"]\n\nfruits.append("cherry")\nfruits.append("mango")\n\nprint(fruits)`,
    starterCode: `fruits = ["apple", "banana"]\n\n# Add "cherry" to the list:\n# Your code here\n\n# Add one more fruit:\n# Your code here\n\nprint(fruits)\n`,
    validator: requires(
      [[/\.append\s*\(/, 'Use .append() to add to the list rather than rewriting it.']],
      (output, code) => {
        const lines = cleanLines(output);
        if (!lines.length) return NO_OUTPUT;
        const appends = (String(code || '').match(/\.append\s*\(/g) || []).length;
        if (code && appends < 2) {
          return { pass: false, message: `Found ${appends} .append() call(s), expected 2: cherry, then a fruit of your choice.` };
        }
        const last = lines[lines.length - 1];
        if (!/^\[.*\]$/.test(last)) {
          return { pass: false, message: `The last line shows "${last}". Print the whole list so every item is visible.` };
        }
        if (!last.includes('cherry')) {
          return { pass: false, message: 'The list printed, but "cherry" is not in it. Append it first.' };
        }
        const items = last.slice(1, -1).split(',').filter(x => x.trim()).length;
        if (items < 4) {
          return { pass: false, message: `The list has ${items} item(s), expected 4 after two appends.` };
        }
        return { pass: true, message: 'List grown! Both items added.' };
      },
    ),
  },

  '7-boss': {
    id: 703,
    title: 'List Boss',
    story: 'Start with an empty list, add three items with .append(), then print the count.',
    goals: [
      'Use .append() three times to add any three items',
      'Print the list and then print "Count:" followed by len()',
    ],
    hints: [
      'Use .append() three times.',
      'items.append("anything") adds one item.',
      'Add 3 items, then print(items).',
    ],
    hintCode: `items = []\n\nitems.append("apple")\nitems.append("banana")\nitems.append("cherry")\n\nprint(items)\nprint("Count:", len(items))`,
    starterCode: `items = []\n\n# Append three things to items:\n# Your code here\n\nprint(items)\nprint("Count:", len(items))\n`,
    validator: requires(
      [[/\.append\s*\(/, 'Use .append() to add the items rather than writing the list out.'],
       [/\blen\s*\(/, 'Use len() to count the items rather than typing the number.']],
      (output, code) => {
        const lines = cleanLines(output);
        if (!lines.length) return NO_OUTPUT;
        const appends = (String(code || '').match(/\.append\s*\(/g) || []).length;
        if (code && appends < 3) {
          return { pass: false, message: `Found ${appends} .append() call(s), expected 3.` };
        }
        const listLine = lines.find(l => /^\[.*\]$/.test(l));
        if (!listLine) {
          return { pass: false, message: 'Print the whole list on its own line so every item is visible.' };
        }
        const count = lines.find(l => /^Count:/.test(l));
        if (!count) {
          return { pass: false, message: 'Print "Count:" followed by len() of the list.' };
        }
        const items = listLine.slice(1, -1).split(',').filter(x => x.trim()).length;
        const shown = Number((count.match(/(\d+)/) || [])[1]);
        if (shown !== items) {
          return { pass: false, message: `The list has ${items} item(s) but Count says ${shown}. Use len() on the list rather than typing a number.` };
        }
        return { pass: true, message: 'Three items added and counted!' };
      },
    ),
  },

  // ──── LESSON 8: Loops with Lists ─────────────────────────────────────────
  // Lesson teaches: for item in list, loop + if with a list, counting in a loop
  // Puzzle A: loop through a list — run it
  // Puzzle B: loop + if — print only items matching a condition
  // Boss:     count items in a list that meet a condition

  '8-a': {
    id: 801,
    title: 'List Printer',
    story: 'Run the code to print every planet in the list, one per line.',
    goals: [
      'Click Run to see each planet printed',
      'Try adding another planet to the list and run again',
    ],
    hints: [
      'Just click Run. No code needed.',
      'Add another planet and run again.',
      'Try adding "Jupiter" to the list.',
    ],
    starterCode: `planets = ["Mercury", "Venus", "Earth", "Mars"]\n\nfor planet in planets:\n    print(planet)`,
    validator: nonEmpty,
  },

  '8-b': {
    id: 802,
    title: 'Loop Filter',
    story: 'Print only the scores that are 80 or higher. Add the if check inside the loop.',
    goals: [
      'Add: if score >= 80:',
      'Then: print(score) on the next line (indented)',
    ],
    hints: [
      'Add an if inside the loop.',
      'Check if score is >= 80.',
      'Try: if score >= 80: then print(score)',
    ],
    hintCode: `scores = [75, 90, 60, 85, 80, 55, 95]\n\nfor score in scores:\n    if score >= 80:\n        print(score)`,
    starterCode: `scores = [75, 90, 60, 85, 80, 55, 95]\n\nfor score in scores:\n    # Add: if score >= 80:\n    #         print(score)\n`,
    validator: requires([[/\bfor\b[\s\S]*\bin\b/, 'Loop through the list rather than printing it whole.'], [/\bif\b/, 'Use an if inside the loop to keep only the high scores.']], exact(['90', '85', '80', '95'], 'Print a score only if it is 80 or more, one per line.', 'High scores found!')),
  },

  '8-boss': {
    id: 803,
    title: 'Score Counter',
    story: 'Count how many scores in the list are 80 or higher. Add 1 to count each time.',
    goals: [
      'Start with count = 0',
      'Add 1 to count each time a score is >= 80',
      'Print "High scores:" and the final count',
    ],
    hints: [
      'Add 1 to count inside the if block.',
      'Write: count = count + 1',
      'Put it indented inside the if block.',
    ],
    hintCode: `scores = [75, 90, 60, 85, 80, 55, 95]\ncount = 0\n\nfor score in scores:\n    if score >= 80:\n        count = count + 1\n\nprint("High scores:", count)`,
    starterCode: `scores = [75, 90, 60, 85, 80, 55, 95]\ncount = 0\n\nfor score in scores:\n    if score >= 80:\n        # Add: count = count + 1\n\nprint("High scores:", count)\n`,
    validator: requires([[/\bfor\b[\s\S]*\bin\b/, 'Loop through the list rather than printing the answer.'], [/\bif\b/, 'Use an if inside the loop to decide what to count.']], exact(['High scores: 4'], 'Count in the loop, then print the total once at the end.', 'Scores counted!')),
  },

  // ──── LESSON 9: Basic Functions ──────────────────────────────────────────
  // Lesson teaches: def, parameters, calling functions, return
  // Puzzle A: define and call a simple function (fill in the call)
  // Puzzle B: function with parameter — call it 3 times with different values
  // Boss:     function with return — call it and print the result

  '9-a': {
    id: 901,
    title: 'First Function',
    story: 'The function is defined. Call it three times to say hello!',
    goals: [
      'Call say_hi() three times below the function',
      'See "Hello there!" printed three times',
    ],
    hints: [
      'Call the function by writing its name.',
      'say_hi() calls it once.',
      'Write say_hi() three times.',
    ],
    hintCode: `def say_hi():\n    print("Hello there!")\n\nsay_hi()\nsay_hi()\nsay_hi()`,
    starterCode: `def say_hi():\n    print("Hello there!")\n\n# Call say_hi() three times:\n`,
    validator: requires([[/\bdef\s+say_hi\s*\(/, 'Define the function first: def say_hi():'], [/\bsay_hi\s*\(\s*\)/, 'Call the function by writing say_hi() on its own line, three times.']], exact(['Hello there!', 'Hello there!', 'Hello there!'], 'Call the function rather than printing your own message.', 'Three hellos sent!')),
  },

  '9-b': {
    id: 902,
    title: 'Function Return',
    story: 'Call the greet function three times with three different names.',
    goals: [
      'Call greet() three times below the function',
      'Use a different name each time',
    ],
    hints: [
      'Put a name in the brackets.',
      'greet("Alex") calls it with "Alex".',
      'Call it 3 times with different names.',
    ],
    hintCode: `def greet(name):\n    print("Hello,", name + "!")\n\ngreet("Alice")\ngreet("Bob")\ngreet("Sam")`,
    starterCode: `def greet(name):\n    print("Hello,", name + "!")\n\n# Call greet() three times with different names:\n`,
    // The values here are the CHILD'S OWN CHOICE, so an exact match against the
    // hintCode would replace a validator that accepts wrong answers with one
    // that rejects right ones. That is the worse of the two failures. Caught by
    // reading the stated goal rather than trusting the derived output.
    validator: requires(
      [[/\bgreet\s*\(/, 'Call greet() below the function, once for each name.']],
      (output) => {
        const lines = cleanLines(output);
        if (!lines.length) return NO_OUTPUT;
        const bad = lines.findIndex(l => !/^Hello, .+!$/.test(l));
        if (bad !== -1) {
          return { pass: false, message: `Line ${bad + 1} shows "${lines[bad]}" but greet() prints "Hello, name!". Call the function rather than printing your own line.` };
        }
        if (lines.length !== 3) {
          return { pass: false, message: `Got ${lines.length} greeting(s), expected 3. Call greet() three times.` };
        }
        if (new Set(lines).size < 3) {
          return { pass: false, message: 'Three greetings, but some use the same name. Use a different name each time.' };
        }
        return { pass: true, message: 'Greeted everyone!' };
      },
    ),
  },

  '9-boss': {
    id: 903,
    title: 'Function Boss',
    story: 'Write a function that adds two numbers and returns the result. Call it and print the answer.',
    goals: [
      'Define add(a, b) that returns a + b',
      'Call add() with two numbers and print the result',
    ],
    hints: [
      'Start with: def add(a, b):',
      'Inside, write: return a + b',
      'Then: print(add(3, 4))',
    ],
    hintCode: `def add(a, b):\n    return a + b\n\nresult = add(3, 4)\nprint("Sum:", result)`,
    starterCode: `# Define a function called add that takes a and b\n# and returns a + b\n\n# Then call it with two numbers and print the result\n`,
    validator: requires([[/\bdef\s+add\s*\(/, 'No function called add yet. Start with def add(a, b):'], [/\breturn\b/, 'add() needs to return a + b, not print it. Add a return line inside the function.']], exact(['Sum: 7'], 'Call add() with two numbers and print what comes back.', 'Function written, called, and printed. Boss cleared!')),
  },

  // ──── LESSON 10: Combining Concepts ──────────────────────────────────────
  // Lesson teaches: using variables, strings, loops, lists, and functions together
  // Puzzle A: function that loops through a list
  // Puzzle B: loop + list + if (filter with a function)
  // Boss:     write a mini program using all concepts

  '10-a': {
    id: 1001,
    title: 'Function + Loop',
    story: 'Run the code to see a function loop through a list and print each item in UPPERCASE.',
    goals: [
      'Click Run to see the function in action',
      'Try changing the words in the list and run again',
    ],
    hints: [
      'Just click Run. No code needed.',
      'Change the words in the list.',
      'Try your own words instead.',
    ],
    starterCode: `def shout_all(items):\n    for item in items:\n        print(item.upper())\n\nwords = ["hello", "world", "python"]\nshout_all(words)`,
    validator: nonEmpty,
  },

  '10-b': {
    id: 1002,
    title: 'Loop + List + If',
    story: 'Print only the names in the list that start with the letter "A".',
    goals: [
      'Loop through the names list',
      'Add: if name[0] == "A": then print(name)',
    ],
    hints: [
      'Add an if inside the loop.',
      'name[0] gets the first letter.',
      'Try: if name[0] == "A": then print(name)',
    ],
    hintCode: `names = ["Alice", "Bob", "Anna", "Charlie", "Amy", "Mary-Anne"]\n\nfor name in names:\n    if name[0] == "A":\n        print(name)`,
    starterCode: `names = ["Alice", "Bob", "Anna", "Charlie", "Amy", "Mary-Anne"]\n\nfor name in names:\n    # Add: if name[0] == "A":\n    #         print(name)\n`,
    validator: requires([[/\bfor\b[\s\S]*\bin\b/, 'Loop through the names rather than printing the list.'], [/\bif\b/, 'Use an if inside the loop to keep only the names starting with A.']], exact(['Alice', 'Anna', 'Amy'], 'Print a name only if it starts with A, one per line.', 'Filtered the list!')),
  },

  '10-boss': {
    id: 1003,
    title: 'Mini Program',
    story: 'Write a function that takes a list of names and prints a greeting for each one.',
    goals: [
      'Define greet_all(names) that loops through names',
      'Print "Hello, " + name + "!" for each name',
      'Call greet_all() with a list of at least 3 names',
    ],
    hints: [
      'Define a function: def greet_all(names):',
      'Loop inside: for name in names:',
      'Then call: greet_all(["Alice", "Bob", "Charlie"])',
    ],
    hintCode: `def greet_all(names):\n    for name in names:\n        print("Hello, " + name + "!")\n\ngreet_all(["Alice", "Bob", "Charlie"])`,
    starterCode: `# Define greet_all(names) that loops through the list\n# and prints "Hello, " + name + "!" for each name\n\n# Then call it with a list of 3 or more names\n`,
    // The values here are the CHILD'S OWN CHOICE, so an exact match against the
    // hintCode would replace a validator that accepts wrong answers with one
    // that rejects right ones. That is the worse of the two failures. Caught by
    // reading the stated goal rather than trusting the derived output.
    validator: requires(
      [[/\bdef\s+greet_all\s*\(/, 'No function called greet_all yet. Start with def greet_all(names):'],
       [/\bfor\b[\s\S]*\bin\b/, 'greet_all() needs a for loop so it works for any length of list.']],
      (output, code) => {
        const lines = cleanLines(output);
        if (!lines.length) return NO_OUTPUT;
        if (code && !/\bgreet_all\s*\(\s*\[/.test(bodyWithoutDefs(code))) {
          return { pass: false, message: 'Defined but never called with a list. Try greet_all(["Alice", "Bob", "Charlie"]).' };
        }
        const bad = lines.findIndex(l => !/^Hello, .+!$/.test(l));
        if (bad !== -1) {
          return { pass: false, message: `Line ${bad + 1} shows "${lines[bad]}" but each line should read "Hello, name!".` };
        }
        if (lines.length < 3) {
          return { pass: false, message: `Found ${lines.length} greeting(s). Call greet_all() with a list of at least 3 names.` };
        }
        return { pass: true, message: 'Mini program complete! Journey finished!' };
      },
    ),
  },
};
