'use strict';

const fs = require('fs');
const path = require('path');

const { loadBlogPosts, loadLessons } = require('./content-loader');

const SITE = 'https://codeitlearn.com';

/**
 * Single source of truth for the price shown anywhere on the site.
 *
 * NOTE: before this change the site stated three different things — JSON-LD
 * said price "0", /pricing said CA$12/mo, and the /coding-for-kids FAQ said
 * US$12/mo. Currency is a business decision, so this is set to the value that
 * appeared most often (CA$) and centralised here. CONFIRM THIS IS CORRECT and
 * change it in this one place if not.
 */
const PRICING = {
  currency: 'CAD',
  symbol: 'CA$',
  amount: '12',
  period: 'month',
  get label() {
    return `${this.symbol}${this.amount} per ${this.period}`;
  },
};

// Mirrors FAQS in src/pages/SEO/CodingForKids.js so the answers are crawlable.
const FAQS = [
  {
    q: 'What age is CodeIt for?',
    a: 'Parents and legal guardians can create private managed profiles for learners ages 5\u201312 after confirming the adult account email. Independent student accounts are for ages 13\u201318.',
  },
  {
    q: 'Do I need to know how to code to help?',
    a: 'No. The activities use plain-language instructions and visible results. A parent or educator can help by asking what changed, what the learner wants to try next, and how they solved a problem.',
  },
  {
    q: 'What can a learner make?',
    a: 'Learners can create and edit websites, small games, and quizzes in the project studio. They can also follow step-by-step Python lessons or experiment in the browser playground.',
  },
  {
    q: 'Is CodeIt free?',
    a: `CodeIt has useful free activities. A Founding Family plan is being considered at ${PRICING.symbol}${PRICING.amount} per ${PRICING.period}, but no payment starts from an interest button and no paid family subscription is live today.`,
  },
  {
    q: 'Are projects public?',
    a: 'Saved projects are private by default. Eligible independent accounts must choose Publish before a project can appear publicly. Managed profiles ages 5\u201312 cannot publish projects.',
  },
];

const LESSONS = [
  ['hello-python', 'Hello Python', 'print statements and your first working Python program'],
  ['variables', 'Variables', 'storing names, numbers, scores, and other information'],
  ['strings', 'Strings', 'working with text and useful string methods'],
  ['if-statements', 'If Statements', 'making programs choose what happens next'],
  ['simple-repetition', 'Simple Repetition', 'repeating actions with range'],
  ['for-loops', 'For Loops', 'looping through text and collections'],
  ['lists', 'Lists', 'keeping several related values together'],
  ['loops-with-lists', 'Loops with Lists', 'processing every item in a list'],
  ['functions', 'Functions', 'organizing reusable actions and returning results'],
  ['combining-concepts', 'Combining Python Concepts', 'combining functions, loops, decisions, and lists'],
  ['numbers-and-arithmetic', 'Numbers & Arithmetic', 'using integers, decimals, and arithmetic operators'],
  ['booleans-and-comparisons', 'Booleans & Comparisons', 'comparing values and working with True and False'],
  ['logical-operators', 'Logical Operators', 'combining conditions with and, or, and not'],
  ['type-casting', 'Type Casting', 'converting safely between text and number values'],
  ['string-formatting', 'String Formatting', 'building readable messages with modern f-strings'],
  ['string-methods', 'String Methods', 'cleaning, searching, and reshaping text'],
  ['while-loops', 'While Loops', 'repeating until a condition changes, and avoiding endless loops'],
  ['break-and-continue', 'Break & Continue', 'leaving a loop early or skipping a single pass'],
  ['import-and-random', 'Import & Random', 'borrowing ready-made modules and adding dice rolls'],
  ['dictionaries', 'Dictionaries', 'storing and looking data up by name instead of by position'],
  ['looping-dictionaries', 'Looping Through Dictionaries', 'visiting every key and value in turn'],
  ['tuples-and-sets', 'Tuples & Sets', 'values that cannot change, and collections without duplicates'],
  ['slicing', 'Slicing', 'taking part of a list or string, including counting from the end'],
  ['list-comprehensions', 'List Comprehensions', 'building and filtering a whole list in one line'],
  ['return-values', 'Return Values', 'default arguments, several returns, and what None means'],
  ['variable-scope', 'Variable Scope', 'where a variable lives and why it disappears'],
  ['try-and-except', 'Try & Except', 'recovering from errors instead of crashing'],
  ['enumerate-and-zip', 'Enumerate & Zip', 'counting while you loop and walking two lists together'],
  ['classes-and-objects', 'Classes & Objects', 'writing your own type with methods and its own data'],
  ['recursion', 'Recursion', 'functions that call themselves, and the base case that stops them'],
  ['capstone-project', 'Capstone Project', 'combining loops, dictionaries, classes, and error handling into one game'],
];

