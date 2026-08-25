// ── One source of truth for the curriculum ───────────────────────────────────
//
// Adding a lesson used to mean editing nine places: a data file, a wrapper
// component, two lines in App.js, the barrel export, LESSON_SEO,
// LESSON_BUILDER_PROMPTS, LESSON_META, FALLBACK_LESSONS, and the journey map.
// Miss one and the lesson half-exists — routable but unlisted, or listed but
// 404. Adding lesson 17 through 31 that way would have been 135 edits.
//
// Now a lesson is one entry here plus one data file.

import lesson1 from './lessonData/lesson1';
import lesson2 from './lessonData/lesson2';
import lesson3 from './lessonData/lesson3';
import lesson4 from './lessonData/lesson4';
import lesson5 from './lessonData/lesson5';
import lesson6 from './lessonData/lesson6';
import lesson7 from './lessonData/lesson7';
import lesson8 from './lessonData/lesson8';
import lesson9 from './lessonData/lesson9';
import lesson10 from './lessonData/lesson10';
import lesson11 from './lessonData/lesson11';
import lesson12 from './lessonData/lesson12';
import lesson13 from './lessonData/lesson13';
import lesson14 from './lessonData/lesson14';
import lesson15 from './lessonData/lesson15';
import lesson16 from './lessonData/lesson16';
import lesson17 from './lessonData/lesson17';
import lesson18 from './lessonData/lesson18';
import lesson19 from './lessonData/lesson19';
import lesson20 from './lessonData/lesson20';
import lesson21 from './lessonData/lesson21';
import lesson22 from './lessonData/lesson22';
import lesson23 from './lessonData/lesson23';
import lesson24 from './lessonData/lesson24';
import lesson25 from './lessonData/lesson25';
import lesson26 from './lessonData/lesson26';
import lesson27 from './lessonData/lesson27';
import lesson28 from './lessonData/lesson28';
import lesson29 from './lessonData/lesson29';
import lesson30 from './lessonData/lesson30';
import lesson31 from './lessonData/lesson31';

/**
 * The curriculum, in order.
 *
 * `unit`         groups lessons on the map.
 * `summary`      is the one line a student reads before starting.
 * `builderPrompt` is the project the lesson unlocks, so every concept has
 *                somewhere to go afterwards.
 * `seoTitle` / `seoDesc` are what Google shows. Written per lesson rather than
 *                generated, because a generated description reads like one.
 *
 * Lessons 1–16 keep their original ids and order. Nobody's saved progress moves.
 */
