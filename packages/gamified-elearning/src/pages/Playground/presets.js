// The playground's starter templates. Also read by the home page, which shows
// the first one and counts the rest, so the two can never disagree.
const PRESETS = [
  {
    label: 'Hello World',
    code: '# Print a message to the screen\nprint("Hello, World!")\nprint("Welcome to Python!")',
  },
  {
    label: 'Variables',
    code: '# Store values in variables\nname = "Alex"\nage = 12\nfavorite = "coding"\n\nprint(name)\nprint(age)\nprint("I love " + favorite)',
  },
  {
    label: 'If / Else',
    code: '# Make decisions with if/else\nscore = 85\n\nif score >= 90:\n    print("Grade: A")\nelif score >= 80:\n    print("Grade: B")\nelif score >= 70:\n    print("Grade: C")\nelse:\n    print("Grade: F")',
  },
  {
    label: 'For Loop',
    code: '# Repeat code with a for loop\nfor i in range(1, 6):\n    print("Step", i)\n\nprint("Done!")',
  },
  {
    label: 'Lists',
    code: '# Work with lists\nfruits = ["apple", "banana", "cherry"]\n\nfor fruit in fruits:\n    print("I like", fruit)\n\nfruits.append("mango")\nprint("Total fruits:", len(fruits))',
  },
  {
    label: 'Functions',
    code: '# Define reusable functions\ndef greet(name):\n    return "Hello, " + name + "!"\n\ndef add(a, b):\n    return a + b\n\nprint(greet("Alex"))\nprint(greet("Sam"))\nprint("3 + 4 =", add(3, 4))',
  },
  {
    label: 'Strings',
    code: '# String methods\nword = "python"\n\nprint(word.upper())\nprint(word.capitalize())\nprint(len(word))\nprint("hello " + word)',
  },
  {
    label: 'Math',
    code: 'import math\n\nprint("Pi =", round(math.pi, 4))\nprint("Square root of 25 =", math.sqrt(25))\nprint("2 to the power 8 =", 2 ** 8)\nprint("Absolute value of -7 =", abs(-7))',
  },
  {
    label: 'Booleans',
    code: '# Compare values to get True or False\na = 10\nb = 7\nprint("a == b:", a == b)\nprint("a > b:", a > b)\nprint("a != b:", a != b)\n\n# Logical operators\nprint("a > 5 and b > 5:", a > 5 and b > 5)\nprint("a > 15 or b > 5:", a > 15 or b > 5)\nprint("not (a == b):", not (a == b))',
  },
  {
    label: 'Type Casting',
    code: '# Convert between types\ntext = "42"\nnumber = int(text)\nprint("int:", number, type(number))\n\ndecimal = float("3.14")\nprint("float:", decimal, type(decimal))\n\nas_string = str(100)\nprint("str:", as_string, type(as_string))\n\nprint("int division:", 7 // 2)\nprint("remainder:", 7 % 2)',
  },
  {
    label: 'F-Strings',
    code: '# Build clean output with f-strings\nname = "Alex"\nage = 14\nscore = 98.5\n\nprint(f"Hello, {name}!")\nprint(f"Age: {age}")\nprint(f"Score: {score:.1f}")\nprint(f"{name} scored {score:.0f} points at age {age}.")',
  },
];

export { PRESETS };
