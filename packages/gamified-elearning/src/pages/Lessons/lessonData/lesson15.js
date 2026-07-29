const lesson15 = {
  id: 15,
  title: "String Formatting",
  subtitle: "Build polished messages by embedding variables directly inside strings!",
  emoji: "✏️",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'f-Strings — The Modern Way',
      body: 'An f-string starts with the letter f before the opening quote: f"...". Inside the string you put variable names (or expressions) inside curly braces {}. Python replaces them with their values at runtime. You can also control formatting: {price:.2f} formats a float to 2 decimal places. f-strings are cleaner than joining strings with +.',
      highlight: 'name = "Alex"\nage = 14\nprint(f"Hello, {name}! You are {age} years old.")',
      code: 'name = "Alex"\nage = 14\nprint(f"Hello, {name}! You are {age} years old.")',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Greeting Card',
      description: 'Click Run to see an f-string that combines a name and a number into one clean sentence.',
      code: 'player = "Sam"\nscore = 1450\nprint(f"Player: {player}")\nprint(f"Score: {score}")\nprint(f"Well done, {player}! You earned {score} points.")',
      successPattern: /Sam|Score:/i,
      hint: 'Click Run! Change player and score, then run again. f-strings update automatically — no + signs needed.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Price Tag',
      description: 'Format a price to exactly two decimal places using :.2f inside the curly braces. Run to see the tidy output!',
      // This is Python f-string syntax stored as plain lesson text, not a JavaScript template.
      // eslint-disable-next-line no-template-curly-in-string
      code: 'item = "Headphones"\nprice = 34.5\nprint(f"{item}: ${price:.2f}")\nprint(f"With 10% discount: ${price * 0.9:.2f}")',
      successPattern: /34\.50|\$|discount/i,
      hint: ':.2f means "format as a float with 2 decimal places". Try price = 9.9 or price = 100 — the output always shows cents.',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Name Tag Generator',
      description: 'Build a formatted name tag using f-strings. Change the details and run to generate a new tag!',
      code: 'first = "Jordan"\nlast = "Lee"\ngrade = 8\nschool = "CodeIt Academy"\nprint(f"Name:   {first} {last}")\nprint(f"Grade:  {grade}")\nprint(f"School: {school}")',
      successPattern: /Jordan|Name:/i,
      hint: 'Try changing first, last, grade, and school. You can put any expression inside {}: even f"{grade + 1}" works!',
      xp: 20,
    },
  ]
};

export default lesson15;