// The wording above is hand-written rather than generated from the lesson data,
// because it is what Google indexes and these pages have been indexed under
// their current titles for a while.
//
// The cost of hand-writing it is that the list can fall behind the curriculum,
// and a lesson with no static page is a lesson search engines cannot see. So it
// is checked against the real lesson files: add lesson 32 and forget this list,
// and the build stops instead of quietly shipping an invisible lesson.
const lessonDataDir = path.join(__dirname, '..', 'src', 'pages', 'Lessons', 'lessonData');
const lessonFileCount = fs.readdirSync(lessonDataDir).filter(name => /^lesson\d+\.js$/.test(name)).length;
if (LESSONS.length !== lessonFileCount) {
  throw new Error(
    `generate-static-seo: ${LESSONS.length} entries in the LESSONS list above, but `
    + `${lessonFileCount} lessons exist in ${path.relative(process.cwd(), lessonDataDir)}. `
    + 'Every lesson needs a line here or it gets no static page.'
  );
}

const BLOG_POSTS = [
  ['learn-python-for-kids', 'How Kids Can Start Learning Python', 'A practical guide to helping a child begin Python with short, interactive projects.'],
  ['python-coding-games', 'Python Coding Games for Beginners', 'Beginner-friendly Python game ideas that turn new programming concepts into playable projects.'],
  ['how-to-start-coding-for-beginners', 'How to Start Coding as a Beginner', 'A simple route from a first line of code to a complete beginner project.'],
  ['best-coding-games-for-kids', 'Best Coding Games for Kids', 'What to look for in a coding game and how play can reinforce real programming skills.'],
  ['python-basics-for-beginners', 'Python Basics for Beginners', 'The core Python ideas every beginner should understand first.'],
  ['is-python-good-for-kids', 'Is Python Good for Kids?', 'Why Python is approachable for young beginners and what children can build with it.'],
  ['coding-for-kids-beginner-guide', 'Coding for Kids: A Beginner Guide for Parents', 'A parent-friendly guide to ages, tools, learning paths, and realistic first projects.'],
];

