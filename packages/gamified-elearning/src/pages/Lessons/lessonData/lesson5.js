const lesson5 = {
  id: 5,
  title: "Simple Repetition",
  subtitle: "Tell Python to repeat something — without writing it out ten times!",
  emoji: "🔁",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'For Loops with Range',
      body: 'A for loop with range() tells Python: "repeat this block N times". The variable i counts each step, starting from 0. You can print i to see the counter change!',
      highlight: 'for i in range(3):\n    print("Go!")   →   prints Go! three times',
      code: 'for i in range(3):\n    print("Go!")',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Count with Range',
      description: 'Click Run to see the loop count from 0. Notice it starts at 0, not 1!',
      code: 'for i in range(5):\n    print(i)',
      successPattern: /0|1|2|3|4/,
      hint: 'Click Run! range(5) gives: 0, 1, 2, 3, 4 — five numbers starting from 0.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Repeat a Message',
      description: 'Run this code to see "Coding is fun!" 5 times. Then change 5 to 3 — what happens?',
      code: 'for i in range(5):\n    print("Coding is fun!")',
      successPattern: /Coding is fun/,
      hint: 'Change 5 to 3 and click Run again — the message appears fewer times!',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Count from 1',
      description: 'Run this code to count from 1 to 5. range(1, 6) starts at 1 and stops before 6!',
      code: 'for i in range(1, 6):\n    print(i)',
      successPattern: /1|2|3|4|5/,
      hint: 'range(1, 6) gives: 1, 2, 3, 4, 5. Try changing the start or end number!',
      xp: 20,
    },
  ]
};

export default lesson5;
