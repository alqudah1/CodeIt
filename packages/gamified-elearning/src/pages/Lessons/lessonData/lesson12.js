const lesson12 = {
  id: 12,
  title: "Booleans & Comparisons",
  subtitle: "Python can decide if something is True or False — and act on it!",
  emoji: "⚖️",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'True and False — Two Special Values',
      body: 'A boolean is a value that is either True or False. You create booleans by comparing things. The comparison operators are: == (equal to), != (not equal), < (less than), > (greater than), <= (less than or equal), and >= (greater than or equal). These comparisons are used inside if statements to make decisions.',
      highlight: 'age = 13\nprint(age >= 13)  # True\nprint(age == 14)  # False',
      code: 'age = 13\nprint(age >= 13)\nprint(age == 14)',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Comparing Numbers',
      description: 'Click Run to see how Python evaluates comparisons between two numbers.',
      code: 'a = 10\nb = 7\nprint(a == b)\nprint(a > b)\nprint(a != b)\nprint(a <= b)',
      successPattern: /True|False/i,
      hint: 'Click Run! Each comparison produces True or False. Try changing a or b to see the results flip.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Even or Odd?',
      description: 'A number is even if the remainder when divided by 2 is 0. Change the number and run to test both even and odd values.',
      code: 'number = 12\nif number % 2 == 0:\n    print(number, "is even")\nelse:\n    print(number, "is odd")',
      successPattern: /even|odd/i,
      hint: 'number % 2 gives the remainder after dividing by 2. If the remainder is 0, the number is even. Try number = 7.',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Score Showdown',
      description: 'Compare two scores and print the right message. Try changing your_score to be lower or higher than top_score!',
      code: 'your_score = 95\ntop_score = 88\nif your_score > top_score:\n    print("You win!")\nelif your_score == top_score:\n    print("It\'s a tie!")\nelse:\n    print("Top score wins.")',
      successPattern: /win|tie|wins/i,
      hint: 'Change your_score to 88 to see a tie, or to 80 to see "Top score wins." Each condition uses a comparison operator.',
      xp: 20,
    },
  ]
};

export default lesson12;
