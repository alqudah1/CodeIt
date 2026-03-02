# CodeIt Production-Ready Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make CodeIt production-ready with rich interactive lessons, quiz→gift→puzzle unlock flow, Turtle Playground, XP progression system, AI buddy agent, and parent email feature.

**Architecture:** Data-driven `InteractiveLessonTemplate` replaces per-lesson boilerplate for Lessons 2–10. Quiz completion triggers a "Gift Unlocked" overlay that routes to a gated Puzzle N. New backend endpoints provide quiz-completion-gating for puzzles, XP level queries, AI proxy, and email triggers — all layered onto the existing Express + MySQL stack without changing any working routes.

**Tech Stack:** React (CRA), Node.js/Express, MySQL (AWS RDS), Apache/Bitnami, Pyodide (Python in browser), PM2, existing auth/progress/quiz/puzzle routes.

---

## Audit Summary (current state as of 2026-03-01)

| Item | State |
|---|---|
| Lesson 1 | Rich `Lesson1Interactive` (900+ lines, drag-drop, confetti, steps) |
| Lesson 2 | `Lesson2Interactive` exists but **App.js routes `/lesson/2` to basic `Lesson2`** |
| Lesson 3 | `Lesson3Interactive` exists but **App.js routes `/lesson/3` to basic `Lesson3`** |
| Lessons 4–10 | Basic single-editor pages (no story, no checkpoints, no badges) |
| Quiz flow | Works (one-per-screen, check/submit), **no gift screen after finish** |
| Puzzle gating | **None** — puzzles are open to all; no lock behind quiz completion |
| Playground | Does not exist |
| XP level system | XP stored in DB but **no level thresholds or feature-unlock logic** |
| AI buddy | Does not exist |
| Parent email | `parent_email` column in DB; **no sending logic** |

---

## Phase 1A — InteractiveLessonTemplate Component (proof: Lesson 2)

### Task 1: Create `InteractiveLessonTemplate` component

**Files:**
- Create: `packages/gamified-elearning/src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.js`
- Create: `packages/gamified-elearning/src/components/InteractiveLessonTemplate/InteractiveLessonTemplate.css`

**Step 1: Design the lesson data shape**

Each lesson exports a plain JS object with this shape:
```js
// lessonData shape
{
  id: 2,                    // number
  title: "Storing Info with Variables",
  subtitle: "Learn to save names, numbers, and messages in Python boxes.",
  emoji: "📦",
  story: [                  // array of story panel strings (2–4 panels)
    "Meet Pixel the robot...",
    "Pixel needs to remember your name...",
  ],
  concepts: [               // array of concept card objects
    { icon: "📦", title: "Variables", body: "A variable is like a labeled box..." },
  ],
  checkpoints: [            // 3 interactive code checkpoints
    {
      id: "cp1",
      title: "Store Your Name",
      description: "Create a variable called `name` and print it.",
      initialCode: 'name = "Alex"\nprint(name)',
      successPattern: /.+/,   // regex to check output is non-empty
      hint: "Try: name = \"YourName\" then print(name)",
      xp: 15,
    },
  ],
}
```

**Step 2: Write the template component**

The component accepts `lessonData` + `lessonId` props and internally handles:
- `currentStoryPanel` state (prev/next story buttons)
- `checkpointStatus[]` array of `{ done: false }` per checkpoint
- Confetti canvas (same lightweight approach as Lesson1Interactive)
- `calmMode` toggle
- `hasMarkedComplete` guard (calls `markLessonComplete` + `trackStaticLessonCompletion` once)
- "Ready for Quiz N" footer button that navigates with `{ state: { source: 'lesson', lessonId: N } }`

Key JSX structure:
```jsx
<div className="il-lesson">
  <canvas ref={confettiRef} className="il-confetti" />
  <Header />
  <ProgressBar currentStep="lesson" />
  <div className="il-scroll-body">
    {/* Hero */}
    <div className="il-hero">
      <span className="il-emoji">{data.emoji}</span>
      <div>
        <span className="il-pill">Lesson {data.id}</span>
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
      </div>
    </div>

    {/* Story Panels */}
    <div className="il-story-card">
      <p>{data.story[storyIdx]}</p>
      <div className="il-story-nav">
        <button onClick={prevStory}>◀</button>
        <span>{storyIdx+1}/{data.story.length}</span>
        <button onClick={nextStory}>▶</button>
      </div>
    </div>

    {/* Concept Cards */}
    <div className="il-concepts">
      {data.concepts.map(c => (
        <div key={c.title} className="il-concept-card">
          <span className="il-concept-icon">{c.icon}</span>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
        </div>
      ))}
    </div>

    {/* Checkpoints */}
    {data.checkpoints.map((cp, i) => (
      <div key={cp.id} className={`il-checkpoint ${cpStatus[i].done ? 'il-checkpoint--done' : ''}`}>
        <div className="il-cp-header">
          <span className="il-cp-num">{i+1}</span>
          <h2>{cp.title}</h2>
          {cpStatus[i].done && <span>✅</span>}
        </div>
        <p>{cp.description}</p>
        <PythonEditor
          initialCode={cp.initialCode}
          onOutput={(out) => handleCpOutput(i, cp, out)}
        />
        {cpStatus[i].hint && <div className="il-hint">{cpStatus[i].hint}</div>}
      </div>
    ))}

    {/* Progress + Footer */}
    <div className="il-progress-strip">
      {cpStatus.map((s, i) => <span key={i}>{s.done ? '✅' : '⭕'}</span>)}
      <span>{cpStatus.filter(s=>s.done).length}/{cpStatus.length} checkpoints</span>
    </div>
    <footer className="il-footer">
      <button className="il-quiz-btn" onClick={goToQuiz}>
        {anyDone ? `Ready for Quiz ${data.id} 🎯` : 'Complete a checkpoint to unlock quiz'}
      </button>
    </footer>
  </div>
</div>
```

**Step 3: Wire `handleCpOutput`**

```js
const handleCpOutput = (idx, cp, output) => {
  const passed = cp.successPattern.test(output.trim());
  const newStatus = [...cpStatus];
  if (passed) {
    newStatus[idx] = { done: true, hint: '' };
    triggerConfetti();
  } else {
    newStatus[idx] = { ...newStatus[idx], hint: cp.hint };
  }
  setCpStatus(newStatus);

  // Mark lesson complete in DB on first success (any checkpoint)
  const anyDone = newStatus.some(s => s.done);
  if (anyDone && !hasMarkedComplete) {
    setHasMarkedComplete(true);
    markLessonComplete(lessonId);
    trackStaticLessonCompletion(lessonId).catch(console.error);
  }
};
```

**Step 4: Create CSS** (`InteractiveLessonTemplate.css`)

Uses the same 4 brand colors:
- Primary: `#667eea` (purple-blue)
- Accent: `#4ecca3` (teal)
- Warm: `#ffd93d` (yellow)
- Alert: `#ff6b9d` (pink)

Key rules:
```css
.il-lesson { display:flex; flex-direction:column; height:100vh; overflow:hidden;
  background: linear-gradient(135deg, rgba(255,245,165,.95) 0%, rgba(155,246,255,.95) 100%); }
.il-confetti { position:fixed; inset:0; pointer-events:none; z-index:9999; }
.il-scroll-body { margin-top:170px; overflow-y:auto; flex:1; padding:2rem 1.5rem 5rem; }
.il-lesson-wrapper { max-width:1100px; margin:0 auto; }
.il-hero { display:flex; gap:1rem; align-items:center; margin-bottom:1.5rem; }
.il-emoji { font-size:3.5rem; }
.il-pill { display:inline-block; padding:4px 12px; background:linear-gradient(135deg,#667eea,#764ba2);
  color:#fff; border-radius:999px; font-size:12px; font-weight:700; }
.il-story-card { background:#fff; border:2px solid #e9ecef; border-radius:16px; padding:1.25rem;
  box-shadow:0 8px 24px rgba(0,0,0,.07); margin-bottom:1.5rem; }
.il-concepts { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-bottom:1.5rem; }
.il-concept-card { background:#fff; border:2px solid #e9ecef; border-radius:14px; padding:1rem;
  box-shadow:0 4px 14px rgba(0,0,0,.06); }
.il-concept-icon { font-size:2rem; display:block; margin-bottom:.5rem; }
.il-checkpoint { background:#fff; border:2px solid #e9ecef; border-radius:16px; padding:1.25rem;
  margin-bottom:1.5rem; transition:border-color .2s,box-shadow .2s; }
.il-checkpoint--done { border-color:#4ecca3; box-shadow:0 4px 18px rgba(78,204,163,.25); }
.il-cp-header { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
.il-cp-num { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2);
  color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; }
.il-hint { margin-top:.5rem; padding:.75rem 1rem; background:#fff3bf; border:1px solid #ffe066;
  border-radius:8px; color:#79520a; font-size:.9rem; }
.il-progress-strip { display:flex; align-items:center; gap:.75rem; padding:1rem;
  background:#f8f9fa; border-radius:12px; margin-bottom:1rem; flex-wrap:wrap; }
.il-footer { text-align:center; padding:1rem 0; }
.il-quiz-btn { padding:.875rem 2rem; border:none; border-radius:14px; font-size:1rem; font-weight:700;
  cursor:pointer; background:linear-gradient(135deg,#4ecca3,#2e9c81); color:#fff;
  box-shadow:0 6px 18px rgba(78,204,163,.4); transition:transform .1s; }
.il-quiz-btn:disabled { background:#ccc; box-shadow:none; cursor:not-allowed; }
@media(max-width:640px) { .il-concepts { grid-template-columns:1fr; } .il-hero { flex-direction:column; text-align:center; } }
```

