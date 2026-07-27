'use strict';

const fs = require('fs');
const path = require('path');

const SITE = 'https://codeitlearn.com';

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
];

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
    description: 'A project-first coding platform for ages 13–18, with supervised guest activities for younger learners. Build websites, games and quizzes, then learn the code.',
    eyebrow: 'For parents & educators',
    h1: 'A first coding project they’ll want to keep improving.',
    intro: 'CodeIt helps a beginner turn an idea into a website, game, or quiz, then change the design, inspect the code, and understand what makes it work.',
    detail: 'New student accounts are for ages 13–18. Younger learners can explore guest activities with an adult beside them. Saved projects are private until the learner chooses Publish.',
    type: 'LearningResource',
  },
  {
    route: '/learn-python-for-kids',
    title: 'Learn Python for Kids & Teens | Interactive Lessons — CodeIt',
    description: 'Learn beginner Python in the browser with short lessons, real code, quizzes, and projects. Student accounts are designed for ages 13–18.',
    eyebrow: 'Beginner Python, in the browser',
    h1: 'Learn Python by making something work.',
    intro: 'Write a line, run it, and see what changed. CodeIt gives beginners a clear path through real Python without downloads or a wall of theory first.',
    detail: 'New student accounts are designed for ages 13–18. Younger learners can explore guest activities with a parent or guardian beside them.',
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
    title: 'CodeIt Pricing: Free Coding & Founding Family Plan',
    description: 'Start coding for free. Preview the planned CodeIt Founding Family plan for more project builds, parent visibility, and two learner profiles.',
    eyebrow: 'Simple, honest pricing',
    h1: 'Start free. Pay when your family needs more room to build.',
    intro: 'CodeIt keeps a useful free option for beginners. We are testing one straightforward family plan before opening billing.',
    detail: 'The proposed Founding Family plan adds more assisted project builds, two learner profiles, parent visibility, and a simple progress summary.',
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
    detail: 'Saved projects are private until their owner chooses Publish. Parents and users can ask to access, correct, unpublish, or delete personal information.',
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

const PAGES = [
  ...BASE_PAGES,
  ...LESSONS.map(([slug, title, topic], index) => ({
    route: `/lesson/${index + 1}`,
    title: `Python Lesson ${index + 1}: ${title} for Beginners | CodeIt`,
    description: `Interactive beginner Python lesson about ${topic}. Write and run code directly in your browser.`,
    eyebrow: `Python lesson ${index + 1}`,
    h1: title,
    intro: `This beginner lesson teaches ${topic}. The explanation, example, and practice activity stay together so students can see what each change does.`,
    detail: 'Run the example, change one part, and use the result to check your understanding before moving to the next lesson.',
    type: 'LearningResource',
    slug,
  })),
  ...BLOG_POSTS.map(([slug, title, description]) => ({
    route: `/blog/${slug}`,
    title: `${title} | CodeIt Blog`,
    description,
    eyebrow: 'CodeIt guide',
    h1: title,
    intro: description,
    detail: 'This guide is written for beginners and the adults supporting them, with practical next steps that connect to interactive CodeIt lessons and projects.',
    type: 'WebPage',
  })),
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

function staticContent(page) {
  return `<main class="static-home-shell static-route-shell" data-static-route="${escapeHtml(page.route)}">
    <div class="static-home-shell__inner">
      <p class="static-route-kicker">${escapeHtml(page.eyebrow)}</p>
      <h1>${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.intro)}</p>
      <h2>${escapeHtml(page.sectionTitle || 'What you can do on CodeIt')}</h2>
      <p>${escapeHtml(page.detail)}</p>
      <nav aria-label="Continue on CodeIt">
        <a href="${escapeHtml(page.route)}">${escapeHtml(page.primaryLinkLabel || 'Open this page')}</a>
        <a href="/builder">Build a project</a>
        <a href="/lessons">Browse lessons</a>
      </nav>
    </div>
  </main>`;
}

function pageSchema(page) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': page.type,
    name: page.h1,
    description: page.description,
    url: `${SITE}${page.route}`,
    isPartOf: { '@id': `${SITE}/#website` },
    publisher: { '@id': `${SITE}/#organization` },
  };

  if (page.type === 'LearningResource') {
    schema.educationalLevel = 'Beginner';
    schema.audience = { '@type': 'EducationalAudience', audienceType: 'Kids and beginner coders' };
    schema.provider = { '@id': `${SITE}/#organization` };
  }
  if (page.type === 'SoftwareApplication') {
    schema.applicationCategory = 'EducationalApplication';
    schema.operatingSystem = 'Web';
    schema.isAccessibleForFree = true;
  }

  return JSON.stringify(schema);
}

function renderRouteDocument(template, page) {
  let html = replaceMeta(template, page);
  const content = staticContent(page);
  html = html.replace(/<div id="root">[\s\S]*?<\/body>/i, `<div id="root">${content}</div>\n  </body>`);
  const routeStyle = `<style id="static-route-style">
    .static-route-shell h2{margin:2rem 0 .5rem;font:700 1.35rem Arvo,Georgia,serif;color:#38291f}
    .static-route-kicker{margin:0 0 .75rem!important;color:#c95f16;font-size:.78rem!important;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
  </style>`;
  const schema = `<script id="static-route-jsonld" type="application/ld+json">${pageSchema(page)}</script>`;
  return html.replace('</head>', `${routeStyle}\n    ${schema}\n  </head>`);
}

function generate(buildDir = path.resolve(__dirname, '../build')) {
  const templatePath = path.join(buildDir, 'index.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  for (const page of PAGES) {
    const outputDir = path.join(buildDir, page.route.replace(/^\//, ''));
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderRouteDocument(template, page));
  }

  console.log(`Generated ${PAGES.length} route-specific search documents.`);
}

if (require.main === module) generate();

module.exports = { PAGES, generate, renderRouteDocument };
