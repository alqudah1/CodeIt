# Interactive Lesson Template — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build one data-driven `InteractiveLessonTemplate` component used by all 10 lessons, each with 3 gated blocks (interaction + code runner), wired to the existing lesson→quiz→puzzle flow.

**Architecture:** Single React component reads lesson data from `lessonContent.js`, renders 3 glass-card blocks sequentially. Block N unlocks only after Block N-1's code runner passes (keyword match). Lesson completion persists to DB via existing `trackStaticLessonCompletion`. Quiz results screen gets a "Go to Puzzle" button.

**Tech Stack:** React (CRA), HTML5 Drag & Drop (no libs), Pyodide via existing `PythonEditor`, existing Express backend routes, localStorage for block state.

---

## Files to Create
- `src/data/lessonContent.js`
- `src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.js`
- `src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.css`

## Files to Modify
- `src/App.js` — point all `/lesson/:id` routes to template
- `src/pages/Lessons/index.js` — export template
- `src/pages/Quizzes/Quiz.js` — add "Go to Puzzle" button on results screen
- `src/pages/Quizzes/Quiz.css` — add `.qz-btn-puzzle` style

---

## Task 1: Create `src/data/lessonContent.js`

**File:** Create `packages/gamified-elearning/src/data/lessonContent.js`

This is the single source of truth for all 10 lessons. Each lesson has exactly 3 blocks. Each block has one interaction type (`drag-drop`, `fill-blank`, or `predict-output`) plus a code runner checkpoint.

**Interaction type schemas:**
- `drag-drop`: `{ pieces: string[], correctOrder: string[] }` — pieces are shown shuffled; user drags into slots
- `fill-blank`: `{ codeTemplate: string, options: string[], correctOption: string }` — `___` in template is the blank
- `predict-output`: `{ codeSnippet: string, options: string[], correctOption: string }` — user picks what the code prints

**Shared block fields:** `id, title, story, interactionType, prompt, starterCode, expectedKeywords: string[], hints: string[]`

**Validation rule:** `expectedKeywords` — output.toLowerCase() must contain ALL keyword strings (case-insensitive).

