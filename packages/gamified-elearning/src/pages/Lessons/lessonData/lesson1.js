const lesson1 = {
  id: 1,
  title: "Hello Python!",
  subtitle: "Make a computer say your first message — it is easier than you think!",
  emoji: "🐍",
  story: "Every program you will ever write starts here: telling the computer to say something, and watching it obey.",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'How Do You Talk to a Computer?',
      body: 'In Python, print() is how you make the computer show a message on screen. You type what you want to say inside the brackets and Python says it!',
      highlight: 'print("Hello!")   →   Hello!\nprint("I love coding!")   →   I love coding!',
      code: 'print("Hello!")\nprint("I love coding!")\nprint("Python is awesome!")',
    },
    {
      type: 'predict',
      id: 'predict-print',
      title: 'What Will It Say?',
      question: 'What does this print?',
      code: 'print("Hello")\nprint("Python")',
      choices: ['Hello Python', 'Hello\nPython', 'HelloPython', '"Hello"\n"Python"'],
      correct: 1,
      explain: 'Right — each print starts a new line, and the quote marks do not get printed.',
      wrongHint: 'There are two prints, so there are two lines. And quote marks never show up in the output.',
      hints: ['Every print() puts its message on its own line.', 'The quotes tell Python where the text starts and ends. They are not part of it.'],
    },
    {
      type: 'example',
      id: 'example',
      title: 'Your First Python Program',
      description: 'This is a real working Python program! Click Run and watch the computer say "Hello!"',
      code: 'print("Hello!")',
      successPattern: /Hello/i,
      hint: 'Click the Run button below the code. You should see Hello! appear in the output box.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Make It Your Own',
      description: 'Change "Hello!" to YOUR message — like your name or something funny. Click Run to see YOUR message appear!',
      code: 'print("Hello!")',
      // Open-ended: the child writes their own message, so the check is that
      // they still used print and that something was actually printed.
      expectedKeywords: ['print('],
      wrongOutputHint: 'Keep the print( and the quote marks, then press Run.',
      hint: 'Click inside the editor, change the text inside the quotes to anything you like, then click Run!',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Print Three Things',
      description: 'Can you print THREE different messages? Each print() prints one line. Change all three messages to whatever you want!',
      code: 'print("Hello!")\nprint("I love Python!")\nprint("Let\'s code!")',
      expectedKeywords: ['print('],
      wrongOutputHint: 'You need three print lines, each with its own message.',
      hint: 'Each line is a separate print(). Change the text in each set of quotes to your own messages!',
      xp: 20,
    },
  ]
};

export default lesson1;
