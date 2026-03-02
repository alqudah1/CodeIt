const lesson2 = {
  id: 2,
  title: "Storing Info with Variables",
  subtitle: "Learn to save names, numbers, and messages in Python — like labeling your favorite boxes!",
  emoji: "📦",
  story: [
    "🤖 Pixel the Robot is forgetful. Every time it meets someone, it forgets their name by the next second!",
    "🧠 You're going to give Pixel a superpower: variables! Variables are like labeled sticky notes inside the computer's brain.",
    "📦 Imagine a box with a label 'name' on it. You put 'Alex' inside. Now Pixel can always look at the box and remember: 'That's Alex!'",
    "✨ Let's teach Pixel to store your name, your age, and your favorite thing — so it never forgets!"
  ],
  concepts: [
    {
      icon: "📦",
      title: "Variables",
      body: "A variable is a labeled box that stores a value. You can change what's in the box anytime!"
    },
    {
      icon: "📝",
      title: "Strings",
      body: "Text values go in quotes: name = \"Alex\". These are called strings — like a string of letters."
    },
    {
      icon: "🔢",
      title: "Numbers",
      body: "Numbers go without quotes: age = 10. Python knows the difference between text and numbers!"
    },
    {
      icon: "🖨️",
      title: "print(variable)",
      body: "To show a variable's value, use print(name) — no quotes around the variable name!"
    }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Store Your Name",
      description: "Create a variable called name and give it your name. Then print it!",
      initialCode: 'name = "Alex"\nprint(name)',
      successPattern: /\S+/,
      hint: "Try: name = \"YourName\" then on the next line: print(name)",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Number Variables",
      description: "Store your age in a variable and print both your name and age on separate lines.",
      initialCode: 'name = "Alex"\nage = 10\nprint(name)\nprint(age)',
      successPattern: /[\s\S]+/,
      hint: "Numbers don't need quotes! Just write: age = 10",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Your Character Sheet",
      description: "Create three variables: name, age, and superpower. Print all three!",
      initialCode: 'name = "Alex"\nage = 10\nsuperpower = "flying"\nprint(name)\nprint(age)\nprint(superpower)',
      successPattern: /[\s\S]+/,
      hint: "Each print() call shows one variable. You need three print() calls!",
      xp: 20,
    }
  ]
};

export default lesson2;