const LESSONS = [
  {
    data: lesson1, unit: 'First words',
    summary: 'Write your first Python program using print()',
    builderPrompt: 'a colourful page that greets me by name',
    seoTitle: 'Hello Python',
    seoDesc: 'Write your first Python print statement and make the computer say something. Free beginner lesson. Runs in your browser.',
  },
  {
    data: lesson2, unit: 'First words',
    summary: 'Store names, numbers, and messages in variables',
    builderPrompt: 'a scoreboard that remembers a player name and score',
    seoTitle: 'Variables in Python',
    seoDesc: 'Learn how to store names, numbers, and messages in Python variables. Free beginner Python lesson on CodeIt. No download needed.',
  },
  {
    data: lesson3, unit: 'First words',
    summary: 'Work with text using quotes, len(), and string methods',
    builderPrompt: 'a silly name generator',
    seoTitle: 'Python Strings',
    seoDesc: 'Explore Python strings. Concatenation, .upper(), .lower(), and len(). Free interactive lesson for beginners, runs in browser.',
  },
  {
    data: lesson4, unit: 'Making choices',
    summary: 'Make decisions in code with if, elif, and else',
    builderPrompt: 'a quiz that says well done or try again',
    seoTitle: 'If Statements in Python',
    seoDesc: 'Learn to make decisions in code with Python if statements and conditionals. Free beginner lesson. No install required.',
  },
  {
    data: lesson5, unit: 'Repeating',
    summary: 'Repeat code automatically using for i in range()',
    builderPrompt: 'a countdown timer game',
    seoTitle: 'For Loops with range()',
    seoDesc: 'Repeat code automatically with Python for loops and range(). Free beginner lesson. Write and run code in your browser.',
  },
  {
    data: lesson6, unit: 'Repeating',
    summary: 'Loop over characters and sequences with for loops',
    builderPrompt: 'a word animation that reveals letters one at a time',
    seoTitle: 'For Loops over Strings',
    seoDesc: 'Loop over every character in a string using Python for loops. Free interactive coding lesson for beginners on CodeIt.',
  },
  {
    data: lesson7, unit: 'Collections',
    summary: 'Create and use Python lists. Index, append, and len()',
    builderPrompt: 'a to-do list I can add things to',
    seoTitle: 'Python Lists',
    seoDesc: 'Create and use Python lists. Indexing, .append(), and len(). Free beginner lesson. Code runs in your browser, no install needed.',
  },
  {
    data: lesson8, unit: 'Collections',
    summary: 'Combine loops and lists to process collections of data',
    builderPrompt: 'a high-score table',
    seoTitle: 'Loops with Lists in Python',
    seoDesc: 'Combine Python loops and lists to process collections of data. Free beginner coding lesson. Runs instantly in your browser.',
  },
  {
    data: lesson9, unit: 'Own commands',
    summary: 'Write reusable functions using def, parameters, and return',
    builderPrompt: 'a calculator with buttons',
    seoTitle: 'Python Functions',
    seoDesc: 'Write reusable Python functions with def, parameters, and return values. Free interactive lesson for beginners on CodeIt.',
  },
  {
    data: lesson10, unit: 'Own commands',
    summary: 'Put it all together. Functions, loops, and lists in one program',
    builderPrompt: 'a small adventure game with choices',
    seoTitle: 'Combining Python Concepts',
    seoDesc: 'Put it all together. Functions, loops, and lists in one Python project. Free beginner lesson on CodeIt.',
  },
  {
    data: lesson11, unit: 'Numbers',
    summary: 'Integers, floats, and arithmetic operators',
    builderPrompt: 'a pocket-money calculator',
    seoTitle: 'Numbers and Arithmetic',
    seoDesc: 'Learn Python integer and float arithmetic. Add, subtract, multiply, divide, floor division, and modulo. Free beginner lesson on CodeIt.',
  },
  {
    data: lesson12, unit: 'Numbers',
    summary: 'True/False values and comparison operators',
    builderPrompt: 'a guess-the-number game',
    seoTitle: 'Booleans and Comparisons',
    seoDesc: 'Understand Python True/False values and comparison operators like ==, !=, <, >. Free interactive beginner lesson. Runs in your browser.',
  },
  {
    data: lesson13, unit: 'Making choices',
    summary: 'Combine conditions with and, or, and not',
    builderPrompt: 'a game with a secret bonus level',
    seoTitle: 'Logical Operators in Python',
    seoDesc: 'Combine conditions with Python and, or, and not. Free beginner lesson. Write and test logical expressions in your browser.',
  },
  {
    data: lesson14, unit: 'Numbers',
    summary: 'Convert between int, float, str, and bool',
    builderPrompt: 'a unit converter',
    seoTitle: 'Type Casting in Python',
    seoDesc: 'Convert between int, float, str, and bool in Python. Free beginner coding lesson. No install needed, runs in your browser.',
  },
  {
    data: lesson15, unit: 'Text',
    summary: 'Build clean output with f-strings and format specifiers',
    builderPrompt: 'a shop page with prices',
    seoTitle: 'String Formatting with f-Strings',
    seoDesc: 'Build polished Python output using f-strings and format specifiers. Free interactive beginner lesson. Runs directly in your browser.',
  },
  {
    data: lesson16, unit: 'Text',
    summary: 'strip, replace, split, join, find, and count',
    builderPrompt: 'a secret message decoder',
    seoTitle: 'Python String Methods',
    seoDesc: 'Clean and transform text with strip(), replace(), split(), find(), and count(). Free Python beginner lesson on CodeIt.',
  },

  // ── Everything below is new. The course used to stop at string methods,
  //    which left out while loops, dictionaries, error handling and classes —
  //    the things a child needs before they can build a game that runs on its
  //    own rather than a program that prints once and exits.

  {
    data: lesson17, unit: 'Repeating',
    summary: 'Repeat until something changes, with while',
    builderPrompt: 'a rocket launch countdown that keeps going until lift-off',
    seoTitle: 'While Loops in Python',
    seoDesc: 'Learn Python while loops. Repeat code until a condition changes, and avoid infinite loops. Free interactive lesson that runs in your browser.',
  },
  {
    data: lesson18, unit: 'Repeating',
    summary: 'Leave a loop early with break, skip a lap with continue',
    builderPrompt: 'a treasure hunt that stops when you find the gold',
    seoTitle: 'Break and Continue in Python',
    seoDesc: 'Control Python loops with break and continue. Stop early or skip a single pass. Free beginner lesson, no install needed.',
  },
  {
    data: lesson19, unit: 'Toolboxes',
    summary: 'Use import to borrow ready-made code, and random for surprises',
    builderPrompt: 'a dice game where the roll is different every time',
    seoTitle: 'Import and Random in Python',
    seoDesc: 'Use Python import, the random module and math module to add dice rolls and surprises to your programs. Free interactive lesson for beginners.',
  },
  {
    data: lesson20, unit: 'Collections',
    summary: 'Store data by name with dictionaries',
    builderPrompt: 'a character sheet with a name, health and level',
    seoTitle: 'Python Dictionaries',
    seoDesc: 'Store and look up data by name with Python dictionaries. Keys, values, and .get(). Free beginner lesson that runs in your browser.',
  },
  {
    data: lesson21, unit: 'Collections',
    summary: 'Loop through a dictionary with .items(), .keys(), and .values()',
    builderPrompt: 'a class scoreboard that lists everyone and their points',
    seoTitle: 'Looping Through a Python Dictionary',
    seoDesc: 'Walk through Python dictionaries with .items(), .keys() and .values(). Free interactive beginner lesson. No download required.',
  },
  {
    data: lesson22, unit: 'Collections',
    summary: 'Tuples that cannot change and sets that drop duplicates',
    builderPrompt: 'a game that tracks which players have joined, with no repeats',
    seoTitle: 'Python Tuples and Sets',
    seoDesc: 'Understand Python tuples and sets. Immutable data and automatic duplicate removal. Free beginner coding lesson on CodeIt.',
  },
  {
    data: lesson23, unit: 'Collections',
    summary: 'Take part of a list or string with slicing',
    builderPrompt: 'a leaderboard that shows only the top three',
    seoTitle: 'Python Slicing',
    seoDesc: 'Slice Python lists and strings with [start:stop:step], including negative indexes and reversing. Free interactive lesson for beginners.',
  },
  {
    data: lesson24, unit: 'Collections',
    summary: 'Build a whole list in one line with a comprehension',
    builderPrompt: 'a page that shows every item in a shop with its price doubled',
    seoTitle: 'Python List Comprehensions',
    seoDesc: 'Write Python list comprehensions. Build and filter lists in a single line. Free beginner-friendly lesson, runs in your browser.',
  },
  {
    data: lesson25, unit: 'Own commands',
    summary: 'Default arguments, several return values, and None',
    builderPrompt: 'a damage calculator with a normal hit and a critical hit',
    seoTitle: 'Python Function Return Values',
    seoDesc: 'Master Python return values, default arguments, multiple returns and None. Free interactive lesson for beginner programmers.',
  },
  {
    data: lesson26, unit: 'Own commands',
    summary: 'Local and global variables. Where a name lives',
    builderPrompt: 'a score keeper where each function does one clear job',
    seoTitle: 'Variable Scope in Python',
    seoDesc: 'Learn Python variable scope. Local versus global, and why a variable made in a function disappears. Free beginner lesson on CodeIt.',
  },
  {
    data: lesson27, unit: 'When things break',
    summary: 'Catch errors with try and except instead of crashing',
    builderPrompt: 'a quiz that keeps going even when someone types nonsense',
    seoTitle: 'Try and Except in Python',
    seoDesc: 'Handle Python errors with try, except, ValueError and KeyError so your program recovers instead of crashing. Free interactive lesson.',
  },
  {
    data: lesson28, unit: 'Collections',
    summary: 'Count while you loop with enumerate, pair lists with zip',
    builderPrompt: 'a ranked leaderboard numbered 1st, 2nd, 3rd',
    seoTitle: 'Python enumerate and zip',
    seoDesc: 'Use Python enumerate() and zip() to loop with a counter and walk two lists together. Free beginner lesson that runs in your browser.',
  },
  {
    data: lesson29, unit: 'Your own things',
    summary: 'Build your own type with classes, objects, and methods',
    builderPrompt: 'a battle game with two fighters that each have health and power',
    seoTitle: 'Python Classes and Objects',
    seoDesc: 'Write Python classes with __init__, self and methods to build your own objects. Free interactive lesson for young programmers.',
  },
  {
    data: lesson30, unit: 'Your own things',
    summary: 'Functions that call themselves, and the base case that stops them',
    builderPrompt: 'a nested menu where every option can open another menu',
    seoTitle: 'Recursion in Python',
    seoDesc: 'Understand Python recursion. Base cases, recursive cases, factorials and reversing a string. Free interactive lesson for beginners.',
  },
  {
    data: lesson31, unit: 'Your own things',
    summary: 'Capstone. Combine everything into one real game',
    builderPrompt: 'a complete treasure hunt game with chests, coins and a score',
    seoTitle: 'Python Capstone Project',
    seoDesc: 'Combine Python loops, dictionaries, classes and error handling into one finished game. The capstone of CodeIt free Python course.',
  },
];

