const lesson3 = {
  id: 3,
  title: "Strings",
  subtitle: "Text is everywhere in Python — learn to combine, change, and measure it!",
  emoji: "🔤",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'Strings Are Text',
      body: 'A string is any text wrapped in quotes. You can join two strings together with + (called concatenation), make them UPPERCASE or lowercase, and count how many letters they have with len()!',
      highlight: 'name = "Alex"\ngreeting = "Hello, " + name\nprint(greeting)   →   Hello, Alex',
      code: 'first = "Hello"\nlast = "Python"\nprint(first + " " + last)',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Join Two Strings',
      description: 'Click Run to join two strings into one message using the + sign!',
      code: 'greeting = "Hello, " + "world!"\nprint(greeting)',
      successPattern: /Hello.*world/i,
      hint: 'Click Run! The + sign joins the two strings into one.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'UPPERCASE and Lowercase',
      description: 'Run this code to see .upper() and .lower() in action. Then change "Python" to YOUR name!',
      code: 'word = "Python"\nprint(word.upper())\nprint(word.lower())',
      successPattern: /PYTHON|python/i,
      hint: 'Change "Python" to your own name, then click Run to see it in uppercase and lowercase!',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Count the Letters',
      description: 'Run the code to see how many letters are in a word. Then change "coding" to YOUR name!',
      code: 'word = "coding"\nprint("Letters:", len(word))',
      successPattern: /Letters:/i,
      hint: 'len() counts the characters in the string. Change "coding" to your own name and run again!',
      xp: 20,
    },
  ]
};

export default lesson3;
