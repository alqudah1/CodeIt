/* ─────────────────────────────────────────────────────────────
   CodeIt guides — long-form reference pages.

   These are written to be genuinely the best answer to a specific
   question, which means several of them recommend a competitor. That
   is deliberate: a page that only recommends CodeIt does not get
   cited by anything, and being useful is the whole mechanism.

   Both the React GuidePage component and the static-SEO build script
   render from this file, so the crawlable HTML and the page a person
   sees are always the same words.
───────────────────────────────────────────────────────────── */

const GUIDE_PAGES = [
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

CodeIt is a browser-based studio for ages 5–18. A learner describes a website, game or quiz and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows what the project is made of and opens the lesson behind each idea it used. Profiles for ages 5–12 are parent-managed and email-verified, and **managed under-13 profiles cannot publish publicly**; independent accounts start at 13. The free plan does not expire, needs no card, and includes ten assisted project builds a month across two learner profiles under one parent view. The family plan is CA$12/month, cancellable any time. There are 31 beginner Python lessons; there is no web curriculum, because the web side is the builder rather than a course. The honest fit is a homeschool parent, a small after-school club, or one or two children, not a class.

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

CodeIt is a browser-based studio where kids build websites, games and quizzes by describing them, then change them by moving things and picking colours, and can open a tab that shows what the project is made of and links to a lesson for each idea in it. It also has AI-assisted project generation where the result stays editable instead of becoming a locked AI result. The loop is: make something, play it, change it, see what it is made of, and publish it. Ages 5 to 18, with parent-managed, email-verified private profiles for ages 5 to 12 and independent accounts from 13. The free plan does not expire, needs no card, and includes ten assisted project builds a month with two learner profiles under a parent view. A paid family plan is available at CA$12 a month and can be cancelled at any time.

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
  {
    slug: "ai-built-it-now-edit-it",
    relatedLessons: [2, 4, 9],
    title: "Your Kid Used AI to Write Their Code. Now What?",
    description: "AI wrote your kid's project. The learning isn't lost, but it hasn't happened yet. What to ask, what to try this week, and both sides of vibe coding.",
    h1: "Your kid used AI to write their code. Now what?",
    lastVerified: "2026-08-21",
    targetQueries: [
      "my kid used ai to write their code",
      "should kids use ai to code",
      "is using chatgpt to code cheating for kids",
      "should kids learn vibe coding",
      "how do kids learn to code if ai writes it",
      "child used ai for coding homework what to do",
      "ai coding tools for kids parents guide",
      "does ai stop kids learning to program"
    ],
    markdown: `**Short answer:** the learning is not lost, but it has not happened yet either. It happens in what your child does next, changing the code, watching it break, and working out why, and you can start that this week with three questions, on any platform, without knowing how to code yourself.

In practice the tool is usually ChatGPT, Claude or whatever their friends are using, and which one matters far less than what happens after the code arrives. This page covers why kids reach for AI (it is rational, not lazy), what is genuinely lost when code arrives finished, why banning it fails, and where the "should kids learn vibe coding" argument actually stands. We build a product in this space and say so plainly near the end.

## Why kids reach for AI

Do the arithmetic from a 10-year-old's side. They want a working snake game. Route one is six hours of typing, punctuation errors and frustration. Route two is thirty seconds. No child picks route one on principle.

It is also not new. Kids have always optimised for the artifact rather than the process, copying tutorial code without reading it, remixing [Scratch](https://scratch.mit.edu/) projects and swapping the sprites, dropping free models into a Roblox game. AI is that instinct with a much better tool attached.

Two things follow. "Lazy" is the wrong diagnosis, and an expensive one: a kid told the shortcut is laziness stops telling you they used it, and you lose the conversation, which is the only tool that works here. And "make the thing" and "learn to make the thing" are different goals, only the first is your child's. The job is not to talk them out of it, but to attach the learning to it.

## What is actually lost when the code arrives finished

Not the typing. Typing is transcription, and nobody ever learned to program by being good at transcription.

What is lost is the debugging loop, which is where learning actually lives:

**predict → run → be surprised → form a theory → change one thing → test it**

That loop is the whole mechanism. It is how a kid builds a working mental model of what a computer does, and it only runs when something behaves unexpectedly. Code that arrives finished skips every step.

Reading finished code feels like learning and mostly is not, the fluency illusion. You recognise the material, so you rate your understanding highly, right up until you have to produce it. Watching someone play piano is not practice.

| What AI takes over | Does it matter? |
|---|---|
| Typing the characters | Barely. That was never the skill. |
| Remembering exact syntax | A little. Professionals look it up too. |
| Choosing what to build | Yes. Choosing is where the interest lives. |
| Breaking a problem into steps | Yes, a lot. This is the part that transfers to maths, writing and everything else. |
| The moment it does not work | Most of all. The surprise is the learning signal. |
| Staying with a stuck problem | Most of all. This trait predicts who keeps going. |

## Why "just ban it" fails

1. **It is unenforceable.** There is a phone, a friend's laptop, and school-issued tools.
2. **It moves the behaviour underground.** What you lose is not the AI use. It is the conversation, the only thing that actually changes how they use it.
3. **It is already inside the software.** Search, documentation, editors, and the learning platforms themselves. [CodeAI](https://code.org/), Code.org, which rebranded in June 2026, moved toward AI literacy rather than away from it. The industry will not help you hold this line.
4. **Directing an AI is a real skill.** It will be assumed of them the way search was assumed of you. A ban practises the wrong thing.

A ban converts a teachable moment into a compliance problem, and those you lose slowly.

**One real exception.** If the work is graded and the teacher's rule is no AI, that is an honesty question, not a pedagogy one. Handle it separately, and do not let it contaminate how you talk about AI in their own projects.

## Vending machine or starting draft?

This is the distinction that matters, and it has nothing to do with whether AI was used.

| AI as a vending machine | AI as a starting draft |
|---|---|
| Prompt, paste, done | Prompt, read, modify, break, extend |
| Cannot say what any line does | Can point at the line that does the thing |
| Bugs get fixed by prompting again | Bugs get fixed by changing code |
| The project is finished on arrival | Arrival is the beginning |
| The work belongs to the model | The work belongs to the kid |

**The one-question test.** Ask for a change nobody asked the AI for: "make the ball speed up each bounce," or "make the button turn green when you win." If the answer is a new prompt, you are in vending machine mode. If they open the code and start hunting, you are in draft mode.

Which mode a kid ends up in is mostly a property of the tool, not the child. Plenty of AI tools hand back a locked result. A file you cannot see into, or a chat answer that must be copied somewhere else before it will run. Whether a kid modifies the output is largely decided by whether modifying it is easy.

## Four things to try this week

Each takes about ten minutes and works with any tool, including a plain chatbot. You do not need to understand the code.

**1. Change one thing, but predict first.** Point at a number. "What happens if we make this 5 instead of 20?" Make them answer out loud before running it. The prediction is the exercise; running it is just marking.

**2. Break it on purpose.** Save first, then delete a line and ask what will stop working. Then restore it. Kids who have never deliberately broken code are afraid of it, and fear is what stops them experimenting.

**3. Ask about one line, but ask the better question.** Not "what does this do," which they answer by reading it back to you. Ask "what would go wrong if this line wasn't there?" That needs a mental model, not recall.

**4. Add one thing the AI did not.** A scoreboard, a second colour, a sound, a restart button. This is the real assessment. If they can add a feature, they understood it. If not, they did not, and now you both know, without an argument.

**Bonus: keep the prompt.** Have them write down what they asked for before reading what came back, then compare. What did the AI add, skip, or quietly change? That is specification practice, the half of the skill most likely to still matter in ten years.

## A short script for the conversation

Do not open with "did you write this yourself?" It is an accusation, and it buys you either a lie or a fight.

> **You:** That looks good. Did you use AI to build it?
> **Them:** Yeah.
> **You:** Makes sense, it is faster. Show me the part you would change first.
> **You:** What do you think breaks if you delete that line?
> **Them:** I don't know.
> **You:** Want to find out? Save it, then delete it and see.
> **You:** Now add one thing it doesn't do yet. Then it is actually yours.

If they get defensive: "I am not saying you cheated. I am asking whether you can change it, because that is the part worth anything."

What this communicates without lecturing: using AI is fine, and not being able to change what it made is the problem. That framing works because it is true, and because it gives them somewhere to go.

## Should kids learn "vibe coding"? Both sides

The term came into wide use in 2025. It means roughly: describe what you want in ordinary language, accept the generated code largely without reading it, and iterate by prompting rather than editing.

| The case for | The case against |
|---|---|
| It is increasingly how software actually gets built; pretending otherwise trains kids for a world that is leaving | You cannot evaluate output you cannot read, and evaluation is the skill everyone agrees survives |
| The durable skills shift to specification and judgment, saying precisely what you want, and telling whether you got it | Debugging generated code needs more understanding, not less; when it breaks, the kid is stranded in code they never wrote |
| It keeps motivation alive, and motivation is the scarcest resource in kids' coding, most quitting happens before any concept lands | The fluency illusion is strong; kids badly over-rate what they know, and the correction arrives late and hard |
| It lowers the barrier for kids who would never have survived setup and syntax, including kids with no parent who codes | Models produce plausible, subtly wrong code, and a beginner has no way to detect it. Confidence without accuracy is worse than neither |
| Professionals already work this way, and pretending they do not is dishonest with older teens | The workflow is a moving target. Betting a child's decade of learning on the 2026 way of prompting is a genuine gamble |

**Where the argument actually is.** Both sides are mostly arguing about sequence, not permission. Very few serious people think a 10-year-old should never touch AI, and very few think reading code is now optional. The disagreement is over how much foundation to install first and how much can be picked up alongside.

That is not settled, and anyone selling you certainty about it is selling. The part both camps agree on, and therefore the part worth practising this year: a kid who can modify generated code is better off than one who cannot, whichever side turns out to be right.

## What this looks like at different ages

| Age | What AI use tends to look like | Your job |
|---|---|---|
| 5–8 | Asks for a whole finished thing; cannot read most of the code | Sit with them. Treat the output like a picture book you read together. Nothing more is expected. |
| 9–12 | Generates projects happily, then gets stuck the moment they want a change | The key window. Each session: one prediction, one deliberate break, one added feature. |
| 13–15 | Uses AI for homework and personal projects, and may not mention it | Shift from supervision to conversation. The extension test is the whole assessment. |
| 16–18 | Works something like a junior developer | Talk about honesty policies and about reading before shipping. They should be able to explain any code they hand in. |

## What to look for in any tool

Ask these of any tool, including ours:

- Does the generated code stay visible and editable, or is it a locked result?
- Can the kid run a broken or half-finished version and see what happens?
- Is there save or version history, so breaking things on purpose is safe?
- Can the kid make a small change without starting a new prompt?

Yes to those keeps the debugging loop intact. No has replaced the loop with a delivery service.

---

## Disclosure: what we built, and who it is not for

We make **CodeIt** (codeitlearn.com). Treat this as an ad.

CodeIt is a browser-based studio where kids build websites, games and quizzes by describing them, then change them by moving things and picking colours, and can open a tab that shows what the project is made of and links to a lesson for each idea in it. The AI-assisted project generation is built so the result stays editable instead of becoming a locked AI result. The specific mechanic this page is about. The loop is: make something, play it, change it, see what it is made of, and publish it. Ages 5 to 18, with parent-managed, email-verified private profiles for ages 5 to 12 and independent accounts from 13. The free plan does not expire, needs no card, and includes ten assisted project builds a month with two learner profiles under a parent view. A paid family plan is available at CA$12 a month and can be cancelled at any time.

Things we will not blur:

- **Our structured lesson sequence is Python only**: thirty-one beginner lessons, [starting with print](/lesson/1), then variables, strings, conditionals, loops, lists and functions. The web side is learn-by-editing-your-own-project. There is no web curriculum.
- **Under-13 managed profiles cannot publish publicly.** Sharing happens inside the parent-managed account.
- **Ages 5 to 12 require a parent-managed profile.** This is not a set-and-forget product for young children.

**CodeIt is not for you if:** your household rule is no AI at all, we generate code, so we are the wrong product; your kid wants Minecraft or Roblox mods ([Tynker](https://www.tynker.com/)); your kid mainly wants to keep making games ([CodeCombat](https://codecombat.com/)); your teen wants a professional AI development workflow (they should be using real developer tools); you want a sequenced web-development course; or you are buying for a school, because we have no school, district, rostering or teacher-dashboard product.

---

## Common questions

**Is using AI to write code cheating?**
For a personal project, no, it is how the tools work now. For graded schoolwork where the teacher said not to, yes, and that is an honesty conversation rather than a technology one.

**My child cannot explain any of the code. Should I worry?**
Not immediately. Ask them to add one small feature the AI did not build. If they can, the understanding is ahead of the explaining. If they cannot, you have found the real gap, and the four exercises above are the fix.

**Will AI stop my kid from ever learning to code properly?**
Only if the loop never runs. Kids who only prompt and paste do not build a mental model. Kids who prompt and then modify are learning the way people have always learned from worked examples.

**What age should a kid start using AI coding tools?**
There is no verified research answer. Practically: under about 9, use it with them rather than handing it over. From 9 to 12 it works well as a starting draft with an adult nearby. From 13 they will use it whether or not you approve, so a habit of modifying beats a rule about access.

**Should I make them write code by hand first?**
Some fundamentals first helps, and a fully AI-first start leaves gaps. But holding a motivated kid at a blank file for months is the most reliable way to end their interest. Most families do better mixing the two than sequencing them strictly.

---

*Last verified: 21 August 2026. Platform names, pricing and terms were checked on this date and change often, confirm on the vendor's own site before paying.*`,
  },
  {
    slug: "what-did-my-kid-learn",
    relatedLessons: [4, 6, 9],
    title: "Did My Kid Learn Anything, or Did AI Do It?",
    description: "Your child built something with AI and it works. Here is how to tell whether they understood it, four checks you can run this week, on any platform.",
    h1: "Did my kid learn anything, or did AI do it?",
    lastVerified: "2026-08-25",
    targetQueries: [
      "did my kid actually learn anything from ai coding",
      "how do i know if my child understands the code",
      "is it still learning if ai wrote the code",
      "how to tell if my child is learning to code",
      "ai coding for kids is it real learning",
      "my child used ai to build a game did they learn",
      "how to check my kid understands their coding project",
      "coding apps for kids that show parents progress"
    ],
    markdown: `**Short answer:** ask them to do four things with their own code, in this order. Find where something is set. Say what happens if you change it. Change it and get the result they predicted. Write something small from an empty file. A child who can trace and modify understood it. A child who can only point at the line has not yet, and that is a starting point rather than a verdict. The four checks are below, with what to say and what a good answer sounds like.

Your child asked an AI for a game. A game appeared. It runs, it looks good, and they are proud of it. You have no way to tell whether they built something or typed a wish and received a result.

Every parent using an AI tool now has this question, and almost nobody answers it well. Platforms report time spent, lessons completed and badges earned. None of those numbers say whether the child understood what is on their screen. Here is how to find out, whatever tool they use.

## What "learning" even means when AI wrote the first draft

Drop the idea that learning means typing every character. Following a tutorial line by line, remixing someone else's [Scratch](https://scratch.mit.edu/) project: these are how beginners have always started, and all involved code the child did not invent.

What matters is whether the child can **operate** on the code in front of them. Four abilities, in order of difficulty:

| Ability | What it looks like | How hard |
|---|---|---|
| Locate | "The speed is set on line 14" | Easiest |
| Trace | "If I change 14 to a bigger number, it falls faster" | Real understanding starts here |
| Modify with intent | Gets a specific result they described first | Solid evidence |
| Build from nothing | Writes something working from a blank file | Hardest |

Most parents fear the child is at zero. Usually they are somewhere in the middle, and the middle is worth something. Nothing on screen tells you which rung.

## Four checks you can run this week

None require you to code, and all work on any platform, [Scratch](https://scratch.mit.edu/), [Tynker](https://www.tynker.com/), [Roblox Studio](https://create.roblox.com/), [Lovable](https://lovable.dev/), anything.

**1. Predict, then run.** Ask them to change one number and say what will happen *before* pressing run. The prediction is the whole test. Being wrong and then saying "oh, I see why" counts as a pass.

**2. Break it on purpose.** Ask them to stop it working, then fix it. A child who can break a chosen part knows what that part does. One who cannot find the way back was not reading it.

**3. Explain one line.** Ask what a single line does, in their own words, no jargon. "That makes it move" is a pass if they can point at which part is the moving.

**4. What next, and why.** A vague answer ("more levels") is fine at first. A specific one ("a second enemy starting on the other side") means they hold a working model of their own program.

A script that works for a non-technical parent:

> "Show me the part that makes it move."
> "If I made that number twice as big, what happens?"
> "Okay, try it. Were you right?"
> "Can you break it so it stops working? Now put it back."
> "What would you add next?"

Five minutes, every couple of weeks. You will hear the change in the answers long before any dashboard shows it.

## Why most comprehension quizzes are worth so little

Most platforms attach quizzes to lessons, and almost all ask general questions: *what does a for loop do?* A child can answer that correctly and understand nothing about the program they just made, or get it right only because they remember the phrasing from a video ten minutes earlier.

There is a sharper kind of question, and the difference is not cosmetic.

| | General question | Question from the child's own file |
|---|---|---|
| Example | "What does a variable do?" | "In your project, what does \`fallSpeed\` start as?" |
| Can be answered by | Recalling a lesson | Reading their own code |
| Can be looked up | Yes | No |
| Can be memorised | Yes | No, every project differs |
| Proves | Familiarity with a term | They opened the file and traced a value |

A question drawn from the child's own file cannot be answered from general knowledge, looked up, or shared between two children. There is no way to get it right except by reading what you wrote. That is the entire argument, and it is worth more than any streak counter.

The same logic applies to the wrong answers. If the choices are \`0\`, \`1\` and \`100\` and the real value is \`3\`, a child can guess. If the wrong answers are other real numbers from the same file, guessing collapses. Every option looks plausible, and only reading resolves it.

## The rule that makes it evidence: first try only

Here is the part most systems get wrong. If a child can retry a question until it turns green, it has stopped measuring comprehension and started measuring persistence with a mouse. Everyone eventually gets 100%.

So the rule has to be: **only answers correct on the first attempt count as evidence.** Retries still help the child, getting it wrong and seeing why is how people learn, but they should not count toward what a parent is shown. A record built this way is small and honest. One built on retry-until-right is large and meaningless.

## What this proves, and what it does not

Answering questions about your own file is real evidence: the child read their code, located something specific, and traced a value. That is the rung most parents fear was never reached.

It is **not** proof:

- That the child could write the same code from a blank file.
- That they could apply the idea to a different problem next month.
- That they understand *why* it is written that way rather than another way.
- That they will remember it in six weeks.

Transfer, using an idea in a new situation, is what everyone actually wants, and nobody in this market measures it well. Any product claiming a handful of in-project questions prove your child "understands programming" is overclaiming. The honest version is narrower: here is what they demonstrated, on this project, on the first try.

## The fair case for starting from generated code

There is a serious argument on the other side and it deserves a straight presentation.

Working programmers read and modify far more code than they write from scratch. Joining a team means opening a codebase you did not write and finding your way around it. Reading unfamiliar code is not a lesser skill than authoring it, for most professional work it is the more used one. A child who spends a year reading, tracing and modifying real code is practising much of what the job consists of.

The alternative for a beginner was often worse: a blank screen, a syntax error, no idea why, and quitting in week two. That is why [Scratch](https://scratch.mit.edu/) and [Tynker](https://www.tynker.com/) use blocks and why [CodeCombat](https://codecombat.com/) and [CodeMonkey](https://www.codemonkey.com/) wrap the work in a game. Generated code removes blank-page failure another way.

The counter-argument is equally real: fluency comes from production, not only recognition. Struggling to make something work from nothing builds durable knowledge that reading does not. [Codecademy](https://www.codecademy.com/) and [Khan Academy](https://www.khanacademy.org/computing/computer-programming) are built on that premise, and they are not wrong.

Both are true. Reading-first is a good start and a bad finish. If your child has used AI tools for months and never started from nothing, that is the gap to close, not because the AI work was fake, but because it was one half.

## What different tools tell a parent

| Tool type | Examples | What a parent typically sees |
|---|---|---|
| Block-based | [Scratch](https://scratch.mit.edu/), [Tynker](https://www.tynker.com/) | The project itself; judge by looking |
| Course-based | [Codecademy](https://www.codecademy.com/), [Khan Academy](https://www.khanacademy.org/computing/computer-programming) | Lessons completed |
| Game-based | [CodeCombat](https://codecombat.com/), [CodeMonkey](https://www.codemonkey.com/) | Levels cleared |
| Sandbox | [Roblox Studio](https://create.roblox.com/) | Whatever the child shows you |
| Professional AI builders | [Lovable](https://lovable.dev/), [v0](https://v0.app/), [Bolt](https://bolt.new/) | Nothing, not education products, and they do not claim to be |

Lessons completed and levels cleared are attendance records. They say the child was present. They do not say what the child could do with their own program, which is what you actually asked.

---

### Disclosure: we make a tool in this space

We build **CodeIt** (codeitlearn.com), a browser-based studio for ages 5 to 18, so treat this as an ad. A learner describes a website, game or quiz, and AI builds a working first version in plain HTML, CSS and JavaScript. They then change it in place: moving elements, picking colours and fonts, or asking for a change in plain language. A separate view shows which programming ideas the finished project uses, and links each one to its lesson. Errors are caught in the sandbox, rewritten in plain language and pointed at the learner's own line number, and one button restores the last version that ran. [Understanding checks](/builder) are generated from the learner's own file, with wrong answers taken from other real values in that file, and **only first-attempt correct answers are recorded** for the parent view. Finished work sits on a shelf on the front page instead of being overwritten by the next project. Profiles for ages 5 to 12 are parent-managed and email-verified; independent accounts start at 13. Free now, no card required.

**Who this is not for.** We have no study showing this improves learning outcomes, and we do not claim this evidence proves a child could write code from scratch or transfer the idea elsewhere, the limits above apply to us too. Managed under-13 profiles cannot publish publicly. There are 31 beginner Python lessons and **no web curriculum**; the web side is the builder itself. If your household rule is no AI at all, we generate code, so we are wrong for you. For Minecraft or Roblox mods, see [Tynker](https://www.tynker.com/); for coding games, [CodeCombat](https://codecombat.com/); for a professional workflow, a teenager should use real developer tools. We have no school, district or teacher-dashboard product.

---

## Common questions

**What is the single best check?** Ask them to predict what a change will do before running it. Everything else is a variation on that.

**My child just says "the AI did it."** That is information, not failure. Ask a smaller question, one line, one number.

**Should I stop them using AI tools?** Not necessarily. Pair it with something requiring production from nothing: a course, a class, or adding one feature unaided.`,
  },
  {
    slug: "glitch-shutdown",
    relatedLessons: [1, 9],
    title: "Glitch Shut Down: Where Beginner Web Projects Live Now",
    description: "Glitch ended web hosting on 8 July 2025. What was lost, what happened to existing projects, why redirects expire, and where to go now.",
    h1: "Glitch shut down. Where do beginner web projects live now?",
    lastVerified: "2026-08-23",
    targetQueries: [
      "glitch shut down",
      "glitch alternative free hosting",
      "is glitch still working",
      "glitch.me link not working",
      "what happened to glitch.com",
      "free alternative to glitch for beginners",
      "where to host a beginner web project free",
      "glitch replacement node.js free"
    ],
    markdown: `**Short answer:** Glitch ended all web app hosting and user app profiles on **8 July 2025**, citing "high operational costs and increasing misuse by bad actors." If you followed a tutorial that told you to "remix this on Glitch," that instruction no longer works, and the glitch.me link you were given is either dead or running on a redirect that is close to expiring.

This page covers what exactly stopped working, what happened to projects people had already built, why the redirects are on a clock, and where to go now, sorted by what you were actually using Glitch for. Some of those use cases have a clean replacement. One of them does not.

## What shut down, and when

| Date | What happened |
|---|---|
| May 2025 | Shutdown announced. Glitch Pro closed to new signups. |
| **8 July 2025** | All web app hosting stopped. User app profiles removed. Live glitch.me sites went dark. |
| Through end of 2025 | Dashboards stayed open so people could download their project code and set up redirects. |
| **31 December 2025** | Final deadline to configure a project URL redirect. After this, no new redirects. |
| End of 2026 | Redirects were promised to work "at least through the end of 2026." That is the floor, not a guarantee of more. |

That last row is the part most people miss. If you set up a redirect in 2025 and stopped thinking about it, it is now on borrowed time: the only commitment made was "at least through the end of 2026." Anything pointing at that URL, a portfolio, a course page, a README, a school handout, should be repointed now rather than after it breaks.

Glitch said it would "focus on helping developers share and discover remixable apps." The company did not disappear. The hosting did.

## What was actually lost

It is easy to describe Glitch as "free hosting" and conclude that any free host replaces it. That misreads why it mattered.

Glitch put four things in the same browser tab, with no setup between them:

1. **Remixable examples.** You started from a working app, not a blank file. Click remix, you have your own copy.
2. **In-browser editing.** No install, no local dev environment, no terminal.
3. **Instant hosting.** Every project had a live URL from the first second, updating as you typed.
4. **No account friction to *see* things.** You could look at and copy real, running code before committing to anything.

The combination is what has no replacement. Plenty of services do any one of these well. Almost nothing does all four with zero setup, which is precisely why so many beginner tutorials, school courses and "build your first web app" guides leaned on it, and why so many of those guides are now quietly broken. If you are working through a tutorial that mentions Glitch, the tutorial is stale. That is not your mistake.

## What happened to projects people had already made

Code was downloadable from the dashboard through the end of 2025. If you did that, you have a folder of files and you can move it anywhere below. If you did not, the window has closed and the dashboard-based export route is gone. Check old email for anything you sent yourself, and check whether the project was ever pushed to GitHub, a fair number of Glitch projects were.

If the project was a static site (HTML, CSS, JavaScript, no server), the files will work anywhere. If it had a Node backend, environment variables and any data stored in the project will not have come along cleanly.

## Where to go now, by what you were using Glitch for

| You used Glitch to… | Best move now | What you actually run into |
|---|---|---|
| Host a static site (HTML/CSS/JS) | [Neocities](https://neocities.org/) or [GitHub Pages](https://pages.github.com/) | Neocities: account + email; its terms state no minimum age. GitHub Pages: **13+ required**, and you need basic repo concepts. |
| Host a static site with drag-and-drop | [Netlify](https://www.netlify.com/) drop | Account required; terms state 13+. No card for the free tier. |
| Same, on Vercel | [Vercel](https://vercel.com/) | Account required; **its terms state you must be at least 16**, higher than most people assume, and it rules out a lot of learners. |
| Share a code snippet or demo | [CodePen](https://codepen.io/) or [JSFiddle](https://jsfiddle.net/) | Fine for a snippet or single page. These are not whole-site hosts; do not try to make one a website. |
| Publish a browser game | [itch.io](https://itch.io/) | Account required. Users 13+; **publishers must be 18+ or have parental/guardian consent.** |
| Run a small Node/Express backend for free | No clean answer. See below. | This is the genuine gap. |
| Remix someone's working example | [CodeSandbox](https://codesandbox.io/), [StackBlitz](https://stackblitz.com/), GitHub template repos | Closest in spirit. Hosting is more limited and the free tiers move around. |
| Teach a class | GitHub Pages plus [GitHub Classroom](https://classroom.github.com/), if students are 13+ | Under-13 classes are the hardest case. There is no drop-in equivalent. |

## The part with no good answer: free Node backends

If your Glitch project had a server, an Express app, a Discord bot, a webhook receiver, anything with a database, there is no free replacement that works the way Glitch did.

[Render](https://render.com/), [Railway](https://railway.com/) and [Fly.io](https://fly.io/) all host Node apps. All three involve a git repo or a CLI, an account, and free tiers that sleep, expire, or ask for a card at some point. [Cloudflare Workers](https://workers.cloudflare.com/) has a generous free tier but a different programming model that older tutorials will not match.

None of them let a twelve-year-old click "remix" and have a running server thirty seconds later. That specific thing is gone, and it is worth being blunt about it rather than pretending a replacement exists.

## If you are a parent or teacher who just found a dead link

Most beginner tutorials that used Glitch built static pages, not servers. In that case the project is easy to rescue: HTML, CSS and JavaScript are ordinary files, and any host in the table will serve them. The work is not lost; the address was.

---

### Disclosure: we make a tool in this space

We build **CodeIt** (codeitlearn.com), a browser-based studio where a learner describes a website, game or quiz and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows what the project is made of and opens the lesson behind each idea it used. The project stays open and changeable rather than locked. Free tier: a monthly allowance of assisted project builds and two learner profiles with parent view, free now, no card required. Ages 5-18, with parent-managed, email-verified profiles for 5-12 and independent accounts from 13.

**Who this is not for, and where we are not the answer on this page.** If your goal is to get a Glitch project you already built back online, it is not a migration tool and not a host for your existing files, use Neocities or GitHub Pages. If you need a Node backend, we do not do that at all. And importantly for this topic: **managed under-13 profiles cannot publish publicly.** If the whole point is a live link a child can send to friends, that constraint matters, and for a child under 13 a parent-owned Neocities or GitHub Pages account is the more honest route. This is a tool for the learning loop, make something, change it, then see what it is made of, save it, not a replacement for hosting.

---

## Common questions

**Is Glitch completely gone?** The company is not, but web app hosting and user app profiles are. Hosting ended 8 July 2025 and is not coming back.

**My glitch.me link still works. Why?** You or the project owner set up a redirect before the 31 December 2025 deadline. Those were promised to work at least through the end of 2026, so it is running out. Repoint it now.

**Can I still download my old project?** The dashboard route closed at the end of 2025. Check GitHub and old emails.

**What is closest to the old Glitch feeling?** CodeSandbox and StackBlitz for remixing and in-browser editing; Neocities for the "make a page, it is live, no ceremony" part. Nothing does both at once.

*Last verified: 23 August 2026.*`,
  },
  {
    slug: "publish-first-project",
    relatedLessons: [1, 15],
    title: "How to Publish a First Website for Free (Real Friction)",
    description: "Putting a first website online free: which hosts need an account, a card, git knowledge, or a minimum age, and which quietly exclude kids.",
    h1: "How to actually publish a first website for free",
    lastVerified: "2026-08-23",
    targetQueries: [
      "how to publish a website for free",
      "free website hosting for beginners",
      "how to put my html file online",
      "github pages age requirement",
      "free web hosting for kids",
      "how do i share my website with a link",
      "is it safe for my child's website to be public",
      "free static site hosting no credit card"
    ],
    markdown: `**Short answer:** if you have a folder with an \`index.html\` file in it, you can have a public link in about ten minutes for no money, and the two most common good choices are [Neocities](https://neocities.org/) and [GitHub Pages](https://pages.github.com/). The catch is not price. It is friction, and the friction is different for a 30-year-old than for a 10-year-old.

This page lists the real requirements for each option: whether you need an account, an email address, a credit card, any knowledge of git or a command line, and, the one most guides skip, whether there is a minimum age that silently rules a child out.

## First, what "publishing" actually means

A website is a folder of files. Publishing means putting that folder on a computer that is always on, so anyone with the address can ask for those files. That computer is the host; the address is the URL.

If your project is HTML, CSS and JavaScript only, it is a **static site**, and static hosting is free almost everywhere because serving a file is cheap. Nearly every first website is static, which is good news. You need one file named exactly \`index.html\`: that is the page a host shows when someone visits the address with nothing after it.

## The options, with the real friction

Every option below needs an account and an email address. None of them asks for a card on the free tier.

| Option | Git / CLI | Minimum age | Free custom domain |
|---|---|---|---|
| [Neocities](https://neocities.org/) | No, upload files in the browser | Terms state none | No (paid feature) |
| [GitHub Pages](https://pages.github.com/) | Some. Repo concepts at minimum | **13+** | Yes, if you own a domain |
| [Netlify](https://www.netlify.com/) drop | No, drag a folder | 13+ | Yes, if you own a domain |
| [Vercel](https://vercel.com/) | Usually git or CLI | **16+** | Yes, if you own a domain |
| [Nekoweb](https://nekoweb.org/) | No, browser editor | Check current terms | No |
| [Cloudflare Pages](https://pages.cloudflare.com/) | Git or CLI | 13+ (18 to contract) | Yes, if you own a domain |
| [CodePen](https://codepen.io/) | No | 13+ | No |
| [itch.io](https://itch.io/) (games) | No, upload a zip | 13 to use; **18+ or guardian consent to publish** | No |

"Free custom domain" means the host serves a domain you own at no extra charge, you still buy the domain separately. "No card" means the free tier does not ask for one at signup; that can change, so check before relying on it.

## The 13+ problem nobody mentions

This is the single most useful thing on this page. **GitHub requires account holders to be 13 or older.** Its terms say so plainly, because of US children's privacy law. So do Netlify, CodePen and Cloudflare. Vercel goes further and requires 16.

Nearly every "publish your first website free" tutorial recommends GitHub Pages without mentioning this. If you are a parent following one of those guides with a 9-year-old, you will get most of the way through and then be asked for a date of birth. The workaround people reach for, entering a false birth year, creates an account that violates the terms and that your child does not legally control.

The honest options for a child under 13 who wants a public link:

1. **A parent-owned account.** The parent creates and owns the GitHub, Neocities or Netlify account and publishes the child's work under it. This is legitimate, it is what the terms contemplate, and it keeps an adult in the loop. It is the route we would suggest first.
2. **Neocities**, whose terms do not state a minimum age, though a parent should still set it up and hold the login.
3. **Do not publish publicly yet.** Share the actual file instead. An HTML file opens in any browser by double-clicking it, and can be emailed or put in a shared drive. Relatives can see the project without it being on the open internet.

Option three is underrated. A public URL is not a requirement for a child to be proud of something.

## "Is it safe for my child's project to be public?"

The honest answer has three parts, and only one of them is about hackers.

**The code is not the risk.** A static page cannot be broken into in any meaningful sense. There is no login, no database, nothing to steal. The worst realistic outcome is that someone copies the source, which is how the web has always worked.

**The content is the risk.** Kids put their full name, school, town, sports team and photos into an "About Me" page, because that is what a personal page is. That becomes public and searchable. Before anything goes live, read every word on the page with an adult. First name only is a reasonable default.

**The account is the risk.** A public site under a real name is a durable, searchable record attached to a child. Publish under a nickname unless there is a reason not to, and keep the login with a parent.

One more practical point: a static site has no comments and no messages, which makes it substantially safer than most places a child could put creative work. Nobody can reply to it. That is a feature.

## A ten-minute path for an adult with an HTML file

1. Put your files in one folder, with the main page named \`index.html\`.
2. Go to [Netlify Drop](https://app.netlify.com/drop) and drag the folder onto the page.
3. You get a live URL immediately. Sign in to keep it permanently.

If you would rather learn what professionals use, do the same project on GitHub Pages instead. It takes longer and you will meet repositories and commits, but that knowledge is reusable everywhere.

## What about a domain name?

You cannot get a genuinely good custom domain for free. Registrars charge roughly $10-15 a year for a \`.com\`. Hosts above will serve a domain you own at no extra cost, but the domain itself is the paid part. For a first project, the free subdomain you are given, \`yourname.neocities.org\`, \`yourname.github.io\`, is completely fine.

---

### Disclosure: we make a tool in this space

We build **CodeIt** (codeitlearn.com), a browser-based studio where a learner describes a website, game or quiz and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows what the project is made of and opens the lesson behind each idea it used. The project stays open and changeable, not locked. The loop is: make something, play it, change it, see what it is made of, and publish it. Free tier: a monthly allowance of assisted builds, two learner profiles with parent view, free now, no card required.

**Where we are not the answer.** This page is about publishing, and on publishing we are not the strongest option. It does not host your own domain and is not a general web host, if you already have files and want them online, Neocities or GitHub Pages is the right tool and we would point you there. Most importantly: **managed profiles for under-13s cannot publish publicly.** For a child under 13 whose specific goal is a public link, a parent-owned Neocities or GitHub Pages account is the honest route, not us. Independent accounts start at 13; profiles for ages 5-12 are parent-managed and email-verified.

---

## Common questions

**Do I need to buy hosting?** No. Static hosting for a personal site is free on every option above.

**Do I need to know git?** Not for Neocities, Netlify Drop, Nekoweb or CodePen. Yes, at least a little, for GitHub Pages, Vercel and Cloudflare Pages.

**Can my 10-year-old have their own GitHub account?** No. GitHub's terms require 13 or older. Use a parent-owned account.

**Will anyone find my site?** Not by accident. A new site with no links pointing at it gets essentially no traffic; sharing the link is how people arrive.

**Can I take it down later?** Yes, on all of them. Search engines may keep a cached copy for a while, which is one more reason to be careful about what goes on the page in the first place.

*Last verified: 23 August 2026.*`,
  },
  {
    slug: "first-browser-game",
    relatedLessons: [6, 19, 31],
    title: "Make a Small Browser Game You Can Actually Read",
    description: "How to build a browser game you can share as a link and understand the code of, plain JavaScript, KAPLAY (formerly Kaboom.js), Phaser and p5.js compared.",
    h1: "Make a small browser game you can actually read",
    lastVerified: "2026-08-23",
    targetQueries: [
      "how to make a browser game",
      "make a game with html css javascript",
      "kaboom.js vs kaplay",
      "easiest game engine for beginners",
      "javascript game library for kids",
      "make a game i can share as a link",
      "roblox vs javascript game for kids",
      "phaser vs p5.js for beginners"
    ],
    markdown: `**Short answer:** if you want a game that runs at a link and whose code you can understand and change, build it in plain HTML, CSS and JavaScript, or with a small library like [KAPLAY](https://kaplayjs.com/), [Phaser](https://phaser.io/) or [p5.js](https://p5js.org/). If instead the goal is a game your friends will actually play, [Roblox](https://www.roblox.com/) wins on distribution and nothing else is close. Those are two different goals and it is worth deciding which one you have before you start.

This page is about the first goal: a small game, running in a browser, made of code you can open and read. It also covers what happened to Kaboom.js, because a lot of tutorials still use a name that no longer exists.

## Decide which goal you have

| Route | Language | Runs in a browser? | Share as a link? | Can a beginner read the code? |
|---|---|---|---|---|
| **Plain HTML/CSS/JS** | JavaScript | Yes | Yes | Yes. This is the point |
| **KAPLAY / Phaser / p5.js** | JavaScript | Yes | Yes | Yes, with a bit of library learning |
| **[Scratch](https://scratch.mit.edu/)** | Blocks | Yes | Yes, on Scratch | There is no text code to read |
| **[Roblox](https://create.roblox.com/)** | Lua | No, needs the Roblox app | Only inside Roblox | Partly, but the platform is most of the work |
| **[Unity](https://unity.com/)** | C# | Web export exists, awkward | Sometimes | Not early on |
| **[Godot](https://godotengine.org/)** | GDScript | Web export exists | Sometimes | Somewhat, after a big download |
| **[pygame](https://www.pygame.org/)** | Python | **No** | **No** | Yes, but nobody can play it |

Two rows deserve a straight answer.

**pygame** is a common recommendation for kids learning Python, and the code really is readable. But it does not run in a browser, so there is no link to send. The player has to install Python and run a file. For a 12-year-old whose motivation is showing friends, that is usually where the project dies.

**Roblox** is the opposite trade. The code is Lua, the tooling is heavy, and a beginner spends more time on the platform's systems than on programming. But it is where the players are. If the sentence in your head is "I want people to play my game," Roblox is the honest answer and this page is not. If the sentence is "I want to understand how a game works," keep reading.

## The plain JavaScript route

You can build a real game with no library at all. A web page can already draw shapes, respond to key presses and run a loop many times a second. That is a game engine in miniature, in about thirty lines.

Every browser game has the same three parts:

1. **State**: variables holding where things are and what the score is.
2. **A loop**: a function that runs roughly 60 times a second, updates the state, and redraws.
3. **Input**: event listeners for keys, clicks or taps that change the state.

Games that work well with no library: Pong, Snake, a clicker, Breakout, a memory game, a quiz, a simple maze. Games that do not: anything with many animated sprites, physics or scrolling levels. That is where a library earns its place.

Start with no library anyway. Understanding the loop is what makes every later tool make sense.

## Kaboom.js is now KAPLAY, and tutorials have not caught up

If you search for a beginner JavaScript game library, you will find a lot of writing about **Kaboom.js**. That name is retired.

Kaboom.js was built at [Replit](https://replit.com/). After Replit stopped developing it, the community took the project over, but Replit kept the original repository and the "Kaboom" trademark, so the community version was renamed. It now lives at [kaplayjs.com](https://kaplayjs.com/) and [github.com/kaplayjs/kaplay](https://github.com/kaplayjs/kaplay), and is community-maintained and open source.

The practical upshot for anyone following an old tutorial: the code mostly still works. KAPLAY was built as a drop-in successor, so in most cases you change the import or script tag to point at KAPLAY and the rest of the tutorial's code is unchanged. If a tutorial's example fails, check the library reference first. The name is usually the problem, not your typing.

## The three libraries worth knowing

| Library | Best for | Learning cost | Notes |
|---|---|---|---|
| [KAPLAY](https://kaplayjs.com/) | Arcade and platform games, sprites, collisions | Low | The former Kaboom.js. Has an online playground. Friendliest of the three for a first sprite game. |
| [Phaser](https://phaser.io/) | Bigger, more serious 2D games | Medium | The most established. Far more tutorials and Stack Overflow answers, which matters when stuck. Heavier to start. |
| [p5.js](https://p5js.org/) | Visual, creative, generative work; simple games | Low | Not a game library, a creative coding library. Excellent if the interest is drawing, animation and art as much as games. Strong beginner documentation. |

A reasonable order: plain JavaScript first, then KAPLAY or p5.js depending on whether the interest is arcade games or visual art, then Phaser if the projects outgrow it.

## What to build first

Something too small. The most common failure is a first project scoped like a commercial game, which stalls in week two and ends the interest.

A good first browser game has one mechanic, one screen, no levels, no saving and no menu. Snake, Pong or a clicker teaches the loop, input handling and collision detection, most of what any 2D game is. Add a second thing only after the first works.

## Where a browser game can be shared

A browser game is a website, so everything on the publishing side applies. Any static host will serve it: [Neocities](https://neocities.org/), [GitHub Pages](https://pages.github.com/) (13+ to hold an account), [Netlify](https://www.netlify.com/).

[itch.io](https://itch.io/) is the natural home for games specifically, and it accepts HTML5 uploads as a zip. Note its terms carefully before assuming a child can use it: players must be 13 or older, and **publishers must be 18 or older, or have parental or guardian consent.** For a young creator that means a parent is involved by design, not by accident.

---

### Disclosure: we make a tool in this space

We build **CodeIt** (codeitlearn.com), a browser-based studio where a learner [describes a website, game or quiz](/builder) and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows what the project is made of and opens the lesson behind each idea it used. The project stays open and changeable rather than locked. The loop is: make something, play it, change it, see what it is made of, and publish it. Free tier: a monthly allowance of assisted project builds, two learner profiles with parent view, free now, no card required. Ages 5-18, with parent-managed, email-verified profiles for 5-12 and independent accounts from 13.

**Who this is not for.** Games here are browser games in HTML, CSS and JavaScript. We do not do Unity, Godot, Roblox Lua or pygame, there is no multiplayer, no mobile app export, and no route to an app store, if any of those is the goal, use the tool built for it. We also have no web curriculum: there are 31 beginner Python lessons, but the web side is the builder itself, not a course. And note that managed under-13 profiles cannot publish publicly, so if the goal is a link a young child can send around, a parent-owned itch.io or Neocities account is the more direct route.

---

## Common questions

**Is Kaboom.js dead?** The name is retired. The project continues as KAPLAY at kaplayjs.com, community-maintained. Old Kaboom tutorials usually work after changing the import.

**Should a beginner use a game engine like Unity or Godot?** Not for a first game. Both are downloads with large interfaces, and a beginner spends the first weeks on the editor rather than on programming. Browser games skip that entirely.

**Is Scratch a waste of time before this?** No. Scratch teaches loops, conditionals, events and variables properly. The reason to move on is wanting to read and write text code, not that Scratch was wrong.

**Can I make a multiplayer game this way?** Not easily. Multiplayer needs a server, which is a substantially harder project. Build several single-player games first.

**JavaScript or Python for game programming?** JavaScript, if the game needs to run at a link. Python is a fine first language, but pygame games cannot be shared as a URL.

*Last verified: 23 August 2026.*`,
  },
  {
    slug: "ai-builder-you-can-edit",
    relatedLessons: [2, 9, 25],
    title: "AI Built Your Website. Can You Change It?",
    description: "Lovable, v0 and Bolt all let you export code, so the lock-in question is subtler. A six-point checklist for judging any AI builder.",
    h1: "AI built your website. Can you change it?",
    lastVerified: "2026-08-23",
    targetQueries: [
      "can you edit ai generated website code",
      "lovable vs v0 vs bolt export code",
      "ai website builder lock in",
      "do you own the code lovable generates",
      "ai app builder that lets you edit code",
      "what happens if i stop paying for lovable",
      "learn to code with ai website builder",
      "ai builder or learn html css javascript"
    ],
    markdown: `**Short answer:** with the main tools, [Lovable](https://lovable.dev/), [v0](https://v0.app/), [Bolt](https://bolt.new/), yes. All three show you the code, let you edit it, and let you get it out, and Vercel states plainly that it does not own what v0 generates. The lock-in worry that dominated conversation about these tools in 2024 is largely out of date, and it is worth saying so before criticising anything.

The real problem is narrower and less discussed: **exportable is not the same as readable.** You can download a folder you cannot understand, and if you cannot understand it you still cannot fix it, extend it, or move it without the tool that made it. This page gives a six-point checklist for judging any AI builder, and it separates the answer for someone shipping a product from the answer for someone trying to learn.

## What the main tools actually do

| Tool | See the code | Edit it in place | Get it out | Ownership |
|---|---|---|---|---|
| [Lovable](https://lovable.dev/) | Yes | Yes | Two-way GitHub sync; free plan can download code directly | Repos are yours, private by default; disconnect without losing the repo |
| [v0](https://v0.app/) (Vercel) | Yes | Yes | Export locally; two-way GitHub sync with branches and pull requests | "Vercel doesn't own the code generated based on your queries and prompts" |
| [Bolt](https://bolt.new/) | Yes, code view | Yes | Download as a zip; GitHub sync | Runs locally after \`npm install\` |
| [Replit Agent](https://replit.com/) | Yes | Yes, full IDE | Git and download | Standard Replit terms |
| [Base44](https://base44.com/), [Mocha](https://getmocha.com/), [Dyad](https://www.dyad.sh/) | Varies | Varies | Varies, check before depending on it | Varies |

So the crude version of the criticism, "AI builders trap your code", is not accurate about the leaders. Where a claim varies by plan, check the current documentation rather than trusting any comparison page, including this one.

## The problem that is real

Download a Lovable or v0 project and look at what arrives. Typically a Next.js or React application, Tailwind for styling, shadcn/ui components, a package manifest, a build configuration, and somewhere between forty and two hundred files. It will not open in a browser by double-clicking; it needs Node.js and a build step before it shows anything.

That is a completely normal professional codebase, and for a working developer it is ideal, familiar, standard, immediately productive.

For a beginner it is a wall. The gap between "I made a website" and "I understand this folder" is enormous, and nothing in the export closes it. The export right is real; the practical freedom is not, because freedom to modify code you cannot read is theoretical.

This is the distinction that matters:

| | Exportable | Readable |
|---|---|---|
| Means | The files are yours to take | You can open a file and know what it does |
| Provided by | Lovable, v0, Bolt, Replit | Depends on the stack generated |
| Protects | Ownership; ability to hire someone | Ability to fix things yourself |
| Enough alone? | For a business, usually | For learning, the only one that counts |

## The six-point checklist

Before depending on any AI builder, get an answer to each of these. They are ordered from easiest to verify to most often skipped.

**1. Can you see the code?** Not a preview, the actual files. If a tool never shows source, that is disqualifying for anything beyond a throwaway prototype.

**2. Can you edit it, and do your edits survive?** The second half is the important one. Some tools let you type in a file and then overwrite your changes on the next generation. Make a small manual edit, prompt again, check it is still there.

**3. Can you get it out, and does it run elsewhere?** Downloading a zip proves nothing until you have run it somewhere else. If it only runs on the platform's servers, you have a rental, not an asset.

**4. Who owns it?** Read the terms. v0's position is explicit and good. Do not assume; several smaller tools are vaguer.

**5. What happens if you stop paying?** Usually the code stays yours and the hosting does not, so the site goes offline while the files survive, an acceptable trade if you know in advance. Check separately what happens to any database or auth the builder set up, which most often does not come along.

**6. Can *you* read what it made?** The skipped question. Open a file at random. If you cannot roughly describe what it does, the code is closed to you regardless of the licence.

One through five are about the tool. Six is about you, and it decides whether you learned anything.

## Which answer applies to you

**If you are shipping a product,** these tools are good and the criticism above mostly does not apply to you. A working application in an afternoon, in a standard stack any developer can pick up, with GitHub sync and clear ownership, is a strong offer. You do not need to read every Tailwind class to run a business. Use them.

**If the point was to learn,** the calculus inverts. The speed that makes these tools valuable to a founder is exactly what removes the learning, because learning happens in the loop of predicting, changing one thing, being wrong, and working out why. A finished forty-file application does not run that loop, not because it hides anything, but because there is no gap for you to close. Generating a second app teaches about as much as the first.

The fix is not avoiding AI. It is choosing output small enough to read. A single HTML file with its CSS and JavaScript can be understood by a determined beginner in an evening. A Next.js application cannot, and no amount of export freedom changes it.

---

### Disclosure: we make a tool in this space

We build **CodeIt** (codeitlearn.com), a browser-based studio for ages 5-18. A learner describes a website, game or quiz and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows [what the project is made of](/builder) and opens the lesson behind each idea it used. The generated project stays editable, not locked. The loop is: make something, play it, change it, see what it is made of, and publish it. Free tier: a monthly allowance of assisted project builds and two learner profiles with parent view, free now, no card required. Profiles for ages 5-12 are parent-managed and email-verified; independent accounts start at 13.

**Who this is not for, stated plainly.** We do not compete with Lovable, v0 or Bolt on capability, and we are not trying to. Those tools build far more than we do, real applications, databases, authentication, production deployment, and if you are shipping a product, they are the right choice and we are not. Our output is deliberately small and plain so a beginner can read it, which is the opposite trade-off from theirs. We also do not host your own domain, have no multiplayer or app export, and have no web curriculum. There are 31 beginner Python lessons, but the web side is the builder itself. Managed under-13 profiles cannot publish publicly.

---

## Common questions

**Do I own the code an AI builder writes?** With v0, Vercel states it does not own the generated code. Lovable puts repositories in your own GitHub account, private by default. Read the terms for anything smaller; ownership language varies.

**What happens if I stop paying?** Typically your code survives and your hosting does not. Check separately what happens to any database, authentication or storage the builder configured. That is the part that usually does not travel.

**Can I edit AI-generated code by hand?** Yes, in all the major tools. The thing to test is whether the AI's next generation overwrites your manual edits. Make one small change, prompt again, and see.

**Will using an AI builder teach me to code?** Not by itself. Reading and modifying its output can, but only if the output is small enough to actually read. A forty-file React application generally is not.

**Is "vibe coding" a real problem?** It is a trade, not a sin. For a professional shipping a product, generating code you have not read is often reasonable. For someone whose goal was to learn, it substitutes the artifact for the skill, and the gap shows up later when something breaks.

*Last verified: 23 August 2026.*`,
  },
  {
    slug: "what-happened-to-juni-learning",
    relatedLessons: [1, 4],
    // Competitor prices this page quotes, all in US dollars, marked so the
    // price guards can see them. Same reason as after-scratch: bare dollar
    // amounts were invisible to the guard.
    quotedPrices: ["US$8", "US$13", "US$24.99", "US$119.99", "US$199.99", "US$94.50", "US$240.00"],
    title: "What Happened to Juni Learning",
    description: "Juni Learning sunset its 1:1 kids coding tutoring and consolidated onto Acely, its own test-prep spinout. What that means and where families went next.",
    h1: "What Happened to Juni Learning",
    lastVerified: "2026-08-21",
    targetQueries: [
      "what happened to juni learning",
      "is juni learning still open",
      "juni learning shut down",
      "juni learning alternatives for kids coding",
      "junilearning.com redirects to acely"
    ],
    markdown: `Juni Learning shut down its one-to-one online coding tutoring business in the autumn of 2025 and consolidated onto Acely, its own AI test-prep product. If you type junilearning.com into a browser today, you get an HTTP 302 redirect to acely.com, not because the domain was sold to a stranger, but because Acely and Juni come from the same company and the same founder.

That distinction matters, and almost every roundup of "kids coding sites" still gets it wrong. This page states what is actually documented, what is not, and what the practical options are for a family that was using Juni for weekly tutoring.

**Last verified: 21 August 2026.**

## The documented facts

**The workforce reduction.** A California WARN (Worker Adjustment and Retraining Notification) notice was filed on 2 September 2025 covering 121 employees in San Francisco. WARN notices are a state-mandated public filing required before large layoffs, which is why this is one of the few hard, dateable facts in the whole story. It was picked up by employment firms tracking WARN filings, including [Strauss Borrelli's notice](https://straussborrelli.com/2025/09/08/juni-learning-warn-act-investigation/).

**The public discussion.** A Hacker News thread titled "Juni Learning Is Closing Down" ran in September 2025, which is where most parents and former instructors first saw the news. It is worth reading for the instructor accounts, but treat the comments as anecdote, not record.

**The redirect.** junilearning.com now returns a 302 to acely.com. You can verify this yourself from a terminal with \`curl -I https://junilearning.com\`.

## The correction: Acely is not a stranger

This is the part that most secondhand write-ups have backwards. Several still describe the redirect as "the domain was sold" or imply an unrelated buyer picked it up.

Acely is a Juni spinout. It went through Y Combinator's W18 batch, the same batch and the same founder, Vivian Shen, behind Juni. Acely came out of beta in January 2024 as an AI-driven standardised-test-prep product. Juni's own legal documents ended up hosted on acely.ai domains, which is about as clear a signal of shared corporate ownership as you can get without a press release.

So the accurate one-sentence version is: **Juni Learning sunset its 1:1 coding tutoring business and consolidated the company onto its test-prep product, Acely.**

The wrong versions, which you will see repeated, are "Juni Learning died," "the company went bankrupt," and "the domain got bought by a test-prep company." None of those are supported by anything on the record. A 121-person WARN filing plus a consolidation onto a sibling product is a strategic exit from one line of business, a serious one for the people laid off and for families mid-course, but not the same event as a corporate failure.

We are also not going to tell you *why* it happened. There is no public statement from the company explaining the decision, no filing that spells out the economics, and no reporting that establishes a cause. Anyone who tells you confidently that it was AI, or tutoring margins, or the funding market is guessing.

## What Juni actually was, so you can replace the right thing

Juni's core product was **live, scheduled, human one-to-one instruction**: a real instructor on a video call, weekly, with a coding curriculum wrapped around it. That is a fundamentally different product from a self-serve app, and it is the reason a straight swap is hard. Most of what gets recommended as a "Juni alternative" is self-serve software, which is cheaper and more flexible but is not the thing you were buying.

Sort your replacement by which half of Juni you cared about.

### If you wanted the live human instruction

| Option | Format | Rough cost | Ages | Notes |
|---|---|---|---|---|
| [Create & Learn](https://www.create-learn.us/pricing) | Live small-group classes online | Free intro class; US$94.50 for four group sessions, US$240.00 for four 1:1 sessions | ~5–18 | Closest widely-available analog to Juni's live model at a group price point |
| [Code Ninjas](https://www.codeninjas.com/) | In-person franchise centres | Not published. You get a price by contacting a centre | ~7–14 | Physical locations; each one is a separate franchise, so both the price and the quality vary. Visit before committing |
| [iD Tech](https://www.idtech.com/) | Intensive camps, some 1:1 | Not published. A price appears once you pick a programme | ~7–19 | Camp-shaped, not weekly-tutor-shaped |

Group classes cost far less than 1:1 and, for many kids, work just as well. Genuine private 1:1 tutoring at Juni's scale is now thin on the ground; independent tutors and local university CS students are a real option that most listicles never mention.

### If you wanted the structured curriculum, not the tutor

| Option | Cost | Ages | Style |
|---|---|---|---|
| [Scratch](https://scratch.mit.edu/) (MIT) | Free | 8–16 | Block-based, enormous community library |
| [CodeAI](https://code.org/en-US/codeai) (formerly Code.org) | Free | K–12 | Full CS curriculum; emphasis has shifted toward AI literacy |
| [Tynker](https://www.tynker.com/) | $15/mo billed yearly, or $468 lifetime | 5–18 | Up to 3 children; Minecraft and Roblox modding hooks |
| [CodeMonkey](https://www.codemonkey.com/) | US$8/mo individual, US$13/mo family (3 kids) | K–8 | Game-based CoffeeScript then Python |
| [CodeCombat](https://codecombat.com/) | Freemium | ~9+ | Typed Python or JavaScript inside an RPG |
| [codeSpark](https://www.beginlearning.com/codespark/pdp) | Price not published on its page | 3–10 | Word-free, so it works for pre-readers. Now a Begin Learning product; codespark.com redirects |
| [Kodable](https://www.kodable.com/parents) | US$24.99/mo, US$119.99/yr, or US$199.99 once, four children | 4–10 | Strongest in the K-5 school niche. The free Kickstart plan is a school plan |

If your child is under 8 and not yet reading fluently, start at codeSpark or Kodable. Nothing on the typed-code end of this table will work for them yet, and paying for it is a common and expensive mistake.

## The follow-up question parents actually ask

**"My child had a half-finished Juni portfolio. Is any of it recoverable?"** Almost certainly not through Juni. If work was done in Scratch, Replit, or a GitHub account your child controlled, it lives there and is fine. If it lived inside Juni's own editor, assume it is gone. This is the practical argument for platforms where projects export as plain files you keep.

**"Is Acely worth anything to us?"** Only if you have a high-schooler preparing for standardised tests. It is a test-prep product. It is not a coding product and does not pretend to be.

**"How do I avoid this next time?"** Two questions before you pay: can we export the work in a standard format, and are we on a month-to-month plan? Lifetime deals and annual prepayments are exactly the wrong shape of commitment for a category with this much turnover.

---

## Disclosure: who published this page

This page is published by **CodeIt** (codeitlearn.com), which makes a browser-based coding studio for kids ages 5–18. So we have an interest here, and you should read the recommendations above with that in mind. We listed the competitors we did because they are the honest answers, including where they beat us.

Where CodeIt genuinely fits a former Juni family: kids who want to [*build* things](/builder), websites, games, quizzes, and then open up the real HTML, CSS and JavaScript underneath to see how they work. Projects can be generated with AI assistance and stay editable afterwards rather than becoming a locked result. The free plan does not expire and needs no card: ten assisted project builds a month and two learner profiles under a parent view. A paid family plan is available at CA$12 a month, cancellable at any time.

Where CodeIt does not fit: we are not a live-tutoring replacement. There is no instructor on a call. If the scheduled human relationship was the point of Juni for your child, Create & Learn or a local tutor is the better answer, not us. Ages 5–12 use parent-managed, email-verified profiles that cannot publish publicly; independent accounts start at 13.`,
  },
  {
    slug: "code-org-is-now-codeai",
    relatedLessons: [1, 6],
    // Kodable's family price, from kodable.com/parents, read 31 August 2026.
    // Declared so the price guards can see it is somebody else's money.
    quotedPrices: ["US$119.99"],
    title: "Code.org Is Now CodeAI: What Changed",
    description: "Code.org rebranded org-wide as CodeAI in June 2026. The domain is still live, CS curriculum still exists, and the emphasis moved to AI literacy.",
    h1: "Code.org Is Now CodeAI: What Changed",
    lastVerified: "2026-08-21",
    targetQueries: [
      "is code.org still around",
      "code.org rebrand codeai",
      "what happened to hour of code",
      "does codeai still teach coding",
      "code.org name change 2026"
    ],
    markdown: `Code.org announced an organisation-wide rebrand to **CodeAI** on 2 June 2026. The name changed; the URL did not. code.org is still live, still in active use, and still free, so if you have been told "Code.org shut down" or "Code.org no longer exists," that is wrong, and it is the single most repeated error about this story.

What did change is the organisation's stated emphasis. CodeAI now describes its mission in terms of **digital fluency** spanning AI science, computer science and data science, rather than computer science alone. The December Hour of Code event is now the **Hour of AI**. Whether that shift is good for your child is a real question with a real answer, and it depends on what you wanted out of the site. This page lays out the evidence and then answers it directly.

**Last verified: 21 August 2026.**

## How we know this is a real rebrand, not a sub-brand

Organisations launch AI-flavoured sub-programs all the time, and those are usually not worth a headline. Three things separate this from that pattern.

1. **The organisation says so in the first person.** The page at [code.org/en-US/codeai](https://code.org/en-US/codeai) states plainly: "Code.org is now CodeAI."
2. **The branding reaches the boring pages.** CodeAI branding now appears on the newsroom and the Terms of Service. Marketing pages get rebranded for campaigns; Terms of Service pages get rebranded when the legal entity's public identity actually changes. This is the strongest single tell.
3. **Independent coverage treated it as an org-level change.** [GeekWire](https://www.geekwire.com/2026/solidifying-its-shift-to-ai-education-code-org-rebrands-as-codeai/) framed it as solidifying a shift to AI education; the Chronicle of Philanthropy and Education Week also covered it.

Leadership context: **Karim Meghji** has been CEO since February 2026, roughly four months before the rebrand was announced.

## The honest answer to "does it still teach coding?"

Yes, and the emphasis has moved.

The computer science curriculum still exists. CS Discoveries, CS Principles, the block-based courses for younger students, the whole existing library. That material did not evaporate on 2 June 2026. A parent whose child is halfway through a course is not stranded.

At the same time, an organisation does not rename itself, restate its mission around digital fluency, and rename its flagship annual event without meaning it. The new material, the new promotion, and the framing at the top of the funnel are AI-forward. CS is now one of three named strands rather than the whole point.

Both of those sentences are true at once. Anyone telling you only the first ("nothing changed, it's just a logo") or only the second ("they abandoned coding") is selling you something. What you should expect over time is that the CS material remains available while the newest, best-promoted, most-maintained content skews toward AI literacy.

## Deciding what that means for your child

| If you wanted... | CodeAI in 2026 | What to consider |
|---|---|---|
| A free, structured K–12 CS course sequence | Still there, still free | Fine to continue. Bookmark your course directly rather than navigating from the homepage |
| Your child to understand how AI works and how to use it critically | Now a core strength | This is the direction the organisation has chosen; expect the newest material here |
| Deep, typed programming practice | Was never CodeAI's centre of gravity | Look at [CodeCombat](https://codecombat.com/), [CodeMonkey](https://www.codemonkey.com/), or [Codecademy](https://www.codecademy.com/), and note Codecademy's Terms of Service §1.A require users to be 16 or older |
| Open-ended creative building | Limited | [Scratch](https://scratch.mit.edu/) remains the strongest free option here |
| A classroom platform for a school | Still a schools platform | CodeAI and [CodeHS](https://codehs.com/) (grades 6–12) remain the main free/low-cost school-facing options |

### Free alternatives if you want CS without the AI framing

| Option | Cost | Ages | Notes |
|---|---|---|---|
| [Scratch](https://scratch.mit.edu/) (MIT) | Free | 8–16 | Block-based, huge shared project community, no AI repositioning |
| [Khan Academy](https://www.khanacademy.org/computing) | Free | ~10+ | Solid teaching, but the CS content runs on legacy ProcessingJS and is visibly aging |
| [freeCodeCamp](https://www.freecodecamp.org/) | Free | Nominally 13+ | Excellent and genuinely free, but built for adults; not designed for kids |
| [Kodable](https://www.kodable.com/parents) | US$119.99/yr for families, four children | 4–10 | K-5 focused. Its free Kickstart plan is a school plan |
| [CodeCombat](https://codecombat.com/) | Freemium | ~9+ | Typed Python/JS in a game |

Scratch is the closest thing to "Code.org before the shift" that still exists at zero cost, and it is not going anywhere. It is an MIT project, not a venture-funded product.

## The follow-up questions parents actually ask

**"Is it still free?"** Yes. CodeAI remains free for K–12 use.

**"Do my child's saved projects survive the rebrand?"** A rebrand is a naming and positioning change, not a platform migration, and accounts and saved work were not reported to be affected. That said, the cheap insurance is universal and worth doing once: if your child has work they care about, download or screenshot it now. This applies to every platform in this document, not just this one.

**"Should I be worried that my child will only learn AI prompting instead of programming?"** This is a fair concern and the honest answer is: watch what they actually do, not what the platform is called. There is a real difference between a child who produces a result with AI and a child who can open up the result, read it, and change it. If your child is using AI tools and never looks underneath, that is a gap regardless of which site they are on. The fix is picking activities that end with the child writing and running code themselves, not picking a vendor.

**"Is Hour of AI still worth participating in?"** For most families and classrooms, yes. The value of that event was always the low-friction, one-hour on-ramp, and that has not changed. Just know what your child is signing up for is now framed around AI concepts.

---

## Disclosure: who published this page

This page is published by **CodeIt** (codeitlearn.com). We make a browser-based coding studio for kids and we compete for the same attention CodeAI gets, so weigh our framing accordingly. We have tried to describe the change without spinning it: CodeAI is free, it is large, its CS curriculum is still real, and for many families continuing there is the right call.

Where CodeIt is a genuine fit is the specific gap described above. Kids describe a website, game or quiz, play what comes back, and change it by moving things and picking colours. A tab then shows what the project is made of and opens the lesson behind each idea in it. AI can help generate a project, but the output stays **editable instead of becoming a locked AI result**: which is the whole point if your worry is that AI tools produce black boxes. The free plan does not expire and needs no card: ten assisted project builds a month and two learner profiles under a parent view. A paid family plan is available at CA$12 a month, cancellable at any time. There is also a [31-lesson beginner Python sequence](/lessons).

Where CodeIt is not a fit: we are a consumer product for families. We have no school, district, rostering, LMS or teacher-dashboard features. If you are a teacher looking at this because your school used Code.org, CodeAI or CodeHS is the right place to stay. And if your child is under 8 and pre-reading, use codeSpark or Kodable, not us.`,
  },
  {
    slug: "common-sense-education-paused-edtech-reviews",
    relatedLessons: [1, 10],
    title: "Common Sense Paused Edtech Reviews",
    description: "Common Sense Education paused all edtech product reviews from February 2026. Its privacy ratings still run. What schools should use instead.",
    h1: "Common Sense Paused Edtech Reviews",
    lastVerified: "2026-08-21",
    targetQueries: [
      "common sense education reviews discontinued",
      "why is common sense not updating edtech reviews",
      "common sense education alternatives for schools",
      "iste edtech index vs common sense",
      "are common sense privacy ratings still active"
    ],
    markdown: `Common Sense Education **paused all edtech product reviews beginning February 2026**. The existing review pages are still online but frozen. They carry notices saying they are no longer being updated. Separately and importantly, Common Sense's **Privacy Program is still fully operating**, which is a distinction most secondhand summaries have blurred into "Common Sense stopped rating edtech." That is not what happened.

If you are a teacher, coach, or district buyer who used those reviews as a filter, the practical consequence is this: you have lost your single best free source of *learning-quality* ratings, you have not lost your privacy ratings, and no direct replacement with the same methodology exists. This page covers what is verified, what the real alternatives are, and how to run an evaluation yourself now that the shortcut is gone.

**Last verified: 21 August 2026.**

## What is verified

**The pause.** [Tech & Learning reported on 30 January 2026](https://www.techlearning.com/technology/apps/common-sense-education-will-pause-edtech-reviews-beginning-february-2026-what-it-means-for-schools-and-where-to-look-next) that Common Sense Education would pause edtech reviews starting in February 2026. EdTech Institute covered it on 11 February 2026.

**The pages are frozen, not deleted.** Review pages remain reachable and readable. They carry a notice indicating they are no longer being updated. Nothing has been taken down as of this page's verification date.

**Privacy ratings continue.** The Common Sense Privacy Program is a separate operation from the learning-quality reviews and it is still running. The clearest proof is a fresh evaluation issued **26 March 2026**, well after the review pause took effect, for the product Yourway, which received a **93% privacy rating**, announced via PR Newswire. A dormant program does not issue new evaluations with new scores.

This is the split to hold in your head:

| Common Sense program | Status as of August 2026 | What it told you |
|---|---|---|
| Edtech product reviews (learning quality) | **Paused since February 2026**; pages frozen but online | Whether a tool was pedagogically good, with an age rating and a teacher-facing score |
| Privacy Program / privacy ratings | **Active**, issuing new evaluations | How a product handles student data, tracking, ads, and third-party sharing |
| Family-facing media reviews (movies, games, apps) | Outside the scope of this pause | Age-appropriateness of consumer media |

## The alternatives that actually exist

Two cautions before the table.

First: **ISTE does not describe itself as Common Sense's successor.** That framing comes from trade press coverage, which points to ISTE as the leading alternative. ISTE has not claimed the mantle, and it would be dishonest to put those words in their mouth.

Second, and more practically: **these are not like-for-like swaps.** Common Sense's reviews produced an editorial learning-quality judgement, a human reviewer scoring pedagogy against a rubric. The main alternative works differently. If you copy a Common Sense-shaped process onto a differently-shaped directory, you will think you have replaced the signal when you have not.

| Source | What it is | Methodology | Cost |
|---|---|---|---|
| [ISTE EdTech Index / Learning Technology Directory](https://iste.org/edtech-index) | The largest active edtech directory; descends from the EdSurge Product Index, running since 2012 | **Validation-badge system**, products earn badges against criteria, rather than a single learning-quality score | Free to browse; free to list |
| [EdTech Impact](https://edtechimpact.com/) | Directory built around verified reviews from educators who have used the product | Aggregated practitioner reviews | Free to browse |
| Common Sense **Privacy** ratings | Still-active data-privacy evaluations from Common Sense itself | Structured privacy rubric, percentage rating | Free |

The honest summary: **ISTE's index is the best place to discover and shortlist products and to see what a product has been validated for. It is not a drop-in replacement for a learning-quality score, because it does not produce one.** A badge tells you a product met specified criteria; a Common Sense review told you a reviewer thought the product taught well. Those are different claims.

### What to do about the gap

The learning-quality judgement now has to come from you or your colleagues. That is more work, but it is not mysterious. A workable process:

1. **Screen for privacy first**, using Common Sense Privacy ratings. This is still free, still active, and still the fastest way to eliminate products outright. Anything with a poor privacy rating is done, no further evaluation needed.
2. **Shortlist on the ISTE index**, filtering for the badges and evidence claims relevant to your use case.
3. **Check practitioner reviews** on EdTech Impact for whether the thing survives contact with a real classroom.
4. **Run your own 20-minute check** on the two or three survivors. Ask: What does a student actually *do* for the first ten minutes? Is there a task with a right answer, or only exploration? Can a teacher see what a student produced without buying a higher tier? What happens to student work if you stop paying?
5. **Ask the vendor two questions in writing.** Can we export student work in a standard format? What is the deletion process for student data when we leave? A vendor that will not answer those in writing has answered them.

Steps 4 and 5 are what the Common Sense reviews were doing on your behalf. Rebuilding them as a shared department checklist is more sustainable than waiting for another free reviewer to appear.

## Follow-up questions

**"Can I still trust the frozen reviews?"** Partly. A review's description of *what a tool is and how it teaches* ages slowly and is still useful context. Its description of pricing, tiers, features and privacy behaviour ages fast and should be treated as of-its-date only. Always check the review's date, then verify pricing and privacy against the vendor's live site.

**"Is this permanent?"** It was announced as a pause, not a shutdown. Nothing in the coverage commits to a restart date, so plan as if it is indefinite and be pleasantly surprised if it is not.

**"Did Common Sense say why?"** We are not going to characterise the reasoning beyond what was reported. The coverage above is the primary record; read it directly rather than trusting a summary, including this one.

**"Does this affect Common Sense's digital citizenship curriculum?"** That curriculum is a separate offering from the product reviews and was not the subject of this announcement. Verify current status on their site before building a school year around it.

---

## Disclosure: who published this page, and why we are not recommending ourselves here

This page is published by **CodeIt** (codeitlearn.com), which makes a browser-based coding studio for families with kids ages 5–18.

We are going to be direct: **CodeIt is not a relevant recommendation for the audience of this page.** If you arrived here, you are almost certainly evaluating software for a school or district. CodeIt has no school or district features, no rostering, no LMS integration, no teacher dashboards, no standards alignment. We are a consumer product bought by parents. Putting ourselves on your shortlist would waste your time.

For school-facing coding curriculum specifically, the established options are [CodeAI](https://code.org/en-US/codeai) (formerly Code.org, free, K–12), [CodeHS](https://codehs.com/) (grades 6–12), [Kodable](https://www.kodable.com/) for K-5, and [Scratch](https://scratch.mit.edu/) (free, MIT). Evaluate those through the process above rather than taking our word for it.

We wrote this page because the facts were being reported wrongly, specifically the widespread claim that Common Sense stopped rating edtech entirely, when its privacy program demonstrably still issues new ratings.`,
  },
  {
    slug: "replit-teams-for-education-shut-down",
    relatedLessons: [1, 9],
    title: "Replit Teams for Education Shut Down",
    description: "Replit discontinued Teams for Education on 1 August 2024. Replit itself still operates but has exited education. Where teachers moved next.",
    h1: "Replit Teams for Education Shut Down",
    lastVerified: "2026-08-21",
    targetQueries: [
      "replit teams for education discontinued",
      "replit education alternative for teachers",
      "is replit still free for students",
      "replit classroom replacement 2026",
      "what to use instead of replit in class"
    ],
    markdown: `Replit discontinued **Teams for Education on 1 August 2024**. Replit the company is still very much operating, it did not go out of business, but it has exited the education market, and there is no sign of it coming back. Two years on, that combination still confuses people: the product you are searching for is gone, the brand you associate with it is thriving, and most search results predate the change.

If you are a teacher who ran a class on Replit, the honest state of the world is that **no single product replaced it**. Teams for Education combined a zero-install browser IDE, real multiplayer collaboration, and a class management layer in one free package. The successors split those functions apart. This page explains what was lost, what the actual options are, and how to choose between them without wasting a term on the wrong one.

**Last verified: 21 August 2026.**

## What actually happened, and what didn't

**What happened:** Teams for Education was discontinued on 1 August 2024. The education-specific tier, the teacher-facing class layer, went away.

**What did not happen:** Replit did not shut down. It continues as a company with a healthy consumer and developer product. Any page telling you "Replit is dead" is wrong in the same way that "Code.org no longer exists" is wrong. The company pivoted its focus; it did not disappear.

**Why coverage is so thin:** this is the part worth naming. When a widely used classroom tool is discontinued, you would expect a wave of migration guides. That did not really happen here. The most substantive migration write-ups came from two vendors with an obvious interest, [Codeanywhere](https://codeanywhere.com/) and [Pickcode](https://pickcode.io/). Beyond those, teachers have largely been left to work it out in forums and staff rooms. The demand for a straight answer is real and mostly unserved, which is why this page exists.

Read the vendor migration posts. They are useful. Just read them knowing they are written by people who want your class on their platform, exactly as you should read this page knowing who published it.

## Break the problem into three parts

Teams for Education was three products in a trenchcoat. Replace them separately.

| What Replit gave you | Replacement category | Options |
|---|---|---|
| Browser IDE with no installs, works on locked-down school machines | Cloud IDE | [Codeanywhere](https://codeanywhere.com/), [CodeSandbox](https://codesandbox.io/), GitHub Codespaces, Replit's own non-education product |
| Real-time multiplayer editing and pair programming | Collaborative editor | CodeSandbox, VS Code Live Share, GitHub Codespaces |
| Class roster, assignments, visibility into student work | Class management layer | [CodeHS](https://codehs.com/), [CodeAI](https://code.org/en-US/codeai) (formerly Code.org), GitHub Classroom |

The mistake to avoid is picking a tool that nails the first column and discovering in week three that you have no way to see thirty students' work.

## The options, honestly compared

| Option | Best for | What it gives you | Watch out for |
|---|---|---|---|
| [CodeHS](https://codehs.com/) | Grades 6–12, whole-course replacement | The closest thing to a complete teacher-facing platform: curriculum, assignments, student visibility | It is a curriculum platform, not a free-form IDE. If you taught your own syllabus in Replit, this is a bigger change than it looks |
| [CodeAI](https://code.org/en-US/codeai) (ex-Code.org) | K–12, free | Free, large, established, with a real classroom layer. Note the organisation rebranded in June 2026 and its emphasis has shifted toward AI literacy; the CS curriculum still exists | Emphasis has moved; check the current course catalogue matches what you teach |
| [Codeanywhere](https://codeanywhere.com/) | Teachers who mainly needed the cloud IDE | Browser-based development environment; published a Replit migration guide | Developer tool first. Thin on class management |
| [Pickcode](https://pickcode.io/) | Younger or beginner classes | Purpose-built for teaching, published a Replit migration guide | Newer and smaller than what you are leaving; evaluate longevity |
| GitHub Codespaces + Classroom | High school, students headed toward real software work | Genuinely industry-standard tooling and workflow | Steepest setup cost; account and age requirements need checking for minors; free-tier limits change |
| [freeCodeCamp](https://www.freecodecamp.org/) | Motivated high-schoolers, zero budget | Free, substantial, well-maintained | Nominally 13+, built for adults, no teacher view at all |
| [Codecademy](https://www.codecademy.com/) | Older students only | Free Basic tier, $14.99/mo Plus | Its Terms of Service §1.A state "You must be 16 years or older to use the Services", which rules it out for most middle school and much of high school |
| [Scratch](https://scratch.mit.edu/) (MIT) | Younger classes, ages 8–16 | Free, stable, enormous community, not going anywhere | Block-based; not a substitute if you were teaching typed Python or JavaScript |
| [CodeCombat](https://codecombat.com/) | Ages ~9+, engagement problems | Typed Python or JavaScript inside an RPG; freemium | Game framing does not suit every class |

### If you only have ten minutes to decide

- **Teaching a full CS course, grades 6–12, need student visibility:** CodeHS.
- **Zero budget, need free and stable:** CodeAI or Scratch, depending on age.
- **You mostly needed the IDE and already handle assignments elsewhere:** Codeanywhere or CodeSandbox.
- **Older students, want them on real professional tooling:** GitHub Codespaces with Classroom.

## Follow-up questions teachers actually ask

**"Can students still just use Replit individually?"** Replit still operates a non-education product. Before pointing minors at it, check Replit's current terms and age requirements yourself, those are exactly the terms most likely to have changed since 2024, and a two-year-old blog post is not a safe source for them.

**"What happened to the code my classes wrote?"** If it was not exported before the shutdown, assume it is gone. The durable lesson: on any platform you adopt next, confirm on day one that student work exports as plain files, and do an export at the end of every term. This is the single cheapest habit that protects you from the next discontinuation.

**"Is there anything free that does all three columns?"** CodeAI is the closest, and it is free. It is not a free-form IDE in the way Replit was, so it is a substitution rather than a replacement.

**"How do I stop this happening again?"** Prefer tools where the work is plain files you can export, prefer institutions over venture-backed startups when stability matters more than features (Scratch is an MIT project; freeCodeCamp is a nonprofit), and keep the syllabus in a document you own rather than inside a vendor's platform.

---

## Disclosure: who published this page, and why we are not the answer

This page is published by **CodeIt** (codeitlearn.com), which makes a browser-based coding studio for kids ages 5–18.

**CodeIt is not a replacement for Replit Teams for Education, and we are not going to pretend otherwise.** We have no rostering, no LMS integration, no teacher dashboards, no assignment workflow, no standards alignment, and no school or district offering of any kind. We are a consumer product bought by families. A teacher who adopts us for a class will be missing the entire third column of the table above by the second week.

For a classroom, the honest recommendations are the ones above: CodeHS for a full secondary CS course, CodeAI for free K–12, Codeanywhere or CodeSandbox if the IDE was the part you needed, GitHub Classroom for older students on professional tooling.

The one place we might be worth a look is well outside a school: a **homeschooling parent or an after-school setting with one or two children**, where you want [kids building websites, games and quizzes](/builder) and then opening up the real HTML, CSS and JavaScript underneath. AI can help generate a project and the result stays editable rather than becoming a locked AI result. The free plan does not expire and needs no card: ten assisted project builds a month and two learner profiles under a parent view. A paid family plan is available at CA$12 a month, cancellable at any time. There is also a 31-lesson beginner Python sequence. Ages 5–12 use parent-managed, email-verified profiles that cannot publish publicly; independent accounts start at 13.

If that is not your situation, take the list above and ignore us.`,
  },
  {
    slug: "tynker-alternative",
    relatedLessons: [1, 4, 6],
    title: "Tynker Alternatives: What to Use, and When Tynker Is Still the Answer",
    description: "Tynker costs $15 to $18 a month for up to three children. What the alternatives actually are, what each one is better at, and the cases where you should stay.",
    h1: "Is Tynker worth it, and what else is there?",
    lastVerified: "2026-08-26",
    targetQueries: ["tynker alternative", "is tynker worth it", "tynker vs scratch", "cheaper alternative to tynker", "tynker pricing family plan", "coding subscription for kids worth the money", "tynker vs code.org", "best paid coding platform for kids"],
    markdown: `**Short answer:** if your child is under 8, or wants Minecraft and Roblox modding specifically, Tynker is still the best-supported option and the alternatives are worse. If your child is past blocks and you mostly want them building things they can share, you are paying for a course library you will not finish.

This page names prices as they were checked on 26 August 2026, from each product's own pricing page.

## What Tynker actually costs

From [Tynker's pricing page](https://www.tynker.com/pricing/), family plans, with a 40% discount applied at the time of checking:

| Plan | Price | Billed |
|---|---|---|
| Quarterly | $18/month | $54 every three months |
| Yearly | $15/month | $180 a year |
| Lifetime | $468 | once |

All three cover up to three children and carry a 30-day money-back guarantee. Tynker states an age range of 5 to 18, from icon coding for pre-readers up to Python and JavaScript.

That is not a bad price for what it is. The question is whether what it is matches what your child does.

## Where Tynker is genuinely the right answer

**Under 8.** Icon coding for pre-readers is real work to build and almost nobody else does it well. If your child cannot yet read fluently, most of the alternatives on this page are unusable for them.

**Minecraft and Roblox modding.** This is Tynker's strongest hand. The integrations are maintained, they work, and a child who wants to mod the game they already play will stay engaged far longer than with a generic project.

**You want a curriculum, not a tool.** Tynker is a course library with a path through it. If you want to hand a child something structured and step away, that is what it is built for.

If any of those three describe you, stop reading. The rest of this page will not serve you better.

## Where the money stops making sense

The common failure is not that Tynker is bad. It is that a subscription bought for a 7-year-old is still being paid for at 11, when the child has outgrown blocks and the text-code courses feel like homework rather than making something.

At that point you are paying a monthly fee for a library, and the child is not opening it. The honest move is to cancel and pick a tool aimed at what they do now.

## The alternatives, and what each is actually for

**[Code.org](https://code.org/).** Free, and it stays free. Rebranded to CodeAI on 2 June 2026, with the Hour of Code now the Hour of AI, and it [continues to provide free curriculum, tools and professional learning resources](https://code.org/en-US/codeorg-is-now-codeai). Best for structured courses at no cost. Weakest at open-ended making: a child who wants to build their own thing and share a link will find it closed-ended.

**Scratch**: free, from MIT, block-based, and still the best on-ramp there is. It is not an alternative to Tynker so much as the thing Tynker's early levels are competing with. If your child is happy in Scratch, there is no reason to pay anyone.

**The p5.js Web Editor**: free, text-based JavaScript, no account needed to start. Best for a teenager who already wants to write code. Nothing about it is designed for children, and that is the point.

**CodeIt**: this is us, so weigh it accordingly.

## Disclosure: we make one of these

CodeIt is a browser-based coding studio for ages 5 to 18, built in Toronto. A learner describes a website, game or quiz, plays what comes back, and changes it by moving things and picking colours or asking in plain language. A separate view shows what the finished project is made of and opens the lesson behind each idea in it. There are [31 beginner Python lessons](/lessons).

Free plan: no card, ten AI-assisted builds a month, and the lessons and Python playground stay free. Paid family plan CA$12 a month, cancellable at any time. Note that is Canadian dollars against Tynker's US dollars, so compare the numbers in your own currency rather than taking the gap at face value.

**Where CodeIt is genuinely the better fit:** a child roughly 8 to 16 who has outgrown blocks, wants to make things rather than take a course, and whose parent wants some evidence of understanding rather than a completion badge. The comprehension questions are generated from the learner's own file, so the right answer is whatever they actually wrote.

**Where Tynker beats us, plainly:** it is older, larger, better supported, and has a proper curriculum. It works for pre-readers and we are weaker there. It has Minecraft and Roblox and we have neither. If those matter to your child, buy Tynker.

**What we do not do at all:** no rostering, no LMS integration, no standards alignment, no teacher dashboards. CodeIt is not a schools product.

## The version of this page you should trust

Any comparison page written by one of the products is worth reading sceptically, including this one. The test is whether it tells you when to buy the competitor. If a page never does that, it is an advert.
## Common questions

**Is Tynker worth it?**
It depends on three things. If your child is under 8, or wants Minecraft and Roblox modding, or you want a curriculum to hand over rather than a tool, then yes, and the alternatives are worse. If your child is past blocks and mostly wants to build things they can share, you are paying monthly for a course library nobody is opening.

**How much does Tynker cost?**
From Tynker's own pricing page, checked 26 August 2026, with the 40% discount that was showing: $18 a month billed quarterly at $54, $15 a month billed yearly at $180, or $468 once for lifetime. All three cover up to three children and carry a 30-day money-back guarantee.

**Tynker vs Scratch: what is the difference?**
Scratch is free, from MIT, and is what Tynker's early levels compete against rather than an alternative to them. Tynker adds icon coding for pre-readers, Minecraft and Roblox integrations, and a structured path. If your child is happy in Scratch, there is no reason to pay anyone.

**Tynker vs Code.org: which is better?**
Code.org, now CodeAI since 2 June 2026, is free and stays free, and is stronger if you want structured courses at no cost. Tynker is better for pre-readers and for game modding. Both are closed-ended: a child who wants to build their own thing and send someone a link will find the walls in either.

**What is a cheaper alternative to Tynker?**
Free ones first: Scratch, Code.org and Google CS First cover most of what a Tynker subscription buys for a child aged 8 to 11. The p5.js Web Editor is free and suits a teenager who already wants to write code. CodeIt has a free plan with no card and a CA$12 family plan, which is Canadian dollars against Tynker's US dollars, so convert before comparing.

**When should I cancel a kids coding subscription?**
When the child has stopped opening it. The common pattern is a plan bought for a 7-year-old still being paid at 11, once blocks feel babyish and the text courses feel like homework. The library is not the problem at that point, the fit is.
`,
  },
  {
    slug: "free-coding-for-kids",
    relatedLessons: [1, 3, 6],
    comparesOptions: ["Scratch", "Code.org, now CodeAI", "Google CS First", "freeCodeCamp", "The p5.js Web Editor"],
    title: "Free Coding for Kids: What Is Actually Free in 2026",
    description: "Six platforms that cost nothing, what each is genuinely good at, and which one to pick by what your child wants to make. Every claim checked against the source.",
    h1: "What is actually free, and which one should we use?",
    lastVerified: "2026-08-29",
    targetQueries: ["free coding for kids", "free coding websites for kids", "best free coding platform for children", "free programming for kids no subscription", "coding for kids without paying", "free alternative to tynker", "free kids coding 2026", "is scratch free"],
    markdown: `**Short answer:** [Scratch](https://scratch.mit.edu/) if your child is new or under about 9. [Code.org](https://code.org/) if you want structured lessons with no account overhead. [freeCodeCamp](https://www.freecodecamp.org/) if they are a teenager who wants to write real code. Everything below is checked against each product's own words, quoted, on 29 August 2026.

There is a lot of "free" in this category that means a free trial, or a free tier that ends at lesson three. These do not: no subscription, no card, and nothing that stops working after a month. All of them are coding websites you open in a browser, and all of them teach real programming rather than a toy version of it.

If you are here because you want your child learning to code without paying, the honest answer is that you can, indefinitely, and most families never need to spend anything.

| Tool | What is free | Best for | Roughly |
|---|---|---|---|
| Scratch | All of it, permanently | A first experience, dragging blocks rather than typing | Under about 9, and up |
| Code.org, now CodeAI | Curriculum, tools and teacher resources | Structured lessons with no account overhead | Primary and secondary |
| Google CS First | Every lesson, any number of students | A teacher or parent who wants a ready-made unit | Primary and lower secondary |
| freeCodeCamp | Courses, projects and certifications | A teenager who has decided they want to write real code | Teenagers |
| The p5.js Web Editor | The editor and the library, open source | Visual and generative work in real JavaScript | Teenagers |

Every claim in that column is quoted from the product's own words further down this page.

## Scratch

**Free, permanently.** The Scratch Foundation [states plainly](https://www.scratchfoundation.org/home): *"Scratch is free for everyone. Supporters make that possible."*

Block-based, from MIT, and still the best on-ramp that exists. A child drags blocks together rather than typing, which removes the entire category of problem where a missing semicolon ends the session in tears.

**Best for:** a first ever coding experience, and for children who want to make animations and games and share them.

**Where it stops:** blocks are a floor, not a ceiling. A child who has been in Scratch for two years and wants to build a real web page will need something else, which is the single most common question parents ask in this category.

## Code.org, now CodeAI

**Free, and they have said so again recently.** The organisation [rebranded to CodeAI on 2 June 2026](https://code.org/en-US/codeorg-is-now-codeai), the Hour of Code became the Hour of AI, and they will *"continue to provide free curriculum, tools, and professional learning resources."* The URL did not change and the site is still live, despite a lot of secondhand writing suggesting otherwise.

**Best for:** structured courses, a class or a group, and anyone who wants a path laid out rather than a blank page.

**Where it stops:** it is closed-ended by design. A child who wants to build their own thing and send someone a link will find the walls quickly.

## Google CS First

**Free, unambiguously.** Google's own wording: *"CS First is totally free of charge — any number of students, all materials, as many lessons as you want."*

Video tutorials with block coding built on Scratch, organised into themed units like sports, art and game design.

**Best for:** a teacher or a parent who wants a ready-made unit with videos, rather than assembling one.

**Where it stops:** it is Scratch underneath, so it inherits both the strengths and the ceiling.

## freeCodeCamp

**Free, including the certificates.** [Their words](https://www.freecodecamp.org/news/about/): *"Every aspect of freeCodeCamp is 100% free. The courses, the projects, even the certifications."* Project-based, in the browser, covering web development, JavaScript, Python and a great deal more.

**Best for:** a motivated teenager who has decided they want to be able to build things properly.

**Where it stops:** it was not designed for children. There is no hand-holding, no age gating in the interface, and the tone assumes an adult career-changer. A 10-year-old will usually bounce off it, and that is not a criticism of freeCodeCamp. It is not what they built.

## The p5.js Web Editor

**Free and open source.** p5.js describes itself as *"a free and open-source JavaScript library built by an inclusive, nurturing community"*, and the [web editor](https://editor.p5js.org/) runs in the browser.

**Best for:** a teenager who wants to make visual, generative, drawing-based things in real JavaScript with nothing to install.

**Where it stops:** nothing about it is designed for children, and nothing guides you. It is a blank editor and a library, which is exactly right for some people and useless for others.

## What about the paid ones

[Tynker](https://www.tynker.com/pricing/) is the main paid option at this age range: $18/month billed quarterly, $15/month billed yearly at $180, or $468 lifetime, covering up to three children, checked 26 August 2026. It is genuinely better than the free options for pre-readers and for Minecraft and Roblox modding. If neither of those describes your child, start with the free tools and see whether you ever run out of them. Most families do not.

There is more detail in [Tynker alternatives](/guide/tynker-alternative), including when to stay.

## Disclosure: we make one of these

CodeIt has a free plan with no card: ten AI-assisted project builds a month, and the Python lessons and [playground](/playground) stay free regardless. The paid family plan is CA$12 a month, cancellable at any time, in Canadian dollars.

A learner describes a website, game or quiz, plays what comes back, and changes it by moving things and picking colours. A separate view shows what the finished project is made of and opens the lesson behind each idea in it.

**Where we fit that the list above does not:** the gap between Scratch and freeCodeCamp, a child roughly 8 to 16 who has outgrown blocks but is not going to sit through an adult curriculum. That gap is the reason CodeIt exists, and if your child is not in it, one of the free tools above is the better answer and this page has tried to say which.

**What we do not do:** no rostering, no LMS integration, no standards alignment, no teacher dashboards. Not a schools product.

## How to use this page

Pick by what the child wants to make, not by what the platform claims to teach. A child who wants a game and a child who wants a website will quit different tools at different speeds, and the free ones cost nothing to try, so try two.
## Common questions

**Is Scratch free?**
Yes, permanently. The Scratch Foundation says it plainly on its own site: "Scratch is free for everyone. Supporters make that possible." There is no paid tier, no trial, and nothing that stops working.

**What are the best free coding websites for kids?**
Checked on 29 August 2026: Scratch for a first experience, Code.org for structured lessons, Google CS First if you want ready-made video units, freeCodeCamp for a teenager who wants to write real code, and the p5.js Web Editor for visual work in real JavaScript. All five are free without a card, and each entry on this page quotes the product's own wording.

**Can my child learn to code without paying anything?**
Yes, indefinitely. Most families never need to spend anything. The free tools above cover a first experience through to real JavaScript, and the only gaps worth paying for are icon coding for pre-readers and Minecraft or Roblox modding.

**Is there a free alternative to Tynker?**
For most of what Tynker does, yes. Scratch covers the block years, Code.org covers structured courses, and Google CS First covers ready-made units. The two things the free tools do not replace are icon coding for children who cannot read fluently and the Minecraft and Roblox integrations. If neither of those describes your child, start free and see whether you ever run out.

**Is freeCodeCamp suitable for children?**
It is free, including the certifications, and it is excellent, but it was not designed for children. There is no hand-holding and the tone assumes an adult changing careers. A 10-year-old will usually bounce off it. A motivated teenager will not.

**What is the catch with free coding platforms?**
Usually that "free" means a trial or a tier that ends a few lessons in. The five on this page do not work that way: no subscription, no card, and nothing that expires. The real limit is scope rather than billing. Scratch has a ceiling, Code.org is closed-ended by design, and the two teenager tools guide you not at all.
`,
  },
  {
    slug: "coding-for-kids-by-age",
    relatedLessons: [1, 6, 20],
    // Kodable's own prices, from kodable.com/parents and kodable.com/plans,
    // read 31 August 2026. The family plans and the school site licences are
    // different products and this page is the one that says so, so it quotes
    // both and declares both.
    quotedPrices: ["US$24.99", "US$119.99", "US$199.99", "US$1,750", "US$2,500", "US$3,500"],
    comparesOptions: ["Ages 5 to 7: before reading is fluent", "Ages 8 to 11: the block years", "Ages 12 to 15: the gap where children quit", "Ages 16 and up: use the real thing"],
    title: "Coding for Kids by Age: 5-7, 8-11, 12-15, 16+",
    description: "What actually works at each age, why the wrong tool at the right age is the usual reason a child quits, and when to move them on. Sourced and dated.",
    h1: "Which coding tool suits my child's age?",
    lastVerified: "2026-08-29",
    targetQueries: ["coding for kids by age", "best coding app for 6 year old", "coding for 8 year old", "coding for 10 year olds", "what age should kids start coding", "coding for teenagers beginner", "is my child too young to learn to code", "when to move from scratch to python"],
    markdown: `**The short version:** ages 5 to 7 need pictures rather than words. 8 to 11 is where blocks work and most children start. Around 11 or 12 blocks stop being satisfying and the wrong move here is the usual reason a child quits. For teenagers, adult tools work and are better, and Python is usually the right first text language.

Parents of 8, 9 and 10 year olds ask this most often, and the answer for that group is almost always Scratch first, then a decision at 11 or 12 about whether to move to Python or to the web.

The common mistake is not starting too early. It is leaving a child in a tool they have outgrown, because the subscription is already paid and the tool still technically works.

Everything below is checked against each product's own site, quoted where it matters, on 29 August 2026.

## Ages 5 to 7: before reading is fluent

At this age the constraint is not intelligence, it is reading speed. A tool that requires reading each block will exhaust a five-year-old before they build anything.

**[ScratchJr](https://www.scratchjr.org/).** Their site states it is for *"young children (ages 5-7)"*. Picture blocks, no text, made for exactly this window. This is the default recommendation.

**[Kodable](https://www.kodable.com/parents).** Paid for families: a seven-day trial with no card, then US$24.99 a month, US$119.99 a year, or US$199.99 once, covering up to four children. The free Kickstart plan people mention is on the school plans page, where the paid tiers run US$1,750, US$2,500 and US$3,500 a year per site. Do not assume either price is the other.

**Tynker**: [icon coding for pre-readers](https://www.tynker.com/pricing/) is genuinely well built and one of the few paid things at this age worth the money. Family plans are $18/month quarterly, $15/month yearly at $180, or $468 lifetime for up to three children.

**Not us.** CodeIt asks a child to describe what they want in words. A five-year-old who cannot yet type a sentence will not get far. We are honest about that on our own pricing page and we will be honest about it here.

## Ages 8 to 11: the block years

This is the sweet spot for block coding and where most children start and stay for two or three years.

**[Scratch](https://scratch.mit.edu/).** *"Scratch is free for everyone"* (Scratch Foundation). Still the best on-ramp that exists, and the community is a large part of why. If your child is happy here, there is no reason to pay anyone anything.

**[Google CS First](https://csfirst.withgoogle.com/).** *"totally free of charge — any number of students, all materials, as many lessons as you want."* Video-led units built on Scratch. Best if you want structure rather than a blank canvas.

**[Code.org](https://code.org/).** Now CodeAI since 2 June 2026, still free, still at the same address. Courses with a path through them.

**Where CodeIt starts to fit:** the top of this band, around 10 or 11, for a child who wants to make a thing and share it rather than complete a course.

## Ages 12 to 15: the gap where children quit

This is the hard part, and it is the reason this site exists.

Blocks start feeling babyish somewhere around 11 or 12. But the adult text-code tools assume motivation a 12-year-old has not built yet, and the drop from dragging a block to a blank file with a blinking cursor is where most children stop coding permanently.

**What works:** anything where they still make something they care about on day one, but the real code is visible. **What fails:** a syntax course. They will complete two lessons and never return.

**[The p5.js Web Editor](https://editor.p5js.org/).** p5.js is *"a free and open-source JavaScript library"*, and the editor runs in the browser with nothing to install. Excellent for a 14-year-old who wants to make visual things. No guidance at all, which suits some children and loses others.

**Code.org** continues to work here, and its later courses are text-based.

**Where CodeIt fits, plainly:** this band is the whole reason we exist. A learner describes a website, game or quiz, plays it, changes it by moving things and picking colours, and a separate view shows what the finished project is made of and opens the lesson behind each idea in it. [Free plan, no card](/pricing), ten AI-assisted builds a month, lessons and playground free regardless. Paid family plan CA$12 a month in Canadian dollars.

If your 13-year-old is thriving in Scratch, leave them there. This band is about the ones who have stopped.

## The one rule that matters more than the age bands

Ages are a starting guess, not a verdict. A confident 9-year-old belongs in the 12-to-15 advice and a hesitant 13-year-old belongs in Scratch, and neither is a problem.

Watch what happens when they get stuck. A child in the right tool gets annoyed and tries again. A child in the wrong tool goes quiet and finds something else to do. That signal is more reliable than any age range on this page, including ours.

## Ages 16 and up: use the real thing

At this point the honest advice is to stop using anything designed for children.

**[freeCodeCamp](https://www.freecodecamp.org/).** *"Every aspect of freeCodeCamp is 100% free. The courses, the projects, even the certifications."* Project-based, serious, and the right answer for a teenager who has decided they want this.

**The p5.js editor**, a plain text editor, or whatever a working developer uses. A 16-year-old who wants to build things should be building them with the tools that build things.

**Not us, mostly.** CodeIt goes to 18 and the lessons are useful for a late beginner, but a motivated 16-year-old is better served by freeCodeCamp and we would rather say so.

| Age | Where most children actually are | What fits |
|---|---|---|
| 5 to 7 | Reading is not fluent yet | Pictures and icons, not words on a screen |
| 8 to 11 | The block years | Scratch and its relatives, where a missing semicolon cannot end the session |
| 12 to 15 | The gap where children quit | Something that produces a visible result fast, and shows the real code behind it |
| 16 and up | Ready for the real thing | The tools adults use, not a version made simpler |

Every row is argued in the section of the same name below, including where we are not the answer.

## Common questions

**What age should kids start coding?**
Five is old enough if the tool uses pictures rather than words. The constraint at that age is reading speed, not intelligence. ScratchJr states it is for ages 5 to 7 and is the default recommendation. Most children start between 8 and 11, which is where block coding works best.

**Is my child too young to learn to code?**
Almost certainly not, but the tool matters more than the age. If they cannot read fluently, anything that requires reading each block will exhaust them before they build anything. Use picture and icon tools until reading is comfortable, then blocks.

**What is the best coding app for a 6 year old?**
ScratchJr, which is free and built for exactly this window. Kodable is worth a look but is paid for families, with a seven-day trial rather than a free tier. Tynker's icon coding for pre-readers is genuinely well built and one of the few paid things at this age worth the money. CodeIt is not the answer here: it asks a child to describe what they want in words.

**What should an 8 or 10 year old use?**
Scratch, almost always, and there is no reason to pay anyone if they are happy there. Google CS First adds video-led structure on top of Scratch, and Code.org gives a path through courses. Around 10 or 11 a child who wants to make a thing and share it rather than complete a course starts to outgrow this band.

**When should we move from Scratch to Python?**
Not on a date. Blocks start feeling babyish around 11 or 12, and the wrong move at that point is the usual reason a child quits. Python suits children around 12 and up who asked for it, or who are heading toward school computer science. Below that, setup friction and text-only output cause more quitting than the language is worth.

**What works for a beginner teenager?**
At 16 and up, stop using anything designed for children. freeCodeCamp is free, project-based, serious, and the right answer for a teenager who has decided they want this. The p5.js Web Editor suits visual and generative work. Between 12 and 15 the need is different: something that produces a visible result fast and shows the real code behind it, because a syntax course loses them in two lessons.

**How do I know if the tool is wrong for my child?**
Watch what happens when they get stuck. A child in the right tool gets annoyed and tries again. A child in the wrong tool goes quiet and finds something else to do. That signal is more reliable than any age range on this page, including ours.
`,
  },
  {
    slug: "best-coding-platforms-for-kids",
    relatedLessons: [1, 9, 31],
    comparesOptions: ["Scratch", "Code.org, now CodeAI", "Tynker", "CodeMonkey", "CodeIt"],
    // CodeMonkey's own prices, read from app.codemonkey.com/home-plans.
    // Corrected 31 August 2026: this page said US$7 individual and US$12
    // family, and the page it cites says US$8 and US$13. Two other guides had
    // the right numbers, so the site contradicted itself about a competitor's
    // price, on the one page that makes the most of having checked.
    quotedPrices: ["US$8", "US$13", "US$20", "US$11", "US$27"],
    title: "The Best Coding Platforms for Kids, Compared Honestly (2026)",
    description: "Scratch, Code.org, Tynker and CodeMonkey, with what each is actually best at, what it costs, and the child each one is wrong for. Prices checked 31 August 2026.",
    h1: "Which coding platform should my child use?",
    lastVerified: "2026-08-31",
    targetQueries: ["best coding platform for kids", "best coding app for kids", "best coding website for kids 2026", "tynker vs code.org vs scratch", "codemonkey vs tynker", "scratch vs tynker", "which coding platform for my child", "best coding program for kids", "kids coding platform comparison"],
    markdown: `**Short answer, by situation.** Under 8 and not reading fluently: Scratch first, Tynker if you want icon coding and can pay. A school or a structured course at no cost: Code.org. A child who likes puzzles and wants text code early: CodeMonkey. A child past blocks who wants to make things rather than take a course: keep reading, and note that we make one of the options on this list.

Prices below were read from each product's own pricing page. CodeMonkey's were re-read on 31 August 2026; the rest on 29 August 2026.

Most roundups of this kind rank the four by popularity, which is not a property of your child. The useful question is which one is wrong for them, and every one of these is wrong for somebody.

| Platform | Cost | Best for | Wrong for |
|---|---|---|---|
| Scratch | Free | A first experience, roughly 7 to 11 | A child who has outgrown blocks, and teenagers who want real code |
| Code.org, now CodeAI | Free | Structured courses at no cost, and classrooms | Open-ended making, and anyone wanting a product rather than a curriculum |
| Tynker | $15 to $18 a month, or $468 once | Pre-readers, and Minecraft or Roblox modding | A child who wants to build their own thing rather than follow a path |
| CodeMonkey | US$8 to US$20 a month | Puzzle-lovers, and a clear line from blocks into text code | A child who wants to make something of their own |
| CodeIt | CA$12/month, free tier | Roughly 8 to 16, past blocks, wants evidence not badges | Pre-readers, Minecraft, and schools |

Prices are each product's own, in each product's own currency, so convert before comparing. The detail behind every row is below.

## Scratch

Free, from MIT, and the reason most children in the world have written any code at all. Blocks snap together, there is nothing to install, and the shared project library is enormous.

**Best for:** a first experience, roughly ages 7 to 11. Nothing else is a better on-ramp and nothing else is as safe a first step.

**Where it stops:** Scratch does not have a next step and does not claim to. It teaches sequencing, loops and conditions in blocks, and then a child gets good at it and there is nowhere to go inside Scratch. That is not a flaw, it is a scope decision by a research group, but it is the single most common reason a parent starts looking at this page.

**Wrong for:** a child who has already made a dozen Scratch projects and is bored, and a teenager who wants to write real code.

## Code.org, now CodeAI

Free, and it stays free. On 2 June 2026 it [rebranded to CodeAI](https://code.org/en-US/codeorg-is-now-codeai), with the Hour of Code becoming the Hour of AI, and it continues to provide free curriculum, tools and professional learning.

**Best for:** structured courses at no cost, and classrooms. Its curriculum work is serious and there is more of it, free, than anyone else offers.

**Where it stops:** it is closed-ended by design. A child works through prepared activities. If what they want is to build their own thing and send someone a link, this is the wrong shape.

**Worth knowing:** the rebrand moved the organisation's centre of gravity toward AI literacy. If you came looking for the coding curriculum specifically, it is still there, but it is no longer the headline. We wrote about [what actually changed](/guide/code-org-is-now-codeai).

**Wrong for:** open-ended making, and a family that wants a product rather than a curriculum.

## Tynker

Paid. From [their pricing page](https://www.tynker.com/parents/pricing/): $18/month billed quarterly, $15/month billed yearly, or $468 once for lifetime. All three cover up to three children, with a 30-day money-back guarantee, and they advertise 5,000+ lessons.

**Best for:** two things nobody else does as well. Icon coding for children who cannot yet read fluently, and Minecraft and Roblox modding for children who already play those games. Both are maintained and both work.

**Where it stops:** it is a course library. The common failure is a subscription bought for a 7-year-old that is still being paid at 11, when the child has outgrown blocks and the text courses feel like homework. At that point cancel it; the library is not the problem, the fit is.

**Wrong for:** a child who wants to build their own thing rather than progress through a path. We wrote a longer look at [when Tynker is still the right answer](/guide/tynker-alternative).

## CodeMonkey

Paid, aimed at grades K to 8. From [their home plans](https://app.codemonkey.com/home-plans): individual US$8/month billed yearly for one child, family US$13/month billed yearly for three, homeschool US$20/month billed yearly for five. Quarterly billing is higher: US$11, US$20 and US$27. It teaches block coding first, then text in CoffeeScript and Python, through game-based challenges.

**Best for:** a child who likes puzzles and rewards, and a parent who wants a clear line from blocks into real text code. The progression is well built and it does move children into typing actual syntax, which is more than most block products manage.

**Where it stops:** every challenge has a correct answer. That is what makes the progression work, and it is also the thing that has aged fastest, because a puzzle with one right answer is exactly what an assistant solves in a second. A child who has worked out that they can ask for the answer will.

**Wrong for:** a child who wants to make something of their own, and any family for whom CoffeeScript being a first text language is a concern. It is a real language and a reasonable teaching choice, but it is not one they will meet again.

## CodeIt

This is us. Weigh it accordingly, and read the disclosure below before you weigh it at all.

A learner describes a website, game or quiz and gets a working version they can play. They change it by moving things, picking colours and fonts, or asking in plain language. A separate view shows what the finished project is made of, and every programming idea in it opens the lesson behind it. There are [31 beginner Python lessons](/lessons) and a Python playground.

The part that is genuinely different: the comprehension questions are generated from the learner's own file. The right answer is whatever they actually wrote, and the wrong options are other real values from the same project, so it cannot be answered from a textbook. Only first attempts count. What a parent gets is a sentence about what their child could explain, not a completion percentage.

Free plan, no card, ten AI-assisted builds a month, with lessons and the playground free for everyone. Family plan CA$12/month, cancellable at any time. That is Canadian dollars against US dollars for Tynker and CodeMonkey, so convert before comparing.

**Best for:** roughly 8 to 16, past blocks, wants to make things, and a parent who wants evidence rather than a badge.

**Wrong for:** pre-readers, where Tynker is better. Minecraft and Roblox, which we do not do at all. Schools, because there is no rostering, no LMS integration, no standards alignment and no teacher dashboards. And anyone who wants a curriculum to hand over and walk away from, which is Code.org or Tynker.

## What the four have in common

All of them answer the same question: how does my child produce code? Blocks, puzzles, guided courses, badges. That question was genuinely hard for twenty years and each of these is a good answer to it.

It is not hard any more. A child with an assistant open has a working game in under a minute. The question that replaced it is whether they understood any of it, and that is a different thing to build for.

## How to actually choose

Ignore the rankings, including this one. Three questions settle it:

1. **Can they read fluently?** If not, the list is Scratch or Tynker and everything else is unusable for them.
2. **Do they want a course or a thing?** A child who wants to finish a path is served by Code.org, Tynker or CodeMonkey. A child who wants to make something and show someone is not.
3. **What happens when they get stuck?** A child in the right tool gets annoyed and tries again. A child in the wrong tool goes quiet and finds something else to do. That signal beats every age range on this page.

## Disclosure

We build CodeIt, which is one of the five options above. A comparison written by one of the products is worth reading sceptically. The test is whether it tells you when to buy a competitor. If a page like this never sends you elsewhere, it is an advert.
## Common questions

**What is the best coding platform for kids?**
There is no single one, and a page that names one without asking about your child is selling something. Under 8 and not reading fluently: Scratch, or Tynker if you want icon coding and can pay. A structured course at no cost: Code.org, now CodeAI. A child who likes puzzles and wants text code early: CodeMonkey. A child past blocks who wants to make things rather than take a course is the case we built CodeIt for.

**Scratch vs Tynker: which should we start with?**
Scratch is free, from MIT, and the best on-ramp there is for roughly 7 to 11. Tynker costs money and earns it in two cases Scratch does not cover: icon coding for children who cannot yet read fluently, and Minecraft and Roblox modding. If neither describes your child, start with Scratch and keep the money.

**CodeMonkey vs Tynker: what is the difference?**
Tynker is a course library advertising 5,000+ lessons, strongest on pre-readers and game modding, covering up to three children for $15 to $18 a month. CodeMonkey is a puzzle progression that moves a child from blocks into text code in CoffeeScript and Python, US$13 a month billed yearly for three children. Tynker is broader. CodeMonkey gets a child typing real syntax sooner, though every challenge has one correct answer, which is exactly what an assistant solves in a second.

**Is Code.org still free now that it is CodeAI?**
Yes. It rebranded on 2 June 2026, the Hour of Code became the Hour of AI, and the free curriculum, tools and professional learning are still there. The emphasis moved toward AI literacy, so the computer science material is no longer the headline, but it did not go away and the address did not change.

**How much do coding platforms for kids cost?**
Read from each product's own pricing page, CodeMonkey's on 31 August 2026 and the rest on 29 August 2026. Scratch and Code.org are free. Tynker is $18 a month billed quarterly, $15 billed yearly, or $468 once, all covering up to three children. CodeMonkey runs US$8 to US$20 a month depending on the plan. CodeIt has a free tier and a CA$12 family plan. Three different currencies, so convert before comparing.

**How do I choose one for my child?**
Three questions settle it. Can they read fluently, because if not the list is only Scratch or Tynker. Do they want a course or a thing to show someone. And what happens when they get stuck: a child in the right tool gets annoyed and tries again, a child in the wrong tool goes quiet and finds something else to do. That last signal beats every age range on this page.
`,
  },
];

export default GUIDE_PAGES;