// Derived views. Every consumer reads from these rather than keeping its own
// copy of the lesson list.

const LESSON_BY_ID = new Map(LESSONS.map(entry => [entry.data.id, entry]));

function getLessonEntry(id) {
  return LESSON_BY_ID.get(Number(id)) || null;
}

function getLessonData(id) {
  return getLessonEntry(id)?.data || null;
}

function lessonExists(id) {
  return LESSON_BY_ID.has(Number(id));
}

/** The list the lesson map renders when the API is unreachable. */
function lessonSummaries() {
  return LESSONS.map(({ data, unit, summary }) => ({
    id: data.id,
    title: data.title,
    unit,
    summary,
    emoji: data.emoji || '🐍',
    xp: data.xp || 50,
  }));
}

function builderPromptFor(id) {
  return getLessonEntry(id)?.builderPrompt || 'a fun project of my own';
}

/** Page title and meta description for one lesson. */
function seoFor(id) {
  const entry = getLessonEntry(id);
  if (!entry) return {};
  return { title: entry.seoTitle, desc: entry.seoDesc };
}

/** Units in curriculum order, each with its lessons — used by the map. */
function lessonUnits() {
  const order = [];
  const byUnit = new Map();
  lessonSummaries().forEach(lesson => {
    if (!byUnit.has(lesson.unit)) {
      byUnit.set(lesson.unit, []);
      order.push(lesson.unit);
    }
    byUnit.get(lesson.unit).push(lesson);
  });
  return order.map(name => ({ name, lessons: byUnit.get(name) }));
}

const TOTAL_LESSONS = LESSONS.length;

export {
  LESSONS,
  TOTAL_LESSONS,
  builderPromptFor,
  getLessonData,
  getLessonEntry,
  lessonExists,
  lessonSummaries,
  lessonUnits,
  seoFor,
};