const BASE_PAGES = [
  {
    route: '/ai-website-builder-for-kids',
    title: 'AI Website Builder for Kids: Build & Learn the Code | CodeIt',
    description: 'Kids can turn an idea into an editable website, game, or quiz, then inspect and change the HTML, CSS, and JavaScript behind it.',
    eyebrow: 'Creative coding for ages 5–18',
    h1: 'An AI website builder for kids that teaches the code.',
    intro: 'CodeIt helps a young creator turn an idea into a website, game, or quiz, then change the design, inspect the real code, and understand how the project works.',
    detail: 'The first version stays editable. Learners can change the content, colors, layout, and behavior, compare the preview with the HTML, CSS, and JavaScript, save their work, and keep improving it.',
    type: 'SoftwareApplication',
  },
  {
    route: '/builder',
    title: 'AI Website Builder for Kids & Beginners | CodeIt',
    description: 'Describe a website, game, or quiz, build it in the browser, then inspect and edit the HTML, CSS, and JavaScript behind it.',
    eyebrow: 'Project studio',
    h1: 'Build a website. Then learn how it works.',
    intro: 'CodeIt turns an idea into a working browser project, but the finished result is only the beginning. Students can play with it, edit individual elements, inspect the code, save versions, and publish a link.',
    detail: 'Start with a fan page, portfolio, quiz, game, or school project. No setup is required, and the project remains editable instead of becoming a locked AI result.',
    type: 'SoftwareApplication',
  },
  {
    route: '/first-game-challenge',
    title: 'Build Your First Game Free | 10-Minute Coding Challenge | CodeIt',
    description: 'Choose a game idea, build a playable first version, change it, save it, and earn XP. A free coding challenge for young creators ages 5–18.',
    eyebrow: 'Free first-game challenge · Ages 5–18',
    h1: 'Build your first game. Make it yours.',
    intro: 'Choose a reaction game, football penalty game, or pet-catching game. CodeIt creates a playable starting point, then the learner changes it, tests it, and saves it.',
    detail: 'The complete mission is to build, personalize, test, and save. Student accounts earn 25 XP for a first saved project and compete through privacy-safe coder aliases instead of real names.',
    type: 'LearningResource',
  },
  {
    route: '/lessons',
    title: 'Beginner Coding Lessons for Kids | CodeIt',
    description: 'Follow short beginner coding lessons covering Python variables, strings, decisions, loops, lists, and functions.',
    eyebrow: 'Beginner learning path',
    h1: 'Learn one coding idea at a time.',
    intro: 'CodeIt lessons introduce one concept, let students try it immediately, and connect the idea to projects they can build and change.',
    detail: 'The path starts with a first print statement and builds toward variables, strings, if statements, loops, lists, and reusable functions.',
    type: 'LearningResource',
  },
  {
    route: '/journey',
    title: 'Interactive Python Learning Journey for Kids | CodeIt',
    description: 'Move through a structured Python journey with lessons, quizzes, puzzles, XP, and visible progress.',
    eyebrow: 'Structured practice',
    h1: 'A clear next step for every beginner.',
    intro: 'The CodeIt journey combines short explanations with quizzes and hands-on challenges, so students practice instead of only watching.',
    detail: 'Progress, XP, and completed activities make it easy to stop and continue later without losing the learning path.',
    type: 'LearningResource',
  },
  {
    route: '/games',
    title: 'Coding Games & Python Challenges for Kids | CodeIt',
    description: 'Practice beginner Python through interactive coding games, puzzles, scores, and challenges that run in the browser.',
    eyebrow: 'Challenge arcade',
    h1: 'Practice coding through playable challenges.',
    intro: 'Each CodeIt challenge reinforces a real programming idea, including print statements, variables, strings, decisions, and loops.',
    detail: 'Students write or change code, see the result immediately, and earn progress for solving the challenge.',
    type: 'LearningResource',
  },
  {
    route: '/playground',
    title: 'Free Online Python Playground for Beginners | CodeIt',
    description: 'Write and run beginner Python directly in your browser with no download or local setup.',
    eyebrow: 'Python playground',
    h1: 'Run Python in your browser.',
    intro: 'Use the CodeIt playground to test a small idea, change an example, or practice a lesson without installing Python.',
    detail: 'The editor and output stay together, making the connection between code and result easier to understand.',
    type: 'SoftwareApplication',
  },
  {
    route: '/explore',
    title: 'Explore Student Coding Projects | CodeIt',
    description: 'Open public websites, games, and quizzes made with CodeIt, then remix a project into your own version.',
    eyebrow: 'Community projects',
    h1: 'See what other beginners are building.',
    intro: 'Published CodeIt projects are playable in the browser. Students can use them for inspiration and remix a copy without changing the original.',
    detail: 'Every shared project can become a starting point for learning, editing, and making something personal.',
    type: 'CollectionPage',
  },
  {
    route: '/coding-for-kids',
    title: 'Coding for Kids: Projects, Python & Parent Guide | CodeIt',
    description: 'A project-first coding platform for ages 5–18, with private parent-managed profiles for ages 5–12. Build websites, games and quizzes, then learn the code.',
    eyebrow: 'For parents & educators',
    h1: 'A first coding project they’ll want to keep improving.',
    intro: 'CodeIt helps a beginner turn an idea into a website, game, or quiz, then change the design, inspect the code, and understand what makes it work.',
    detail: 'Parents can create private managed profiles for ages 5–12 after confirming the adult account email. Independent student accounts begin at 13. Managed younger profiles cannot publish publicly.',
    type: 'LearningResource',
  },
  {
    route: '/learn-python-for-kids',
    title: 'Free Python for Kids Online | 16 Interactive Lessons | CodeIt',
    description: 'Start learning Python for free with 31 interactive browser lessons, real code, quizzes, and projects. No download or signup is needed to open Lesson 1.',
    eyebrow: 'Beginner Python, in the browser',
    h1: 'Learn Python by making something work.',
    intro: 'Write a line, run it, and see what changed. CodeIt gives beginners a clear path through real Python without downloads or a wall of theory first.',
    detail: 'Parents can create private managed profiles for ages 5–12 after confirming the adult account email. Independent student accounts begin at 13, and the lessons also work for older beginners.',
    type: 'LearningResource',
  },
  {
    route: '/python-games-for-kids',
    title: 'Python Games for Kids | Real Coding Puzzles — CodeIt',
    description: 'Use real Python to solve browser-based games and coding puzzles about variables, loops, decisions, and beginner programming.',
    eyebrow: 'Real Python, playful challenges',
    h1: 'Python games that make every line matter.',
    intro: 'Each short challenge gives a beginner a reason to use loops, variables, or conditions. They type real Python, run it, and see what their code changed.',
    detail: 'CodeIt pairs five current coding puzzles with lessons so each challenge reinforces a specific beginner skill.',
    type: 'LearningResource',
  },
  {
    route: '/blog',
    title: 'Coding Guides for Kids, Parents & Beginners | CodeIt',
    description: 'Read practical guides about learning Python, choosing coding activities, and helping a beginner build confidence.',
    eyebrow: 'CodeIt guides',
    h1: 'Clear coding guidance for beginners and parents.',
    intro: 'The CodeIt blog answers common questions about where to start, what children can build, and how coding games support real learning.',
    detail: 'Use the guides alongside the free lessons and project studio for a practical route from curiosity to a finished project.',
    type: 'CollectionPage',
  },
  {
    route: '/pricing',
    title: 'CodeIt Pricing: Free Coding & Family Pilot',
    description: 'Start coding for free, then request a free CodeIt family pilot spot with guided setup, parent progress, and two learner profiles.',
    eyebrow: 'Free family pilot',
    h1: 'Start free. Join the family pilot when you want more support.',
    intro: 'CodeIt keeps a useful free option for beginners. Families can now request a free pilot spot before paid billing opens.',
    detail: 'The Founding Family pilot offers guided setup, more assisted project building, learner profiles, parent visibility, and a direct feedback channel. No card or subscription starts automatically.',
    type: 'WebPage',
  },
  {
    route: '/privacy',
    title: 'Privacy & Safety | CodeIt',
    description: 'How CodeIt handles account information, learning progress, projects, AI processing, analytics, public sharing, and child safety.',
    eyebrow: 'Privacy & safety',
    h1: 'Clear information about what CodeIt collects—and why.',
    intro: 'CodeIt collects information needed to run accounts, save learning progress, and build projects. It does not sell personal information or run behavioural advertising.',
    sectionTitle: 'Privacy choices and controls',
    detail: 'Saved projects are private until their owner chooses Publish. An unsaved guest project can remain only in that browser for up to seven days and is not uploaded as an account project without an explicit save.',
    primaryLinkLabel: 'Read Privacy & Safety',
    type: 'WebPage',
  },
  {
    route: '/terms',
    title: 'Terms of Use | CodeIt',
    description: 'The rules for using CodeIt lessons, coding tools, AI-assisted projects, accounts, public sharing, and planned paid features.',
    eyebrow: 'Terms of use',
    h1: 'Build freely. Learn responsibly. Keep people safe.',
    intro: 'These terms explain the current rules for using CodeIt accounts, lessons, project tools, AI-assisted results, and public sharing.',
    sectionTitle: 'Using CodeIt responsibly',
    detail: 'Student accounts are for ages 13–18, younger learners need parent-managed access, and public projects must not include private or harmful information.',
    primaryLinkLabel: 'Read the Terms of Use',
    type: 'WebPage',
  },
];

