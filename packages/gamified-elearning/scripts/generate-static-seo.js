'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');

const {
  loadPageMeta,
  loadPricing,
  loadBlogPosts,
  loadLessons,
  loadGuidePages,
  loadMarkdownRenderer,
  loadFaqs,
  loadCompany,
  loadPressFacts,
} = require('./content-loader');

const SITE = 'https://codeitlearn.com';

// Deterministic build output: derived from the commit, not from the clock, so
// two builds of the same commit produce byte-identical files.
//
// This was a hand-typed date, and it went stale the day after it was typed: the
// site changed substantially on 26 August and every URL in the sitemap still
// announced the 25th. A constant only a person can update is a constant that
// stops being true, which is the same failure as the hand-maintained sitemap
// this file replaced and the lesson count that said 16.
//
// The commit date has both properties: fixed for a given commit, and it moves on
// its own. The pinned date remains only as a fallback for a build with no git,
// where a slightly old date beats no sitemap.
const PINNED_LAST_MODIFIED = '2026-08-25';

function commitDate() {
  try {
    const iso = require('node:child_process')
      .execFileSync('git', ['log', '-1', '--format=%cs'], {
        cwd: __dirname,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      .trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : PINNED_LAST_MODIFIED;
  } catch {
    return PINNED_LAST_MODIFIED;
  }
}

const LAST_MODIFIED = commitDate();

// Why the commit date is not enough on its own.
//
// Vercel does not build from a git clone. It unpacks a source archive, so
// `git log` throws there and commitDate() returns the pinned fallback on every
// production build. The sitemap that has been live since 25 August announces
// 2026-08-25 on all 69 URLs, and would have announced it forever, through any
// number of deploys. The pin was written as a fallback for a case that does not
// happen locally and happens on every real build.
//
// So the date a URL announces is now derived from that URL's own content. A
// checked-in manifest holds, per route, a fingerprint of the page's title,
// description and crawlable body, and the date that fingerprint was first seen.
// A page whose content is unchanged keeps its stored date no matter how many
// times the site is deployed. A page whose content changed announces today.
// That is what lastmod is defined to mean, and it needs no git.
// Overridable so a test can point at a manifest it controls and watch what a
// wrong fingerprint actually does, rather than asserting that the code reads
// the way it is supposed to behave.
const CONTENT_DATES_PATH =
  process.env.CODEIT_CONTENT_DATES || path.resolve(__dirname, '../src/data/contentDates.json');

function readContentDates() {
  try {
    const parsed = JSON.parse(fs.readFileSync(CONTENT_DATES_PATH, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const CONTENT_DATES = readContentDates();
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// ── Whose price is this? ─────────────────────────────────────────────────────
//
// Four separate guards assumed that every CA$ or US$ amount anywhere on the
// site was ours. That was true while the site had no comparison pages, and
// comparison pages are the format that outranks us — the roundups that own
// "best coding platform for kids" are all comparisons. The first one written
// broke all four guards by quoting CodeMonkey's US$12 family plan, which is a
// different twelve dollars from ours.
//
// Relaxing the guards to allow US$ would have been the wrong repair: it would
// let our own price ship in the wrong currency on exactly the pages a parent
// reads when deciding. So a page instead declares, out loud, which prices
// belong to somebody else. Everything not declared and not ours is a bug.
//
// The declaration is checked in both directions — a declared price that no
// longer appears on the page fails too — so the list cannot quietly become a
// blanket exemption for a page nobody rereads.
const PRICE_IN_TEXT = /(?:CA|US)\$\s?\d+(?:\.\d+)?/g;

function normalisePrice(text) {
  return String(text).replace(/\s+/g, '');
}

function ourPrice() {
  return normalisePrice(`${PRICING.CURRENCY_SYMBOL}${PRICING.AMOUNT}`);
}

/** Every currency-prefixed amount in some text, normalised. */
function statedPrices(text) {
  return (String(text || '').match(PRICE_IN_TEXT) || []).map(normalisePrice);
}

/** The prices a page says belong to someone else. */
function declaredPrices(page) {
  return (Array.isArray(page && page.quotedPrices) ? page.quotedPrices : []).map(normalisePrice);
}

/** Prices on a page that are neither ours nor declared as someone else's. */
function unaccountedPrices(page, text) {
  const declared = new Set(declaredPrices(page));
  const mine = ourPrice();
  return statedPrices(text).filter((price) => price !== mine && !declared.has(price));
}

// Hash the meaning of the page, not the file. The rendered document carries
// hashed asset filenames and shared boilerplate that change on builds where no
// page changed at all; hashing those would mark all 69 URLs modified on every
// deploy, which is the same no-information sitemap in the other direction.
function contentFingerprint(page) {
  const body = staticContent(page)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto
    .createHash('sha1')
    .update([page.title || '', page.description || '', body].join('\u0000'))
    .digest('hex')
    .slice(0, 16);
}

// Built once, keyed by route, so that only real pages consult the manifest.
let CONTENT_DATE_BY_ROUTE = null;

function contentDateByRoute() {
  if (CONTENT_DATE_BY_ROUTE) return CONTENT_DATE_BY_ROUTE;
  CONTENT_DATE_BY_ROUTE = new Map();
  for (const page of [HOME_PAGE, ...PAGES]) {
    const route = page.route || '/';
    const hash = contentFingerprint(page);
    const stored = CONTENT_DATES[route];
    const unchanged =
      stored && stored.hash === hash && /^\d{4}-\d{2}-\d{2}$/.test(stored.date || '');
    CONTENT_DATE_BY_ROUTE.set(route, { hash, date: unchanged ? stored.date : BUILD_DATE });
  }
  return CONTENT_DATE_BY_ROUTE;
}

// Refresh the checked-in manifest so the next build has today's fingerprints to
// compare against. On Vercel the working tree is discarded, and that is fine:
// an out-of-date manifest still gives every unchanged page its true stored date
// and every changed page the deploy date. It is only wrong if it is missing.
function writeContentDates() {
  const next = {};
  for (const route of [...contentDateByRoute().keys()].sort()) {
    const { hash, date } = contentDateByRoute().get(route);
    next[route] = { hash, date };
  }
  try {
    fs.writeFileSync(CONTENT_DATES_PATH, `${JSON.stringify(next, null, 2)}\n`);
  } catch {
    // Read-only filesystem on the build host. Nothing to do and nothing broken.
  }
  return next;
}

// Price and free-plan limits come from src/config/pricing.js — the same file
// the pricing page reads. This script used to keep its own copy, which is how
// the site ended up stating the price four different ways.
const PRICING = loadPricing();

// One source of truth, shared with the /faq page and the parent guide.
const FAQS = loadFaqs();
const COMPANY = loadCompany();

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
    eyebrow: 'Creative coding for ages 5–18',
    h1: 'An AI website builder for kids that teaches the code.',
    intro: 'CodeIt helps a young creator turn an idea into a website, game, or quiz, then change the design, inspect the real code, and understand how the project works.',
    detail: 'The first version stays editable. Learners can change the content, colors, layout, and behavior, compare the preview with the HTML, CSS, and JavaScript, save their work, and keep improving it.',
    type: 'SoftwareApplication',
  },
  {
    route: '/builder',
    eyebrow: 'Project studio',
    h1: 'Build a website. Then learn how it works.',
    intro: 'CodeIt turns an idea into a working browser project, but the finished result is only the beginning. Students can play with it, edit individual elements, inspect the code, save versions, and publish a link.',
    detail: 'Start with a fan page, portfolio, quiz, game, or school project. No setup is required, and the project remains editable instead of becoming a locked AI result.',
    type: 'SoftwareApplication',
  },
  {
    route: '/first-game-challenge',
    eyebrow: 'Free first-game challenge · Ages 5–18',
    h1: 'Build your first game. Make it yours.',
    intro: 'Choose a reaction game, football penalty game, or pet-catching game. CodeIt creates a playable starting point, then the learner changes it, tests it, and saves it.',
    detail: 'The complete mission is to build, personalize, test, and save. Student accounts earn 25 XP for a first saved project and compete through privacy-safe coder aliases instead of real names.',
    type: 'LearningResource',
  },
  {
    route: '/lessons',
    eyebrow: 'Beginner learning path',
    h1: 'Learn one coding idea at a time.',
    intro: 'CodeIt lessons introduce one concept, let students try it immediately, and connect the idea to projects they can build and change.',
    detail: 'The path starts with a first print statement and builds toward variables, strings, if statements, loops, lists, and reusable functions.',
    type: 'LearningResource',
  },
  {
    route: '/journey',
    eyebrow: 'Structured practice',
    h1: 'A clear next step for every beginner.',
    intro: 'The CodeIt journey combines short explanations with quizzes and hands-on challenges, so students practice instead of only watching.',
    detail: 'Progress, XP, and completed activities make it easy to stop and continue later without losing the learning path.',
    type: 'LearningResource',
  },
  {
    route: '/games',
    eyebrow: 'Challenge arcade',
    h1: 'Practice coding through playable challenges.',
    intro: 'Each CodeIt challenge reinforces a real programming idea, including print statements, variables, strings, decisions, and loops.',
    detail: 'Students write or change code, see the result immediately, and earn progress for solving the challenge.',
    type: 'LearningResource',
  },
  {
    route: '/playground',
    eyebrow: 'Python playground',
    h1: 'Run Python in your browser.',
    intro: 'Use the CodeIt playground to test a small idea, change an example, or practice a lesson without installing Python.',
    detail: 'The editor and output stay together, making the connection between code and result easier to understand.',
    type: 'SoftwareApplication',
  },
  {
    route: '/explore',
    eyebrow: 'Community projects',
    h1: 'See what other beginners are building.',
    intro: 'Published CodeIt projects are playable in the browser. Students can use them for inspiration and remix a copy without changing the original.',
    detail: 'Every shared project can become a starting point for learning, editing, and making something personal.',
    type: 'CollectionPage',
  },
  {
    route: '/coding-for-kids',
    eyebrow: 'For parents & educators',
    h1: 'A first coding project they’ll want to keep improving.',
    intro: 'CodeIt helps a beginner turn an idea into a website, game, or quiz, then change the design, inspect the code, and understand what makes it work.',
    detail: 'Parents can create private managed profiles for ages 5–12 after confirming the adult account email. Independent student accounts begin at 13. Managed younger profiles cannot publish publicly.',
    type: 'LearningResource',
  },
  {
    route: '/learn-python-for-kids',
    eyebrow: 'Beginner Python, in the browser',
    h1: 'Learn Python by making something work.',
    intro: 'Write a line, run it, and see what changed. CodeIt gives beginners a clear path through real Python without downloads or a wall of theory first.',
    detail: 'Parents can create private managed profiles for ages 5–12 after confirming the adult account email. Independent student accounts begin at 13, and the lessons also work for older beginners.',
    type: 'LearningResource',
  },
  {
    route: '/python-games-for-kids',
    eyebrow: 'Real Python, playful challenges',
    h1: 'Python games that make every line matter.',
    intro: 'Each short challenge gives a beginner a reason to use loops, variables, or conditions. They type real Python, run it, and see what their code changed.',
    detail: 'CodeIt pairs five current coding puzzles with lessons so each challenge reinforces a specific beginner skill.',
    type: 'LearningResource',
  },
  {
    route: '/blog',
    eyebrow: 'CodeIt guides',
    h1: 'Clear coding guidance for beginners and parents.',
    intro: 'The CodeIt blog answers common questions about where to start, what children can build, and how coding games support real learning.',
    detail: 'Use the guides alongside the free lessons and project studio for a practical route from curiosity to a finished project.',
    type: 'CollectionPage',
  },
  {
    route: '/pricing',
    eyebrow: 'Free family pilot',
    h1: 'Start free. Join the family pilot when you want more support.',
    intro: 'CodeIt keeps a useful free option for beginners, and a paid family plan for households that want more.',
    detail: 'The family plan adds guided setup, more assisted project building, learner profiles, parent visibility, and a direct feedback channel. Nothing starts charging on its own.',
    type: 'WebPage',
  },
  {
    route: '/privacy',
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

const GUIDE_CONTENT = loadGuidePages();
const PRESS_FACTS = loadPressFacts();

/**
 * The questions a guide already answers, as Q&A pairs.
 *
 * FAQPage existed here and only /faq ever populated it. Meanwhile eight guides
 * carry forty hand-written questions under a "Common questions" heading — real
 * questions with real answers, visible on the page, and invisible to anything
 * that reads structure rather than prose. Assistants pull question-and-answer
 * pairs in preference to paragraphs, and these are exactly the questions the
 * guides were written to be found for.
 *
 * Deliberately narrow, because FAQ schema that does not match what a reader
 * sees is a manual action rather than a rich result:
 *
 *   * only inside a section whose heading is about questions, which is why the
 *     six-point checklist in ai-builder-you-can-edit — bold, ends in a question
 *     mark, and not a FAQ — is not collected;
 *   * only when a real answer is present, either after the question on the same
 *     line or in the paragraph below it;
 *   * links and emphasis are flattened to text, because the schema field is
 *     text and shipping raw Markdown into it would be gibberish to a reader.
 */
const QUESTION_SECTION = /questions/i;
const BOLD_QUESTION = /^\*\*\s*(?:\d+\.\s*)?(.+?\?)\s*\*\*\s*(.*)$/;

function plainText(markdown) {
  return String(markdown)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function guideFaqs(markdown) {
  const lines = String(markdown || '').split('\n');
  const faqs = [];
  let inQuestions = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (/^## /.test(line)) {
      inQuestions = QUESTION_SECTION.test(line.slice(3));
      continue;
    }
    if (!inQuestions) continue;

    const match = BOLD_QUESTION.exec(line);
    if (!match) continue;

    const question = plainText(match[1]);
    let answer = plainText(match[2]);

    // Answer on the line below, which is how half of them are written.
    for (let j = i + 1; !answer && j < lines.length; j += 1) {
      const next = lines[j].trim();
      if (!next) continue;
      if (/^#{1,6} /.test(next) || BOLD_QUESTION.test(next)) break;
      answer = plainText(next);
    }

    // A question with no answer is worse than no schema at all.
    if (question.length > 5 && answer.length >= 20) faqs.push({ q: question, a: answer });
  }

  return faqs;
}
const renderMarkdown = loadMarkdownRenderer();
const BLOG_CONTENT = loadBlogPosts();
const LESSON_CONTENT = loadLessons();

// Counted, never typed. A page that states "31 lessons" is stating a fact about
// the curriculum, and the curriculum is the only thing that should be able to
// change it. This site has already shipped a title advertising 16 lessons
// against 31, in the same breath as a description saying 31.
const LESSON_COUNT = LESSON_CONTENT.size;
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
function bodyTextOf(page) {
  if (page.bodyHtml) {
    return page.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return sectionsToText(page.sections || []);
}

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
        `CodeIt keeps a useful free option. Beginners can open the project studio, follow the Python lessons, and use the browser playground without paying and without entering a card. The free plan includes ${PRICING.FREE_MONTHLY_AI_BUILDS} assisted project builds each month.`,
      ],
    },
    {
      heading: `The paid family plan: ${PRICING.PRICE_PER_INTERVAL}`,
      paragraphs: [
        `The family plan costs ${PRICING.PRICE_PER_INTERVAL} in ${PRICING.CURRENCY} and can be cancelled at any time. Tax is shown before card details are entered.`,
        'It adds guided setup, more assisted project building, learner profiles, parent visibility, and a direct feedback channel.',
        'The free plan does not expire and no card is needed to use it. Nothing starts charging on its own — a subscription begins only when someone chooses to start one.',
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
const IDENTITY_PAGES = [
  {
    // A page for people who might write about CodeIt.
    //
    // The binding constraint on being named by an assistant is that nothing off
    // this domain mentions the product. Journalists, directory editors and
    // people writing roundups cite what is easy to cite: one page with the
    // facts, the spelling, the founder, and an honest statement of what the
    // thing does not do.
    //
    // The content is in src/data/pressFacts.js so the React route at /press and
    // this crawlable copy render the same words. It shipped here first with no
    // React route at all, which meant a crawler could read the page and a person
    // arriving from a search result was redirected to the homepage by the
    // catch-all in App.js. Every figure is passed in from config rather than
    // typed, so the page other people quote cannot go stale.
    route: '/press',
    type: 'AboutPage',
    ...PRESS_FACTS({
      locationLine: COMPANY.locationLine(),
      founderName: COMPANY.founderName,
      contactEmail: COMPANY.contactEmail,
      url: COMPANY.url,
      primaryAlternateName: COMPANY.alternateNames[0],
      sameAs: COMPANY.sameAs,
      pricePerInterval: PRICING.PRICE_PER_INTERVAL,
      freeMonthlyAiBuilds: PRICING.FREE_MONTHLY_AI_BUILDS,
      lessonCount: LESSON_COUNT,
    }),
  },
  {
    route: '/about',
    eyebrow: 'About',
    h1: 'About CodeIt',
    intro: `CodeIt is a browser-based coding studio for learners aged 5 to 18, built in ${COMPANY.locationLine()}${COMPANY.founderName ? ` by ${COMPANY.founderName}` : ''}. A learner describes a website, game or quiz; CodeIt builds a working first version; and then the learner opens it up and changes it.`,
    detail: 'The project stays editable rather than becoming a finished result you can only look at.',
    type: 'AboutPage',
    sections: [
      {
        heading: 'Why it exists',
        paragraphs: [
          'Most tools for young coders are block-based, and blocks are a good on-ramp — Scratch in particular has taught an enormous number of children to think in loops and conditionals. The gap is on the other side of it.',
          'A ten-year-old who has outgrown blocks is stuck. Block tools keep the real code hidden for good, and text editors ask a child to type code before they have made anything worth caring about. Codecademy\u2019s terms of service require users to be sixteen. freeCodeCamp is free and excellent but was not designed for children. The platforms built for kids are, with few exceptions, blocks-first by design. CodeIt exists for that gap.',
        ],
      },
      {
        heading: 'How it works',
        paragraphs: [
          'The loop is: make something, play it, change it, see what it is made of, and publish it. Starting from a working project rather than an empty file means a beginner has something to be curious about on day one, and seeing the effect of a single change is where the understanding comes from. The typing was never the hard part.',
          'CodeIt also asks questions drawn from the learner\u2019s own project, where the correct answer is whatever they actually wrote. Only questions answered correctly first time count. That is there so a parent can see what a child could explain, not only what got produced.',
        ],
      },
      {
        heading: 'Who it is for, and who it is not for',
        paragraphs: [
          'It suits a learner roughly between 8 and 16 who has outgrown block coding, or a beginner of any age who wants to build web projects and understand what they are made of. It also suits a parent who cannot code, because the activities use plain language and visible results.',
          'It is not right for a pre-reading child — Kodable and codeSpark are built for that and are better at it. It is not right for a learner who mainly wants to keep making games, where CodeCombat or Roblox Studio fit better. And it is not a schools product: there is no rostering, no LMS integration, no standards alignment and no teacher dashboard.',
        ],
      },
      {
        heading: 'Accounts, ages and safety',
        paragraphs: [
          'Parents and legal guardians create private managed profiles for learners aged 5 to 12, after confirming the adult account email address. Independent student accounts begin at 13.',
          'Saved projects are private by default, and eligible independent accounts must actively choose Publish before a project appears publicly. Managed profiles for ages 5 to 12 cannot publish projects at all. Leaderboards use coder aliases rather than real names.',
        ],
      },
      {
        heading: 'What it costs',
        paragraphs: [
          `CodeIt has a free plan that does not expire and needs no card. A paid family plan is available at ${PRICING.PRICE_PER_INTERVAL}, cancellable at any time, and nothing starts charging on its own. We are not going to promise the free plan will always be as generous as it is now, because we do not know that.`,
        ],
      },
      {
        heading: 'Not to be confused with',
        paragraphs: [
          'CodeIt at codeitlearn.com is unrelated to CodeIT at codeitlearning.com (a coding tutoring company in London), MIT CodeIt (a youth outreach programme at MIT), CodeIT at codeit.us (a software engineering services company), or CodeIt.right (a C# code analysis tool).',
          `CodeIt is built and run by ${COMPANY.founderName || 'its founder'} in ${COMPANY.locationLine()}.`,
        ],
      },
      ...(COMPANY.contactEmail
        ? [
            {
              heading: 'Contact',
              paragraphs: [
                `Email ${COMPANY.contactEmail}${COMPANY.founderName ? ` and it reaches ${COMPANY.founderName}` : ''}. Questions about safety, accounts, billing or anything a page here got wrong are all welcome.`,
              ],
            },
          ]
        : []),
    ],
  },
  {
    route: '/faq',
    eyebrow: 'Questions',
    h1: 'Questions parents ask first',
    intro: 'Including the ones with awkward answers. If something here is out of date, it is a bug.',
    detail: 'These answers are kept in one place and used by every page that shows them.',
    type: 'WebPage',
    faqs: FAQS,
  },
];

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
        `The journey sequences the ${LESSON_COUNT} beginner Python lessons with quizzes and puzzle challenges, so every concept is met, practised, and then used before the next one arrives.`,
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
        // This said "Sixteen sequenced lessons" while there were thirty-one, on
        // the page that actually ranks, describing half the course to every
        // parent who found it. The count is now counted, and the sentence that
        // follows it names what the second half contains — which is what a
        // parent deciding whether this is worth their evening wants to know,
        // and was the reason the stale number mattered.
        `${LESSON_COUNT} sequenced lessons take a beginner from a first print statement through variables, strings, if statements, loops, lists and reusable functions, then on to arithmetic, booleans, logical operators, type casting, string formatting and string methods.`,
        'From there the path continues into while loops, break and continue, importing modules, dictionaries, tuples and sets, slicing, list comprehensions, return values, scope, error handling with try and except, enumerate and zip, classes and objects, and recursion. It ends with a capstone: building a real game.',
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
      heading: 'Payments',
      paragraphs: [
        "Subscriptions are processed by Stripe. Card details are entered on Stripe's own form and never reach CodeIt. What CodeIt stores is Stripe's identifiers for the customer and subscription, the plan status and the renewal date.",
        'Only an adult account can subscribe. A managed learner profile, or an account whose date of birth indicates the holder is under 18, cannot start a subscription and is never asked for payment details.',
      ],
    },
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
        `A paid family plan is available at ${PRICING.PRICE_PER_INTERVAL}, cancellable at any time, with tax shown before card details are entered. The free plan does not expire and needs no card, and no subscription starts on its own — one begins only when someone chooses to start it.`,
      ],
    },
  ],
};

// The homepage is generated last, from the untouched template, because every
// other route uses build/index.html as its shell.
const HOME_PAGE = {
  route: '/',
  eyebrow: 'Creative coding for ages 5–18',
  // Kept in step with the real page. The app's headline changed when the front
  // door became three tappable games, and a crawlable copy that claims a
  // different headline from the page a person sees is the one kind of drift
  // worth avoiding at any SEO cost. "Website" is retained because it is what
  // the page has been indexed under.
  h1: 'Make a real game or website. Then see the code inside it.',
  intro:
    'CodeIt helps kids and beginner coders create websites, games, and quizzes, inspect the code behind them, and keep improving every project. Learners are then asked questions generated from their own code, so understanding is shown rather than assumed.',
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
        'Make something, play it, change it, see what it is made of, and publish it. Changing a project and watching what moves is what turns a finished thing into something a beginner actually understands.',
        'Starting takes one tap. The front page offers three ready-made games — catching falling stars, a penalty shootout, and dodging asteroids — that open already running, with no typing and no account. Each one is written to be read: the settings that control it are plain named values at the top of the file, so a first change can be a single number.',
      ],
    },
    {
      heading: 'Showing the project is yours',
      paragraphs: [
        'When AI writes the first version of a project, finishing it proves nothing about whether the learner understood any of it. CodeIt asks. The questions are generated from the learner\'s own project rather than from a question bank: if their game has a variable called fallSpeed set to 3, the question asks what fallSpeed starts as, and the wrong answers are other numbers from the same file.',
        'A question cannot be answered by someone who has not read their own code, and it cannot be passed by someone who did the last one. Only questions answered correctly at the first attempt are recorded, because a wrong answer shows the right one along with an explanation. What a parent sees is a plain sentence describing what their child worked out, not a score or a percentage.',
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
        `CodeIt has a free plan that does not expire and needs no card, including ${PRICING.FREE_MONTHLY_AI_BUILDS} assisted project builds a month. A paid family plan is available at ${PRICING.PRICE_PER_INTERVAL}, cancellable at any time.`,
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
  ...IDENTITY_PAGES,

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

  {
    route: '/guide',
    title: 'Coding Guides for Parents, Teachers & Beginners | CodeIt',
    description:
      'Practical, current guides on choosing coding tools, publishing a first project, and knowing whether a child actually learned anything.',
    eyebrow: 'CodeIt guides',
    h1: 'Straight answers about learning to code.',
    intro:
      'Written to be useful whether or not you ever use CodeIt. Several of these recommend another tool, because for a lot of readers another tool is the right answer.',
    detail: 'Each guide is dated and says when it was last checked against the products it names.',
    type: 'CollectionPage',
    // An index whose whole job is pointing at the guides, that linked to none
    // of them. Every guide had zero inbound links in the crawlable HTML, so a
    // crawler that does not run JavaScript could reach them only through the
    // sitemap — the weakest signal there is, and the likeliest reason pages
    // written for queries with thin competition were not surfacing at all.
    //
    // bodyHtml rather than sections, because sections escape their paragraphs
    // and an index without anchors is the bug being fixed.
    bodyHtml: GUIDE_CONTENT.map(
      (guide) =>
        `<h2><a href="/guide/${escapeHtml(guide.slug)}">${escapeHtml(guide.h1)}</a></h2>\n      ` +
        `<p>${escapeHtml(guide.description)}</p>`
    ).join('\n      '),
  },

  ...GUIDE_CONTENT.map((guide) => ({
    route: `/guide/${guide.slug}`,
    title: guide.title,
    description: guide.description,
    eyebrow: 'CodeIt guide',
    h1: guide.h1,
    intro: guide.description,
    detail: `Last verified ${guide.lastVerified}.`,
    type: 'Article',
    slug: guide.slug,
    datePublished: guide.lastVerified,
    // Declared in the guide itself, so the page and its structured data agree
    // about what is being compared. Absent on guides that are not roundups.
    comparesOptions: guide.comparesOptions,
    quotedPrices: guide.quotedPrices,
    faqs: guideFaqs(guide.markdown),
    // Pre-rendered from the same Markdown the React page renders, so the
    // crawlable HTML and the page a person sees are the same words.
    bodyHtml: renderMarkdown(guide.markdown),
    breadcrumbs: [
      ['/', 'Home'],
      ['/guide', 'Guides'],
      [`/guide/${guide.slug}`, guide.h1],
    ],
  })),

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

/**
 * Titles and descriptions come from src/data/pageMeta.js, which the React app's
 * useSEO hook reads too. They used to be written in both places and drifted:
 * eleven of sixteen pairs disagreed, and two of the disagreements were a wrong
 * price and a false claim about what children do.
 *
 * Lesson, blog and guide routes are absent from that file on purpose — their
 * titles are built from their own content just above, and copying derived text
 * into a config file would recreate the duplication this removes. So a missing
 * entry is only an error for a page that is supposed to have one.
 */
const PAGE_META = loadPageMeta();

for (const page of [HOME_PAGE, ...PAGES]) {
  const meta = PAGE_META[page.route || '/'];
  if (meta) {
    page.title = meta.title;
    page.description = meta.description;
  }
}

for (const page of [HOME_PAGE, ...PAGES]) {
  if (!page.title || !page.description) {
    throw new Error(
      `generate-static-seo: ${page.route || '/'} has no title or description. ` +
        'Hand-written pages get theirs from src/data/pageMeta.js; add an entry there.'
    );
  }
}


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

/**
 * Which guides each page should point at.
 *
 * The guides were orphaned: twelve pages, zero inbound links between them. The
 * index has been fixed above, but an index is one hop from nothing. These are
 * links from the pages that already rank to the guides that do not, chosen for
 * genuine topical relevance rather than to spread link equity around — a reader
 * on /coding-for-kids really is the reader asking what comes after Scratch.
 */
const GUIDES_BY_ROUTE = {
  '/': ['after-scratch', 'best-coding-platforms-for-kids', 'ai-built-it-now-edit-it', 'free-coding-for-kids'],
  '/coding-for-kids': ['after-scratch', 'best-coding-platforms-for-kids', 'what-did-my-kid-learn', 'coding-for-kids-by-age'],
  '/learn-python-for-kids': ['after-scratch'],
  '/lessons': ['after-scratch', 'free-coding-for-kids'],
  '/builder': ['ai-builder-you-can-edit', 'publish-first-project'],
  '/ai-website-builder-for-kids': ['ai-builder-you-can-edit', 'ai-built-it-now-edit-it'],
  '/games': ['first-browser-game'],
  '/python-games-for-kids': ['first-browser-game'],
  '/first-game-challenge': ['first-browser-game'],
  '/explore': ['publish-first-project'],
  '/playground': ['after-scratch'],
  '/journey': ['what-did-my-kid-learn', 'coding-for-kids-by-age'],
  '/blog': ['what-did-my-kid-learn'],

  // The seven blog posts were written in March and point at nothing but the
  // site nav. Every one of them is the older, weaker answer to a question a
  // guide now answers better and more recently — the category moved underneath
  // them, Code.org rebranded in June and Common Sense paused in February — and
  // a reader who lands on one from search deserves the current page, not a
  // dead end. Measured before assuming: the worst text overlap between any two
  // of these pages is 4.3%, so this is not duplication, it is age.
  '/blog/learn-python-for-kids': ['after-scratch', 'coding-for-kids-by-age'],
  '/blog/python-coding-games': ['first-browser-game', 'free-coding-for-kids'],
  '/blog/how-to-start-coding-for-beginners': ['after-scratch', 'free-coding-for-kids'],
  '/blog/best-coding-games-for-kids': ['first-browser-game', 'best-coding-platforms-for-kids'],
  '/blog/python-basics-for-beginners': ['after-scratch', 'coding-for-kids-by-age'],
  '/blog/is-python-good-for-kids': ['coding-for-kids-by-age', 'best-coding-platforms-for-kids'],
  '/blog/coding-for-kids-beginner-guide': ['best-coding-platforms-for-kids', 'what-did-my-kid-learn'],
  '/faq': ['what-did-my-kid-learn', 'coding-for-kids-by-age'],
  '/pricing': ['tynker-alternative', 'best-coding-platforms-for-kids', 'free-coding-for-kids'],
  '/about': ['ai-built-it-now-edit-it'],
};

function guideLinksFor(route) {
  const slugs = GUIDES_BY_ROUTE[route === '/' ? '/' : route] || [];
  return slugs
    .map((slug) => GUIDE_CONTENT.find((guide) => guide.slug === slug))
    .filter(Boolean)
    .map((guide) => `<a href="/guide/${escapeHtml(guide.slug)}">${escapeHtml(guide.h1)}</a>`)
    .join('\n        ');
}

function staticContent(page) {
  // Every page a person can reach should be reachable from every other page.
  // This list used to hold four routes, which left eleven indexable pages with
  // no inbound link at all — including /learn-python-for-kids, one of the few
  // pages that actually ranks. A crawler found them only in the sitemap.
  //
  // This is site navigation, not link stuffing: it is the set of sections a
  // real footer would carry, and the current page is always filtered out.
  const relatedLinks = [
    ['/coding-for-kids', 'Coding for kids: parent guide'],
    ['/learn-python-for-kids', 'Learn Python for kids'],
    ['/ai-website-builder-for-kids', 'How project building works'],
    ['/playground', 'Python playground'],
    ['/games', 'Coding games'],
    ['/python-games-for-kids', 'Python games for kids'],
    ['/journey', 'The learning journey'],
    ['/first-game-challenge', 'First game challenge'],
    ['/explore', 'Projects other learners built'],
    ['/pricing', 'Free access and family pilot'],
    ['/blog', 'Coding guides'],
    ['/guide', 'Straight answers about learning to code'],
    ['/faq', 'Questions parents ask first'],
    ['/about', 'About CodeIt'],
    ['/press', 'Press and facts'],
    ['/privacy', 'Privacy'],
    ['/terms', 'Terms'],
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
      ${page.bodyHtml || sectionsHtml(page.sections)}
      ${faqHtml(page.faqs)}
      <h2>${escapeHtml(page.sectionTitle || 'What you can do on CodeIt')}</h2>
      <p>${paragraphHtml(page.detail)}</p>
      <nav aria-label="Continue on CodeIt">
        <a href="${escapeHtml(page.route)}">${escapeHtml(page.primaryLinkLabel || 'Open this page')}</a>
        <a href="/builder">Build a project</a>
        <a href="/lessons">Browse lessons</a>
        ${relatedLinks}
        ${guideLinksFor(page.route)}
      </nav>
    </div>
  </main>`;
}

function pageSchema(page) {
  const graph = [];
  const url = `${SITE}${page.route}`;
  const bodyText = bodyTextOf(page);

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
  if (page.type === 'BlogPosting' || page.type === 'Article') {
    primary.headline = page.h1;
    primary.author = { '@id': `${SITE}/#organization` };
    primary.mainEntityOfPage = { '@type': 'WebPage', '@id': url };
    if (page.datePublished) {
      primary.datePublished = page.datePublished;
      primary.dateModified = page.datePublished;
    }
    if (bodyText) primary.articleBody = bodyText;
    if (bodyText) primary.wordCount = bodyText.split(/\s+/).length;
  }

  graph.push(primary);

  // Roundups get an ItemList of what they compare.
  //
  // A comparison page is a list, and Article alone does not say so. An
  // extraction pipeline reading Article sees prose; reading ItemList it sees
  // named options in order, which is the shape of the answer an assistant is
  // trying to build when someone asks what to use. These are the two page types
  // that beat this site on every unbranded query, so it is worth telling a
  // machine that is what they are.
  //
  // The list is parsed from the page's own H2 headings rather than typed
  // beside them, so a section renamed or removed cannot leave a stale entry
  // behind claiming the page still compares something it does not.
  if (page.comparesOptions) {
    const headings = [...String(page.bodyHtml || '').matchAll(/<h2>(.*?)<\/h2>/g)]
      .map((match) => match[1].replace(/<[^>]+>/g, '').trim())
      .filter((heading) => page.comparesOptions.includes(heading));

    if (headings.length) {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${url}#options`,
        name: page.h1,
        itemListOrder: 'https://schema.org/ItemListUnordered',
        numberOfItems: headings.length,
        itemListElement: headings.map((heading, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: heading,
        })),
      });
    }
  }

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

/**
 * The global @graph in public/index.html carries a hand-written Organization
 * node. Replace it with the one built from src/config/company.js so identity
 * facts live in exactly one file — adding a founder name or a sameAs profile
 * should never mean editing HTML.
 */
function withOrganization(html) {
  const schema = JSON.stringify(COMPANY.organizationSchema(), null, 10)
    .replace(/\n/g, '\n  ');
  return html.replace(
    /\{\s*"@type": "Organization"[\s\S]*?\n\s{8}\}/,
    schema.replace(/^\{/, '{').replace(/\}$/, '}')
  );
}

/**
 * The WebSite node in that same @graph carries its own hand-written alias list,
 * and it went stale: it still omitted 'CodeIt Learn' after that became the name
 * every external profile is registered under. A page that answers "what is this
 * called" two different ways is worse than one that answers once, because a
 * reader deciding whether two mentions are the same organisation has to guess.
 *
 * Rewrite every alternateName array in the graph from config. There is only one
 * list of names for this company and it lives in src/config/company.js.
 */
function withAliases(html) {
  const aliases = JSON.stringify(COMPANY.alternateNames);
  return html.replace(/"alternateName":\s*\[[^\]]*\]/g, `"alternateName": ${aliases}`);
}

function renderRouteDocument(template, page) {
  let html = replaceMeta(withAliases(withOrganization(template)), page);
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

/**
 * The date a specific page last changed, not the date the site was built.
 *
 * Every URL used to carry the same lastmod, which tells a crawler that all 69
 * pages changed together — that is, nothing useful. A guide verified in March
 * and a page rewritten this morning looked identical, so the signal was spent
 * on all of them equally and did no work for any of them.
 *
 * Guides carry lastVerified and blog posts carry their own date, both authored
 * by the person who checked the facts. Those are better evidence of change than
 * the build clock. Everything else falls back to the commit date.
 */
function pageLastModified(page) {
  const own = page && page.datePublished;
  if (/^\d{4}-\d{2}-\d{2}$/.test(own || '')) return own;

  // A real page's date comes from its own content. Anything not in the page
  // list — a bare object in a test, a route added without content — falls back
  // to the commit date, which is what it always did.
  const known = contentDateByRoute().get((page && page.route) || '/');
  return known ? known.date : LAST_MODIFIED;
}

/**
 * llms.txt, with the guides in it.
 *
 * That file is written for language models, and it listed thirteen product
 * pages and none of the fifteen guides — the pages that exist specifically to
 * answer a question, which is the only thing a model fetching this file is
 * looking for. A model reading it learned what CodeIt sells and nothing about
 * what CodeIt knows.
 *
 * It was also maintained by hand, which on this site has been a reliable way to
 * make something stop being true. The guide section is generated from
 * src/data/guidePages.js at build time and replaces anything already under that
 * heading, so adding a guide adds it here and removing one removes it.
 */
function writeLlmsTxt(buildDir) {
  const source = path.resolve(__dirname, '../public/llms.txt');
  if (!fs.existsSync(source)) {
    console.warn('llms.txt not found in public/; skipping.');
    return;
  }

  const HEADING = '## Guides';
  const base = fs.readFileSync(source, 'utf8').split(HEADING)[0].trimEnd();

  const guides = GUIDE_CONTENT.map(
    (guide) =>
      `- ${guide.h1}\n  ${SITE}/guide/${guide.slug}\n  ${guide.description}\n  Last checked ${guide.lastVerified}.`
  ).join('\n\n');

  const body =
    `${base}\n\n${HEADING}\n\n` +
    'Long-form answers to specific questions. Several of them recommend a\n' +
    'competitor, because for many readers a competitor is the right answer.\n' +
    'Each one states the date its facts were checked.\n\n' +
    `${guides}\n`;

  fs.writeFileSync(path.join(buildDir, 'llms.txt'), body);
  console.log(`Wrote llms.txt with ${GUIDE_CONTENT.length} guides.`);
}

function writeSitemap(buildDir) {
  const urls = [
    { route: '/', priority: '1.0', page: HOME_PAGE },
    ...PAGES.map((page) => ({ route: page.route, page })),
  ];
  const seen = new Set();
  const body = urls
    .filter(({ route }) => (seen.has(route) ? false : seen.add(route)))
    .map(
      ({ route, priority, page }) =>
        `  <url>\n` +
        `    <loc>${SITE}${route === '/' ? '/' : route}</loc>\n` +
        `    <lastmod>${pageLastModified(page)}</lastmod>\n` +
        (priority ? `    <priority>${priority}</priority>\n` : '') +
        `  </url>`
    )
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), xml);
  console.log(`Generated sitemap.xml with ${seen.size} URLs.`);

  // Tell IndexNow the sitemap changed.
  //
  // submit-indexnow.js has existed for months, works, and had never once run:
  // nothing invoked it, and when invoked by hand it threw ENOENT because it
  // read a sitemap file that was deleted when this script took over writing
  // one. So every page published since then was announced to Bing and Copilot
  // by nothing at all.
  //
  // Production deploys only. Preview builds would announce URLs that are about
  // to change again, and IndexNow rate-limits repeat submissions. A failure
  // here is logged and swallowed: a search-engine ping is not worth failing a
  // deploy over.
  if (process.env.VERCEL_ENV === 'production') {
    try {
      require('./submit-indexnow.js').notify(buildDir);
    } catch (error) {
      console.warn(`IndexNow notification skipped: ${error.message}`);
    }
  }
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

  // The sitemap is generated from the same PAGES list rather than maintained
  // by hand. A hand-written sitemap is how fifteen lessons went unlisted for
  // months on a site whose entire problem was not being readable.
  writeContentDates();
  writeSitemap(buildDir);
  writeLlmsTxt(buildDir);

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

module.exports = {
  PAGES,
  HOME_PAGE,
  PRICING,
  FAQS,
  LAST_MODIFIED,
  BUILD_DATE,
  CONTENT_DATES_PATH,
  contentFingerprint,
  guideFaqs,
  plainText,
  statedPrices,
  declaredPrices,
  unaccountedPrices,
  ourPrice,
  writeContentDates,
  pageLastModified,
  writeLlmsTxt,
  generate,
  renderRouteDocument,
  pageSchema,
};
