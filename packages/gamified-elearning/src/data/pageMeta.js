/**
 * pageMeta.js — one title and one description per route.
 *
 * These used to be written twice: once in the React page's useSEO call, and
 * again in scripts/generate-static-seo.js. Nothing kept the two in sync, so a
 * single URL could tell a person one thing and a crawler another. On
 * 25 August 2026 eleven of the sixteen pairs disagreed, and two of those
 * mattered: /pricing quoted a crawler the CA$12 plan while offering a person a
 * free pilot, and /builder told a JavaScript crawler that children edit the
 * real code, a claim the rest of the site had already stopped making.
 *
 * Both sides read this file now — useSEO looks an entry up by its canonical
 * path, and the static generator reads the same object — so they cannot
 * disagree, because there is only one of them.
 *
 * Lesson, blog and guide pages are deliberately absent. Their titles come from
 * their own content, and copying derived text into here would recreate exactly
 * the duplication this file exists to remove.
 *
 * Adding a page means adding it here.
 */

const PAGE_META = {
  '/': {
    title: 'Coding for Kids: Build Websites & Learn the Code | CodeIt',
    description: 'CodeIt is a browser-based coding platform for ages 5–18. Describe a website, game or quiz, play what comes back, change it by moving things and picking colours, then see what it is made of.',
  },
  '/MainPage': {
    title: 'Your progress | CodeIt. Python Learning Progress',
    description: 'Track your Python lessons, quizzes, and coding challenges. See your XP, streak, achievements, and next mission on your CodeIt progress page.',
  },
  '/about': {
    title: 'About CodeIt',
    description: 'CodeIt is a browser-based coding studio for ages 5–18, built in Toronto. Learners describe a website, game or quiz, change it by moving things and picking colours, then see the code behind it.',
  },
  '/ai-website-builder-for-kids': {
    title: 'AI Website Builder for Kids: Build & Learn the Code | CodeIt',
    description: 'Kids can turn an idea into a website, game, or quiz, change it by moving things and picking colours, then see the HTML, CSS, and JavaScript behind it.',
  },
  '/blog': {
    title: 'Coding Guides for Kids, Parents & Beginners | CodeIt',
    description: 'Read practical guides about learning Python, choosing coding activities, and helping a beginner build confidence.',
  },
  '/builder': {
    title: 'AI Website Builder for Kids & Beginners | CodeIt',
    description: 'Describe a website, game, or quiz, build it in the browser, then see the HTML, CSS, and JavaScript behind it.',
  },
  '/character': {
    title: 'Avatar Lab. Customize Your Coding Avatar | CodeIt',
    description: 'Design your personal coding avatar for CodeIt. Pick your style, outfit, accessories, and nickname. Level up through Python lessons to unlock new looks.',
  },
  '/coding-for-kids': {
    title: 'Coding for Kids: Projects, Python & Parent Guide | CodeIt',
    description: 'A project-first coding platform for ages 5–18, with private parent-managed profiles for ages 5–12. Build websites, games and quizzes, then learn the code.',
  },
  '/creator-brief': {
    title: 'CodeIt Creator Brief',
    description: 'An unlisted collaboration brief for demonstrating and promoting CodeIt accurately.',
  },
  '/explore': {
    title: 'Explore Student Coding Projects | CodeIt',
    description: 'Open public websites, games, and quizzes made with CodeIt, then remix a project into your own version.',
  },
  '/faq': {
    title: 'CodeIt FAQ: Ages, Cost, Safety & What It Does Not Do',
    description: 'Straight answers about CodeIt — age ranges, what it costs, whether projects are public, what it does not do, and how it differs from Scratch.',
  },
  '/first-game-challenge': {
    title: 'Build Your First Game Free | 10-Minute Coding Challenge | CodeIt',
    description: 'Choose a game idea, build a playable first version, change it, save it, and earn XP. A free coding challenge for young creators ages 5–18.',
  },
  '/forgot-password': {
    title: 'Reset Password | CodeIt',
    description: 'Request a secure link to reset your CodeIt password.',
  },
  '/games': {
    title: 'Coding Games & Python Challenges for Kids | CodeIt',
    description: 'Practice beginner Python through interactive coding games, puzzles, scores, and challenges that run in the browser.',
  },
  '/guide': {
    title: 'Coding Guides for Parents, Teachers & Beginners | CodeIt',
    description: 'Practical, current guides on choosing coding tools, publishing a first project, and knowing whether a child actually learned anything.',
  },
  '/investor-brief': {
    title: 'CodeIt Investor Overview',
    description: 'An unlisted, honest overview of the CodeIt product, market thesis, business model, and validation plan.',
  },
  '/journey': {
    title: 'Interactive Python Learning Journey for Kids | CodeIt',
    description: 'Move through a structured Python journey with lessons, quizzes, puzzles, XP, and visible progress.',
  },
  '/leaderboard': {
    title: 'Leaderboard | CodeIt',
    description: 'See CodeIt creators climb the rankings by building projects, publishing their work, and completing coding challenges.',
  },
  '/learn-python-for-kids': {
    title: 'Free Python for Kids Online | 31 Interactive Lessons | CodeIt',
    description: 'Start learning Python for free with 31 interactive browser lessons, real code, quizzes, and projects. No download or signup is needed to open Lesson 1.',
  },
  '/lessons': {
    title: 'Beginner Coding Lessons for Kids | CodeIt',
    description: 'Follow short beginner coding lessons covering Python variables, strings, decisions, loops, lists, and functions.',
  },
  '/login': {
    title: 'Sign In | CodeIt',
    description: 'Sign in to your CodeIt account and continue your Python learning journey. Pick up where you left off.',
  },
  '/parent-review': {
    title: 'Parent Review | CodeIt',
    description: 'Review and manage an existing CodeIt learner account.',
  },
  '/playground': {
    title: 'Free Online Python Playground for Beginners | CodeIt',
    description: 'Write and run beginner Python directly in your browser with no download or local setup.',
  },
  '/press': {
    title: 'CodeIt Press Kit: Facts, Figures and Contact',
    description: 'Everything needed to write accurately about CodeIt: what it is, what it costs, what it deliberately does not do, who built it, and how to use the logo.',
  },
  '/pricing': {
    title: 'CodeIt Pricing: Free Coding & Family Pilot',
    description: 'Start free with no card. The CodeIt family plan is CA$12 a month, cancellable at any time, with guided setup, parent progress and learner profiles.',
  },
  '/privacy': {
    title: 'Privacy & Safety | CodeIt',
    description: 'How CodeIt handles account information, learning progress, projects, AI processing, analytics, public sharing, and child safety.',
  },
  '/profile': {
    title: 'My Profile. CodeIt',
    description: 'Your avatar, XP, and level on CodeIt.',
  },
  '/python-games-for-kids': {
    title: 'Python Games for Kids | Real Coding Puzzles — CodeIt',
    description: 'Use real Python to solve browser-based games and coding puzzles about variables, loops, decisions, and beginner programming.',
  },
  '/register': {
    title: 'Create Free Account | CodeIt',
    description: 'Join CodeIt for free and start learning Python with interactive lessons, quizzes, coding games, and creative projects.',
  },
  '/reset-password': {
    title: 'Choose New Password | CodeIt',
    description: 'Choose a new password for your CodeIt account.',
  },
  '/terms': {
    title: 'Terms of Use | CodeIt',
    description: 'The rules for using CodeIt lessons, coding tools, AI-assisted projects, accounts, public sharing, and planned paid features.',
  },
};

export default PAGE_META;