/* ─────────────────────────────────────────────────────────────
   Real content, loaded from the same modules the React app uses.
   This is what makes the pages crawlable: assistants that retrieve
   this site do not execute JavaScript, so anything only rendered by
   React is invisible to them.
───────────────────────────────────────────────────────────── */

const BLOG_CONTENT = loadBlogPosts();
const LESSON_CONTENT = loadLessons();
const BLOG_BY_SLUG = new Map(BLOG_CONTENT.map((post) => [post.slug, post]));

/** Blog post -> [{heading, paragraphs:[string]}] */
function blogSections(post) {
  if (!post || !Array.isArray(post.sections)) return [];
  return post.sections.map((section) => ({
    heading: section.heading,
    paragraphs: Array.isArray(section.body) ? section.body : [section.body].filter(Boolean),
  }));
}

/** Lesson -> [{heading, paragraphs:[string], code:string}] for every step. */
function lessonSections(lesson) {
  if (!lesson || !Array.isArray(lesson.steps)) return [];
  return lesson.steps.map((step, i) => {
    const paragraphs = [];
    if (step.body) paragraphs.push(step.body);
    if (step.description) paragraphs.push(step.description);
    if (step.highlight) paragraphs.push(step.highlight);
    if (step.hint) paragraphs.push(`Hint: ${step.hint}`);
    return {
      heading: step.title || `Step ${i + 1}`,
      paragraphs,
      code: step.code || '',
    };
  });
}

