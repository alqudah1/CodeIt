const lesson10 = {
  id: 10,
  title: "Modules & Libraries — Borrow Superpowers!",
  subtitle: "Import ready-made tools from Python's library — like borrowing superpowers from other coders!",
  emoji: "🧩",
  story: [
    "🌍 Thousands of Python coders have already solved common problems and packed their solutions into modules.",
    "📦 import math gives you math.sqrt(), math.pi, and more — all written by experts, free for you to use!",
    "🎲 import random lets you make games. import datetime tracks time. Modules unlock endless power!",
    "🏆 This is your final lesson. You've come so far — let's import some superpowers and celebrate!"
  ],
  concepts: [
    { icon: "📦", title: "import", body: "import math loads the math module. Then use math.sqrt(16) to call functions inside it." },
    { icon: "🎯", title: "from ... import", body: "from math import sqrt lets you call sqrt(16) directly — without the math. prefix." },
    { icon: "🎲", title: "random module", body: "import random then random.randint(1, 10) gives a random number between 1 and 10!" },
    { icon: "⏰", title: "datetime module", body: "from datetime import date — date.today() gives today's date. Useful for apps!" }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Math Module",
      description: "Import math and use it to calculate the square root of 144 and the value of pi.",
      initialCode: 'import math\nprint(math.sqrt(144))\nprint(math.pi)',
      successPattern: /12\.0|3\.14/,
      hint: "math.sqrt(144) should give 12.0. math.pi gives 3.14159...",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Random Number Game",
      description: "Use random.randint() to pick a number between 1 and 100. Print 'Your lucky number is X!'",
      initialCode: 'import random\nnumber = random.randint(1, 100)\nprint("Your lucky number is " + str(number) + "!")',
      successPattern: /lucky number/i,
      hint: "random.randint(1, 100) picks any integer from 1 to 100 — different every time you run!",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Today's Date",
      description: "Import date from datetime and print today's date in a friendly message.",
      initialCode: 'from datetime import date\ntoday = date.today()\nprint("Today is " + str(today))',
      successPattern: /Today is/i,
      hint: "str(today) converts the date object to a readable string like '2026-03-01'.",
      xp: 20,
    }
  ]
};
export default lesson10;
