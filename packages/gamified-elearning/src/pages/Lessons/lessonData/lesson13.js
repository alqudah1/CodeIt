const lesson13 = {
  id: 13,
  title: "Logical Operators",
  subtitle: "Combine conditions with and, or, and not to make smarter decisions!",
  emoji: "🔗",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'Combining Conditions',
      body: 'Python has three logical operators. "and" requires both conditions to be True. "or" requires at least one to be True. "not" flips a boolean — True becomes False, False becomes True. These let you write richer conditions without nesting lots of if statements inside each other.',
      highlight: 'x = 15\nif x > 10 and x < 20:\n    print("x is between 10 and 20")',
      code: 'x = 15\nif x > 10 and x < 20:\n    print("x is between 10 and 20")',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Login Check',
      description: 'Click Run to see how "and" checks two conditions at the same time. Both must be True for access to be granted.',
      code: 'username = "admin"\npassword = "secret123"\nif username == "admin" and password == "secret123":\n    print("Access granted")\nelse:\n    print("Access denied")',
      successPattern: /granted|denied/i,
      hint: 'Click Run! Change the password to something wrong and run again — "and" means both must match.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'In Range Check',
      description: 'Use "and" to check that a number sits between 10 and 20. Try changing the number to test the boundary edges.',
      code: 'number = 15\nif number >= 10 and number <= 20:\n    print(number, "is between 10 and 20")\nelse:\n    print(number, "is out of range")',
      successPattern: /between|out of range/i,
      hint: 'Both conditions must be True at the same time. Try number = 10 (boundary), number = 20 (boundary), then number = 21 (out of range).',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Grade Classifier',
      description: 'This program uses "and" to give a grade based on a score range. Change the score and run to see different grades!',
      code: 'score = 78\nif score >= 90:\n    print("Grade: A")\nelif score >= 70 and score < 90:\n    print("Grade: B")\nelif score >= 50 and score < 70:\n    print("Grade: C")\nelse:\n    print("Grade: F")',
      successPattern: /Grade:/i,
      hint: 'Try score = 95, then 72, then 55, then 40. The "and" in each elif makes sure the score falls in exactly one band.',
      xp: 20,
    },
  ]
};

export default lesson13;