/** Full plain-text body of a page, for schema articleBody / word counts. */
function sectionsToText(sections) {
  return sections
    .flatMap((section) => [section.heading, ...(section.paragraphs || []), section.code || ''])
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function lessonsIndexSections() {
  return [
    {
      heading: 'The full beginner Python path',
      paragraphs: [
        `CodeIt has ${LESSONS.length} sequenced beginner Python lessons. Each one introduces a single idea, gives a runnable example, and ends with a challenge that changes the code.`,
      ],
    },
    ...LESSONS.map(([, title, topic], index) => ({
      heading: `Lesson ${index + 1}: ${title}`,
      paragraphs: [`Covers ${topic}.`],
    })),
  ];
}

function blogIndexSections() {
  return [
    {
      heading: 'All CodeIt guides',
      paragraphs: ['Practical guides for beginners and the adults supporting them.'],
    },
    ...BLOG_CONTENT.map((post) => ({
      heading: post.title,
      paragraphs: [post.description || post.excerpt || ''].filter(Boolean),
    })),
  ];
}

function pricingSections() {
  return [
    {
      heading: 'Free access',
      paragraphs: [
        'CodeIt keeps a useful free option. Beginners can open the project studio, follow the Python lessons, and use the browser playground without paying and without entering a card.',
      ],
    },
    {
      heading: 'Founding Family pilot',
      paragraphs: [
        `The Founding Family plan is being considered at ${PRICING.label}. It is not live today: no card is required, no subscription starts automatically, and paid billing has not opened.`,
        'The pilot includes guided setup, more assisted project building, learner profiles, parent visibility, and a direct feedback channel.',
      ],
    },
    {
      heading: 'Who can have an account',
      paragraphs: [
        'Parents and legal guardians create private managed profiles for learners ages 5–12 after confirming the adult account email. Independent student accounts begin at 13. Managed profiles for ages 5–12 cannot publish projects publicly.',
      ],
    },
  ];
}

/**
 * Body content for the hand-written landing pages.
 *
 * These previously shipped only an h1 + two sentences in the static HTML, so a
 * crawler that does not run JavaScript saw ~450 characters per page. Everything
 * here is factual and matches what the React page actually renders.
 */
const SECTIONS_BY_ROUTE = {
  '/ai-website-builder-for-kids': [
    {
      heading: 'How it works',
      paragraphs: [
        'A learner describes what they want — a fan page, a portfolio, a quiz, a small game — and CodeIt builds a working first version in the browser. Nothing is installed.',
        'That first version is a starting point, not a finished answer. The learner can change the content, colours, layout, and behaviour, compare the live preview with the HTML, CSS, and JavaScript behind it, save versions, and keep improving it.',
      ],
    },
    {
      heading: 'Why the project stays editable',
      paragraphs: [
        'Most AI tools hand back a finished result. The problem for a learner is that the interesting part — finding out why something works, breaking it, and fixing it — never happens.',
        'CodeIt keeps the generated project open. Change one line, run it, and see what moved. That loop is where the understanding comes from.',
      ],
    },
    {
      heading: 'What a learner can see',
      paragraphs: [
        'The preview and the code sit side by side. A learner can select an element on the page and find the code that produced it, which makes real HTML, CSS, and JavaScript approachable well before a text-only course would be.',
      ],
    },
  ],
  '/builder': [
    {
      heading: 'Start from an idea',
      paragraphs: [
        'Describe a website, game, or quiz and CodeIt builds a working browser project. Common starting points are a fan page, a portfolio, a class quiz, a reaction game, or a school project.',
      ],
    },
    {
      heading: 'Then make it yours',
      paragraphs: [
        'Play with the result, edit individual elements, inspect the underlying HTML, CSS, and JavaScript, and save versions as you go. The project remains editable instead of becoming a locked AI result.',
        'Saved projects are private by default. Eligible independent accounts must choose Publish before a project can appear publicly, and managed profiles for ages 5–12 cannot publish projects at all.',
      ],
    },
  ],
  '/first-game-challenge': [
    {
      heading: 'The challenge',
      paragraphs: [
        'Choose a reaction game, a football penalty game, or a pet-catching game. CodeIt creates a playable starting point, and the learner changes it, tests it, and saves it.',
        'The complete mission is four steps: build, personalise, test, and save.',
      ],
    },
    {
      heading: 'What you need',
      paragraphs: [
        'A browser. There is no download, and no card is required to take part. Student accounts earn 25 XP for a first saved project and appear on leaderboards through privacy-safe coder aliases rather than real names.',
      ],
    },
  ],
  '/journey': [
    {
      heading: 'What the journey includes',
      paragraphs: [
        'The journey sequences the sixteen beginner Python lessons with quizzes and puzzle challenges, so every concept is met, practised, and then used before the next one arrives.',
        'A learner always has one clear next step rather than a menu of options, which is the point at which most self-directed beginners stall.',
      ],
    },
    {
      heading: 'A structured path, not a pile of lessons',
      paragraphs: [
        'The journey combines short explanations with quizzes and hands-on challenges, so a learner practises each idea rather than only reading about it.',
        'Progress, XP, and completed activities are saved, so a learner can stop and continue later without losing their place.',
      ],
    },
  ],
  '/games': [
    {
      heading: 'Why practice is separate from lessons',
      paragraphs: [
        'Reading an explanation and being able to use an idea are different things. The challenge arcade exists so a learner meets the same concept again in a situation they have not seen before.',
        'Challenges run in the browser with immediate output, so a wrong answer is information rather than a dead end.',
      ],
    },
    {
      heading: 'Practice that reinforces a specific skill',
      paragraphs: [
        'Each challenge is tied to a real programming idea — print statements, variables, strings, decisions, or loops. Learners write or change code, see the result immediately, and earn progress for solving it.',
        'The challenges pair with the beginner Python lessons, so a learner can move between explanation and practice on the same concept.',
      ],
    },
  ],
  '/playground': [
    {
      heading: 'What the playground is for',
      paragraphs: [
        'The playground is a blank space to test a small idea, change an example from a lesson, or check what a line of Python actually does. It is not a structured course and there is no progress to lose.',
      ],
    },
    {
      heading: 'Run Python without installing anything',
      paragraphs: [
        'The playground runs beginner Python in the browser. There is no download, no environment setup, and no local configuration — the usual place where a beginner gives up before writing a line of code.',
        'The editor and the output stay together on screen, which makes the connection between a change in the code and a change in the result easier to follow.',
      ],
    },
  ],
  '/explore': [
    {
      heading: 'Learning from finished work',
      paragraphs: [
        'Seeing what another beginner built — and being able to open the code behind it — is often more motivating than a lesson brief. Remixing starts a learner from something that already works, which is a lower barrier than an empty page.',
      ],
    },
    {
      heading: 'Projects published by other learners',
      paragraphs: [
        'Published CodeIt projects are playable in the browser. A learner can open one for inspiration and remix a copy into their own version without changing the original.',
        'Only eligible independent accounts can publish. Managed profiles for ages 5–12 cannot publish projects publicly.',
      ],
    },
  ],
  '/learn-python-for-kids': [
    {
      heading: 'What the lesson path covers',
      paragraphs: [
        'Sixteen sequenced lessons take a beginner from a first print statement through variables, strings, if statements, loops, lists, and reusable functions, then on to arithmetic, booleans, logical operators, type casting, string formatting, and string methods.',
        'Each lesson introduces one idea, gives a runnable example, and ends with a challenge that requires changing the code.',
      ],
    },
    {
      heading: 'Who it suits',
      paragraphs: [
        'The lessons work for young beginners and for older beginners meeting Python for the first time. Parents create private managed profiles for ages 5–12 after confirming the adult account email; independent student accounts begin at 13.',
        'Lesson 1 opens without a download. The structured lesson sequence is currently Python only — the project studio is where learners work with HTML, CSS, and JavaScript.',
      ],
    },
  ],
  '/python-games-for-kids': [
    {
      heading: 'What makes a coding game useful',
      paragraphs: [
        'A coding game only teaches if the code is doing the work. Games where the programming is decoration produce enthusiasm without transfer.',
        'In these challenges the learner writes or edits Python and the game responds to what they wrote, so solving it requires understanding the concept rather than guessing.',
      ],
    },
    {
      heading: 'Real Python, not a simulation of it',
      paragraphs: [
        'Each short challenge gives a beginner a reason to use a loop, a variable, or a condition. They type real Python, run it, and see exactly what their code changed.',
        'The current set of coding puzzles is paired with the lessons, so each challenge reinforces a specific beginner skill rather than testing something the learner has not met yet.',
      ],
    },
  ],
  '/privacy': [
    {
      heading: 'What CodeIt collects',
      paragraphs: [
        'CodeIt collects the information needed to run accounts, save learning progress, and build projects. It does not sell personal information and does not run behavioural advertising.',
      ],
    },
    {
      heading: 'Projects and publishing',
      paragraphs: [
        'Saved projects are private until their owner chooses Publish. An unsaved guest project can remain only in that browser for up to seven days and is not uploaded as an account project without an explicit save.',
        'Managed profiles for ages 5–12 cannot publish projects publicly. Leaderboards use coder aliases rather than real names.',
      ],
    },
  ],
  '/terms': [
    {
      heading: 'Accounts and ages',
      paragraphs: [
        'Independent student accounts are for ages 13–18. Younger learners aged 5–12 need parent-managed access, created after the adult account email is confirmed.',
      ],
    },
    {
      heading: 'Sharing responsibly',
      paragraphs: [
        'Public projects must not include private or harmful information. AI-assisted results are a starting point that the learner is expected to review and change.',
        'Saved projects stay private until their owner chooses Publish, and managed profiles for ages 5–12 cannot publish at all.',
      ],
    },
    {
      heading: 'Paid features',
      paragraphs: [
        'Paid billing is not currently active. No card is required to use CodeIt today, and no subscription starts automatically from an interest button. Any future paid plan will be introduced with clear notice before it applies.',
      ],
    },
  ],
};

// The homepage is generated last, from the untouched template, because every
// other route uses build/index.html as its shell.
const HOME_PAGE = {
  route: '/',
  title: 'Coding for Kids: Build Websites & Learn the Code | CodeIt',
  description:
    'CodeIt is a browser-based coding platform for ages 5–18. Build websites, games and quizzes, then inspect and edit the real HTML, CSS and JavaScript behind them.',
  eyebrow: 'Creative coding for ages 5–18',
  h1: 'Make a website. Learn the code behind it.',
  intro:
    'CodeIt helps kids and beginner coders create websites, games, and quizzes, inspect the code behind them, and keep improving every project.',
  detail:
    'Students ages 5–18 can build, edit, save, and learn from real browser projects. Parents can create private managed learner profiles for children ages 5–12 and receive progress updates.',
  type: 'SoftwareApplication',
  faqs: FAQS,
  sections: [
    {
      heading: 'What CodeIt is',
      paragraphs: [
        'CodeIt is a creative coding studio that runs in the browser. A learner describes a website, game, or quiz; CodeIt builds a working first version; and then the learner changes it.',
        'The first version stays editable instead of becoming a locked result. Learners can change the content, colours, layout, and behaviour, compare the preview with the HTML, CSS, and JavaScript, save their work, and keep improving it.',
      ],
    },
    {
      heading: 'How the learning loop works',
      paragraphs: [
        'Make something, see the code, change the code, save the project, and share what was built. Seeing the effect of a single change is what turns a finished project into something a beginner actually understands.',
      ],
    },
    {
      heading: 'Who it is for',
      paragraphs: [
        'Learners ages 5–18. Parents and legal guardians create private managed profiles for ages 5–12 after confirming the adult account email. Independent student accounts begin at 13. Managed profiles for ages 5–12 cannot publish projects publicly.',
        'CodeIt suits a beginner who has outgrown block-based tools such as Scratch and wants to work with real HTML, CSS, and JavaScript. It is not a schools product: there is no rostering, LMS integration, or teacher dashboard.',
      ],
    },
    {
      heading: 'What it costs',
      paragraphs: [
        `CodeIt has useful free activities and no card is required to start. A Founding Family plan is being considered at ${PRICING.label}; paid billing is not currently active.`,
      ],
    },
    {
      heading: 'Beginner Python lessons',
      paragraphs: [
        `Alongside the project studio, CodeIt has ${LESSONS.length} sequenced beginner Python lessons covering ${LESSONS.slice(0, 6)
          .map(([, title]) => title.toLowerCase())
          .join(', ')}, and more. The structured lesson sequence is currently Python only.`,
      ],
    },
  ],
};

const PAGES = [
  ...BASE_PAGES.map((page) => {
    if (page.route === '/coding-for-kids') return { ...page, faqs: FAQS, sections: SECTIONS_BY_ROUTE[page.route] };
    if (SECTIONS_BY_ROUTE[page.route]) return { ...page, sections: SECTIONS_BY_ROUTE[page.route] };
    if (page.route === '/pricing') return { ...page, sections: pricingSections() };
    if (page.route === '/lessons') return { ...page, sections: lessonsIndexSections() };
    if (page.route === '/blog') return { ...page, sections: blogIndexSections() };
    return page;
  }),

  ...LESSONS.map(([slug, title, topic], index) => {
    const number = index + 1;
    const lesson = LESSON_CONTENT.get(number);
    const sections = lessonSections(lesson);
    return {
      route: `/lesson/${number}`,
      // Use the lesson's own title so the static <title>/<h1> match what the
      // React app renders. These previously disagreed on every lesson page.
      title: `Python Lesson ${number}: ${lesson?.title || title} for Beginners | CodeIt`,
      description: `Interactive beginner Python lesson about ${topic}. Write and run code directly in your browser.`,
      eyebrow: `Python lesson ${number}`,
      h1: lesson?.title || title,
      intro:
        lesson?.subtitle ||
        `This beginner lesson teaches ${topic}. The explanation, example, and practice activity stay together so students can see what each change does.`,
      detail: 'Run the example, change one part, and use the result to check your understanding before moving to the next lesson.',
      type: 'LearningResource',
      slug,
      lessonNumber: number,
      sections,
      breadcrumbs: [
        ['/', 'Home'],
        ['/lessons', 'Lessons'],
        [`/lesson/${number}`, lesson?.title || title],
      ],
    };
  }),

  ...BLOG_POSTS.map(([slug, fallbackTitle, fallbackDescription]) => {
    const post = BLOG_BY_SLUG.get(slug);
    const sections = blogSections(post);
    // Use the post's own title so static and rendered <title> agree.
    const title = post?.title || fallbackTitle;
    return {
      route: `/blog/${slug}`,
      title: `${title} | CodeIt Blog`,
      description: post?.description || fallbackDescription,
      eyebrow: 'CodeIt guide',
      h1: title,
      intro: post?.excerpt || post?.description || fallbackDescription,
      detail: 'This guide is written for beginners and the adults supporting them, with practical next steps that connect to interactive CodeIt lessons and projects.',
      type: 'BlogPosting',
      slug,
      sections,
      datePublished: post?.date,
      breadcrumbs: [
        ['/', 'Home'],
        ['/blog', 'Blog'],
        [`/blog/${slug}`, title],
      ],
    };
  }),
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Escape, then keep authored line breaks visible in HTML. */
function paragraphHtml(text) {
  return escapeHtml(text).replaceAll('\n', '<br />');
}

function replaceMeta(html, page) {
  const canonical = `${SITE}${page.route}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${description}" />`)
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}" />`);
}

