const lesson1 = {
  id: 1,
  title: "Hello Python!",
  subtitle: "Make a computer say your first message — it is easier than you think!",
  emoji: "🐍",
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
      successPattern: /\S+/,
      hint: 'Click inside the editor, change the text inside the quotes to anything you like, then click Run!',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Print Three Things',
      description: 'Can you print THREE different messages? Each print() prints one line. Change all three messages to whatever you want!',
      code: 'print("Hello!")\nprint("I love Python!")\nprint("Let\'s code!")',
      successPattern: /\w+[\s\S]+\w+/,
      hint: 'Each line is a separate print(). Change the text in each set of quotes to your own messages!',
      xp: 20,
    },
  ]
};

export default lesson1;
