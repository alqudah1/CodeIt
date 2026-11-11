// Lesson 1, rebuilt as the model for the rest (11 November 2026).
//
// It used to open with reading: a numbered panel, a story, a paragraph, a KEY
// IDEA box and a read-only code block, and only then a guess. Now the first
// thing a child does is press Run, and somebody answers: Pixel, on a small
// drawn stage, says whatever their Python prints. The explanation comes
// second, as the line they just ran taken apart piece by piece.
//
// The rules this lesson keeps, for every lesson that follows it:
//   1. Do first, then explain. Step one runs.
//   2. Every step ends in something that moves: Pixel says the output.
//   3. One voice per screen, two short sentences at most.
//   4. The last step is the child's own: here, a joke in three lines.
//
// The step ids are stable: two public activity links land on 'example' and
// 'tryit' by id, never by position.
const lesson1 = {
  id: 1,
  title: "Hello Python!",
  subtitle: "Make a computer say your first message. It is easier than you think!",
  emoji: "🐍",
  story: "This is Pixel. Pixel only says what Python tells it to say.",
  steps: [
    {
      type: 'example',
      id: 'example',
      title: 'Your First Python Program',
      stage: 'say',
      idle: 'Hi, I am Pixel! Press the orange Run button and I will say it.',
      description: 'This is one line of real Python. Press Run and watch Pixel.',
      code: 'print("Hello!")',
      successPattern: /Hello/i,
      hint: 'Press the orange Run button under the code. Pixel says Hello!',
      xp: 10,
    },
    {
      type: 'concept',
      id: 'concept',
      title: 'What Just Happened?',
      body: 'You told the computer what to say, and it said it. Here is your line again. Tap each piece.',
      parts: {
        pieces: [['print', 'a'], ['(', 'b'], ['"Hello!"', 'c'], [')', 'b']],
        notes: {
          a: 'This word means: say it.',
          b: 'Brackets hold what to say.',
          c: 'The words. They always sit inside quote marks.',
        },
      },
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Make It Your Own',
      stage: 'say',
      idle: 'Change my words. Then press Run!',
      description: 'Change Hello! to anything you like. Your name. A silly word. Then press Run.',
      code: 'print("Hello!")',
      // Open-ended: the child writes their own message, so the check is that
      // they still used print and that something was actually printed.
      expectedDifferentOutput: 'Hello!',
      expectedKeywords: ['print('],
      wrongOutputHint: 'Keep the print( and the quote marks, then press Run.',
      hint: 'Tap inside the code box. Change only the words between the quote marks. Then press Run.',
      xp: 15,
    },
    {
      type: 'predict',
      id: 'predict-print',
      title: 'What Will It Say?',
      stage: 'say',
      idle: 'Two prints this time. What will I say?',
      plays: ['Hello', 'Python'],
      question: 'What does this print?',
      code: 'print("Hello")\nprint("Python")',
      choices: ['Hello Python', 'Hello\nPython', 'HelloPython', '"Hello"\n"Python"'],
      correct: 1,
      explain: 'Right. Each print starts a new line, and the quote marks do not get printed.',
      wrongHint: 'There are two prints, so there are two lines. And quote marks never show up in the output.',
      hints: ['Every print() puts its message on its own line.', 'The quotes tell Python where the text starts and ends. They are not part of it.'],
    },
    {
      type: 'fillblank',
      id: 'fix-pixel',
      title: 'Pixel Lost a Word',
      stage: 'say',
      idle: 'I cannot talk! A word is missing.',
      plays: ['Thank you!'],
      question: 'Tap the word that makes Pixel talk again.',
      template: '___("Thank you!")',
      options: ['say', 'print', 'talk', 'Print'],
      answers: ['print'],
      explain: 'Yes. It is print, all in small letters.',
      wrongHint: 'Python only knows one word for this. You used it on the first step.',
      hints: ['It starts with p.', 'Small letters only. Python cares about capital letters.'],
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Pixel Tells a Joke',
      stage: 'say',
      idle: 'Three lines make a joke. Press Run to hear mine, then write yours!',
      description: 'Three prints, three lines. Run it, then change all three so the joke is yours.',
      code: 'print("Knock knock!")\nprint("Who is there?")\nprint("Python!")',
      // Three lines that are not the three we wrote: the child said three
      // things of their own, one print each.
      expectedDifferentOutput: 'Knock knock!\nWho is there?\nPython!',
      expectedOutput: /^\s*\S.*\n+\s*\S.*\n+\s*\S/,
      expectedKeywords: ['print('],
      wrongOutputHint: 'Pixel needs three lines to say. Use three prints, one under the other.',
      hint: 'Change the words inside each pair of quote marks. Keep one print on each line.',
      xp: 20,
    },
  ]
};

export default lesson1;