```js
// packages/gamified-elearning/src/data/lessonContent.js

export const LESSON_CONTENT = [

  // ─────────────────────────────────────────────────────────────────
  // LESSON 1 — Hello Python (print & basics)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Hello Python! 🐍',
    subtitle: 'Make the computer talk using print()',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '1-1',
        title: 'What is Python?',
        story: 'Python is a language computers understand — like a secret code! The print() command tells Python to show a message on screen. Think of it as making the computer talk! 🗣️',
        interactionType: 'drag-drop',
        prompt: 'Drag the pieces into the correct order to build: print("Hello")',
        pieces: ['print', '(', '"Hello"', ')', 'say'],
        correctOrder: ['print', '(', '"Hello"', ')'],
        starterCode: 'print("Hello, Python!")',
        expectedKeywords: ['hello'],
        hints: ['Start with the word: print', 'The message goes inside quotes inside the brackets'],
      },
      {
        id: '1-2',
        title: 'How print() works',
        story: 'When you type print("something"), Python shows that message on screen. You can print anything you want — words, numbers, even emojis! 🎉',
        interactionType: 'fill-blank',
        prompt: 'Fill in the blank to complete the code:',
        codeTemplate: '___("I love Python!")',
        options: ['print', 'say', 'show'],
        correctOption: 'print',
        starterCode: 'print("I love Python!")\nprint("Coding is fun!")',
        expectedKeywords: ['love python', 'fun'],
        hints: ['The command that makes Python show text on screen starts with "pr"'],
      },
      {
        id: '1-3',
        title: 'Your first message',
        story: 'You can print any message you want! Change the text inside the quotes and run the code. Almost there — one last challenge! 🔥',
        interactionType: 'predict-output',
        prompt: 'Look at this code. What will it print?',
        codeSnippet: 'print("Python rocks!")',
        options: ['Python rocks!', 'print("Python rocks!")', '"Python rocks!"', 'rocks'],
        correctOption: 'Python rocks!',
        starterCode: 'print("Python is awesome!")\nprint("I am a coder!")',
        expectedKeywords: ['python', 'coder'],
        hints: ['print() shows what is INSIDE the brackets (without the quotes)'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 2 — Variables & Data Types
  // ─────────────────────────────────────────────────────────────────
  {
    id: 2,
    title: 'Storing Information with Variables 📦',
    subtitle: 'Learn how Python remembers things using variables',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '2-1',
        title: 'What is a variable?',
        story: 'A variable is like a labelled box where Python stores information. You give it a name, then put a value inside using =. Example: name = "Alex" stores the word "Alex" in a box called "name". 📦',
        interactionType: 'drag-drop',
        prompt: 'Arrange these pieces to store the name "Alex" in a variable:',
        pieces: ['name', '=', '"Alex"', 'print', '10'],
        correctOrder: ['name', '=', '"Alex"'],
        starterCode: 'name = "Alex"\nprint(name)',
        expectedKeywords: ['alex'],
        hints: ['Variable name comes first, then =, then the value', 'Text values go inside double quotes'],
      },
      {
        id: '2-2',
        title: 'Numbers vs text',
        story: 'Variables can hold numbers (like age = 10) or text (like name = "Alex"). Numbers do NOT need quotes. Text DOES need quotes. This is called a data type! 🔢',
        interactionType: 'predict-output',
        prompt: 'Look at this code. What will it print?',
        codeSnippet: 'age = 10\nprint(age)',
        options: ['10', 'age', '"10"', 'print(age)'],
        correctOption: '10',
        starterCode: 'age = 8\nprint(age * 2)',
        expectedKeywords: ['16'],
        hints: ['Variables store the VALUE, not the name. age stores 10, so print(age) shows 10'],
      },
      {
        id: '2-3',
        title: 'Using variables together',
        story: 'You can use variables in print statements! You can even join text together using +. This is called concatenation — a fancy word for "sticking things together"! 🔗',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank so the variable stores a number (not text):',
        codeTemplate: 'age = ___\nprint(age)',
        options: ['10', '"10"', 'ten'],
        correctOption: '10',
        starterCode: 'name = "Alex"\nage = 10\nprint("Name:", name)\nprint("Age:", age)',
        expectedKeywords: ['alex', '10'],
        hints: ['Numbers do NOT use quotes. "10" is text, 10 is a number'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 3 — Functions & Loops
  // ─────────────────────────────────────────────────────────────────
  {
    id: 3,
    title: 'Loops & Functions 🔄',
    subtitle: 'Repeat actions and reuse code with loops and functions',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '3-1',
        title: 'What is a function?',
        story: 'A function is a reusable block of code. You define it once with def, then call it by name whenever you need it. It\'s like teaching Python a new trick! 🎪',
        interactionType: 'drag-drop',
        prompt: 'Arrange these lines to define and call a function:',
        pieces: ['def greet():', '    print("Hi!")', 'greet()', 'say hello'],
        correctOrder: ['def greet():', '    print("Hi!")', 'greet()'],
        starterCode: 'def greet():\n    print("Hi!")\ngreet()',
        expectedKeywords: ['hi'],
        hints: ['Functions start with def, then the function name and ()', 'Call the function by writing its name with () at the end'],
      },
      {
        id: '3-2',
        title: 'Loops — repeat code',
        story: 'A for loop repeats code multiple times. range(3) means "do this 3 times". Loops save you from writing the same line over and over! 🔁',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank to make the loop run 3 times:',
        codeTemplate: 'for i in ___:\n    print(i)',
        options: ['range(3)', '3', '"three"'],
        correctOption: 'range(3)',
        starterCode: 'for i in range(3):\n    print(i)',
        expectedKeywords: ['0', '1', '2'],
        hints: ['range(3) creates the numbers 0, 1, 2 — that\'s 3 numbers total'],
      },
      {
        id: '3-3',
        title: 'Loops with functions',
        story: 'You can combine loops and functions! Call a function inside a loop to repeat an action. Almost there — this is the final block! 🔥',
        interactionType: 'predict-output',
        prompt: 'What does this code print?',
        codeSnippet: 'for i in range(3):\n    print("Go!")',
        options: ['Go!\nGo!\nGo!', 'Go!', '012', '3'],
        correctOption: 'Go!\nGo!\nGo!',
        starterCode: 'def cheer(times):\n    for i in range(times):\n        print("Yay!")\ncheer(3)',
        expectedKeywords: ['yay'],
        hints: ['The loop runs range(3) = 3 times. Each time it prints "Go!" — so you get 3 lines'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 4 — Conditionals
  // ─────────────────────────────────────────────────────────────────
  {
    id: 4,
    title: 'Making Decisions with Conditionals 🔀',
    subtitle: 'Use if, elif, and else to make Python choose',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '4-1',
        title: 'If statements',
        story: 'An if statement lets Python make a decision. If a condition is true, it runs one block of code. If not, it can run something else. It\'s like a fork in the road! 🛤️',
        interactionType: 'drag-drop',
        prompt: 'Arrange these lines to print "Win!" if score is greater than 5:',
        pieces: ['if score > 5:', '    print("Win!")', 'else:', '    print("Try again")', 'elif:'],
        correctOrder: ['if score > 5:', '    print("Win!")', 'else:', '    print("Try again")'],
        starterCode: 'score = 7\nif score > 5:\n    print("Win!")\nelse:\n    print("Try again")',
        expectedKeywords: ['win'],
        hints: ['if comes first, else comes last', 'The indented code runs only when the condition is True'],
      },
      {
        id: '4-2',
        title: 'Comparison operators',
        story: 'Python uses == (equals), > (greater than), < (less than), >= (greater or equal), <= (less or equal). These are comparison operators — they check if something is true! ⚖️',
        interactionType: 'predict-output',
        prompt: 'What does this code print?',
        codeSnippet: 'age = 10\nif age >= 10:\n    print("You are 10 or older")',
        options: ['You are 10 or older', 'False', '10', 'nothing'],
        correctOption: 'You are 10 or older',
        starterCode: 'score = 5\nif score >= 5:\n    print("Pass")\nelse:\n    print("Fail")',
        expectedKeywords: ['pass'],
        hints: ['age is 10, and 10 >= 10 is True, so the if block runs'],
      },
      {
        id: '4-3',
        title: 'else — the fallback',
        story: 'The else block runs when the if condition is False. Together with elif (else-if), you can handle many different cases. One last challenge! 🔥',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank to add an else clause:',
        codeTemplate: 'x = -3\nif x > 0:\n    print("Positive")\n___:\n    print("Not positive")',
        options: ['else', 'elif', 'if'],
        correctOption: 'else',
        starterCode: 'x = -3\nif x > 0:\n    print("Positive")\nelif x == 0:\n    print("Zero")\nelse:\n    print("Negative")',
        expectedKeywords: ['negative'],
        hints: ['else runs when NO previous condition was True. It has no condition of its own'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 5 — Lists & Strings
  // ─────────────────────────────────────────────────────────────────
  {
    id: 5,
    title: 'Lists & Strings 📋',
    subtitle: 'Store collections of items and work with text',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '5-1',
        title: 'Lists — storing many items',
        story: 'A list stores multiple items in one variable. You create a list with square brackets: fruits = ["apple", "banana"]. Each item has a position (index) starting from 0! 📋',
        interactionType: 'drag-drop',
        prompt: 'Arrange the lines to create a list and print its first item:',
        pieces: ['fruits = ["apple", "banana"]', 'print(fruits[0])', 'print(len(fruits))', 'x = 99'],
        correctOrder: ['fruits = ["apple", "banana"]', 'print(fruits[0])', 'print(len(fruits))'],
        starterCode: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[0])',
        expectedKeywords: ['apple'],
        hints: ['Lists use square brackets []', 'fruits[0] gets the FIRST item (index starts at 0)'],
      },
      {
        id: '5-2',
        title: 'String methods',
        story: 'Strings have built-in methods (tools) to transform text. .upper() makes it ALL CAPS, .lower() makes it lowercase, .strip() removes extra spaces. Methods are called with a dot! 🔧',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank to convert the text to uppercase:',
        codeTemplate: 'message = "hello"\nprint(message.___())',
        options: ['upper', 'capitalize', 'UPPER'],
        correctOption: 'upper',
        starterCode: 'name = "python"\nprint(name.upper())',
        expectedKeywords: ['python'],
        hints: ['The method to make ALL CAPS is called upper (not UPPER)'],
      },
      {
        id: '5-3',
        title: 'List operations',
        story: 'You can add items to a list with .append(), get the length with len(), and loop through items with for. Lists are incredibly useful in real programs! 🔥',
        interactionType: 'predict-output',
        prompt: 'What does this code print?',
        codeSnippet: 'numbers = [1, 2, 3]\nprint(len(numbers))',
        options: ['3', '[1, 2, 3]', '1', '6'],
        correctOption: '3',
        starterCode: 'words = ["cat", "dog", "fish"]\nwords.append("bird")\nprint(words)',
        expectedKeywords: ['cat', 'bird'],
        hints: ['len() returns the COUNT of items in the list. [1,2,3] has 3 items'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 6 — Dictionaries & Sets
  // ─────────────────────────────────────────────────────────────────
  {
    id: 6,
    title: 'Dictionaries & Sets 📚',
    subtitle: 'Store labelled information like a contact book',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '6-1',
        title: 'Dictionaries — labelled data',
        story: 'A dictionary stores key-value pairs — like a real dictionary where words have definitions. You create one with curly braces: person = {"name": "Alex", "age": 10}. Access values by key! 📖',
        interactionType: 'drag-drop',
        prompt: 'Arrange the lines to create a dictionary and print a value:',
        pieces: ['person = {"name": "Alex", "age": 10}', 'print(person["name"])', 'print(person["city"])', 'x = person'],
        correctOrder: ['person = {"name": "Alex", "age": 10}', 'print(person["name"])'],
        starterCode: 'person = {"name": "Alex", "age": 10}\nprint(person["name"])',
        expectedKeywords: ['alex'],
        hints: ['Dictionaries use curly braces {}', 'Access a value with dict["key"]'],
      },
      {
        id: '6-2',
        title: 'Accessing dictionary values',
        story: 'To get a value from a dictionary, use the key in square brackets: grades["math"]. The key is like a label, and the value is what\'s stored under that label! 🔑',
        interactionType: 'predict-output',
        prompt: 'What does this code print?',
        codeSnippet: 'grades = {"math": 95, "art": 88}\nprint(grades["math"])',
        options: ['95', '88', 'grades["math"]', 'math'],
        correctOption: '95',
        starterCode: 'pet = {"name": "Buddy", "type": "dog"}\nprint(pet["type"])',
        expectedKeywords: ['dog'],
        hints: ['grades["math"] gets the value stored under the key "math", which is 95'],
      },
      {
        id: '6-3',
        title: 'Adding to dictionaries',
        story: 'You can add new key-value pairs to a dictionary after creating it: pet["age"] = 3. You can also update existing values! Dictionaries are flexible and powerful! 🔥',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank to add an age to the dictionary:',
        codeTemplate: 'pet = {"name": "Buddy"}\npet["age"] = ___\nprint(pet)',
        options: ['3', '"3"', 'age'],
        correctOption: '3',
        starterCode: 'scores = {"alice": 90, "bob": 85}\nscores["carol"] = 92\nprint(scores)',
        expectedKeywords: ['carol', '92'],
        hints: ['Age is a number, so it does NOT need quotes'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 7 — File Handling
  // ─────────────────────────────────────────────────────────────────
  {
    id: 7,
    title: 'File Handling 📁',
    subtitle: 'Read and write files to save data permanently',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '7-1',
        title: 'Writing to a file',
        story: 'Python can save data to files! Use open("filename.txt", "w") to open a file for writing. The "w" means write mode. Always use with so Python closes the file automatically! 💾',
        interactionType: 'drag-drop',
        prompt: 'Arrange the lines to write to a file and confirm it worked:',
        pieces: ['with open("notes.txt", "w") as f:', '    f.write("Hello file!")', 'print("File saved!")', 'f.read("Hello file!")'],
        correctOrder: ['with open("notes.txt", "w") as f:', '    f.write("Hello file!")', 'print("File saved!")'],
        starterCode: 'with open("hello.txt", "w") as f:\n    f.write("Hello, file!")\nwith open("hello.txt", "r") as f:\n    print(f.read())',
        expectedKeywords: ['hello'],
        hints: ['The with statement automatically closes the file', 'f.write() puts text into the file'],
      },
      {
        id: '7-2',
        title: 'Reading from a file',
        story: 'To read a file, use open("filename.txt", "r") — "r" means read mode. Then f.read() gets all the text inside the file. You can write and read in the same program! 📖',
        interactionType: 'predict-output',
        prompt: 'What does this code print?',
        codeSnippet: 'with open("test.txt", "w") as f:\n    f.write("Hi!")\nwith open("test.txt", "r") as f:\n    print(f.read())',
        options: ['Hi!', 'f.read()', '"Hi!"', 'test.txt'],
        correctOption: 'Hi!',
        starterCode: 'with open("diary.txt", "w") as f:\n    f.write("Day 1: I learned Python!")\nwith open("diary.txt", "r") as f:\n    content = f.read()\n    print(content)',
        expectedKeywords: ['day 1', 'python'],
        hints: ['f.read() returns everything that was written to the file — in this case: Hi!'],
      },
      {
        id: '7-3',
        title: 'Read vs Write mode',
        story: 'The mode string matters! "w" = write, "r" = read, "a" = append (add to end). Using the wrong mode causes an error. One last challenge! 🔥',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank to open the file in READ mode:',
        codeTemplate: 'with open("data.txt", ___) as f:\n    print(f.read())',
        options: ['"r"', '"w"', '"read"'],
        correctOption: '"r"',
        starterCode: 'lines = ["line 1", "line 2", "line 3"]\nwith open("lines.txt", "w") as f:\n    for line in lines:\n        f.write(line + "\\n")\nwith open("lines.txt", "r") as f:\n    print(f.read())',
        expectedKeywords: ['line 1', 'line 2'],
        hints: ['The mode for reading is "r" (in quotes). "r" stands for read'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 8 — Exception Handling
  // ─────────────────────────────────────────────────────────────────
  {
    id: 8,
    title: 'Exception Handling 🛡️',
    subtitle: 'Handle errors gracefully so your program never crashes',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '8-1',
        title: 'What is an exception?',
        story: 'An exception is an error that happens while the program runs. Without handling it, the program crashes! Use try/except to catch errors and handle them gracefully — like a safety net! 🕸️',
        interactionType: 'drag-drop',
        prompt: 'Arrange these lines to catch a ValueError:',
        pieces: ['try:', '    x = int("abc")', 'except ValueError:', "    print(\"That's not a number!\")", '    print(x)'],
        correctOrder: ['try:', '    x = int("abc")', 'except ValueError:', "    print(\"That's not a number!\")"],
        starterCode: 'try:\n    number = int("hello")\n    print(number)\nexcept ValueError:\n    print("Oops! That is not a number.")',
        expectedKeywords: ['oops', 'not a number'],
        hints: ['try goes first, then the risky code (indented)', 'except catches the error — it only runs if something went wrong'],
      },
      {
        id: '8-2',
        title: 'Different exception types',
        story: 'Different errors have different names: ValueError (wrong type), ZeroDivisionError (divide by zero), IndexError (list index out of range). You can catch specific ones! 🎯',
        interactionType: 'predict-output',
        prompt: 'What does this code print?',
        codeSnippet: 'try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print("Cannot divide by zero!")',
        options: ["Cannot divide by zero!", '0', '10 / 0', 'ZeroDivisionError'],
        correctOption: "Cannot divide by zero!",
        starterCode: 'def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return "Cannot divide by zero!"\nprint(safe_divide(10, 2))\nprint(safe_divide(5, 0))',
        expectedKeywords: ['5.0', 'cannot'],
        hints: ['10 / 0 causes a ZeroDivisionError. The except block catches it and prints the message'],
      },
      {
        id: '8-3',
        title: 'Catching the right error',
        story: 'Match your except to the right error type. ZeroDivisionError for division, ValueError for type problems, IndexError for list bounds. Great programmers handle all cases! 🔥',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank with the correct exception type:',
        codeTemplate: 'try:\n    x = 10 / 0\nexcept ___:\n    print("Error!")',
        options: ['ZeroDivisionError', 'Error', 'ValueError'],
        correctOption: 'ZeroDivisionError',
        starterCode: 'def get_item(lst, index):\n    try:\n        return lst[index]\n    except IndexError:\n        return "Index out of range!"\nfruits = ["apple", "banana"]\nprint(get_item(fruits, 0))\nprint(get_item(fruits, 5))',
        expectedKeywords: ['apple', 'index out of range'],
        hints: ['10 / 0 is a division by zero error. The exception class for this is ZeroDivisionError'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 9 — Object-Oriented Programming
  // ─────────────────────────────────────────────────────────────────
  {
    id: 9,
    title: 'Object-Oriented Programming 🏗️',
    subtitle: 'Create your own objects with classes',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '9-1',
        title: 'Classes and objects',
        story: 'A class is a blueprint for creating objects. An object is an instance of a class. Like a cookie cutter (class) and the cookies (objects)! You can make as many cookies as you like! 🍪',
        interactionType: 'drag-drop',
        prompt: 'Arrange these lines to define a Dog class with a bark method:',
        pieces: ['class Dog:', '    def __init__(self, name):', '        self.name = name', '    def bark(self):', '        print(self.name + " says: Woof!")', '    def init(name):'],
        correctOrder: ['class Dog:', '    def __init__(self, name):', '        self.name = name', '    def bark(self):', '        print(self.name + " says: Woof!")'],
        starterCode: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        print(self.name + " says: Woof!")\nmy_dog = Dog("Rex")\nmy_dog.bark()',
        expectedKeywords: ['rex', 'woof'],
        hints: ['class comes first', '__init__ is the constructor — it runs when you create an object', 'self refers to the object itself'],
      },
      {
        id: '9-2',
        title: 'The self keyword',
        story: 'self is how an object refers to itself. When you write self.name = name, you\'re saving the name ON the object. Every method in a class gets self as its first parameter! 🪞',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank with the correct keyword:',
        codeTemplate: 'class Cat:\n    def __init__(self, name):\n        ___.name = name',
        options: ['self', 'cat', 'name'],
        correctOption: 'self',
        starterCode: 'class Cat:\n    def __init__(self, name, color):\n        self.name = name\n        self.color = color\n    def describe(self):\n        print(self.name + " is " + self.color)\nmy_cat = Cat("Whiskers", "orange")\nmy_cat.describe()',
        expectedKeywords: ['whiskers', 'orange'],
        hints: ['self refers to the object being created. self.name stores name ON the object'],
      },
      {
        id: '9-3',
        title: 'Inheritance',
        story: 'One class can inherit from another, getting all its methods! This is called inheritance. It\'s like a child inheriting traits from a parent. This is the last block — you\'re almost done! 🔥',
        interactionType: 'predict-output',
        prompt: 'What does this code print?',
        codeSnippet: 'class Animal:\n    def speak(self):\n        print("...")\nclass Dog(Animal):\n    def speak(self):\n        print("Woof!")\nd = Dog()\nd.speak()',
        options: ['Woof!', '...', 'Dog', 'Animal'],
        correctOption: 'Woof!',
        starterCode: 'class Circle:\n    def __init__(self, radius):\n        self.radius = radius\n    def area(self):\n        return 3.14 * self.radius * self.radius\nc = Circle(5)\nprint("Area:", c.area())',
        expectedKeywords: ['area', '78.5'],
        hints: ['Dog overrides speak(), so its own version runs — not Animal\'s version'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LESSON 10 — Modules & Libraries
  // ─────────────────────────────────────────────────────────────────
  {
    id: 10,
    title: 'Modules & Libraries 🧩',
    subtitle: 'Import powerful tools to supercharge your Python',
    estimatedMinutes: 15,
    blocks: [
      {
        id: '10-1',
        title: 'Importing modules',
        story: 'Python comes with lots of built-in modules — toolboxes full of useful functions! Use import to bring them in. import random gives you random numbers, import math gives you math tools! 🧰',
        interactionType: 'drag-drop',
        prompt: 'Arrange the lines to import random and generate a number:',
        pieces: ['import random', 'number = random.randint(1, 10)', 'print("Number:", number)', 'random.dice()'],
        correctOrder: ['import random', 'number = random.randint(1, 10)', 'print("Number:", number)'],
        starterCode: 'import random\nresult = random.randint(1, 100)\nprint("Random number:", result)',
        expectedKeywords: ['random number'],
        hints: ['import comes first, before using the module', 'random.randint(1, 10) gives a random number between 1 and 10'],
      },
      {
        id: '10-2',
        title: 'The math module',
        story: 'The math module has functions like sqrt (square root), floor (round down), ceil (round up), and the constant pi. These save you from writing complex math yourself! ➕',
        interactionType: 'predict-output',
        prompt: 'What does this code print?',
        codeSnippet: 'import math\nprint(math.sqrt(16))',
        options: ['4.0', '16', '2.0', 'sqrt(16)'],
        correctOption: '4.0',
        starterCode: 'import math\nprint("Pi is:", math.pi)\nprint("Square root of 25:", math.sqrt(25))',
        expectedKeywords: ['pi', '5.0'],
        hints: ['math.sqrt(16) = 4.0 because 4 * 4 = 16. Python returns it as a decimal (float)'],
      },
      {
        id: '10-3',
        title: 'Choosing the right module',
        story: 'Different modules do different things. import math for math, import random for random numbers, import datetime for dates and times. You\'ve made it to the final block! 🔥🎉',
        interactionType: 'fill-blank',
        prompt: 'Fill the blank to import the math module:',
        codeTemplate: 'import ___\nprint(math.floor(3.7))',
        options: ['math', 'random', 'string'],
        correctOption: 'math',
        starterCode: 'import math\nprint("Floor of 7.9:", math.floor(7.9))\nprint("Ceiling of 2.1:", math.ceil(2.1))',
        expectedKeywords: ['7', '3'],
        hints: ['math.floor() rounds DOWN. To use it, you need to import math'],
      },
    ],
  },
];
```

