// Guides, part 3 of 5. The list is put together in ../guidePages.js,
// which says why it is in parts.

const GUIDES_C = [
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

We build **CodeIt** (codeitlearn.com), a browser-based studio where a learner describes a website, game or quiz and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows what the project is made of and opens the lesson behind each idea it used. The project stays open and changeable, not locked. The loop is: make something, play it, change it, see what it is made of, and publish it. Free tier: a monthly allowance of assisted builds, one managed learner profile with parent view, free now, no card required.

**Where we are not the answer.** This page is about publishing, and on publishing we are not the strongest option. It does not host your own domain and is not a general web host, if you already have files and want them online, Neocities or GitHub Pages is the right tool and we would point you there. Most importantly: **managed profiles for under-13s cannot publish publicly.** For a child under 13 whose specific goal is a public link, a parent-owned Neocities or GitHub Pages account is the honest route, not us. CodeIt is built for ages 8 to 14. A learner aged 13 or over opens their own account; for anyone younger a parent or guardian confirms their email and creates a private managed profile, which CodeIt supports from age 5.

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

We build **CodeIt** (codeitlearn.com), a browser-based studio where a learner [describes a website, game or quiz](/builder) and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows what the project is made of and opens the lesson behind each idea it used. The project stays open and changeable rather than locked. The loop is: make something, play it, change it, see what it is made of, and publish it. Free tier: a monthly allowance of assisted project builds, one managed learner profile with parent view, free now, no card required. Built for ages 8 to 14, with parent-managed, email-verified profiles for 5-12 and independent accounts from 13.

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

We build **CodeIt** (codeitlearn.com), a browser-based studio built for ages 8 to 14. A learner describes a website, game or quiz and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows [what the project is made of](/builder) and opens the lesson behind each idea it used. The generated project stays editable, not locked. The loop is: make something, play it, change it, see what it is made of, and publish it. Free tier: a monthly allowance of assisted project builds and one managed learner profile with parent view, free now, no card required. Profiles for ages 5-12 are parent-managed and email-verified; independent accounts start at 13.

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

This page is published by **CodeIt** (codeitlearn.com), which makes a browser-based coding studio for kids, built for ages 8 to 14. So we have an interest here, and you should read the recommendations above with that in mind. We listed the competitors we did because they are the honest answers, including where they beat us.

Where CodeIt genuinely fits a former Juni family: kids who want to [*build* things](/builder), websites, games, quizzes, and then open up the real HTML, CSS and JavaScript underneath to see how they work. Projects can be generated with AI assistance and stay editable afterwards rather than becoming a locked result. The free plan does not expire and needs no card: ten assisted project builds a month and one managed learner profile under a parent view. A paid family plan is available at CA$12 a month, cancellable at any time.

Where CodeIt does not fit: we are not a live-tutoring replacement. There is no instructor on a call. If the scheduled human relationship was the point of Juni for your child, Create & Learn or a local tutor is the better answer, not us. Ages 5–12 use parent-managed, email-verified profiles that cannot publish publicly; independent accounts start at 13.`,
  },
];

export { GUIDES_C };
