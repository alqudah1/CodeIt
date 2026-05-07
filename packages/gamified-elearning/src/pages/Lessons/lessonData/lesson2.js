const lesson2 = {
  id: 2,
  title: "Storing Info with Variables",
  subtitle: "Save names, numbers, and messages in Python — like labeling boxes!",
  emoji: "📦",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'What is a Variable?',
      body: 'A variable is like a labeled box. You store a value inside and give the box a name. Later, Python opens the box and uses what is inside!',
      highlight: 'name = "Alex"   stores the text:   Alex\nage  = 10       stores the number: 10',
      code: 'name = "Alex"\nage = 10\nprint(name)\nprint(age)',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Variables in Action',
      description: 'Click Run to see how Python stores a name in a variable and prints it!',
      code: 'name = "Alex"\nprint(name)',
      successPattern: /Alex/,
      hint: 'Click Run! The variable name holds "Alex" and print(name) shows it on screen.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Store Your Own Info',
      description: 'Change "Alex" to YOUR name and 10 to YOUR age. Click Run to see your own info printed!',
      code: 'name = "Alex"\nage = 10\nprint(name)\nprint(age)',
      successPattern: /\d+/,
      hint: 'Change "Alex" to your name and 10 to your age, then click Run!',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Your Character Sheet',
      description: 'Change all three variables — name, age, and superpower — to your own. Click Run to show your character sheet!',
      code: 'name = "Alex"\nage = 10\nsuperpower = "flying"\nprint(name)\nprint(age)\nprint(superpower)',
      successPattern: /\w+[\s\S]*\d+/,
      hint: 'Change "Alex", 10, and "flying" to your own name, age, and favorite superpower!',
      xp: 20,
    },
  ]
};

export default lesson2;