function sectionsHtml(sections) {
  if (!sections || sections.length === 0) return '';
  return sections
    .map((section) => {
      const parts = [`<h2>${escapeHtml(section.heading)}</h2>`];
      for (const paragraph of section.paragraphs || []) {
        if (!paragraph) continue;
        parts.push(`<p>${paragraphHtml(paragraph)}</p>`);
      }
      if (section.code) {
        parts.push(`<pre><code>${escapeHtml(section.code)}</code></pre>`);
      }
      return parts.join('\n      ');
    })
    .join('\n      ');
}

function faqHtml(faqs) {
  if (!faqs || faqs.length === 0) return '';
  const items = faqs
    .map(
      ({ q, a }) => `<h3>${escapeHtml(q)}</h3>
        <p>${paragraphHtml(a)}</p>`
    )
    .join('\n        ');
  return `<section aria-labelledby="static-faq-heading">
        <h2 id="static-faq-heading">Questions parents ask first</h2>
        ${items}
      </section>`;
}

function breadcrumbHtml(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) return '';
  const crumbs = breadcrumbs
    .map(([route, label], i) =>
      i === breadcrumbs.length - 1
        ? `<span aria-current="page">${escapeHtml(label)}</span>`
        : `<a href="${escapeHtml(route)}">${escapeHtml(label)}</a>`
    )
    .join(' / ');
  return `<nav aria-label="Breadcrumb">${crumbs}</nav>`;
}

