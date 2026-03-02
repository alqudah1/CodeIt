const lesson3 = {
  id: 3,
  title: "Functions & Loops — Do It Again!",
  subtitle: "Teach Python to repeat tasks and group actions into reusable recipes.",
  emoji: "🔄",
  story: [
    "🍕 Zara the pizza chef makes the same pizza 100 times a day. She's exhausted!",
    "💡 You tell Zara: 'Write a recipe once, then follow it as many times as you need.' That's a function!",
    "🔁 And for repetitive tasks — like putting cheese on 10 pizzas — you use a loop. Python counts for you!",
    "🎯 By the end of this lesson, you'll write your own recipe (function) and loop through a task automatically."
  ],
  concepts: [
    { icon: "📋", title: "Functions", body: "A function is a reusable block of code. Define it once with def, call it many times!" },
    { icon: "🔁", title: "For Loops", body: "A for loop repeats code a set number of times. for i in range(5): runs 5 times." },
    { icon: "📢", title: "Calling Functions", body: "After def greet():, call it by writing greet() — Python runs everything inside!" },
    { icon: "🎯", title: "Parameters", body: "Functions can take inputs: def greet(name): means you pass a name each call." }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Your First Function",
      description: "Define a function called greet that prints 'Hello, friend!' then call it.",
      initialCode: 'def greet():\n    print("Hello, friend!")\n\ngreet()',
      successPattern: /Hello/i,
      hint: "Don't forget to call greet() after defining it — define ≠ run!",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Loop 5 Times",
      description: "Use a for loop to print 'Coding is fun!' exactly 5 times.",
      initialCode: 'for i in range(5):\n    print("Coding is fun!")',
      successPattern: /Coding is fun/,
      hint: "range(5) gives you numbers 0,1,2,3,4 — Python runs the loop body once for each.",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Function with Parameter",
      description: "Write a function greet(name) that prints 'Hello, NAME!' and call it with your own name.",
      initialCode: 'def greet(name):\n    print("Hello, " + name + "!")\n\ngreet("Alex")',
      successPattern: /Hello/i,
      hint: "The parameter name acts like a variable inside the function. Try passing your own name!",
      xp: 20,
    }
  ]
};
export default lesson3;
