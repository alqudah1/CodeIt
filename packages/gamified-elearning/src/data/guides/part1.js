// Guides, part 1 of 5. The list is put together in ../guidePages.js,
// which says why it is in parts.

const GUIDES_A = [
  {
    slug: "glitch-for-classrooms",
    relatedLessons: [1, 9],
    title: "Glitch for Classrooms: What Teachers Use Now",
    description: "Glitch ended hosting in July 2025. A teacher's replacement guide: remixable starters, age gates, Chromebook fit, and what to do with old projects.",
    h1: "My class used Glitch. What do we use now?",
    lastVerified: "2026-08-25",
    targetQueries: ["my class used Glitch for coding projects what should we use now", "glitch alternative for classroom", "glitch shut down what do teachers use", "free coding platform for middle school no installs", "remixable starter project for a class like glitch", "coding site for students under 13 chromebook", "replacement for glitch and replit teams for education", "student web hosting age requirements school"],
    markdown: `**Short answer:** for most classes, the closest working replacements are [CodeHS Free](https://codehs.com/free) if you want a full course and roster in one place, [Pickcode](https://pickcode.io/) if you want a lighter tool with starter code and assignments, and [Neocities](https://neocities.org/) or the [p5.js Web Editor](https://editor.p5js.org/) if you only need students to build and share small web projects. None of them reproduce the exact Glitch loop (one link, thirty remixes, thirty live URLs in a minute), and it is worth knowing that before you plan the unit.

This page is only about classroom use. If you are looking for general hosting for your own projects, that is a different question, covered separately in [Glitch shut down: where beginner web projects live now](/guide/glitch-shutdown).

## Two more deadlines land this week

Before anything else, two things that affect teachers right now, in August 2026:

- **GitHub Classroom's last day is 28 August 2026.** No new classrooms can be created, and classroom-specific data, assignment definitions, autograding tests, submission history, is deleted after 4 September 2026. GitHub accounts, repositories and organizations are unaffected. There is an export utility; use it this week if you have anything in there. ([GitHub community FAQ](https://github.com/orgs/community/discussions/145312))
- **Trinket's last day is 31 August 2026.** Export before then: Account Settings does a bulk export, the Share button downloads a single trinket, and the Courses menu exports a course. Only saved versions are included, so anything left unsaved in an editor is lost. The code was open-sourced, but as the team put it, open source does not mean the site stays online. A community-run instance exists at [trinket.strivemath.org](https://trinket.strivemath.org/), which Trinket does not guarantee. Download your trinkets from Account Settings before the date. ([Trinket announcement](https://trinket.io/announcement))

Add these to Glitch (July 2025) and Replit's Teams for Education (retired 1 August 2024), and four of the browser-based classroom tools teachers relied on have closed inside two years. That is the context you are planning in, and it is a reasonable argument for choosing tools that either charge money or are backed by a foundation, rather than free products from venture-funded startups.

## What Glitch actually gave you

It helps to separate the four things Glitch did, because they replace separately.

1. **Remixable starters.** You posted one link; every student clicked Remix and had a private, working copy. No accounts to pre-create, no zip files, no git.
2. **Instant hosting.** Every project had a live URL from the first save, so students could show each other and take the link home.
3. **Zero-install editing.** It ran in a browser tab on a locked-down Chromebook with no admin rights.
4. **Small server-side projects.** Node and Express apps, not just static pages.

Point 1 is the hard one. Almost every replacement below asks the student to sign in before they can fork anything, and the sign-in is where age policy stops you.

## The age gates, which usually decide it

For a middle-school class this is the deciding constraint, not features. Verified today against each platform's own terms:

Every option below needs an account, and an email address to create one. All are browser-based, so they run on a managed Chromebook with nothing to install.

| Platform | Age minimum | School email or admin needed | Remix / fork flow | Live URL | Cost |
|---|---|---|---|---|---|
| [CodeHS Free](https://codehs.com/free) | Teacher creates student accounts; no public age gate found (unverified) | No | Starter code in assignments; sandbox for free builds | Web projects run in CodeHS | Free, no card |
| [Pickcode](https://pickcode.io/) | Unverified | No | Lessons with starter code | Shareable project links (unverified) | Free tier for unlimited projects; Pro $500/teacher/yr + ~$5/student/semester |
| [Scratch](https://scratch.mit.edu/educators/) | Teacher Accounts create student accounts without student email | No | "Remix" is native and closest in spirit to Glitch | Project page URL | Free |
| [p5.js Web Editor](https://editor.p5js.org/) | Unverified | No | Duplicate a sketch (sign-in needed to save) | Yes, sketch URL | Free |
| [Neocities](https://neocities.org/) | Terms state no minimum for account creation | No | None, upload files | Yes, free subdomain | Free: 1 GB, 200 GB bandwidth, file-type limits. Supporter $5/mo |
| [GitHub Pages](https://pages.github.com/) + template repos | **13+** | No | "Use this template" is the nearest true remix | Yes | Free |
| [GitHub Codespaces](https://github.com/features/codespaces) | **13+** | No | Open any repo in a browser VS Code | Port forwarding, not permanent hosting | Free personal tier: 120 core-hours, 15 GB-months/mo |
| [Classroom 50](https://classroom50.org/) | 13+ (rides on GitHub accounts) | You own a GitHub org | Assignment repos, autograded | Via GitHub Pages | Free, open source |
| [CodeSandbox](https://codesandbox.io/) | Unverified | No | Fork | Yes | Free: 400 credits/mo, 20 sandboxes; freezes when credits run out |
| [StackBlitz](https://stackblitz.com/) | Unverified | No | Fork | Yes | Free tier |
| [Netlify](https://www.netlify.com/) | **13+** | No | Drag-and-drop deploy | Yes | Free tier, no card |
| [Vercel](https://vercel.com/) | **16+** | No | Deploy from repo | Yes | Free tier |
| [CodePen](https://codepen.io/) | Terms state services are **not available to minors under 18**; 13–17 require a guardian-created and guardian-managed account | No | Fork a pen | Pen URL, not a site | Free tier |
| [itch.io](https://itch.io/) | 13+ to use; **18+ or parental consent to publish** | No | None | Yes, game page | Free |

Two entries in that table surprise most teachers. **Vercel is 16+, not 13+**: most guides get this wrong, and it quietly rules out every middle school. **CodePen's terms are stricter than its reputation**: they state the service is not available to minors, with 13–17-year-olds requiring a guardian-managed account. Read that clause yourself before you put thirty student sign-ups through it.

"Managed Chromebook" above means the tool is browser-only and needs no local install. It does not mean your district has allowlisted the domain. Ask your admin to allow the site and any preview subdomains before the lesson, not during it.

## Choosing by what you used Glitch for

**You posted one starter link and everyone remixed it.** Scratch is the only mainstream tool where remix works exactly as it did on Glitch, but it is blocks, not HTML. For text-based work, the honest closest match is a **GitHub template repository**: you build one repo, tick "Template repository" in settings, and students click "Use this template" to get their own copy. That requires 13+ accounts and about twenty minutes of setup pain the first time. For under-13 classes, CodeHS and Pickcode solve it a different way: the teacher issues the accounts and attaches starter code to an assignment, so no student ever signs up for anything.

**Students needed a live URL to share.** Neocities is the least encumbered option: a free account, 1 GB, a real URL, no card, and terms that set no account minimum age. GitHub Pages is better if you want version history and are 13+. Skip Vercel for school-age classes on the age rule alone.

**No installs on locked-down machines.** Every option here is browser-only. If you just need students to edit files without any account at all, [vscode.dev](https://vscode.dev/) opens a full editor in a tab and can open a local folder, with no sign-in and no hosting.

**Small Node or Express projects.** Be prepared for disappointment. Free hosting for student-run servers has largely gone; [Render](https://render.com/), [Railway](https://railway.com/) and [Fly.io](https://fly.io/) all want a repo, an account and usually a card, and their free tiers sleep or expire. GitHub Codespaces is the closest thing left, and its forwarded ports are for development, not for a public class showcase. If your unit depended on a live Node backend per student, plan to rewrite it as front-end JavaScript or budget for hosting.

## Your old class projects

Glitch code was downloadable from the dashboard through the end of 2025; that route is closed now. Redirects had to be configured before 31 December 2025 and were promised to work "at least through the end of 2026", so any glitch.me link in a course page, handout, LMS module or student portfolio is on a clock that runs out within months. Repoint them now. Note that glitch.com itself now redirects to the company blog, which is why searching for classroom guidance still surfaces a dead product's own marketing.

If you did not export, check whether projects were ever pushed to GitHub, and check the Internet Archive for the rendered page. That gets you the front-end HTML and CSS of a static project, though not a Node backend or its data.

---

### Disclosure: about CodeIt

**CodeIt is not a schools product, and this page would be dishonest if it implied otherwise.** There is no rostering, no LMS integration, no standards alignment, no teacher dashboard, no class management and no bulk account creation. A teacher with thirty students cannot run CodeIt the way they ran Glitch. If you are the teacher this page is written for, the recommendation above stands: CodeHS, Pickcode, Classroom 50 with GitHub Pages, Neocities or the p5.js editor.

CodeIt is a browser-based studio built for ages 8 to 14. A learner describes a website, game or quiz and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows what the project is made of and opens the lesson behind each idea it used. Profiles for ages 5 to 12 are parent-managed and email-verified, and **managed under-13 profiles cannot publish publicly**; independent accounts start at 13. The free plan does not expire, needs no card, and includes ten assisted project builds a month and one managed learner profile under a parent view. The family plan is CA$12/month, cancellable any time. There are 31 beginner Python lessons; there is no web curriculum, because the web side is the builder rather than a course. The honest fit is a homeschool parent, a small after-school club, or one or two children, not a class.

---

*Last verified: 25 August 2026. Age policies and free tiers change; check each platform's own terms before committing a class to it.*

## Questions teachers ask

**Is Glitch coming back for education?** No. Hosting and user app profiles ended on 8 July 2025, citing operational costs and misuse. The company still publishes, but there is nothing to remix.

**What is the closest thing to Glitch's remix button?** Scratch for blocks, GitHub template repositories for text-based code, and teacher-issued starter code in CodeHS or Pickcode when students are under 13.

**Can under-13 students publish a website?** Rarely under their own account. Neocities' terms set no account minimum; GitHub and Netlify require 13, Vercel 16, and CodePen's terms are stricter still. The usual workaround is a single teacher-owned host where student work is uploaded under the teacher's account.

**We used Replit Teams for Education before Glitch. Is Replit an option again?** The K-12 classroom management product was retired on 1 August 2024 and has not returned in that form. Replit's current education page is oriented to universities and AI app building; treat any K-12 fit as unverified.`,
  },
  {
    slug: "after-scratch",
    relatedLessons: [1, 2, 4],
    // CodeMonkey's own prices, from app.codemonkey.com/home-plans, re-read
    // 31 August 2026. These were written as bare "$8" and "$13", which slipped
    // past the price guards entirely: an unmarked dollar amount is not read as
    // a second currency, so a competitor's US price could sit on the page
    // undeclared. Marking them US$ is what the rest of the site does and what
    // the guard is for.
    quotedPrices: ["US$8", "US$13", "US$24.99", "US$119.99", "US$199.99"],
    title: "What to Use After Scratch, Before Python",
    description: "Your kid outgrew Scratch but isn't ready for Python. Here's how to tell if they're actually ready, why the Python jump fails, and what to pick instead.",
    h1: "What to use after Scratch, before Python",
    lastVerified: "2026-08-21",
    targetQueries: [
      "what to use after scratch",
      "what comes after scratch for kids",
      "is my child ready to move on from scratch",
      "scratch to python transition kids",
      "best coding language after scratch age 10",
      "block coding to text coding for kids",
      "coding for 10 year old after scratch",
      "scratch alternatives for older kids"
    ],
    markdown: `**Short answer:** for most kids aged 9 to 13 who have outgrown Scratch, HTML, CSS and JavaScript in a browser is a better next step than Python. The feedback stays visual and immediate, there is nothing to install, and the thing they build is a real thing they can look at. Python is the right next step for a narrower group, kids around 12 and up who asked for it by name, or who are heading toward data, AI, or school computer science.

But before you pick anything, check whether your kid is actually ready to leave Scratch. Most are not yet, and the signal parents usually read as readiness is something else entirely.

## Is your kid actually ready to leave Scratch?

### The false signal: boredom

"I'm bored of Scratch" almost never means "I have outgrown these concepts." It usually means one of three much smaller things: they have run out of project ideas, their project got big and managing sprites and scripts became tedious, or their friends moved on and the social pull went with them.

Here is a quick test. Give them three challenges. If your kid has genuinely outgrown Scratch, each should take under an hour.

1. Add a high score that survives closing the project.
2. Make the game two-player on one keyboard.
3. Add a 60-second timer that ends the game and shows a results screen.

If any of those stumps them, the ceiling they hit was not Scratch's. The fix is a harder project, not a new platform. [Scratch](https://scratch.mit.edu/) is free and has an enormous remix community, so there is no cost to staying another six months.

### The real signals

Look for three or more of these:

| Signal | What it sounds like | Why it counts |
|---|---|---|
| Fighting the tool's limits, not the tool | "How do I make this a real website?" "How do I make it save?" | They want things blocks cannot express |
| Curiosity about what is underneath | Right-clicking a website and picking Inspect; "how did they make this?" | Text code is now an answer to a question they already have |
| Reading and typing tolerance | Can read an error message aloud and type for 20 minutes without melting down | Text coding is a reading and typing task before it is a logic task |
| Debugging stamina | Stays with a bug for 10 minutes without asking for rescue | Text code produces far more failure per unit of progress |
| Wants an audience outside Scratch | Wants people who are not on Scratch to be able to open the thing | Web output has a natural audience; a terminal does not |

If your child is under 8, or still reading slowly, stay in blocks longer. Nothing is lost by waiting. [codeSpark](https://www.beginlearning.com/codespark/pdp) is word-free, so it works for kids who cannot read yet; it is now part of Begin Learning and its own domain redirects there. [Kodable](https://www.kodable.com/parents) covers roughly ages 4 to 10 and is paid for families: a seven-day trial, then US$24.99 a month, US$119.99 a year, or US$199.99 once, for up to four children. Its free Kickstart plan is on the school plans page, not the parent one. A pre-reader pushed into typed code will fail at reading, not at programming, and will not be able to tell the difference.

## Why the jump straight to Python is where most kids quit

Python is not a hard language. The problem is what happens to the reward-per-effort ratio on day one.

| What Scratch gave them | What Python day one takes away |
|---|---|
| Runs instantly in a browser | Install, editor setup, "python is not recognized as a command" |
| Errors are visible and recoverable | A red traceback; \`IndentationError\` caused by invisible whitespace |
| Output is a moving, coloured thing | Output is grey text in a terminal window |
| Something to show off in 20 minutes | Something to show off in several weeks |
| Syntax errors are structurally impossible | One missing colon stops everything |

A kid who was building playable games last month is now printing \`Hello, world\` and getting it wrong. They do not experience that as "the tool changed." They experience it as "I got worse at coding," and a meaningful number quietly conclude they are not a coding person. Python's real advantages, readability, libraries, a path into data and AI, show up around hour 20 to 40. Many kids never get there.

## Why HTML, CSS and JavaScript is usually the better bridge

1. **The browser is the runtime.** No install, no environment, no version conflicts. The wall that stops beginners before line one is simply absent.
2. **It fails gracefully.** A malformed HTML tag renders imperfectly instead of refusing to run. Partial correctness produces partial results, which is exactly what block coding trained them to expect.
3. **Feedback stays visual and fast.** Change a colour, save, refresh, see it. That loop is the thing they liked about Scratch, preserved.
4. **The output is a real artifact.** A page. A game with buttons and images. Not a console.
5. **The entire web is a worked example.** View Source and Inspect work on every site they already use. No other beginner language has millions of readable examples one right-click away.
6. **It is genuinely real code.** Brackets, quotes, semicolons, functions, conditionals, loops, event handlers. A kid who learns what a function and a loop are in JavaScript has learned them once, for good. Python later becomes syntax reskinning rather than a fresh start.

Two honest caveats. JavaScript has real weirdness, \`==\` versus \`===\`, type coercion, asynchronous code, that bites eventually. And HTML and CSS alone are markup and styling, not programming; the programming starts at JavaScript. Some kids build a good-looking page and stall there. Fine outcome, but do not mistake it for learning to program.

## The gap nobody serves well: ages 9 to 13 who want real typed code

This is worth stating plainly, because it explains why your search returned only listicles.

[Codecademy](https://www.codecademy.com/)'s [Terms of Service](https://www.codecademy.com/terms), §1.A, states: "You must be 16 years or older to use the Services." [freeCodeCamp](https://www.freecodecamp.org/) is nominally 13+ and is built for adult career changers. [Khan Academy](https://www.khanacademy.org/)'s computer science content is free and gentle, but it runs on legacy ProcessingJS and is visibly aging.

So the best-known platforms for real typed code are age-gated or aimed above exactly the children who just outgrew Scratch. That is a structural gap, not an oversight.

One more note: if you find a 2023 or 2024 article recommending Juni Learning, it is closed. Juni wound down its tutoring business in September 2025, a California WARN notice covering 121 employees, and consolidated onto its test-prep spinout, Acely. Do not sign up.

## Decision table: pick by your kid's actual signals

Start here: **Can they read fluently?** No → stay in blocks. Yes → **do they want to keep making games, specifically?** Yes → typed code inside a game. No → **do they want people to see the thing?** Yes → the web path. No → puzzle-and-logic path.

| Your kid | Best next step | Where to go |
|---|---|---|
| Under 8, or still reading slowly | Stay in blocks; add harder projects | [codeSpark](https://www.beginlearning.com/codespark/pdp) (word-free, now sold through Begin), [Kodable](https://www.kodable.com/parents) (paid for families, US$119.99/yr) |
| 8–12, loved making **games** and wants to keep making games | Typed Python or JavaScript inside a game world | [CodeCombat](https://codecombat.com/): freemium, roughly 9+, the strongest "keep making games" answer |
| 8–12, obsessed with **Minecraft or Roblox** | Modding path, the motivation is already there | [Tynker](https://www.tynker.com/) ($15/mo billed yearly, or $468 lifetime, up to 3 children) |
| 9–13, loved the "look what I made" part; wants something others can open | HTML, CSS, JavaScript in a browser | Any browser-based web editor; see the disclosure below |
| 9–13, loved the **puzzles and logic**, not the art | Structured typed-code puzzles | [CodeMonkey](https://www.codemonkey.com/) (US$8/mo individual, US$13/mo family, K–8), [CodeCombat](https://codecombat.com/) |
| 10+, more curious about **AI** than about code | AI literacy alongside coding | [CodeAI](https://code.org/): this is Code.org, which rebranded in June 2026 and shifted emphasis toward AI literacy; free |
| 11–13, asking for **Python by name** | Python, but inside something with visible output | [CodeCombat](https://codecombat.com/)'s Python path first; a beginner Python sequence second. Note Codecademy's 16+ age gate |
| 13–15, self-directed, reads well | Real adult-track courses | [Codecademy](https://www.codecademy.com/) (free Basic, ~$14.99/mo Plus, and check the 16+ term), [freeCodeCamp](https://www.freecodecamp.org/) |
| 15–18, wants a portfolio or a job someday | Full certification tracks | [freeCodeCamp](https://www.freecodecamp.org/), free, with real projects |

## What the first three months actually look like

Tell your kid this in advance, because it prevents most quitting:

**Their first typed project will be worse than their last Scratch project.** A game with sound, scoring and three levels becomes a page with a button that changes colour. That is not a drop in skill. It is the cost of moving from a tool that hid the machinery to one that shows it.

- **Weeks 1–2.** Typing pain, punctuation errors, "it just doesn't work." Sit nearby. Do not type for them; read errors aloud with them.
- **Weeks 3–6.** They stop fearing error messages and start reading them. That is the real milestone, more than any project.
- **Months 2–3.** They modify examples instead of following instructions, and ask for features nobody assigned. That is when it has taken.

Two or three hours a week is plenty. A kid who does 30 minutes four times a week will pass a kid who does one heroic Saturday.

---

## Disclosure: what we built, and who it is not for

We make **CodeIt** (codeitlearn.com), so treat this section as an ad and judge it accordingly.

CodeIt is a browser-based studio where kids build websites, games and quizzes by describing them, then change them by moving things and picking colours, and can open a tab that shows what the project is made of and links to a lesson for each idea in it. It also has AI-assisted project generation where the result stays editable instead of becoming a locked AI result. The loop is: make something, play it, change it, see what it is made of, and publish it. Built for ages 8 to 14. A learner aged 13 or over opens their own account; for anyone younger a parent or guardian confirms their email and creates a private managed profile, which CodeIt supports from age 5. The free plan does not expire, needs no card, and includes ten assisted project builds a month with one managed learner profile under a parent view. A paid family plan is available at CA$12 a month and can be cancelled at any time.

Two things we will not blur:

- **Our structured lesson sequence is Python, not web.** It is 31 beginner lessons, [starting with print](/lesson/1), then variables, strings, conditionals, loops, lists and functions. The HTML/CSS/JS side is learn-by-editing-your-own-project, not a graded course. If you want a sequenced web curriculum with lessons and checkpoints, we do not have one.
- **Under-13 managed profiles cannot publish publicly.** Sharing happens inside the parent-managed account. If your child's main motivation is a public link, wait until 13 or choose something else.

**CodeIt is not for you if:** your kid wants Minecraft or Roblox mods (go to Tynker), wants to keep making games above all (go to CodeCombat), cannot read yet (go to codeSpark), wants deep Python (go to Codecademy at 16+, or CodeCombat now), needs offline access, or you are buying for a school, we have no school, district, rostering or teacher-dashboard product.

---

## Common questions

**Is Scratch too babyish for a 12-year-old?**
Usually not. Scratch officially covers 8 to 16, and advanced projects involve cloning, lists, custom blocks and real algorithmic thinking. Social embarrassment is a legitimate reason to move on, but it is a social reason, not an educational one.

**Should we skip straight to Python because it is what schools use?**
Only if your child is around 12 or older and wants it. Younger than that, setup friction and text-only output cause more quitting than the language is worth. The concepts transfer either way. A loop is a loop.

**Is HTML actually coding?**
HTML and CSS are markup and styling. JavaScript is programming. The web path works as a bridge because it starts with the forgiving parts and adds real programming gradually.

**How long before they can build something real?**
On the web path, a simple real page in session one and something worth showing someone in two to three weeks. On the Python path, four to eight weeks before output stops being terminal text.

**What if they quit after two weeks?**
Common and usually recoverable. The cause is normally the visible-reward drop described above. Go back to a project they picked, make it smaller, and let them modify working code rather than start from a blank file.

---

*Last verified: 21 August 2026. Competitor pricing, age ratings and terms were checked on this date and change often, confirm on the vendor's own site before paying.*

## Try the translation, not just the theory

CodeIt's studio has a starter written for exactly this crossing: **Cat and mouse chase**, a game where every important line of real JavaScript carries a comment naming the Scratch block it replaces, "forever" becomes the animation loop, "when key pressed" becomes an event listener, "go to random position" becomes two lines of Math.random(). Your kid plays it first, then opens the code and finds a language they already half-speak.

[Open Cat and mouse chase in the studio](/builder?start=cat-chase), it loads instantly, free, no account needed.
`,
  },
];

export { GUIDES_A };
