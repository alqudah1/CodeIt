const lesson8 = {
  id: 8,
  title: "Handling Errors Gracefully",
  subtitle: "Learn to catch mistakes before they crash your program — like a safety net for your code!",
  emoji: "🛡️",
  story: [
    "💥 Maya's robot kept crashing every time someone typed a word instead of a number. Total disaster!",
    "🦺 Python's try/except is a safety net. If code inside try: fails, Python jumps to except: — no crash!",
    "🧪 You can even print a friendly message: 'Oops! Please enter a number.' instead of a scary error.",
    "🏆 Professional programmers always handle errors. After this lesson, you will too!"
  ],
  concepts: [
    { icon: "🛡️", title: "try / except", body: "Code in try: runs normally. If it crashes, except: catches the error and handles it." },
    { icon: "🏷️", title: "Exception Types", body: "ValueError, TypeError, ZeroDivisionError — each error has a name you can catch specifically." },
    { icon: "📢", title: "Error Messages", body: "except ValueError as e: print(e) — you can print what went wrong in a friendly way." },
    { icon: "✅", title: "finally", body: "finally: always runs — even if there's an error. Use it for cleanup tasks." }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Safe Division",
      description: "Write try/except to handle division by zero. Print 'Cannot divide by zero!' if it happens.",
      initialCode: 'try:\n    result = 10 / 0\n    print(result)\nexcept ZeroDivisionError:\n    print("Cannot divide by zero!")',
      successPattern: /Cannot divide/i,
      hint: "Division by zero raises ZeroDivisionError. Catch it with except ZeroDivisionError:",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Type Safety",
      description: "Try to convert 'hello' to an integer. Catch the ValueError and print a friendly message.",
      initialCode: "try:\n    num = int(\"hello\")\n    print(num)\nexcept ValueError:\n    print(\"That's not a number!\")",
      successPattern: /not a number/i,
      hint: "int('hello') raises ValueError because 'hello' can't be converted to a number.",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Finally Block",
      description: "Add a finally block that always prints 'Program finished!' regardless of error.",
      initialCode: 'try:\n    print(10 / 2)\nexcept ZeroDivisionError:\n    print("Error!")\nfinally:\n    print("Program finished!")',
      successPattern: /Program finished/,
      hint: "finally: runs after try/except no matter what. Put cleanup code here.",
      xp: 20,
    }
  ]
};
export default lesson8;