**Step: Write the file** — copy the code above into `packages/gamified-elearning/src/data/lessonContent.js`.

**Step: Commit**
```bash
cd /home/bitnami/CodeIt
git add packages/gamified-elearning/src/data/lessonContent.js
git commit -m "feat(data): add lessonContent.js with all 10 lessons (3 blocks each)"
```

---

## Task 2: Create `InteractiveLessonTemplate.css`

**File:** Create `packages/gamified-elearning/src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.css`

```css
/* InteractiveLessonTemplate.css
   Scoped with il- prefix to avoid clashing with any existing classes */

:root {
  --il-primary: #667eea;
  --il-accent:  #4ecca3;
  --il-warm:    #ffd166;
  --il-danger:  #ff6b9d;
}

/* ── Page ──────────────────────────────────────────────────────────── */
.il-page {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    rgba(255, 245, 165, 0.95) 0%,
    rgba(255, 214, 165, 0.95) 30%,
    rgba(255, 171, 171, 0.95) 60%,
    rgba(155, 246, 255, 0.95) 100%
  );
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
}

.il-confetti {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.il-content {
  max-width: 820px;
  margin: 0 auto;
  padding: 100px 20px 80px;
  width: 100%;
}

/* ── Lesson header ──────────────────────────────────────────────────── */
.il-lesson-header {
  text-align: center;
  margin-bottom: 28px;
}

.il-lesson-pill {
  display: inline-block;
  padding: 4px 14px;
  background: linear-gradient(135deg, var(--il-primary), #764ba2);
  color: #fff;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.il-lesson-title {
  font-size: clamp(1.4rem, 4vw, 2rem);
  font-weight: 800;
  color: #1a1a2e;
  margin: 8px 0 6px;
}

.il-lesson-subtitle {
  color: #555;
  font-size: 1.05rem;
}

/* ── Progress dots ──────────────────────────────────────────────────── */
.il-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.il-progress__dot {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  transition: all 350ms ease;
  background: #e9ecef;
  color: #adb5bd;
  flex-shrink: 0;
}

.il-progress__dot--done {
  background: var(--il-accent);
  color: #fff;
  box-shadow: 0 0 16px rgba(78, 204, 163, 0.5);
}

.il-progress__dot--active {
  background: var(--il-primary);
  color: #fff;
  box-shadow: 0 0 16px rgba(102, 126, 234, 0.5);
}

.il-progress__dot--locked {
  background: #dee2e6;
  color: #adb5bd;
}

.il-progress__line {
  width: 80px;
  height: 4px;
  background: #dee2e6;
  border-radius: 2px;
  transition: background 350ms ease;
  flex-shrink: 0;
}

.il-progress__line--done {
  background: var(--il-accent);
}

/* ── Block card ─────────────────────────────────────────────────────── */
.il-block {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  padding: 24px;
  margin-bottom: 20px;
  transition: all 350ms ease;
}

.il-block--locked {
  opacity: 0.45;
  pointer-events: none;
  filter: grayscale(30%);
}

.il-block--done {
  border-color: rgba(78, 204, 163, 0.5);
  box-shadow: 0 8px 32px rgba(78, 204, 163, 0.15);
}

.il-block__lock {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-size: 1rem;
}

.il-block__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.il-block__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, var(--il-primary), #764ba2);
  color: #fff;
  border-radius: 50%;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.35);
}

.il-block__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  flex: 1;
}

.il-block__done-badge {
  font-size: 1.2rem;
  margin-left: auto;
}

.il-block__story {
  color: #444;
  font-size: 1rem;
  line-height: 1.65;
  margin-bottom: 18px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border-left: 4px solid var(--il-primary);
}

/* ── Motivational banner ─────────────────────────────────────────────── */
.il-motivational {
  background: linear-gradient(135deg, var(--il-warm), #ffaa00);
  color: #7a4000;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 14px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(255, 170, 0, 0.25);
}

/* ── Interaction ─────────────────────────────────────────────────────── */
.il-interaction {
  margin-bottom: 16px;
}

.il-interaction__prompt {
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  font-size: 0.97rem;
}

/* Drag-drop */
.il-dd__available {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  min-height: 54px;
  margin-bottom: 14px;
  background: rgba(102, 126, 234, 0.03);
}

.il-dd__empty {
  color: #adb5bd;
  font-size: 0.9rem;
  align-self: center;
}

.il-dd__slots {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.il-slot {
  min-width: 80px;
  min-height: 46px;
  border: 2.5px dashed rgba(102, 126, 234, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.04);
  transition: all 150ms;
  padding: 4px 8px;
}

.il-slot--filled {
  border-style: solid;
  border-color: var(--il-primary);
  background: rgba(102, 126, 234, 0.08);
}

.il-slot__hint {
  color: #adb5bd;
  font-size: 0.78rem;
}

.il-chip {
  padding: 9px 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid var(--il-primary);
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: grab;
  user-select: none;
  transition: transform 120ms, box-shadow 120ms;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.15);
}

.il-chip:active,
.il-chip--placed:active {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  cursor: grabbing;
}

/* Fill-blank & predict */
.il-code-display {
  background: rgba(22, 22, 40, 0.92);
  color: #e9ecef;
  padding: 14px 18px;
  border-radius: 14px;
  font-family: 'Courier New', monospace;
  font-size: 0.93rem;
  line-height: 1.7;
  margin-bottom: 14px;
  overflow-x: auto;
  white-space: pre;
}

.il-blank {
  display: inline-block;
  min-width: 64px;
  padding: 2px 10px;
  border: 2px dashed var(--il-warm);
  border-radius: 6px;
  color: var(--il-warm);
  background: rgba(255, 209, 102, 0.1);
  transition: all 200ms;
}

.il-blank--filled {
  border-style: solid;
  color: #fff;
  background: rgba(102, 126, 234, 0.4);
  border-color: var(--il-primary);
}

.il-blank--correct {
  background: rgba(78, 204, 163, 0.35);
  border-color: var(--il-accent);
  color: #d4fc79;
}

.il-blank--wrong {
  background: rgba(255, 107, 157, 0.25);
  border-color: var(--il-danger);
  color: #ffb4c0;
}

.il-predict__question {
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
  font-size: 0.97rem;
}

.il-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.il-opt {
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.88);
  border: 2px solid var(--il-primary);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.il-opt:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.il-opt--selected {
  background: rgba(102, 126, 234, 0.15);
  border-width: 2.5px;
}

.il-opt--correct {
  border-color: var(--il-accent);
  background: rgba(78, 204, 163, 0.2);
  color: #1e6f3e;
}

.il-opt--wrong {
  border-color: var(--il-danger);
  background: rgba(255, 107, 157, 0.15);
  color: #8b0032;
}

/* ── Code runner ─────────────────────────────────────────────────────── */
.il-block__runner {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1.5px solid rgba(102, 126, 234, 0.18);
}

.il-runner__title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.il-runner__desc {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 12px;
}

/* ── Hint ────────────────────────────────────────────────────────────── */
.il-hint {
  background: rgba(255, 245, 165, 0.85);
  border: 1.5px solid var(--il-warm);
  border-radius: 10px;
  padding: 10px 14px;
  color: #7a4000;
  font-size: 0.9rem;
  margin-top: 10px;
}

.il-hint p {
  margin: 0 0 4px;
}

.il-hint p:last-child {
  margin-bottom: 0;
}

/* ── Feedback ────────────────────────────────────────────────────────── */
.il-feedback {
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  margin-top: 12px;
}

.il-feedback--correct {
  background: rgba(78, 204, 163, 0.18);
  border: 1.5px solid var(--il-accent);
  color: #1e6f3e;
}

.il-feedback--wrong {
  background: rgba(255, 107, 157, 0.13);
  border: 1.5px solid var(--il-danger);
  color: #8b0032;
}

/* ── Buttons ─────────────────────────────────────────────────────────── */
.il-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: transform 120ms, box-shadow 120ms;
  margin-top: 10px;
  margin-right: 8px;
  text-decoration: none;
}

.il-btn:hover {
  transform: translateY(-2px);
}

.il-btn--primary {
  background: linear-gradient(135deg, var(--il-primary), #764ba2);
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.il-btn--hint {
  background: rgba(255, 245, 165, 0.85);
  color: #7a4000;
  border: 1.5px solid var(--il-warm);
}

.il-btn--check {
  background: linear-gradient(135deg, var(--il-accent), #2e9c81);
  color: #fff;
  box-shadow: 0 4px 14px rgba(78, 204, 163, 0.38);
}

.il-btn--lg {
  padding: 14px 30px;
  font-size: 1.05rem;
  border-radius: 14px;
}

/* ── Celebration panel ──────────────────────────────────────────────── */
.il-celebration {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid rgba(78, 204, 163, 0.5);
  border-radius: 24px;
  padding: 36px 28px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(78, 204, 163, 0.22);
  margin-top: 28px;
}

.il-celebration h2 {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 10px;
}

.il-celebration p {
  color: #555;
  margin: 0 0 20px;
  font-size: 1.05rem;
}

.il-xp-pill {
  display: inline-block;
  padding: 6px 22px;
  background: linear-gradient(135deg, var(--il-warm), #ffaa00);
  color: #7a4000;
  border-radius: 999px;
  font-weight: 700;
  font-size: 1rem;
  margin: 6px 0 18px;
  box-shadow: 0 4px 12px rgba(255, 170, 0, 0.3);
}

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .il-content {
    padding: 88px 12px 60px;
  }
  .il-block {
    padding: 16px;
  }
  .il-progress__line {
    width: 40px;
  }
  .il-dd__slots {
    flex-direction: column;
  }
  .il-slot {
    min-width: 100%;
  }
  .il-btn--lg {
    width: 100%;
    justify-content: center;
  }
}
```