function staticContent(page) {
  const relatedLinks = [
    ['/coding-for-kids', 'Coding for kids: parent guide'],
    ['/ai-website-builder-for-kids', 'How project building works'],
    ['/pricing', 'Free access and family pilot'],
    ['/blog', 'Coding guides'],
  ]
    .filter(([route]) => route !== page.route)
    .map(([route, label]) => `<a href="${route}">${label}</a>`)
    .join('\n        ');

  const dateLine = page.datePublished
    ? `<p><time datetime="${escapeHtml(page.datePublished)}">Published ${escapeHtml(page.datePublished)}</time></p>`
    : '';

  return `<main class="static-home-shell static-route-shell" data-static-route="${escapeHtml(page.route)}">
    <div class="static-home-shell__inner">
      ${breadcrumbHtml(page.breadcrumbs)}
      <p class="static-route-kicker">${escapeHtml(page.eyebrow)}</p>
      <h1>${escapeHtml(page.h1)}</h1>
      ${dateLine}
      <p>${paragraphHtml(page.intro)}</p>
      ${sectionsHtml(page.sections)}
      ${faqHtml(page.faqs)}
      <h2>${escapeHtml(page.sectionTitle || 'What you can do on CodeIt')}</h2>
      <p>${paragraphHtml(page.detail)}</p>
      <nav aria-label="Continue on CodeIt">
        <a href="${escapeHtml(page.route)}">${escapeHtml(page.primaryLinkLabel || 'Open this page')}</a>
        <a href="/builder">Build a project</a>
        <a href="/lessons">Browse lessons</a>
        ${relatedLinks}
      </nav>
    </div>
  </main>`;
}

