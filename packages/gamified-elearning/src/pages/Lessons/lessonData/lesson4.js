const lesson4 = {
  id: 4,
  title: "Making Decisions with If Statements",
  subtitle: "Teach Python to choose different paths — like a Choose-Your-Own-Adventure story!",
  emoji: "🔀",
  story: [
    "🌦️ Luna the weather bot needs to decide: 'Should I bring an umbrella today?'",
    "🤔 Luna checks the temperature. If it's raining → umbrella. If it's sunny → sunglasses. Otherwise → just a jacket.",
    "💻 Python does this with if/elif/else — each is a different fork in the road your code can take.",
    "🎮 You'll program Luna to make smart decisions based on numbers and conditions!"
  ],
  concepts: [
    { icon: "❓", title: "if statement", body: "if condition: runs the code block only when the condition is True." },
    { icon: "↔️", title: "elif / else", body: "elif gives a second condition to check. else runs when all conditions are False." },
    { icon: "⚖️", title: "Comparisons", body: "Use ==, >, <, >=, <= to compare values. if age > 12: checks if age is bigger than 12." },
    { icon: "🔗", title: "and / or", body: "Combine conditions: if temp > 20 and sunny: means BOTH must be true." }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Age Check",
      description: "Write an if/else that prints 'Teen!' if age >= 13 or 'Kid!' otherwise. Try different age values!",
      initialCode: 'age = 15\nif age >= 13:\n    print("Teen!")\nelse:\n    print("Kid!")',
      successPattern: /Teen|Kid/,
      hint: "Change age = 15 to age = 8 and run again to see the else branch!",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Temperature Advisor",
      description: "If temp > 25 print 'Hot day!', elif temp > 15 print 'Nice day!', else print 'Cold day!'",
      initialCode: 'temp = 20\nif temp > 25:\n    print("Hot day!")\nelif temp > 15:\n    print("Nice day!")\nelse:\n    print("Cold day!")',
      successPattern: /day!/,
      hint: "Try changing temp to 30, then to 10 — does Python pick the right message?",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Secret Password",
      description: "Check if password == 'python123'. Print 'Access granted!' or 'Wrong password!'",
      initialCode: 'password = "python123"\nif password == "python123":\n    print("Access granted!")\nelse:\n    print("Wrong password!")',
      successPattern: /Access|Wrong/,
      hint: "Try changing the password variable to something wrong — you should see 'Wrong password!'",
      xp: 20,
    }
  ]
};
export default lesson4;