**Step: Create directory and write file**
```bash
mkdir -p /home/bitnami/CodeIt/packages/gamified-elearning/src/components/InteractiveLessonTemplate
```
Then write the CSS file as above.

**Step: Commit**
```bash
git add packages/gamified-elearning/src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.css
git commit -m "feat(styles): add InteractiveLessonTemplate.css with glass UI and 4 brand colors"
```

---

## Task 3: Create `InteractiveLessonTemplate.js`

**File:** Create `packages/gamified-elearning/src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.js`

**Imports needed:**
- `react-router-dom`: `useNavigate`, `useParams`
- `../../pages/Header/Header`
- `../../pages/pythoneditor/PythonEditor`
- `../../data/lessonContent` → `LESSON_CONTENT`
- `../../utils/progressTracker` → `trackStaticLessonCompletion`
- `../../context/ProgressContext` → `useProgress`
- `../../context/AuthContext` → `AuthContext`
- `./InteractiveLessonTemplate.css`

```jsx
// packages/gamified-elearning/src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.js

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../pages/Header/Header';
import PythonEditor from '../../pages/pythoneditor/PythonEditor';
import { LESSON_CONTENT } from '../../data/lessonContent';
import { trackStaticLessonCompletion } from '../../utils/progressTracker';
import { useProgress } from '../../context/ProgressContext';
import { AuthContext } from '../../context/AuthContext';
import './InteractiveLessonTemplate.css';

// ── Lightweight confetti (canvas, no deps) ───────────────────────────
function fireConfetti(canvasRef, durationMs = 1800) {
  const canvas = canvasRef.current;
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx    = canvas.getContext('2d');
  const colors = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e', '#667eea'];
  const parts  = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width, y: -10,
    r: 3 + Math.random() * 5,
    c: colors[Math.floor(Math.random() * colors.length)],
    vx: -3 + Math.random() * 6, vy: 2 + Math.random() * 4,
    g: 0.04 + Math.random() * 0.05, a: 1,
  }));
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.a -= 0.0035;
      ctx.globalAlpha = Math.max(p.a, 0);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (ts - start < durationMs) requestAnimationFrame(step);
    else { ctx.globalAlpha = 1; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  };
  requestAnimationFrame(step);
}

// ── DragDrop interaction ─────────────────────────────────────────────
function DragDropInteraction({ block, onPass }) {
  const [slots,     setSlots]     = useState(Array(block.correctOrder.length).fill(null));
  const [available, setAvailable] = useState(() => [...block.pieces].sort(() => Math.random() - 0.5));
  const [checked,   setChecked]   = useState(false);
  const [correct,   setCorrect]   = useState(false);
  const [hintIdx,   setHintIdx]   = useState(0);

  // Already passed (parent re-renders with new block) — reset on block change
  useEffect(() => {
    setSlots(Array(block.correctOrder.length).fill(null));
    setAvailable([...block.pieces].sort(() => Math.random() - 0.5));
    setChecked(false);
    setCorrect(false);
    setHintIdx(0);
  }, [block.id]); // eslint-disable-line

  const onDragStart = (e, item, fromSlotIdx) => {
    e.dataTransfer.setData('item', item);
    e.dataTransfer.setData('fromSlot', fromSlotIdx !== undefined ? String(fromSlotIdx) : '-1');
  };

  const onDropSlot = (e, toIdx) => {
    e.preventDefault();
    const item      = e.dataTransfer.getData('item');
    const fromSlot  = parseInt(e.dataTransfer.getData('fromSlot'), 10);
    const newSlots  = [...slots];
    const newAvail  = [...available];

    if (fromSlot >= 0) {
      // Swap: piece came from another slot
      const displaced = newSlots[toIdx];
      newSlots[toIdx]      = item;
      newSlots[fromSlot]   = displaced;
    } else {
      // From available pool
      const aIdx = newAvail.indexOf(item);
      if (aIdx >= 0) newAvail.splice(aIdx, 1);
      if (newSlots[toIdx] !== null) newAvail.push(newSlots[toIdx]);
      newSlots[toIdx] = item;
    }
    setSlots(newSlots);
    setAvailable(newAvail);
    setChecked(false);
  };

  const onDropAvailable = (e) => {
    e.preventDefault();
    const fromSlot = parseInt(e.dataTransfer.getData('fromSlot'), 10);
    if (fromSlot >= 0) {
      const item     = e.dataTransfer.getData('item');
      const newSlots = [...slots];
      newSlots[fromSlot] = null;
      setSlots(newSlots);
      setAvailable(prev => [...prev, item]);
      setChecked(false);
    }
  };

  const handleCheck = () => {
    setChecked(true);
    const isOk = slots.every((s, i) => s === block.correctOrder[i]);
    setCorrect(isOk);
    if (isOk) onPass();
  };

  const allFilled = slots.every(s => s !== null);

  if (correct) {
    return <div className="il-feedback il-feedback--correct">🎉 Perfect order! Now run the code below. ▼</div>;
  }

  return (
    <div className="il-interaction il-drag-drop">
      <p className="il-interaction__prompt">{block.prompt}</p>

      {/* Available pool */}
      <div className="il-dd__available" onDragOver={e => e.preventDefault()} onDrop={onDropAvailable}>
        {available.length > 0
          ? available.map((item, i) => (
              <div key={i} className="il-chip" draggable onDragStart={e => onDragStart(e, item, undefined)}>
                {item}
              </div>
            ))
          : <span className="il-dd__empty">All pieces placed!</span>
        }
      </div>

      {/* Drop slots */}
      <div className="il-dd__slots">
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`il-slot ${slot ? 'il-slot--filled' : ''}`}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDropSlot(e, i)}
          >
            {slot
              ? <div className="il-chip il-chip--placed" draggable onDragStart={e => onDragStart(e, slot, i)}>{slot}</div>
              : <span className="il-slot__hint">Drop here</span>
            }
          </div>
        ))}
      </div>

      {/* Hints */}
      {hintIdx < block.hints.length && (
        <button className="il-btn il-btn--hint" onClick={() => setHintIdx(h => h + 1)}>💡 Need a hint?</button>
      )}
      {hintIdx > 0 && (
        <div className="il-hint">
          {block.hints.slice(0, hintIdx).map((h, i) => <p key={i}>💡 {h}</p>)}
        </div>
      )}

      {/* Check button */}
      {allFilled && (
        <button className="il-btn il-btn--check" onClick={handleCheck}>✅ Check Order</button>
      )}
      {checked && !correct && (
        <div className="il-feedback il-feedback--wrong">Not quite! Check the order and try again. 🔄</div>
      )}
    </div>
  );
}

// ── FillBlank interaction ────────────────────────────────────────────
function FillBlankInteraction({ block, onPass }) {
  const [selected, setSelected] = useState(null);
  const [checked,  setChecked]  = useState(false);
  const [hintIdx,  setHintIdx]  = useState(0);

  useEffect(() => {
    setSelected(null); setChecked(false); setHintIdx(0);
  }, [block.id]); // eslint-disable-line

  const parts   = block.codeTemplate.split('___');
  const correct = checked && selected === block.correctOption;
  const wrong   = checked && selected !== block.correctOption;

  const handleCheck = () => {
    if (!selected) return;
    setChecked(true);
    if (selected === block.correctOption) onPass();
  };

  if (correct) {
    return <div className="il-feedback il-feedback--correct">🎉 Correct! Now run the code below. ▼</div>;
  }

  return (
    <div className="il-interaction il-fill-blank">
      <p className="il-interaction__prompt">{block.prompt}</p>

      <pre className="il-code-display">
        {parts[0]}
        <span className={`il-blank ${selected ? 'il-blank--filled' : ''} ${wrong ? 'il-blank--wrong' : ''}`}>
          {selected || '___'}
        </span>
        {parts[1] || ''}
      </pre>

      <div className="il-options">
        {block.options.map((opt, i) => (
          <button
            key={i}
            className={`il-opt ${selected === opt ? 'il-opt--selected' : ''} ${wrong && opt === selected ? 'il-opt--wrong' : ''}`}
            onClick={() => { setSelected(opt); setChecked(false); }}
          >
            {opt}
          </button>
        ))}
      </div>

      {hintIdx < block.hints.length && (
        <button className="il-btn il-btn--hint" onClick={() => setHintIdx(h => h + 1)}>💡 Need a hint?</button>
      )}
      {hintIdx > 0 && (
        <div className="il-hint">
          {block.hints.slice(0, hintIdx).map((h, i) => <p key={i}>💡 {h}</p>)}
        </div>
      )}

      {selected && (
        <button className="il-btn il-btn--check" onClick={handleCheck}>✅ Check Answer</button>
      )}
      {wrong && (
        <div className="il-feedback il-feedback--wrong">Not quite! Try a different option. 🔄</div>
      )}
    </div>
  );
}

// ── PredictOutput interaction ─────────────────────────────────────────
function PredictOutputInteraction({ block, onPass }) {
  const [selected, setSelected] = useState(null);
  const [hintIdx,  setHintIdx]  = useState(0);

  useEffect(() => {
    setSelected(null); setHintIdx(0);
  }, [block.id]); // eslint-disable-line

  const handleSelect = (opt) => {
    if (selected === block.correctOption) return; // already passed
    setSelected(opt);
    if (opt === block.correctOption) onPass();
  };

  const correct = selected === block.correctOption;
  const wrong   = selected !== null && selected !== block.correctOption;

  if (correct) {
    return <div className="il-feedback il-feedback--correct">🎉 Correct! Now run the code below. ▼</div>;
  }

  return (
    <div className="il-interaction il-predict">
      <p className="il-interaction__prompt">{block.prompt}</p>

      <pre className="il-code-display">{block.codeSnippet}</pre>

      <p className="il-predict__question">What does this print?</p>
      <div className="il-options">
        {block.options.map((opt, i) => (
          <button
            key={i}
            className={`il-opt ${wrong && selected === opt ? 'il-opt--wrong' : ''}`}
            onClick={() => handleSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      {hintIdx < block.hints.length && (
        <button className="il-btn il-btn--hint" onClick={() => setHintIdx(h => h + 1)}>💡 Need a hint?</button>
      )}
      {hintIdx > 0 && (
        <div className="il-hint">
          {block.hints.slice(0, hintIdx).map((h, i) => <p key={i}>💡 {h}</p>)}
        </div>
      )}

      {wrong && (
        <div className="il-feedback il-feedback--wrong">Not quite! Think about what print() shows on screen. 🔄</div>
      )}
    </div>
  );
}

// ── BlockCard ────────────────────────────────────────────────────────
function BlockCard({ block, blockIdx, unlocked, progress, showMotivational, onInteractionPass, onRunPass }) {
  const [runOutput,  setRunOutput]  = useState('');
  const [runAttempts, setRunAttempts] = useState(0);

  const handleRunOutput = (output) => {
    setRunOutput(output);
    setRunAttempts(r => r + 1);

    if (progress.runPassed) return; // already passed

    const allMatch = block.expectedKeywords.every(
      kw => output.toLowerCase().includes(kw.toLowerCase())
    );

    if (allMatch && output.trim().length > 0) {
      onRunPass(block.id);
    }
  };

  if (!unlocked) {
    return (
      <div className="il-block il-block--locked">
        <div className="il-block__lock">🔒 Complete the previous block to unlock this one!</div>
      </div>
    );
  }

  return (
    <div className={`il-block ${progress.runPassed ? 'il-block--done' : 'il-block--active'}`}>

      {showMotivational && (
        <div className="il-motivational">Almost there! One last challenge 🔥</div>
      )}

      <div className="il-block__header">
        <span className="il-block__num">{blockIdx + 1}</span>
        <h2 className="il-block__title">{block.title}</h2>
        {progress.runPassed && <span className="il-block__done-badge">✅</span>}
      </div>

      <div className="il-block__story">{block.story}</div>

      {!progress.interactionPassed ? (
        <>
          {block.interactionType === 'drag-drop' && (
            <DragDropInteraction block={block} onPass={() => onInteractionPass(block.id)} />
          )}
          {block.interactionType === 'fill-blank' && (
            <FillBlankInteraction block={block} onPass={() => onInteractionPass(block.id)} />
          )}
          {block.interactionType === 'predict-output' && (
            <PredictOutputInteraction block={block} onPass={() => onInteractionPass(block.id)} />
          )}
        </>
      ) : (
        <>
          {!progress.runPassed && (
            <div className="il-feedback il-feedback--correct">
              🎯 Interaction complete! Now run the code below to finish this block.
            </div>
          )}

          <div className="il-block__runner">
            <h3 className="il-runner__title">⌨️ Code Runner Checkpoint</h3>
            <p className="il-runner__desc">
              Run the starter code — then try modifying it to experiment!
            </p>
            <PythonEditor
              key={block.id}
              initialCode={block.starterCode}
              onOutput={handleRunOutput}
            />

            {/* Hint after 2+ failed attempts */}
            {runOutput && !progress.runPassed && runAttempts >= 2 && (
              <div className="il-hint">
                💡 Your output needs to include: <strong>{block.expectedKeywords.join(', ')}</strong>
              </div>
            )}

            {progress.runPassed && (
              <div className="il-feedback il-feedback--correct">
                🎉 Block {blockIdx + 1} complete! Keywords matched — great work!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Template ────────────────────────────────────────────────────
const InteractiveLessonTemplate = () => {
  const { id }      = useParams();
  const lessonId    = parseInt(id, 10);
  const navigate    = useNavigate();
  const { markLessonComplete } = useProgress();
  useContext(AuthContext); // ensure context is available

  const confettiRef = useRef(null);
  const lesson      = LESSON_CONTENT.find(l => l.id === lessonId);

  // ── Block progress from localStorage ──────────────────────────────
  const makeInitialProgress = () => {
    const blocks = {};
    if (lesson) {
      lesson.blocks.forEach(b => {
        blocks[b.id] = { interactionPassed: false, runPassed: false };
      });
    }
    return { blocks, lessonComplete: false };
  };

  const [blockProgress, setBlockProgress] = useState(() => {
    const key   = `lesson_${lessonId}_blocks`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch (_) { /* ignore corrupt data */ }
    }
    return makeInitialProgress();
  });

  const [lessonXP,          setLessonXP]          = useState(0);
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);

  // ── Persist progress ───────────────────────────────────────────────
  const saveProgress = (newProgress) => {
    localStorage.setItem(`lesson_${lessonId}_blocks`, JSON.stringify(newProgress));
    setBlockProgress(newProgress);
  };

  // ── Interaction passed ─────────────────────────────────────────────
  const handleInteractionPass = (blockId) => {
    const newProgress = {
      ...blockProgress,
      blocks: {
        ...blockProgress.blocks,
        [blockId]: { ...blockProgress.blocks[blockId], interactionPassed: true },
      },
    };
    saveProgress(newProgress);
  };

  // ── Run passed (code runner) ───────────────────────────────────────
  const handleRunPass = (blockId) => {
    const newBlocks = {
      ...blockProgress.blocks,
      [blockId]: { ...blockProgress.blocks[blockId], runPassed: true },
    };
    const allPassed = lesson.blocks.every(b => newBlocks[b.id]?.runPassed);
    const newProgress = { blocks: newBlocks, lessonComplete: allPassed };
    saveProgress(newProgress);

    if (allPassed && !blockProgress.lessonComplete) {
      completeLesson();
    }
  };

  // ── Complete lesson ────────────────────────────────────────────────
  const completeLesson = async () => {
    if (isCompletingLesson) return;
    setIsCompletingLesson(true);
    try {
      const result = await trackStaticLessonCompletion(lessonId);
      setLessonXP(result?.xpEarned || 0);
    } catch (err) {
      console.error('Lesson completion error:', err);
    } finally {
      markLessonComplete(lessonId);
      fireConfetti(confettiRef, 2200);
    }
  };

  // ── Unlock logic ───────────────────────────────────────────────────
  const isUnlocked = (blockIdx) => {
    if (blockIdx === 0) return true;
    const prevBlock = lesson.blocks[blockIdx - 1];
    return blockProgress.blocks[prevBlock.id]?.runPassed === true;
  };

  // ── Error state ────────────────────────────────────────────────────
  if (!lesson) {
    return (
      <div className="il-page">
        <Header />
        <div className="il-content" style={{ textAlign: 'center', paddingTop: 120 }}>
          <h2>Lesson {lessonId} not found.</h2>
          <button className="il-btn il-btn--primary" onClick={() => navigate('/lessons')}>
            ← Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="il-page">
      <canvas ref={confettiRef} className="il-confetti" />
      <Header />

      <div className="il-content">
        {/* Lesson header */}
        <div className="il-lesson-header">
          <div>
            <span className="il-lesson-pill">Lesson {lessonId}</span>
          </div>
          <h1 className="il-lesson-title">{lesson.title}</h1>
          <p className="il-lesson-subtitle">{lesson.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="il-progress">
          {lesson.blocks.map((block, idx) => {
            const done   = blockProgress.blocks[block.id]?.runPassed;
            const active = isUnlocked(idx) && !done;
            return (
              <React.Fragment key={block.id}>
                <div
                  className={`il-progress__dot ${
                    done   ? 'il-progress__dot--done'   :
                    active ? 'il-progress__dot--active' :
                             'il-progress__dot--locked'
                  }`}
                >
                  {done ? '✓' : idx + 1}
                </div>
                {idx < lesson.blocks.length - 1 && (
                  <div className={`il-progress__line ${done ? 'il-progress__line--done' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Block cards */}
        {lesson.blocks.map((block, idx) => (
          <BlockCard
            key={block.id}
            block={block}
            blockIdx={idx}
            unlocked={isUnlocked(idx)}
            progress={blockProgress.blocks[block.id] || { interactionPassed: false, runPassed: false }}
            showMotivational={idx === 2 && isUnlocked(idx) && !blockProgress.blocks[block.id]?.runPassed}
            onInteractionPass={handleInteractionPass}
            onRunPass={handleRunPass}
          />
        ))}

        {/* Celebration panel */}
        {blockProgress.lessonComplete && (
          <div className="il-celebration">
            <h2>🏆 Lesson {lessonId} Complete!</h2>
            {lessonXP > 0 && <div className="il-xp-pill">+{lessonXP} XP earned! 🎉</div>}
            <p>Amazing work! You're ready for the quiz.</p>
            <button
              className="il-btn il-btn--primary il-btn--lg"
              onClick={() => navigate(`/quiz/${lessonId}`, { state: { source: 'lesson', lessonId } })}
            >
              Take Quiz {lessonId} 🍉
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveLessonTemplate;
```

**Step: Write the file** — copy the code above into `packages/gamified-elearning/src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.js`.

**Step: Commit**
```bash
git add packages/gamified-elearning/src/components/InteractiveLessonTemplate/
git commit -m "feat(component): add InteractiveLessonTemplate with 3-block interactive structure"
```

---

## Task 4: Update `src/pages/Lessons/index.js`

**File:** Modify `packages/gamified-elearning/src/pages/Lessons/index.js`

Add export for `InteractiveLessonTemplate`. Keep all existing exports to avoid breaking any existing imports.

```js
// packages/gamified-elearning/src/pages/Lessons/index.js

import Lesson1 from './Lesson1';
import Lesson2 from './Lesson2';
import Lesson3 from './Lesson3';
import Lesson4 from './Lesson4';
import Lesson5 from './Lesson5';
import Lesson6 from './Lesson6';
import Lesson7 from './Lesson7';
import Lesson8 from './Lesson8';
import Lesson9 from './Lesson9';
import Lesson10 from './Lesson10';
import Lesson1Interactive from './Lesson1Interactive';
import Lesson2Interactive from './Lesson2Interactive';
import Lesson3Interactive from './Lesson3Interactive';
import LessonMap from './LessonMap';
import InteractiveLessonTemplate from '../../components/InteractiveLessonTemplate/InteractiveLessonTemplate';

export {
  Lesson1, Lesson2, Lesson3, Lesson4, Lesson5,
  Lesson6, Lesson7, Lesson8, Lesson9, Lesson10,
  Lesson1Interactive, Lesson2Interactive, Lesson3Interactive,
  LessonMap,
  InteractiveLessonTemplate,
};
```

**Step: Commit**
```bash
git add packages/gamified-elearning/src/pages/Lessons/index.js
git commit -m "feat(lessons): export InteractiveLessonTemplate from lessons index"
```

---

## Task 5: Update `src/App.js` — route all /lesson/:id to template

**File:** Modify `packages/gamified-elearning/src/App.js`

**Change:** Import `InteractiveLessonTemplate` and replace all 10 `/lesson/N` routes with a single parameterized route.

**Before (lines 10 and 54–64):**
```jsx
import { Lesson1, Lesson1Interactive, ..., LessonMap } from './pages/Lessons';
// ...
<Route path="/lesson/1" element={<Lesson1Interactive />} />
<Route path="/lesson/2" element={<Lesson2 />} />
// ... etc up to lesson 10
```

**After:**
```jsx
import { LessonMap, InteractiveLessonTemplate } from './pages/Lessons';
// ...
<Route path="/lesson/:id" element={<InteractiveLessonTemplate />} />
```

**Exact diff to apply:**

1. Replace the import line for lessons:
```jsx
// OLD:
import { Lesson1, Lesson1Interactive, Lesson2, Lesson2Interactive, Lesson3, Lesson3Interactive, Lesson4, Lesson5, Lesson6, Lesson7, Lesson8, Lesson9, Lesson10, LessonMap } from './pages/Lessons';

// NEW:
import { LessonMap, InteractiveLessonTemplate } from './pages/Lessons';
```

2. Replace the ten `/lesson/N` routes with one:
```jsx
// OLD (10 lines):
<Route path="/lesson/1" element={<Lesson1Interactive />} />
<Route path="/lesson/2" element={<Lesson2 />} />
<Route path="/lesson/3" element={<Lesson3 />} />
<Route path="/lesson/4" element={<Lesson4 />} />
<Route path="/lesson/5" element={<Lesson5 />} />
<Route path="/lesson/6" element={<Lesson6 />} />
<Route path="/lesson/7" element={<Lesson7 />} />
<Route path="/lesson/8" element={<Lesson8 />} />
<Route path="/lesson/9" element={<Lesson9 />} />
<Route path="/lesson/10" element={<Lesson10 />} />

// NEW (1 line):
<Route path="/lesson/:id" element={<InteractiveLessonTemplate />} />
```

**Step: Commit**
```bash
git add packages/gamified-elearning/src/App.js
git commit -m "feat(routing): route all /lesson/:id to InteractiveLessonTemplate"
```

---

## Task 6: Update `Quiz.js` and `Quiz.css` — add "Go to Puzzle" button

**Files:**
- Modify `packages/gamified-elearning/src/pages/Quizzes/Quiz.js`
- Modify `packages/gamified-elearning/src/pages/Quizzes/Quiz.css`

### 6a. Quiz.js change

In the results screen (`if (done) {...}` block), after the existing `<div className="qz-results-actions">`, add the puzzle button.

**Locate this exact block in Quiz.js (around line 293):**
```jsx
<div className="qz-results-actions">
  <button className="qz-btn-retry" onClick={handleRetry}>
    🔄 Retry
  </button>
  <button className="qz-btn-home" onClick={() => navigate(-1)}>
    ← Back
  </button>
</div>
```

**Replace with:**
```jsx
<div className="qz-results-actions">
  <button className="qz-btn-retry" onClick={handleRetry}>
    🔄 Retry
  </button>
  <button className="qz-btn-home" onClick={() => navigate(-1)}>
    ← Back
  </button>
</div>
<button
  className="qz-btn-puzzle"
  onClick={() => {
    // Optimistic puzzle completion — mark in DB then navigate
    const t = localStorage.getItem('token');
    if (t) {
      fetch(`/api/puzzles/${quizId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    }
    navigate(`/game/${quizId}`);
  }}
>
  🎮 Play Puzzle {quizId}
</button>
```

### 6b. Quiz.css change

Add at the end of the file:
```css
/* Puzzle CTA on results screen */
.qz-btn-puzzle {
  display: block;
  width: 100%;
  margin-top: 14px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #4ecca3, #2e9c81);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(78, 204, 163, 0.38);
  transition: transform 120ms, box-shadow 120ms;
}

.qz-btn-puzzle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(78, 204, 163, 0.5);
}
```

**Step: Commit**
```bash
git add packages/gamified-elearning/src/pages/Quizzes/Quiz.js
git add packages/gamified-elearning/src/pages/Quizzes/Quiz.css
git commit -m "feat(quiz): add 'Go to Puzzle' button on results screen"
```

---

## Task 7: Build and Deploy

```bash
# Build frontend
cd /home/bitnami/CodeIt
/home/bitnami/deploy-frontend.sh
```

Expected output: No errors, new bundle hash, files copied to `/opt/bitnami/apache/htdocs/`.

If deploy script is unavailable, run manually:
```bash
cd /home/bitnami/CodeIt/packages/gamified-elearning
npm run build
sudo rm -rf /opt/bitnami/apache/htdocs/static/js /opt/bitnami/apache/htdocs/static/css
sudo cp -r build/. /opt/bitnami/apache/htdocs/
```

---

## Task 8: Verify

Run these checks. Do NOT claim success until each one is confirmed.

### 8a. Lesson routing (all 10)
Open in browser:
- `https://codeitlearn.com/lesson/1` — should show Lesson 1 with 3 blocks, Block 1 active
- `https://codeitlearn.com/lesson/6` — same structure, different content
- `https://codeitlearn.com/lesson/10` — same structure, final lesson content

Expected: Glass card UI, progress dots `●──○──○`, Block 1 interaction visible, Blocks 2–3 locked.

### 8b. Block unlock flow
1. Go to `/lesson/1`
2. Complete Block 1 drag-drop interaction (arrange `print ( "Hello" )`)
3. PythonEditor appears — run the code
4. Confirm output contains "hello" → Block 2 unlocks
5. Confirm progress dot 1 turns green

### 8c. Lesson completion + quiz navigation
1. Complete all 3 blocks of Lesson 1
2. Celebration panel appears with "+XP" pill
3. Click "Take Quiz 1 🍉"
4. Confirm navigation to `/quiz/1`
5. Verify via API: `curl -s -X POST https://codeitlearn.com/api/lessons/1/complete -H "Authorization: Bearer <token>"` should return `{"alreadyCompleted": true}`

### 8d. Quiz results — puzzle button
1. Complete Quiz 1
2. On results screen: confirm "🎮 Play Puzzle 1" button is visible
3. Click it — confirm navigation to `/game/1` (Talking Robot puzzle)

### 8e. No regressions
- `https://codeitlearn.com/` — Home page loads ✓
- `https://codeitlearn.com/login` — Login page loads ✓
- `https://codeitlearn.com/leaderboard` — Leaderboard loads ✓
- `https://codeitlearn.com/lessons` — LessonMap loads ✓
- `https://codeitlearn.com/quiz/1` — Quiz loads (directly, no gate) ✓

### 8f. API checks
```bash
# Health check
curl -s https://codeitlearn.com/api/health

# Lesson list
curl -s https://codeitlearn.com/api/lessons

# Quiz questions
curl -s https://codeitlearn.com/api/quiz/1/questions -H "Authorization: Bearer <token>" | python3 -m json.tool
```

---

## Checklist

- [ ] `src/data/lessonContent.js` created (10 lessons × 3 blocks)
- [ ] `InteractiveLessonTemplate.css` created
- [ ] `InteractiveLessonTemplate.js` created
- [ ] `App.js` routes updated (single `/lesson/:id`)
- [ ] `Lessons/index.js` exports updated
- [ ] `Quiz.js` puzzle button added
- [ ] `Quiz.css` `.qz-btn-puzzle` style added
- [ ] Build succeeds (no TypeScript/React errors)
- [ ] Deploy succeeds
- [ ] `/lesson/1` shows 3-block UI
- [ ] Block unlock works (block 2 appears after block 1 run passes)
- [ ] Lesson completion calls DB API
- [ ] Quiz results show "Go to Puzzle" button
- [ ] Home, Login, LessonMap, Leaderboard unaffected