**Step 5: No test needed (visual component); do a manual build smoke-test**
Run: `cd /home/bitnami/CodeIt/packages/gamified-elearning && npm run build 2>&1 | tail -20`
Expected: `Compiled successfully.`

**Step 6: Commit**
```bash
git add packages/gamified-elearning/src/components/InteractiveLessonTemplate/
git commit -m "feat(lessons): add reusable InteractiveLessonTemplate component"
```

---

### Task 2: Create Lesson 2 data + wire route (proof of concept)

**Files:**
- Create: `packages/gamified-elearning/src/pages/Lessons/lessonData/lesson2.js`
- Modify: `packages/gamified-elearning/src/pages/Lessons/Lesson2Interactive.js` (replace content to use template)
- Modify: `packages/gamified-elearning/src/App.js:57` (change `/lesson/2` from `Lesson2` to `Lesson2Interactive`)
- Modify: `packages/gamified-elearning/src/pages/Lessons/index.js` (ensure `Lesson2Interactive` exported)

**Step 1: Write lesson 2 data file**

```js
// lesson2.js
const lesson2 = {
  id: 2,
  title: "Storing Info with Variables",
  subtitle: "Learn to save names, numbers, and messages in Python — like labeling your favorite boxes!",
  emoji: "📦",
  story: [
    "🤖 Pixel the Robot is forgetful. Every time it meets someone, it forgets their name by the next second!",
    "🧠 You're going to give Pixel a superpower: variables! Variables are like labeled sticky notes inside the computer's brain.",
    "📦 Imagine a box with a label 'name' on it. You put 'Alex' inside. Now Pixel can always look at the box and remember: 'That's Alex!'",
    "✨ Let's teach Pixel to store your name, your age, and your favorite thing — so it never forgets!"
  ],
  concepts: [
    {
      icon: "📦",
      title: "Variables",
      body: "A variable is a labeled box that stores a value. You can change what's in the box anytime!"
    },
    {
      icon: "📝",
      title: "Strings",
      body: "Text values go in quotes: name = \"Alex\". These are called strings — like a string of letters."
    },
    {
      icon: "🔢",
      title: "Numbers",
      body: "Numbers go without quotes: age = 10. Python knows the difference between text and numbers!"
    },
    {
      icon: "🖨️",
      title: "print(variable)",
      body: "To show a variable's value, use print(name) — no quotes around the variable name!"
    }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Store Your Name",
      description: "Create a variable called name and give it your name. Then print it!",
      initialCode: 'name = "Alex"\nprint(name)',
      successPattern: /\S+/,
      hint: "Try: name = \"YourName\" then on the next line: print(name)",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Number Variables",
      description: "Store your age in a variable and print both your name and age on separate lines.",
      initialCode: 'name = "Alex"\nage = 10\nprint(name)\nprint(age)',
      successPattern: /[\s\S]+/,
      hint: "Numbers don't need quotes! Just write: age = 10",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Your Character Sheet",
      description: "Create three variables: name, age, and superpower. Print all three!",
      initialCode: 'name = "Alex"\nage = 10\nsuperpower = "flying"\nprint(name)\nprint(age)\nprint(superpower)',
      successPattern: /[\s\S]+/,
      hint: "Each print() call shows one variable. You need three print() calls!",
      xp: 20,
    }
  ]
};

export default lesson2;
```

**Step 2: Rewrite `Lesson2Interactive.js` to use the template**

Replace entire file content:
```js
import React from 'react';
import InteractiveLessonTemplate from '../../components/InteractiveLessonTemplate/InteractiveLessonTemplate';
import lessonData from './lessonData/lesson2';

const Lesson2Interactive = () => <InteractiveLessonTemplate lessonData={lessonData} />;

export default Lesson2Interactive;
```

**Step 3: Update App.js route**

Change line 57 from:
```js
<Route path="/lesson/2" element={<Lesson2 />} />
```
to:
```js
<Route path="/lesson/2" element={<Lesson2Interactive />} />
```

**Step 4: Build and verify**
```bash
cd /home/bitnami/CodeIt/packages/gamified-elearning && npm run build 2>&1 | tail -20
```
Expected: `Compiled successfully.`

**Step 5: Deploy and test**
```bash
/home/bitnami/deploy-frontend.sh
```
Then open browser: `https://codeitlearn.com/lesson/2`
Verify: story panels, 3 concept cards, 3 code checkpoints all render.

**Step 6: Commit**
```bash
git add packages/gamified-elearning/src/pages/Lessons/ packages/gamified-elearning/src/App.js
git commit -m "feat(lessons): wire Lesson 2 to InteractiveLessonTemplate (proof of concept)"
```

---

### Task 3: Create lesson data for Lessons 3–10 and wire routes

**Files to create** (one per lesson):
- `packages/gamified-elearning/src/pages/Lessons/lessonData/lesson3.js` through `lesson10.js`

**Files to modify:**
- `packages/gamified-elearning/src/pages/Lessons/Lesson3Interactive.js` (rewrite like Lesson2Interactive)
- Create: `packages/gamified-elearning/src/pages/Lessons/Lesson4Interactive.js` through `Lesson10Interactive.js` (thin wrappers)
- `packages/gamified-elearning/src/App.js` (update routes 3–10)
- `packages/gamified-elearning/src/pages/Lessons/index.js` (add new exports)

**Step 1: Create all lesson data files**

Below is the content for each lesson data file. Create them exactly as specified.

**`lesson3.js`** — Functions & Loops
```js
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
```

**`lesson4.js`** — If/Elif/Else
```js
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
```

**`lesson5.js`** — Lists & Strings
```js
const lesson5 = {
  id: 5,
  title: "Lists & Strings — Your Data Toolkit",
  subtitle: "Collect multiple items in lists and manipulate text like a Python word wizard!",
  emoji: "📋",
  story: [
    "🛒 Marco is making a shopping list — but every time he adds something, the paper gets messy!",
    "💡 Python has lists: shopping = ['apples', 'milk', 'eggs']. All items in one tidy place!",
    "✂️ Strings are also super powerful. You can reverse them, count letters, find words, and more.",
    "🎯 By the end, you'll manage a list of your favorite things and perform cool string magic!"
  ],
  concepts: [
    { icon: "📋", title: "Lists", body: "A list holds multiple items: fruits = ['apple', 'banana', 'mango']. Access with fruits[0]." },
    { icon: "➕", title: "Append & Remove", body: "fruits.append('grape') adds an item. fruits.remove('apple') deletes one." },
    { icon: "🔤", title: "String Methods", body: "name.upper() makes UPPERCASE. name.lower() makes lowercase. len(name) counts characters." },
    { icon: "🔁", title: "Loop a List", body: "for fruit in fruits: print(fruit) — loops through every item in the list!" }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Favorite Things List",
      description: "Create a list called favorites with 3 of your favorite things, then print the whole list.",
      initialCode: "favorites = ['coding', 'pizza', 'music']\nprint(favorites)",
      successPattern: /\[/,
      hint: "Lists use square brackets [ ]. Add strings inside with quotes, separated by commas.",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Loop Through the List",
      description: "Print each item in your favorites list on its own line using a for loop.",
      initialCode: "favorites = ['coding', 'pizza', 'music']\nfor item in favorites:\n    print(item)",
      successPattern: /coding|pizza|music/i,
      hint: "The loop variable item takes on each list value one at a time.",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — String Magic",
      description: "Store your name in a variable and print it in UPPERCASE, then print how many letters it has.",
      initialCode: 'name = "Alex"\nprint(name.upper())\nprint(len(name))',
      successPattern: /[A-Z]{2,}/,
      hint: "name.upper() converts to uppercase. len(name) counts the characters.",
      xp: 20,
    }
  ]
};
export default lesson5;
```