function pageSchema(page) {
  const graph = [];
  const url = `${SITE}${page.route}`;
  const bodyText = sectionsToText(page.sections || []);

  const primary = {
    '@context': 'https://schema.org',
    '@type': page.type,
    name: page.h1,
    description: page.description,
    url,
    isPartOf: { '@id': `${SITE}/#website` },
    publisher: { '@id': `${SITE}/#organization` },
  };

  if (page.type === 'LearningResource') {
    primary.educationalLevel = 'Beginner';
    primary.audience = { '@type': 'EducationalAudience', audienceType: 'Kids and beginner coders' };
    primary.provider = { '@id': `${SITE}/#organization` };
    if (page.lessonNumber) {
      primary.learningResourceType = 'Lesson';
      primary.position = page.lessonNumber;
      primary.teaches = page.h1;
      primary.isPartOf = { '@id': `${SITE}/lessons#course` };
    }
  }

  if (page.type === 'SoftwareApplication') {
    primary.applicationCategory = 'EducationalApplication';
    primary.operatingSystem = 'Web';
    primary.isAccessibleForFree = true;
  }

  // Articles previously carried no headline, author or datePublished at all.
  if (page.type === 'BlogPosting') {
    primary.headline = page.h1;
    primary.author = { '@id': `${SITE}/#organization` };
    primary.mainEntityOfPage = { '@type': 'WebPage', '@id': url };
    if (page.datePublished) {
      primary.datePublished = page.datePublished;
      primary.dateModified = page.datePublished;
    }
    if (bodyText) primary.articleBody = bodyText;
    if (page.sections?.length) primary.wordCount = bodyText.split(/\s+/).length;
  }

  graph.push(primary);

  // The 16-lesson sequence is a Course. `LearningResource` alone does not
  // express the sequence, and Course is what most extraction pipelines key on.
  if (page.route === '/lessons') {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'Course',
      '@id': `${SITE}/lessons#course`,
      name: 'Beginner Python for Kids',
      description: `A sequence of ${LESSONS.length} interactive beginner Python lessons that run in the browser.`,
      url: `${SITE}/lessons`,
      provider: { '@id': `${SITE}/#organization` },
      educationalLevel: 'Beginner',
      inLanguage: 'en',
      isAccessibleForFree: true,
      numberOfCredits: LESSONS.length,
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: 'PT30M',
      },
      hasPart: LESSONS.map(([, title], index) => ({
        '@type': 'LearningResource',
        position: index + 1,
        name: title,
        url: `${SITE}/lesson/${index + 1}`,
      })),
    });
  }

  // FAQPage was absent sitewide despite a real, visible FAQ.
  if (page.faqs?.length) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: page.faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }

  if (page.breadcrumbs?.length) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: page.breadcrumbs.map(([route, label], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: label,
        item: `${SITE}${route}`,
      })),
    });
  }

  return JSON.stringify(graph.length === 1 ? graph[0] : graph);
}

function renderRouteDocument(template, page) {
  let html = replaceMeta(template, page);
  const content = staticContent(page);
  html = html.replace(/<div id="root">[\s\S]*?<\/body>/i, `<div id="root">${content}</div>\n  </body>`);
  const routeStyle = `<style id="static-route-style">
    .static-route-shell h2{margin:2rem 0 .5rem;font:700 1.35rem Arvo,Georgia,serif;color:#38291f}
    .static-route-shell h3{margin:1.25rem 0 .35rem;font:700 1.05rem Arvo,Georgia,serif;color:#38291f}
    .static-route-shell pre{overflow-x:auto;padding:.75rem 1rem;border-radius:8px;background:#f4efe9}
    .static-route-kicker{margin:0 0 .75rem!important;color:#c95f16;font-size:.78rem!important;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
  </style>`;
  const schema = `<script id="static-route-jsonld" type="application/ld+json">${pageSchema(page)}</script>`;
  return html.replace('</head>', `${routeStyle}\n    ${schema}\n  </head>`);
}

function generate(buildDir = path.resolve(__dirname, '../build')) {
  const templatePath = path.join(buildDir, 'index.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  let totalBodyChars = 0;
  for (const page of PAGES) {
    const outputDir = path.join(buildDir, page.route.replace(/^\//, ''));
    fs.mkdirSync(outputDir, { recursive: true });
    const document = renderRouteDocument(template, page);
    fs.writeFileSync(path.join(outputDir, 'index.html'), document);
    totalBodyChars += staticContent(page).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
  }

  // Homepage last: it overwrites the template file itself.
  fs.writeFileSync(templatePath, renderRouteDocument(template, HOME_PAGE));
  totalBodyChars += staticContent(HOME_PAGE).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;

  const average = Math.round(totalBodyChars / (PAGES.length + 1));
  console.log(
    `Generated ${PAGES.length + 1} route-specific search documents ` +
      `(average ${average} characters of crawlable body text per page).`
  );

  // Guardrail: the whole point of this script is that assistants which do not
  // run JavaScript can still read the page. If that regresses, fail the build.
  const MIN_AVERAGE_BODY_CHARS = 1200;
  if (average < MIN_AVERAGE_BODY_CHARS) {
    throw new Error(
      `Static SEO output averages only ${average} characters of body text per page ` +
        `(minimum ${MIN_AVERAGE_BODY_CHARS}). Content is probably not being inlined.`
    );
  }
}

if (require.main === module) generate();

module.exports = { PAGES, HOME_PAGE, PRICING, FAQS, generate, renderRouteDocument, pageSchema };
