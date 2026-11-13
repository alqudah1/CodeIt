// Guides, part 2 of 5. The list is put together in ../guidePages.js,
// which says why it is in parts.

const GUIDES_B = [
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
| Professionals already work this way, and pretending they do not is dishonest with older teens | The workflow is a moving target. Staking a child's decade of learning on the 2026 way of prompting is a genuine gamble |

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

CodeIt is a browser-based studio where kids build websites, games and quizzes by describing them, then change them by moving things and picking colours, and can open a tab that shows what the project is made of and links to a lesson for each idea in it. The AI-assisted project generation is built so the result stays editable instead of becoming a locked AI result. The specific mechanic this page is about. The loop is: make something, play it, change it, see what it is made of, and publish it. Built for ages 8 to 14. A learner aged 13 or over opens their own account; for anyone younger a parent or guardian confirms their email and creates a private managed profile, which CodeIt supports from age 5. The free plan does not expire, needs no card, and includes ten assisted project builds a month with one managed learner profile under a parent view. A paid family plan is available at CA$12 a month and can be cancelled at any time.

Things we will not blur:

- **Our structured lesson sequence is Python only**: thirty-one beginner lessons, [starting with print](/lesson/1), then variables, strings, conditionals, loops, lists and functions. The web side is learn-by-editing-your-own-project. There is no web curriculum.
- **Under-13 managed profiles cannot publish publicly.** Sharing happens inside the parent-managed account.
- **A child under 13 needs a parent-managed profile.** This is not a set-and-forget product for young children.

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

We build **CodeIt** (codeitlearn.com), a browser-based studio built for ages 8 to 14, so treat this as an ad. A learner describes a website, game or quiz, and AI builds a working first version in plain HTML, CSS and JavaScript. They then change it in place: moving elements, picking colours and fonts, or asking for a change in plain language. A separate view shows which programming ideas the finished project uses, and links each one to its lesson. Errors are caught in the sandbox, rewritten in plain language and pointed at the learner's own line number, and one button restores the last version that ran. [Understanding checks](/builder) are generated from the learner's own file, with wrong answers taken from other real values in that file, and **only first-attempt correct answers are recorded** for the parent view. Finished work sits on a shelf on the front page instead of being overwritten by the next project. Independent accounts start at 13; a younger child uses a parent-managed, email-verified profile. Free now, no card required.

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

We build **CodeIt** (codeitlearn.com), a browser-based studio where a learner describes a website, game or quiz and gets a working version they can play. They change it by moving things on the page, picking colours and fonts, or asking for what they want. A tab then shows what the project is made of and opens the lesson behind each idea it used. The project stays open and changeable rather than locked. Free tier: a monthly allowance of assisted project builds and one managed learner profile with parent view, free now, no card required. Built for ages 8 to 14. Independent accounts start at 13; a younger child uses a parent-managed, email-verified profile.

**Who this is not for, and where we are not the answer on this page.** If your goal is to get a Glitch project you already built back online, it is not a migration tool and not a host for your existing files, use Neocities or GitHub Pages. If you need a Node backend, we do not do that at all. And importantly for this topic: **managed under-13 profiles cannot publish publicly.** If the whole point is a live link a child can send to friends, that constraint matters, and for a child under 13 a parent-owned Neocities or GitHub Pages account is the more honest route. This is a tool for the learning loop, make something, change it, then see what it is made of, save it, not a replacement for hosting.

---

## Common questions

**Is Glitch completely gone?** The company is not, but web app hosting and user app profiles are. Hosting ended 8 July 2025 and is not coming back.

**My glitch.me link still works. Why?** You or the project owner set up a redirect before the 31 December 2025 deadline. Those were promised to work at least through the end of 2026, so it is running out. Repoint it now.

**Can I still download my old project?** The dashboard route closed at the end of 2025. Check GitHub and old emails.

**What is closest to the old Glitch feeling?** CodeSandbox and StackBlitz for remixing and in-browser editing; Neocities for the "make a page, it is live, no ceremony" part. Nothing does both at once.

*Last verified: 23 August 2026.*`,
  },
];

export { GUIDES_B };