**`lesson6.js`** — Dictionaries & Sets
```js
const lesson6 = {
  id: 6,
  title: "Dictionaries & Sets — Smart Storage",
  subtitle: "Store data with labels using dictionaries — like a real contacts book in Python!",
  emoji: "📚",
  story: [
    "📱 Sophia keeps her contacts in a messy spreadsheet. Name in one place, number somewhere else.",
    "💡 Python dictionaries fix this: contact = {'name': 'Sophia', 'phone': '555-1234'}. Label + value together!",
    "🗃️ You look things up by key — contact['name'] gives you 'Sophia' instantly.",
    "Sets are like lists but they automatically remove duplicates — perfect for unique collections!"
  ],
  concepts: [
    { icon: "📖", title: "Dictionaries", body: "A dict stores key-value pairs: person = {'name': 'Alex', 'age': 10}. Access with person['name']." },
    { icon: "➕", title: "Adding/Updating", body: "person['city'] = 'Toronto' adds a new key. Same syntax updates an existing one." },
    { icon: "🔑", title: "Keys & Values", body: "person.keys() lists all keys. person.values() lists all values." },
    { icon: "🎯", title: "Sets", body: "A set removes duplicates: {1, 2, 2, 3} becomes {1, 2, 3}. Great for unique items!" }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Create Your Profile",
      description: "Create a dictionary called profile with your name, age, and favorite color. Print your name.",
      initialCode: "profile = {'name': 'Alex', 'age': 10, 'color': 'blue'}\nprint(profile['name'])",
      successPattern: /\S+/,
      hint: "Access a dictionary value with profile['key']. The key is the label on the left.",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Update & Print All",
      description: "Add a 'city' key to your profile, then print all the keys and values.",
      initialCode: "profile = {'name': 'Alex', 'age': 10}\nprofile['city'] = 'Toronto'\nprint(profile.keys())\nprint(profile.values())",
      successPattern: /city|Toronto/i,
      hint: "profile['city'] = 'YourCity' adds a new entry. Then use .keys() and .values()!",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Remove Duplicates with Sets",
      description: "Create a list with duplicate numbers and convert it to a set to see only unique values.",
      initialCode: "numbers = [1, 2, 2, 3, 3, 3, 4]\nunique = set(numbers)\nprint(unique)",
      successPattern: /\{/,
      hint: "set() automatically removes duplicates. The output will be in curly braces {}.",
      xp: 20,
    }
  ]
};
export default lesson6;
```

**`lesson7.js`** — File Handling (simulated in Pyodide)
```js
const lesson7 = {
  id: 7,
  title: "Reading & Writing Files",
  subtitle: "Learn how Python saves and loads data to disk — like a diary that never forgets!",
  emoji: "📁",
  story: [
    "📓 Jake writes in a diary every day — but his notebook gets lost all the time.",
    "💾 Python can save text to files on the computer so it's never lost. open(), write(), read() — simple tools!",
    "📂 In a browser, we simulate this with Python's io.StringIO — same commands, safe sandbox.",
    "📖 By the end you'll write text to a 'file' and read it back — like saving your progress in a game!"
  ],
  concepts: [
    { icon: "📝", title: "Writing a File", body: "open('diary.txt', 'w') opens for writing. file.write('text') saves content." },
    { icon: "📖", title: "Reading a File", body: "open('diary.txt', 'r') opens for reading. file.read() loads all the text." },
    { icon: "🔒", title: "with Statement", body: "with open('file.txt', 'w') as f: — auto-closes the file when done. Safer!" },
    { icon: "📋", title: "Readlines", body: "file.readlines() returns a list — one string per line. Great for line-by-line processing." }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Write and Read",
      description: "Use io.StringIO to simulate writing 'Hello, diary!' and then reading it back.",
      initialCode: 'import io\nf = io.StringIO()\nf.write("Hello, diary!")\nf.seek(0)\nprint(f.read())',
      successPattern: /Hello, diary!/,
      hint: "f.seek(0) moves back to the start before reading. Without it, you'd read nothing!",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Multiple Lines",
      description: "Write three diary entries to a StringIO object and read them all back.",
      initialCode: 'import io\nf = io.StringIO()\nf.write("Day 1: Learned Python\\n")\nf.write("Day 2: Made a function\\n")\nf.write("Day 3: Loops are cool!\\n")\nf.seek(0)\nprint(f.read())',
      successPattern: /Day 1/,
      hint: "Use \\n at the end of each line to create a new line in the file.",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Readlines",
      description: "Read the diary back as a list of lines and print each one with its line number.",
      initialCode: 'import io\nf = io.StringIO("Day 1: Learned Python\\nDay 2: Made a function\\nDay 3: Loops!")\nlines = f.readlines()\nfor i, line in enumerate(lines, 1):\n    print(i, line.strip())',
      successPattern: /1\s+Day/,
      hint: "enumerate(lines, 1) gives (1, line1), (2, line2) etc. .strip() removes the newline at the end.",
      xp: 20,
    }
  ]
};
export default lesson7;
```

**`lesson8.js`** — Exception Handling
```js
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
      initialCode: 'try:\n    num = int("hello")\n    print(num)\nexcept ValueError:\n    print("That\'s not a number!")',
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
```

**`lesson9.js`** — Object-Oriented Programming
```js
const lesson9 = {
  id: 9,
  title: "Classes & Objects — Build Your Own Blueprints",
  subtitle: "Create templates for objects — like designing a robot blueprint, then building many robots!",
  emoji: "🏗️",
  story: [
    "🏭 The robot factory needs to build 100 robots — all the same design but with different names.",
    "📐 A class is a blueprint. Robot is the class; individual robots are objects made from that blueprint.",
    "🔧 Each object gets its own data (name, color) stored in self — short for 'this specific robot'.",
    "🚀 Classes are how big programs are organized. Games, apps, websites — all built with classes!"
  ],
  concepts: [
    { icon: "📐", title: "Class Definition", body: "class Dog: defines a blueprint. All dogs share the same structure." },
    { icon: "🔧", title: "__init__ method", body: "def __init__(self, name): runs when you create an object. self refers to the object itself." },
    { icon: "📦", title: "Instance Variables", body: "self.name = name stores data in the object. Each object has its own copy!" },
    { icon: "⚙️", title: "Methods", body: "def bark(self): is a method — a function that belongs to the class." }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Your First Class",
      description: "Create a Dog class with a name attribute and a bark() method. Create a dog and make it bark!",
      initialCode: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        print(self.name + " says: Woof!")\n\nmy_dog = Dog("Buddy")\nmy_dog.bark()',
      successPattern: /Woof/i,
      hint: "Dog('Buddy') creates an object. my_dog.bark() calls the bark method on that object.",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Multiple Objects",
      description: "Create two Dog objects with different names and make both bark.",
      initialCode: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        print(self.name + " says: Woof!")\n\ndog1 = Dog("Buddy")\ndog2 = Dog("Luna")\ndog1.bark()\ndog2.bark()',
      successPattern: /Buddy|Luna/,
      hint: "Each object is independent. dog1 and dog2 have different names but the same blueprint!",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Add More Attributes",
      description: "Add breed to the Dog class and print a full description: 'NAME is a BREED.'",
      initialCode: 'class Dog:\n    def __init__(self, name, breed):\n        self.name = name\n        self.breed = breed\n    def describe(self):\n        print(self.name + " is a " + self.breed + ".")\n\nmy_dog = Dog("Max", "Labrador")\nmy_dog.describe()',
      successPattern: /is a/,
      hint: "Add a second parameter to __init__ and store it with self.breed = breed.",
      xp: 20,
    }
  ]
};
export default lesson9;
```

**`lesson10.js`** — Modules & Libraries
```js
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
```

**Step 2: Create thin wrapper components for Lessons 3–10**

For each lesson N (3 through 10), create `LessonNInteractive.js`:
```js
// Lesson3Interactive.js (already exists — replace content)
// Lesson4Interactive.js through Lesson10Interactive.js (create new)
import React from 'react';
import InteractiveLessonTemplate from '../../components/InteractiveLessonTemplate/InteractiveLessonTemplate';
import lessonData from './lessonData/lessonN';  // replace N
const LessonNInteractive = () => <InteractiveLessonTemplate lessonData={lessonData} />;
export default LessonNInteractive;
```

**Step 3: Update App.js**

Change routes for lessons 3–10 to use `*Interactive` components:
```js
<Route path="/lesson/3" element={<Lesson3Interactive />} />
...through...
<Route path="/lesson/10" element={<Lesson10Interactive />} />
```

Also update the imports at the top of `App.js` to include `Lesson3Interactive` through `Lesson10Interactive`.

**Step 4: Update `src/pages/Lessons/index.js`** to export all new components.

**Step 5: Build + deploy + verify**
```bash
cd /home/bitnami/CodeIt/packages/gamified-elearning && npm run build 2>&1 | tail -5
/home/bitnami/deploy-frontend.sh
```
Test each lesson URL: `https://codeitlearn.com/lesson/3` through `/lesson/10`

**Step 6: Commit**
```bash
git add packages/gamified-elearning/src/pages/Lessons/ packages/gamified-elearning/src/App.js
git commit -m "feat(lessons): migrate lessons 3-10 to InteractiveLessonTemplate with rich content"
```

---

## Phase 2 — Quiz→Gift→Puzzle Flow

### Task 4: Quiz results — "Gift Unlocked" screen

**Files:**
- Modify: `packages/gamified-elearning/src/pages/Quizzes/Quiz.js:268-303` (replace results screen JSX)
- Modify: `packages/gamified-elearning/src/pages/Quizzes/Quiz.css` (add gift screen styles)

**Step 1: Add puzzle navigation state to Quiz.js results screen**

After quiz submit (`setDone(true)`), also store `quizId` and `results` so the results screen can render a "Gift" CTA.

Replace the existing results screen render (the `if (done) { ... }` block) with:

```jsx
if (done) {
  const correct = results?.correctCount ?? 0;
  const tot = results?.totalQuestions ?? total;
  const xp = results?.xpEarned ?? 0;
  const pct = results?.percentage ?? (tot > 0 ? Math.round((correct / tot) * 100) : 0);
  const passed = pct >= 60;

  return (
    <div className="qz-page">
      <div className="qz-results-card">
        <div className="qz-results-trophy">
          {pct === 100 ? "🏆" : pct >= 60 ? "⭐" : "💪"}
        </div>
        <h1 className="qz-results-title">
          {pct === 100 ? "Perfect Score!" : pct >= 60 ? "Great Job!" : "Keep Trying!"}
        </h1>
        <div className="qz-score-wrap">
          <span className="qz-score-big">{correct}</span>
          <span className="qz-score-slash"> / </span>
          <span className="qz-score-total">{tot}</span>
        </div>
        <div className="qz-xp-pill">+{xp} XP earned! 🎉</div>
        {submitErr && <p className="qz-submit-err">{submitErr}</p>}

        {/* GIFT PUZZLE UNLOCK (show when passed) */}
        {passed && (
          <div className="qz-gift-box">
            <div className="qz-gift-emoji">🎁</div>
            <h2 className="qz-gift-title">Gift Unlocked!</h2>
            <p className="qz-gift-desc">
              You unlocked <strong>Puzzle {quizId}</strong>! Ready to play your reward?
            </p>
            <button
              className="qz-btn-gift"
              onClick={() => navigate(`/game/${quizId}`, {
                state: { source: 'quiz', quizId: Number(quizId) }
              })}
            >
              🎮 Play Puzzle {quizId}
            </button>
          </div>
        )}

        <div className="qz-results-actions">
          <button className="qz-btn-retry" onClick={handleRetry}>🔄 Retry</button>
          <button className="qz-btn-home" onClick={() => navigate('/lessons')}>📚 Back to Lessons</button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add CSS for the gift box** (append to `Quiz.css`):
```css
.qz-gift-box {
  background: linear-gradient(135deg, #ffd93d22, #ff6b9d22);
  border: 3px solid #ffd93d;
  border-radius: 20px;
  padding: 1.5rem;
  margin: 1.25rem 0;
  text-align: center;
  animation: giftPulse 1.5s ease-in-out infinite alternate;
}
@keyframes giftPulse {
  from { box-shadow: 0 0 0 0 rgba(255, 217, 61, 0.4); }
  to   { box-shadow: 0 0 0 16px rgba(255, 217, 61, 0); }
}
.qz-gift-emoji { font-size: 3.5rem; display: block; margin-bottom: .5rem; }
.qz-gift-title { font-size: 1.5rem; font-weight: 800; color: #b5179e; margin: 0 0 .5rem; }
.qz-gift-desc  { color: #495057; margin: 0 0 1rem; }
.qz-btn-gift {
  display: inline-block;
  padding: .875rem 2rem;
  background: linear-gradient(135deg, #b5179e, #7209b7);
  color: #fff; border: none; border-radius: 14px;
  font-size: 1rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 18px rgba(181,23,158,.4);
  transition: transform .1s;
}
.qz-btn-gift:hover { transform: scale(1.03); }
```

**Step 3: Backend — mark quiz completion for puzzle gating**

Add a new endpoint to `packages/codeit-backend/routes/quiz.js`:
```js
// GET /api/quiz/:quizId/completed — check if current user completed quiz N
router.get('/:quizId/completed', async (req, res) => {
  const userId = req.user.user_id;
  const { quizId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT attempt_id FROM Student_Quiz_Attempt WHERE student_id = ? AND quiz_id = ? LIMIT 1',
      [userId, quizId]
    );
    res.json({ completed: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

Also add to `ENDPOINTS` in `api.js`:
```js
quiz: {
  base: `${API_BASE_URL}/api/quiz`,
  completed: (id) => `${API_BASE_URL}/api/quiz/${id}/completed`,
},
```

**Step 4: Backend — add /api/puzzles/progress endpoint**

Add to `packages/codeit-backend/routes/puzzles.js`:
```js
// GET /api/puzzles/progress — list completed puzzle IDs for the current user
// IMPORTANT: Must be BEFORE /:id route
router.get('/progress', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await pool.query(
      'SELECT puzzle_id FROM Student_Puzzle_Progress WHERE user_id = ? ORDER BY puzzle_id',
      [userId]
    );
    res.json({ success: true, completedPuzzles: rows.map(r => r.puzzle_id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

Add to `ENDPOINTS` in `api.js`:
```js
puzzles: {
  list:     `${API_BASE_URL}/api/puzzles`,
  progress: `${API_BASE_URL}/api/puzzles/progress`,
  complete: (id) => `${API_BASE_URL}/api/puzzles/${id}/complete`,
},
```

**Step 5: Frontend — Puzzle gating in GameHub**

The existing `/games` page (`GameHub.js`) lists puzzle cards. We need to show locked puzzles as locked unless Quiz N is completed.

Modify `packages/gamified-elearning/src/pages/Games/GameHub.js`:

At the top of the component, add state:
```js
const [completedQuizIds, setCompletedQuizIds] = useState(new Set());
const [loadingGates, setLoadingGates] = useState(true);
const token = localStorage.getItem('token');
```

Add a `useEffect` to load quiz completions for puzzles 1–10:
```js
useEffect(() => {
  if (!token) { setLoadingGates(false); return; }
  const checks = Array.from({ length: 10 }, (_, i) => i + 1).map(id =>
    fetch(`${API_BASE_URL}/api/quiz/${id}/completed`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : { completed: false })
      .then(d => d.completed ? id : null)
  );
  Promise.all(checks).then(ids => {
    setCompletedQuizIds(new Set(ids.filter(Boolean)));
    setLoadingGates(false);
  });
}, [token]);
```

In the puzzle card render, add a lock overlay when quiz is not completed:
```jsx
const isUnlocked = completedQuizIds.has(puzzle.id);
// Wrap existing card content:
<div className={`game-card ${!isUnlocked ? 'game-card--locked' : ''}`}>
  {!isUnlocked && <div className="game-card__lock">🔒<br/><small>Complete Quiz {puzzle.id} first!</small></div>}
  {/* existing card content */}
</div>
```

Add CSS to `Games.css`:
```css
.game-card--locked { position: relative; filter: grayscale(0.7); pointer-events: none; }
.game-card__lock {
  position: absolute; inset: 0; border-radius: inherit;
  background: rgba(0,0,0,0.55); color: #fff;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-size: 2rem; z-index: 2; border-radius: 16px;
}
.game-card__lock small { font-size: .75rem; margin-top: .25rem; }
```

**Step 6: Restart backend**
```bash
pm2 restart codeit-backend
curl -s http://localhost:8080/api/health
```

**Step 7: Build + deploy + verify**
```bash
/home/bitnami/deploy-frontend.sh
```
Test flow:
1. Login, go to `/lesson/1`, complete it, click "Ready for Quiz 1"
2. Complete Quiz 1 (get ≥ 60%), see gift screen with "Play Puzzle 1" button
3. Verify clicking it navigates to `/game/1`
4. Go to `/games` — Puzzle 1 should be unlocked, Puzzles 2-10 locked

**Step 8: Commit**
```bash
git add packages/gamified-elearning/src/pages/Quizzes/ packages/codeit-backend/routes/ packages/gamified-elearning/src/pages/Games/
git commit -m "feat(quiz,puzzles): add gift unlock screen after quiz + puzzle gating"
```

---

### Task 5: Post-Puzzle "Turtle Playground Unlocked" screen

**Files:**
- Modify: one of the Game pages (e.g., `Game1.js`) to show completion CTA — OR create a shared `PuzzleCompletionBanner` component
- Create: `packages/gamified-elearning/src/components/PuzzleCompletionBanner.js`

**Step 1: Create `PuzzleCompletionBanner` component**

This is a simple conditional banner that shows after a puzzle is completed:
```jsx
// PuzzleCompletionBanner.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PuzzleCompletionBanner = ({ puzzleId }) => {
  const navigate = useNavigate();
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff', borderRadius: 20, padding: '1.5rem', textAlign: 'center',
      margin: '1rem', boxShadow: '0 8px 24px rgba(102,126,234,.4)'
    }}>
      <div style={{ fontSize: '3rem' }}>🐢</div>
      <h2 style={{ margin: '.5rem 0' }}>You Unlocked Turtle Playground!</h2>
      <p style={{ opacity: .9, marginBottom: '1rem' }}>
        You crushed Puzzle {puzzleId}! Draw cool shapes with Python Turtle now.
      </p>
      <button
        onClick={() => navigate('/playground')}
        style={{
          background: '#ffd93d', color: '#333', border: 'none',
          borderRadius: 12, padding: '.75rem 1.75rem',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
        }}
      >
        🎨 Open Turtle Playground
      </button>
    </div>
  );
};

export default PuzzleCompletionBanner;
```

Note: This banner must be included in the actual puzzle game pages. The `/game/*` routes are served by the `codeit-puzzle` PM2 app (port 3001), not the React frontend. Therefore the "Turtle unlocked" button will be shown **in the gift flow on the quiz results page** (after puzzle completion), not inside the puzzle app itself.

Revised approach: After the user completes a puzzle (calls `POST /api/puzzles/:id/complete`), if the response `alreadyCompleted: false`, show a modal on the Quiz results page or on a separate `/puzzle-complete` route.

Simplest working approach: Add to the `GameHub.js` page a notice that says "Complete any puzzle to unlock Turtle Playground!" that links to `/playground` once any puzzle is completed.

**Step 2: Check puzzle completion in GameHub**

In `GameHub.js`, after loading quiz gate status, also fetch `/api/puzzles/progress`. If any puzzles are completed, show a "🐢 Turtle Playground Unlocked!" banner linking to `/playground`.

---

## Phase 3 — Turtle Playground (`/playground`)

### Task 6: Create Turtle Playground page

**Files:**
- Create: `packages/gamified-elearning/src/pages/Playground/TurtlePlàyground.js`
- Create: `packages/gamified-elearning/src/pages/Playground/TurtlePlayground.css`
- Modify: `packages/gamified-elearning/src/App.js` (add `/playground` route)

**Step 1: Approach**

Skulpt (https://skulpt.org) can run Python Turtle in the browser without a server. We embed it via CDN script tags in `public/index.html`.

Alternative: Use Pyodide + a custom SVG-based turtle simulation (simpler, no CDN dependency).

**Chosen approach**: Pyodide-based custom turtle using `<canvas>`. We implement a minimal Python `turtle` module emulation:
- `forward(n)`, `back(n)`, `right(deg)`, `left(deg)`, `penup()`, `pendown()`, `color(c)`, `speed(n)`, `hideturtle()`, `clear()`, `done()`

The Pyodide runner in `PythonEditor.js` already intercepts `print`. We extend it to also intercept turtle commands via a pre-pended Python shim that captures turtle calls as JSON, then replays them on a canvas.

**Step 2: Canvas turtle renderer (JavaScript)**

Create `TurtleCanvas.js`:
```js
export function replayTurtle(commands, canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let x = canvas.width / 2, y = canvas.height / 2;
  let angle = -90; // start facing up
  let penDown = true;
  let color = '#000';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  for (const cmd of commands) {
    if (cmd.type === 'forward') {
      const rad = (angle * Math.PI) / 180;
      const nx = x + Math.cos(rad) * cmd.value;
      const ny = y + Math.sin(rad) * cmd.value;
      if (penDown) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
      x = nx; y = ny;
    } else if (cmd.type === 'back') {
      const rad = (angle * Math.PI) / 180;
      const nx = x - Math.cos(rad) * cmd.value;
      const ny = y - Math.sin(rad) * cmd.value;
      if (penDown) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
      x = nx; y = ny;
    } else if (cmd.type === 'right') {
      angle += cmd.value;
    } else if (cmd.type === 'left') {
      angle -= cmd.value;
    } else if (cmd.type === 'penup') {
      penDown = false;
    } else if (cmd.type === 'pendown') {
      penDown = true;
    } else if (cmd.type === 'color') {
      color = cmd.value;
      ctx.strokeStyle = color;
    } else if (cmd.type === 'width') {
      ctx.lineWidth = cmd.value;
    } else if (cmd.type === 'goto') {
      x = canvas.width / 2 + cmd.x;
      y = canvas.height / 2 - cmd.y;
    } else if (cmd.type === 'clear') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      x = canvas.width / 2; y = canvas.height / 2; angle = -90;
    }
  }
}
```

**Step 3: Python shim**

Prepended to user code before Pyodide runs it:
```python
_turtle_commands = []
class _T:
    def forward(self, n): _turtle_commands.append({'type':'forward','value':n})
    def fd(self, n): self.forward(n)
    def back(self, n): _turtle_commands.append({'type':'back','value':n})
    def bk(self, n): self.back(n)
    def right(self, d): _turtle_commands.append({'type':'right','value':d})
    def rt(self, d): self.right(d)
    def left(self, d): _turtle_commands.append({'type':'left','value':d})
    def lt(self, d): self.left(d)
    def penup(self): _turtle_commands.append({'type':'penup'})
    def pendown(self): _turtle_commands.append({'type':'pendown'})
    def pu(self): self.penup()
    def pd(self): self.pendown()
    def color(self, c): _turtle_commands.append({'type':'color','value':c})
    def width(self, w): _turtle_commands.append({'type':'width','value':w})
    def pensize(self, w): self.width(w)
    def goto(self, x, y): _turtle_commands.append({'type':'goto','x':x,'y':y})
    def setpos(self, x, y): self.goto(x, y)
    def speed(self, s): pass
    def hideturtle(self): pass
    def ht(self): pass
    def showturtle(self): pass
    def clear(self): _turtle_commands.append({'type':'clear'})
    def done(self): pass
    def circle(self, r, e=None):
        import math
        steps = 36 if e is None else int(e)
        step_len = (2 * math.pi * abs(r)) / steps
        for _ in range(steps):
            self.forward(step_len)
            self.left(360 / steps)

turtle = _T()
```

After running, extract `_turtle_commands` and replay on canvas.

**Step 4: Create TurtlePlayground component**

```jsx
// TurtlePlayground.js
import React, { useState, useRef, useEffect } from 'react';
import Header from '../Header/Header';
import { replayTurtle } from './TurtleCanvas';
import './TurtlePlayground.css';

const STARTER_EXAMPLES = [
  {
    label: '🟦 Draw a Square',
    code: `for i in range(4):\n    turtle.forward(100)\n    turtle.right(90)`
  },
  {
    label: '⭐ Draw a Star',
    code: `for i in range(5):\n    turtle.forward(120)\n    turtle.right(144)`
  },
  {
    label: '🌀 Draw a Spiral',
    code: `for i in range(36):\n    turtle.forward(i * 3)\n    turtle.right(91)`
  },
  {
    label: '🌈 Rainbow Hexagon',
    code: `colors = ['red','orange','yellow','green','blue','purple']\nfor i in range(6):\n    turtle.color(colors[i])\n    turtle.forward(100)\n    turtle.right(60)`
  },
  {
    label: '🎯 Bullseye',
    code: `for r in [20, 40, 60, 80]:\n    turtle.penup()\n    turtle.goto(0, -r)\n    turtle.pendown()\n    turtle.circle(r)`
  },
];

const TURTLE_SHIM = `
_turtle_commands = []
class _T:
    def forward(self, n): _turtle_commands.append({'type':'forward','value':n})
    def fd(self, n): self.forward(n)
    def back(self, n): _turtle_commands.append({'type':'back','value':n})
    def bk(self, n): self.back(n)
    def right(self, d): _turtle_commands.append({'type':'right','value':d})
    def rt(self, d): self.right(d)
    def left(self, d): _turtle_commands.append({'type':'left','value':d})
    def lt(self, d): self.left(d)
    def penup(self): _turtle_commands.append({'type':'penup'})
    def pendown(self): _turtle_commands.append({'type':'pendown'})
    def pu(self): self.penup()
    def pd(self): self.pendown()
    def color(self, c): _turtle_commands.append({'type':'color','value':c})
    def width(self, w): _turtle_commands.append({'type':'width','value':w})
    def pensize(self, w): self.width(w)
    def goto(self, x, y): _turtle_commands.append({'type':'goto','x':x,'y':y})
    def setpos(self, x, y): self.goto(x, y)
    def speed(self, s): pass
    def hideturtle(self): pass
    def ht(self): pass
    def showturtle(self): pass
    def clear(self): _turtle_commands.append({'type':'clear'})
    def done(self): pass
    def circle(self, r, e=None):
        import math
        steps = 36 if e is None else int(e)
        step_len = (2 * math.pi * abs(r)) / steps
        for _ in range(steps):
            self.forward(step_len)
            self.left(360/steps)
turtle = _T()
`;

export default function TurtlePlayground() {
  const [code, setCode] = useState(STARTER_EXAMPLES[0].code);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const canvasRef = useRef(null);
  const pyodideRef = useRef(null);

  // Check if user has completed any puzzle (unlock gate)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setChecking(false); return; }
    fetch('/api/puzzles/progress', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { completedPuzzles: [] })
      .then(d => {
        setUnlocked((d.completedPuzzles || []).length > 0);
        setChecking(false);
      })
      .catch(() => { setUnlocked(false); setChecking(false); });
  }, []);

  // Load Pyodide once
  useEffect(() => {
    if (!window.loadPyodide) return;
    window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/' })
      .then(py => { pyodideRef.current = py; });
  }, []);

  const runCode = async () => {
    if (!pyodideRef.current) { setError('Python runtime not ready. Try again in a moment.'); return; }
    setRunning(true);
    setError('');
    setOutput('');
    const fullCode = TURTLE_SHIM + '\n' + code;
    try {
      // Limit iterations guard: prepend a simple line counter check
      await pyodideRef.current.runPythonAsync(fullCode);
      const cmds = pyodideRef.current.globals.get('_turtle_commands').toJs({ dict_converter: Object.fromEntries });
      const canvas = canvasRef.current;
      replayTurtle(cmds, canvas);
      setOutput('✅ Drawing complete!');
    } catch (e) {
      setError('❌ ' + String(e).split('\n').slice(-2).join(' '));
    } finally {
      setRunning(false);
    }
  };

  if (checking) return <div style={{textAlign:'center',padding:'3rem'}}>Loading...</div>;

  if (!unlocked) return (
    <div>
      <Header />
      <div className="tplay-locked">
        <div className="tplay-lock-icon">🔒</div>
        <h2>Turtle Playground is Locked</h2>
        <p>Complete <strong>any puzzle</strong> to unlock the Turtle Playground!</p>
        <a href="/games" className="tplay-btn">Go to Puzzles</a>
      </div>
    </div>
  );

  return (
    <div className="tplay-page">
      <Header />
      <div className="tplay-wrapper">
        <div className="tplay-hero">
          <span className="tplay-emoji">🐢</span>
          <div>
            <h1>Turtle Playground</h1>
            <p>Draw amazing shapes with Python! Pick a starter or write your own.</p>
          </div>
        </div>

        <div className="tplay-grid">
          {/* Left: editor */}
          <div className="tplay-editor-col">
            <div className="tplay-starters">
              {STARTER_EXAMPLES.map((ex, i) => (
                <button key={i} className="tplay-starter-btn" onClick={() => setCode(ex.code)}>
                  {ex.label}
                </button>
              ))}
            </div>
            <textarea
              className="tplay-editor"
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              rows={16}
            />
            <button className="tplay-run-btn" onClick={runCode} disabled={running}>
              {running ? '⏳ Running...' : '▶ Run'}
            </button>
            {output && <div className="tplay-output tplay-output--ok">{output}</div>}
            {error  && <div className="tplay-output tplay-output--err">{error}</div>}
          </div>

          {/* Right: canvas */}
          <div className="tplay-canvas-col">
            <canvas ref={canvasRef} width={480} height={480} className="tplay-canvas" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Add route to App.js**
```js
import TurtlePlayground from './pages/Playground/TurtlePlayground';
// Inside <Routes>:
<Route path="/playground" element={<TurtlePlayground />} />
```

**Step 6: Create `TurtleCanvas.js`** (the replay function file from Step 2 above).

**Step 7: Add `TurtlePlayground.css`** with responsive grid layout (editor left, canvas right on desktop; stacked on mobile).

**Step 8: Add Playground link to Header nav**

In `Header.js`, add `{ to: '/playground', label: '🐢 Playground' }` to `NAV_LINKS`.

**Step 9: Build + deploy + test**
```bash
/home/bitnami/deploy-frontend.sh
```
Verify: `/playground` shows locked if no puzzles done; unlocked after completing one. Run "Draw a Square" example and see a square on canvas.

**Step 10: Commit**
```bash
git add packages/gamified-elearning/src/pages/Playground/ packages/gamified-elearning/src/App.js packages/gamified-elearning/src/pages/Header/
git commit -m "feat(playground): add Turtle Playground page with Pyodide runner and 5 starter examples"
```

---

## Phase 4 — XP Level System

### Task 7: XP levels + feature unlock

**Files:**
- Create: `packages/gamified-elearning/src/utils/xpLevels.js`
- Modify: `packages/gamified-elearning/src/pages/Header/Header.js` (add XP bar)
- Modify: `packages/gamified-elearning/src/pages/Header/Header.css`
- Backend: no changes needed (total_xp already in Students table)

**Step 1: Define level thresholds**

```js
// xpLevels.js
export const LEVELS = [
  { level: 1, minXP: 0,    title: 'Beginner',   color: '#4cc9f0', unlocks: 'Lessons & Quiz 1' },
  { level: 2, minXP: 200,  title: 'Explorer',   color: '#4ecca3', unlocks: 'Puzzles' },
  { level: 3, minXP: 500,  title: 'Builder',    color: '#ffd93d', unlocks: 'Turtle Playground' },
  { level: 4, minXP: 900,  title: 'Creator',    color: '#ff6b9d', unlocks: 'AI Buddy Hints' },
  { level: 5, minXP: 1400, title: 'Master',     color: '#b5179e', unlocks: 'Bonus Challenges' },
  { level: 6, minXP: 2000, title: 'Python Pro', color: '#667eea', unlocks: 'All Features' },
];

export function getLevel(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl;
    else break;
  }
  const nextIdx = LEVELS.indexOf(current) + 1;
  const next = LEVELS[nextIdx] || null;
  const progress = next
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100;
  return { ...current, next, progress: Math.min(100, progress) };
}
```

**Step 2: Fetch XP in Header and show level badge + progress bar**

In `Header.js`, add:
```js
import { getLevel } from '../../utils/xpLevels';
const [totalXP, setTotalXP] = useState(0);

useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token || !user) return;
  fetch('/api/rewards/leaderboard', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const userId = user.user_id ?? user.id;
      const entry = (data?.leaderboard || []).find(e => String(e.student_id) === String(userId));
      if (entry) setTotalXP(Number(entry.xp_points) || 0);
    })
    .catch(() => {});
}, [user]);

const lvlInfo = getLevel(totalXP);
```

In Header JSX, add after logo:
```jsx
{user && (
  <div className="site-header__xp">
    <span className="site-header__xp-badge" style={{ background: lvlInfo.color }}>
      Lv {lvlInfo.level} {lvlInfo.title}
    </span>
    <div className="site-header__xp-bar">
      <div className="site-header__xp-fill" style={{ width: `${lvlInfo.progress}%`, background: lvlInfo.color }} />
    </div>
    <span className="site-header__xp-text">{totalXP} XP</span>
  </div>
)}
```

Add to `Header.css`:
```css
.site-header__xp { display:flex; align-items:center; gap:.5rem; }
.site-header__xp-badge { padding:3px 10px; border-radius:999px; color:#fff; font-size:.7rem; font-weight:700; white-space:nowrap; }
.site-header__xp-bar { width:80px; height:8px; background:#e9ecef; border-radius:4px; overflow:hidden; }
.site-header__xp-fill { height:100%; border-radius:4px; transition:width .5s; }
.site-header__xp-text { font-size:.75rem; color:#495057; font-weight:600; white-space:nowrap; }
@media(max-width:640px) { .site-header__xp { display:none; } }
```

**Step 3: Build + test**
After deploying, login and check that the header shows a level badge and XP bar that fills based on earned XP.

**Step 4: Commit**
```bash
git add packages/gamified-elearning/src/utils/xpLevels.js packages/gamified-elearning/src/pages/Header/
git commit -m "feat(xp): add XP level system with 6 levels and header progress bar"
```

---

## Phase 6 — AI Buddy Agent (Skeleton + Mock Mode)

### Task 8: Backend `/api/ai/help` endpoint

**Files:**
- Modify: `packages/codeit-backend/test-quiz.js` (add ai route)
- Create: `packages/codeit-backend/routes/ai.js`

**Step 1: Create `routes/ai.js`**

```js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'Team42*';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Mock responses for common contexts (when no API key)
const MOCK_HINTS = {
  lesson: [
    "Great question! Try running the code first and see what output you get. Look at the print() statement — what's inside the quotes?",
    "Hint: Variables are like labeled boxes. What value did you put in the box?",
    "Remember: Python is case-sensitive. Make sure your spelling matches exactly!",
  ],
  quiz: [
    "Read the question carefully. Think about what the code would print when you run it.",
    "Try to eliminate obviously wrong answers first, then pick the best one!",
    "Think about what you learned in the lesson — which concept does this question test?",
  ],
  puzzle: [
    "Break the puzzle into small steps. What's the very first thing the robot/character needs to do?",
    "Look at the goal description carefully. What Python command would help here?",
    "Try a simpler version first, then add complexity. Start with just one action!",
  ],
  default: [
    "You're doing great! Keep experimenting — coders learn by trying things.",
    "Hint: Read any error messages carefully. Python tells you exactly what went wrong and on which line!",
    "Remember to check: indentation, quotes, and parentheses — these are common sources of bugs.",
  ]
};

function getMockHint(context) {
  const pool = MOCK_HINTS[context] || MOCK_HINTS.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// POST /api/ai/help
router.post('/help', authenticateToken, async (req, res) => {
  const { context = 'default', lessonId, quizId, puzzleId, prompt, code } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (prompt.length > 500) return res.status(400).json({ error: 'Prompt too long (max 500 chars)' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    // Mock mode: return a helpful pre-written hint
    const hint = getMockHint(context);
    return res.json({ response: hint, mode: 'mock' });
  }

  // Real mode: call Claude API
  try {
    const systemPrompt = `You are CodeBot, a friendly AI helper for CodeIt — a Python learning platform for kids aged 8-14.
Your role: give short, encouraging hints (2-3 sentences max). NEVER give the full solution.
Context: ${context}${lessonId ? `, Lesson ${lessonId}` : ''}${quizId ? `, Quiz ${quizId}` : ''}${puzzleId ? `, Puzzle ${puzzleId}` : ''}
Rules: Keep it kid-friendly. Be encouraging. Give hints not answers. No unsafe content.`;

    const userMessage = code
      ? `Student's question: ${prompt}\n\nTheir code:\n\`\`\`python\n${code.slice(0, 500)}\n\`\`\``
      : `Student's question: ${prompt}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const text = data.content?.[0]?.text || 'Keep trying — you can do it!';
    res.json({ response: text, mode: 'live' });
  } catch (err) {
    console.error('AI error:', err.message);
    res.json({ response: getMockHint(context), mode: 'mock_fallback' });
  }
});

module.exports = router;
```

**Step 2: Register in `test-quiz.js`**
```js
const aiRoutes = require('./routes/ai');
// ...after other app.use calls:
app.use('/api/ai', aiRoutes);
```

**Step 3: Test endpoint**
```bash
pm2 restart codeit-backend
TOKEN=$(curl -s -X POST http://localhost:8080/api/login -H 'Content-Type: application/json' -d '{"email":"mustafa@test.com","password":"Mustafa2003"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s -X POST http://localhost:8080/api/ai/help \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"context":"lesson","lessonId":2,"prompt":"What is a variable?"}' | python3 -m json.tool
```
Expected: `{ "response": "...", "mode": "mock" }`

### Task 9: AI Buddy frontend — floating button + chat panel

**Files:**
- Create: `packages/gamified-elearning/src/components/AiBuddy/AiBuddy.js`
- Create: `packages/gamified-elearning/src/components/AiBuddy/AiBuddy.css`
- Modify: `packages/gamified-elearning/src/App.js` (wrap all routes with `<AiBuddy />`)

**Step 1: Create AiBuddy component**

```jsx
// AiBuddy.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import './AiBuddy.css';

export default function AiBuddy() {
  const { user } = useContext(AuthContext) || {};
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm CodeBot 🤖 Ask me for a hint anytime!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Derive context from current URL
  const getContext = () => {
    const p = location.pathname;
    if (p.startsWith('/lesson')) return { context: 'lesson', lessonId: p.split('/')[2] };
    if (p.startsWith('/quiz'))   return { context: 'quiz',   quizId:   p.split('/')[2] };
    if (p.startsWith('/game'))   return { context: 'puzzle', puzzleId: p.split('/')[2] };
    return { context: 'default' };
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim().slice(0, 300);
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);

    const token = localStorage.getItem('token');
    const ctx = getContext();

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/help`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...ctx, prompt: text }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'bot', text: data.response || 'Keep trying! 🚀' }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Oops! Check your connection and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Only show when logged in

  // Hide on home page
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <>
      {/* Floating button */}
      <button className="ai-buddy-fab" onClick={() => setOpen(o => !o)} aria-label="AI Buddy">
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="ai-buddy-panel">
          <div className="ai-buddy-header">
            <span>🤖 CodeBot</span>
            <span className="ai-buddy-subtitle">Your Python hint helper</span>
          </div>
          <div className="ai-buddy-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg--${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="ai-msg ai-msg--bot ai-msg--typing">
              <span />
              <span />
              <span />
            </div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-buddy-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask for a hint..."
              maxLength={300}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 2: CSS** (position fixed, bottom-right)
```css
.ai-buddy-fab {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 1000;
  width: 56px; height: 56px; border-radius: 50%; border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff; font-size: 1.5rem; cursor: pointer;
  box-shadow: 0 8px 24px rgba(102,126,234,.5);
  transition: transform .15s;
}
.ai-buddy-fab:hover { transform: scale(1.08); }
.ai-buddy-panel {
  position: fixed; bottom: 5rem; right: 1.5rem; z-index: 999;
  width: 320px; max-height: 460px;
  background: #fff; border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0,0,0,.18);
  display: flex; flex-direction: column; overflow: hidden;
}
.ai-buddy-header {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff; padding: .75rem 1rem;
  display: flex; flex-direction: column;
}
.ai-buddy-subtitle { font-size: .75rem; opacity: .85; }
.ai-buddy-messages { flex: 1; overflow-y: auto; padding: .75rem; display: flex; flex-direction: column; gap: .5rem; }
.ai-msg { max-width: 85%; padding: .6rem .875rem; border-radius: 16px; font-size: .875rem; line-height: 1.4; }
.ai-msg--bot { background: #f0f4ff; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; }
.ai-msg--user { background: linear-gradient(135deg,#667eea,#764ba2); color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }
.ai-msg--typing { display:flex; gap:4px; align-items:center; }
.ai-msg--typing span { width:8px; height:8px; border-radius:50%; background:#667eea; animation:typing .8s infinite; }
.ai-msg--typing span:nth-child(2) { animation-delay:.15s; }
.ai-msg--typing span:nth-child(3) { animation-delay:.3s; }
@keyframes typing { 0%,80%,100%{opacity:.3} 40%{opacity:1} }
.ai-buddy-input { display:flex; gap:.5rem; padding:.75rem; border-top:1px solid #e9ecef; }
.ai-buddy-input input { flex:1; border:1.5px solid #e9ecef; border-radius:10px; padding:.5rem .75rem; font-size:.875rem; outline:none; }
.ai-buddy-input input:focus { border-color:#667eea; }
.ai-buddy-input button { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:10px; padding:.5rem .875rem; font-weight:700; cursor:pointer; font-size:.875rem; }
.ai-buddy-input button:disabled { opacity:.5; cursor:not-allowed; }
@media(max-width:420px) { .ai-buddy-panel { width: calc(100vw - 2rem); right:1rem; } }
```

**Step 3: Add `<AiBuddy />` to App.js**

Import and place it inside the Router but outside Routes:
```jsx
import AiBuddy from './components/AiBuddy/AiBuddy';
// Inside <Router>:
<RouteLogger />
<AiBuddy />
<Routes>...</Routes>
```

**Step 4: Build + test**
```bash
/home/bitnami/deploy-frontend.sh
```
Verify: floating robot button appears on lesson/quiz pages. Click → panel opens. Type "What is a variable?" → receive a mock hint.

**Step 5: Commit**
```bash
git add packages/codeit-backend/routes/ai.js packages/codeit-backend/test-quiz.js packages/gamified-elearning/src/components/AiBuddy/
git commit -m "feat(ai-buddy): add CodeBot AI hint agent with mock mode and Claude API support"
```

---

## Phase 7 — Parent Email Feature

### Task 10: Backend email setup

**Files:**
- Create: `packages/codeit-backend/routes/email.js`
- Create: `packages/codeit-backend/emailTemplates.js`
- Modify: `packages/codeit-backend/test-quiz.js` (register email route)
- Modify: `packages/codeit-backend/routes/auth.js` (send welcome email on signup if parent_email set)

**Step 1: Install nodemailer (or use SMTP directly)**
```bash
cd /home/bitnami/CodeIt/packages/codeit-backend && npm install nodemailer
```

**Step 2: Create `emailTemplates.js`**
```js
// emailTemplates.js
function welcomeEmail(studentName, parentEmail) {
  return {
    to: parentEmail,
    subject: `Welcome to CodeIt! Your child ${studentName} has started learning Python 🐍`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#667eea">👋 Welcome to CodeIt!</h2>
  <p>Hi there!</p>
  <p><strong>${studentName}</strong> just joined CodeIt — a fun, gamified Python learning platform for kids.</p>
  <p>They'll learn programming through:</p>
  <ul>
    <li>🎓 10 interactive lessons</li>
    <li>🧩 10 fun puzzles</li>
    <li>📝 10 quizzes</li>
    <li>🐢 Turtle Playground drawing</li>
  </ul>
  <p>You'll receive weekly progress updates here. Happy coding!</p>
  <p style="color:#667eea;font-weight:bold">The CodeIt Team 🚀</p>
</div>`
  };
}

function weeklyProgressEmail(studentName, parentEmail, stats) {
  return {
    to: parentEmail,
    subject: `${studentName}'s Weekly Progress on CodeIt 📊`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#667eea">📊 Weekly Progress Report</h2>
  <p>Here's what <strong>${studentName}</strong> achieved this week on CodeIt:</p>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px;background:#f8f9fa">Total XP</td><td style="padding:8px;font-weight:bold">${stats.totalXP} XP</td></tr>
    <tr><td style="padding:8px">Lessons Completed</td><td style="padding:8px;font-weight:bold">${stats.lessonsCompleted} / 10</td></tr>
    <tr><td style="padding:8px;background:#f8f9fa">Quizzes Taken</td><td style="padding:8px;font-weight:bold">${stats.quizzesTaken}</td></tr>
    <tr><td style="padding:8px">Puzzles Solved</td><td style="padding:8px;font-weight:bold">${stats.puzzlesSolved} / 10</td></tr>
  </table>
  <p style="margin-top:16px">Keep encouraging them — every lesson builds real coding skills! 🌟</p>
  <p style="color:#667eea;font-weight:bold">The CodeIt Team</p>
</div>`
  };
}

function milestoneEmail(studentName, parentEmail, milestone) {
  return {
    to: parentEmail,
    subject: `🏆 ${studentName} hit a milestone on CodeIt!`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#ffd93d">🏆 Milestone Achieved!</h2>
  <p><strong>${studentName}</strong> just reached a big milestone:</p>
  <p style="font-size:1.3rem;font-weight:bold;color:#667eea;text-align:center;padding:20px">${milestone}</p>
  <p>Give them a high five — they're becoming a real Python programmer! 🐍</p>
  <p style="color:#667eea;font-weight:bold">The CodeIt Team</p>
</div>`
  };
}

module.exports = { welcomeEmail, weeklyProgressEmail, milestoneEmail };
```

**Step 3: Create `routes/email.js`**
```js
const express = require('express');
const nodemailer = require('nodemailer');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { welcomeEmail, weeklyProgressEmail, milestoneEmail } = require('../emailTemplates');
const router = express.Router();
const JWT_SECRET = 'Team42*';

// Create transporter — uses env vars; falls back to console logging in dev
function getTransporter() {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  // Dev mode: log emails to console, no SMTP needed
  return {
    sendMail: (opts) => {
      console.log('[EMAIL DEV]', opts.to, '|', opts.subject);
      return Promise.resolve({ messageId: 'dev-' + Date.now() });
    }
  };
}

async function sendEmail(opts) {
  const transport = getTransporter();
  return transport.sendMail({
    from: process.env.EMAIL_FROM || 'CodeIt <noreply@codeitlearn.com>',
    ...opts,
  });
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// POST /api/email/test-welcome — trigger welcome email manually for testing
router.post('/test-welcome', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await pool.query(
      'SELECT u.name, u.parent_email FROM Users u WHERE u.user_id = ?',
      [userId]
    );
    if (!rows.length || !rows[0].parent_email) {
      return res.status(400).json({ error: 'No parent email on file' });
    }
    const { name, parent_email } = rows[0];
    const tmpl = welcomeEmail(name.split(' ')[0], parent_email);
    await sendEmail(tmpl);
    res.json({ success: true, message: `Welcome email sent to ${parent_email}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email/weekly — send weekly summary to all students with parent emails
// Call this from a cron or manually; protected by a secret header
router.post('/weekly', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const [students] = await pool.query(`
      SELECT u.user_id, u.name, u.parent_email, s.total_xp,
        (SELECT COUNT(*) FROM Student_Lesson_Progress slp WHERE slp.user_id = u.user_id) AS lessons_done,
        (SELECT COUNT(*) FROM Student_Quiz_Attempt sqa WHERE sqa.student_id = u.user_id) AS quizzes_taken,
        (SELECT COUNT(*) FROM Student_Puzzle_Progress spp WHERE spp.user_id = u.user_id) AS puzzles_done
      FROM Users u
      JOIN Students s ON s.user_id = u.user_id
      WHERE u.parent_email IS NOT NULL AND u.parent_email != ''
    `);
    let sent = 0;
    for (const st of students) {
      const tmpl = weeklyProgressEmail(st.name.split(' ')[0], st.parent_email, {
        totalXP: st.total_xp,
        lessonsCompleted: st.lessons_done,
        quizzesTaken: st.quizzes_taken,
        puzzlesSolved: st.puzzles_done,
      });
      await sendEmail(tmpl);
      sent++;
    }
    res.json({ success: true, emailsSent: sent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

**Step 4: Register in `test-quiz.js`**
```js
const emailRoutes = require('./routes/email');
app.use('/api/email', emailRoutes);
```

**Step 5: Wire welcome email on signup in `routes/auth.js`**

In the signup handler, after successful student creation, add (non-blocking):
```js
if (parent_email) {
  const { welcomeEmail } = require('../emailTemplates');
  // fire-and-forget
  require('./email').sendEmailSilent(welcomeEmail(name.split(' ')[0], parent_email));
}
```

(Export a `sendEmailSilent` helper from email.js that catches errors silently.)

**Step 6: Test**
```bash
pm2 restart codeit-backend
TOKEN=... # from earlier
curl -s -X POST http://localhost:8080/api/email/test-welcome \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```
Expected (no SMTP set): `{ "success": true, "message": "Welcome email sent to ..." }` + console log shows `[EMAIL DEV]`.

**Step 7: Commit**
```bash
git add packages/codeit-backend/routes/email.js packages/codeit-backend/emailTemplates.js packages/codeit-backend/test-quiz.js
git commit -m "feat(email): add parent email system with welcome + weekly digest + milestone templates"
```

---

## Verification Checklist

For each phase, run these checks:

### Phase 1
- [ ] `https://codeitlearn.com/lesson/2` shows story panels, 3 concept cards, 3 code checkpoints
- [ ] Completing a checkpoint marks lesson as done in DB: `curl .../api/lessons/progress` shows lesson 2 in completedLessons
- [ ] Same for lessons 3–10
- [ ] No `localhost:8080` URLs anywhere in built JS bundles: `grep -r "localhost" /opt/bitnami/apache/htdocs/static/js/ | grep -v ".map"`

### Phase 2
- [ ] After passing Quiz 1 (≥ 60%), gift screen shows with "Play Puzzle 1" button
- [ ] `/games` shows Puzzle 1 unlocked, Puzzle 2 locked (if quiz 2 not done)
- [ ] `curl http://localhost:8080/api/quiz/1/completed -H "Auth: Bearer $TOKEN"` returns `{ "completed": true }`
- [ ] `curl http://localhost:8080/api/puzzles/progress -H "Auth: Bearer $TOKEN"` returns completed puzzle IDs

### Phase 3
- [ ] `/playground` shows locked if no puzzles complete
- [ ] After completing puzzle 1 via `POST /api/puzzles/1/complete`, `/playground` unlocks
- [ ] "Draw a Square" example draws an actual square on the canvas
- [ ] No infinite loops: code runs in < 5 seconds

### Phase 4
- [ ] Header shows "Lv 1 Beginner" for new users with 0 XP
- [ ] After earning XP via quiz, header updates level badge and progress bar
- [ ] Level 2 unlocks at 200 XP (Explorer)

### Phase 6
- [ ] Floating 🤖 button visible on `/lesson/1`
- [ ] Click opens chat panel
- [ ] Sending "What is a variable?" returns a hint
- [ ] Panel does NOT appear on `/login` or home page

### Phase 7
- [ ] `POST /api/email/test-welcome` returns success + console shows `[EMAIL DEV]` log
- [ ] `POST /api/email/weekly` with correct header sends digests to all users with parent email

---

## Deployment Script Reference

```bash
# Full build + deploy
/home/bitnami/deploy-frontend.sh

# Backend restart
pm2 restart codeit-backend

# Verify backend
curl -s http://localhost:8080/api/health

# Get test token
curl -s -X POST http://localhost:8080/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mustafa@test.com","password":"Mustafa2003"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])"

# Check no localhost in bundles
grep -rl "localhost:80" /opt/bitnami/apache/htdocs/static/js/ 2>/dev/null | head
```

---

## Execution Order (Recommended)

1. **Task 1** (InteractiveLessonTemplate) → **Task 2** (Lesson 2 proof) → deploy → verify
2. **Task 3** (Lessons 3-10) → deploy → verify all 10 lesson URLs
3. **Task 4** (Quiz gift screen + backend gating) → **Task 5** (puzzle banner) → deploy + verify
4. **Task 6** (Turtle Playground) → deploy → verify
5. **Task 7** (XP levels in header) → deploy → verify
6. **Task 8** (AI backend) + **Task 9** (AI frontend) → deploy → verify
7. **Task 10** (Email) → restart backend → verify
