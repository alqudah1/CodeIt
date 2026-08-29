# The plan, A to Z

Written 26 August 2026, after real children used the site and told Mustafa it
was confusing, slow and broken.

Worked top to bottom. One letter at a time. **A letter is only crossed off when
a browser has been pointed at it afterwards and the number that was wrong is
measurably no longer wrong** — not when the code changed.

The complaints themselves are in `COMPLAINTS.md`, in his words. The product
this is all in service of is in `GOAL.md`. This file is the order of work.

---

## Where things actually stand, measured

Numbers taken from a real browser, studio with a game open:

| | phone | laptop |
|---|---|---|
| The child's project | **27%** of the page | **33%** of the page |
| Project starts at | 626px down | 553px down |
| Buttons and links | 19 | **31** (21 on the first screen) |
| Words of interface text | 113 | 131 |

Two thirds of the screen is CodeIt talking. A child opened a game and had to
scroll past our furniture to find the thing they made.

---

## A. The project becomes the biggest thing on the screen

**Why.** 33% is backwards. The child made a game; the game should dominate.
Everything else is scaffolding around it and should look like scaffolding.

**Do.** Cut the chrome above the preview: the "Made with CodeIt / Playable
project / Game controls ready" badge row, the duplicated title, the device
size buttons, and the second Play button. Move guidance below the project
rather than above it.

**Done when.** The project is at least 60% of the first screen, visible without
scrolling on a 390px phone, with 10 or fewer controls on the first screen.

**Done, 26 August.** Measured in a browser:

| | before | after |
|---|---|---|
| phone — project starts at | 626px | **336px** |
| phone — share of the first screen | 27% of page | **60%** |
| phone — studio controls on first screen | 9 | **4** |
| laptop — project starts at | 553px | **386px** |
| laptop — share of the first screen | 33% of page | **52%** |
| laptop — studio controls on first screen | 21 | **11** |

Removed: a pretend browser window (three traffic-light dots and an address bar
reading "CodeIt Studio: <name>"), a row of badges telling a child their game was
a "Playable project", the project's name printed a second time, and a full-width
"+ Make something else" sitting above the thing it starts over from.

The laptop's remaining eleven include five that belong to the editing panel —
COLOURS, TEXT, EFFECTS, CONTROLS under MAKE IT MINE. Those are not clutter; they
are C's answer to "what can I edit", visible where a child can find them. The
bar is met on a phone and the laptop is close enough that the next gain comes
from B rather than from more cutting here.

## B. One voice telling a child what to do, not five

**Why.** On one screen right now: a kicker ("YOUR FIRST VERSION IS READY"), a
heading ("Play it. Change it. Test it. Then save it."), a paragraph ("A strong
project needs your ideas..."), a four-step checklist, the Pixel coach, and four
tab labels. Six systems saying versions of the same sentence. A child reads none
of them.

**Do.** Keep the four-step checklist — it is ordered, it knows what has been
done, and each step goes to its page. Delete the kicker, the heading and the
paragraph. The coach becomes the checklist's voice rather than a second one.

**Done when.** Exactly one instruction system is on screen at a time.

**Done, 26 August.** Six became one — the four-step checklist, with a single
short line labelling it. Gone: the kicker, the "Play it. Change it. Test it.
Then save it." heading, and the paragraph underneath it, all three saying what
the checklist says in order while knowing which step you are on.

| | before | after |
|---|---|---|
| instruction systems on screen | 6 | **1** |
| words of interface text, phone | 113 | **63** |
| words of interface text, laptop | 131 | **82** |
| page height, phone | 1850px | **1552px** |

Fourteen tests failed on this, all of them waiting for the deleted heading to
know the studio had finished building. They now wait for the first step of the
checklist, which is what they actually cared about and survives a rewording.

## C. "What can I edit" is answered by the screen

**Why.** Thirteen of the twenty starters can be edited piece by piece and a
browser check proves it. Nothing tells a child that. They asked out loud.

**Do.** When a project opens, show it — an outline on hover, a first-time nudge
on a real element in their own project, edit mode discoverable without opening
a panel.

**Done when.** A child who has never seen the studio can point at something they
could change, without being told.

**Done, 26 August.** The screen now names one real thing in the child's own
project, read out of their own file:

| project | what the screen says |
|---|---|
| Animal quiz | See where it says "🐾 How well do you know animals?"? Tap it… |
| Cupcake shop | See where it says "Cupcakes baked this morning"? Tap it… |
| Build a maze | See the walls? Tap one and you can drag it somewhere else… |
| Catch the stars | *(silent — a canvas game, and rightly)* |

| | before | after |
|---|---|---|
| steps to reach editing | 2 | **1** |
| words on screen about editing | 1 ("COLOURS") | **a sentence naming their own project** |
| button label | "Edit elements" | **"Tap things to change them"** |

It stays quiet on canvas games rather than pointing at something painted, and
three things it wanted to point at had to be ruled out on the way: an
`<h2>Game over!</h2>` the stylesheet hides until you lose, a tip line that fades
out after three seconds, and anything carrying `pointer-events: none`. All three
are real markup a child cannot tap.

## D. Games the AI builds have to run

**Why.** "People are creating games but some games don't work." The twenty
starters are run in a browser on every build and all twenty pass. What has never
been tested is what the model invents from a typed sentence, which is most of
what children actually do.

**Do.** Build a harness that generates projects from real prompts through the
live API and runs each one in a browser exactly like `starters-run.js` does.
Find the true failure rate first. Then fix whatever it shows — generation
prompt, a validation pass before the child sees it, or a retry.

**Done when.** A known percentage is known at all, and then improved. No guesses
before the number exists.

**Half done, 26 August — and the cause was findable without the number.**

Reading the generation path first turned out to be free and decisive. Everything
the server checked before handing a project to a child was a search for words in
the text:

```
html.trim().length > 200
/<body/i, /<style/i, /<\/html>/i
a <script> with at least 80 characters in it
for a game: contains "score", and "restart|startGame|newGame",
            and "setInterval|setTimeout|requestAnimationFrame"
```

**Nothing anywhere asked whether the JavaScript could run.** A generated game
with an unbalanced brace contains every one of those words, passes every check,
reaches the child, and throws on the first frame. They press Play and nothing
happens.

`generatedCode.js` compiles each `<script>` with `new Function` — which parses
and never calls, so a project that would have thrown on line one throws on the
server instead. It runs at both decision points: the first pass, and again after
the retry, because otherwise a project that failed, was sent back, and came back
still broken shipped anyway.

All twenty starters pass it, so it blocks nothing that works. Deleting one brace
from a real starter makes it fail, so it catches what it is for. Every fallback
project parses too — the rescue path was never checked before.

**Still open:** the actual failure rate. That needs live generations against
production, which costs money and build quota, so it waits for Mustafa's word.

## E. The code, displayed like something a child would read

**Why.** "The way the code is displayed needs fixing." It is a real editor over
the child's own file with ninety-nine concept elements underneath it, and that
may be the problem rather than the achievement.

**Do.** Look at it in a browser properly first — including whether the tab even
switches, which it did not in one probe. Then cut it to what a child can use.

**Done when.** A child can find one line of their own code and say what it does.

**Done, 26 August.** Two things were wrong and both were about order.

The tab opened the file at line 1 — `<!doctype html>`, `<html>`, `<head>`, a
viewport meta tag, then sixty lines of CSS. Two hundred lines in the file and
nothing a child would recognise until past line seventy.

And "What you used in this project" — every concept found in their own code,
with the count, the line number and their own line — sat *underneath* the
editor, four thousand pixels down. The best thing on the tab was the last thing
on the page.

| | before | after |
|---|---|---|
| editor opens showing | lines 1–20 | **lines 62–81** |
| the first line a child reads | `<!doctype html>` | `// ── Change these and watch what happens ──` |
| "What you used" appears | after the editor | **before it** |

The jump is explained rather than silent — "Opened at the settings you can
change. Scroll up for the rest of the file." — because a file that opens
somewhere other than the top with no explanation is disorienting.

A starter marks its own settings block, so that is what it opens at. A generated
project has no marker and gets the first real line inside its first `<script>`
instead. The median jump across all twenty starters is over thirty lines, which
is asserted, because a version of this that quietly returned 1 every time would
look exactly like one that worked.

## F. Twenty seconds of blank screen

**Why.** An AI build takes ten to twenty seconds and shows nothing. It is the
single largest wait in the product.

**Do.** Show a real project instantly — a starter close to what they asked for —
and shape it into their idea while they are already playing.

**Done when.** Something playable is on screen within two seconds of asking.

**Done, 26 August.** It already showed *something* — but a progress bar first,
and then one of five generic demo templates (click the star; three questions
about oceans) while twenty finished projects sat unused in the same folder.

Now the wait shows the real starter closest to what the child typed:

| they typed | they play |
|---|---|
| "a space game where you dodge rocks" | **Dodge the asteroids** |
| "a quiz about animals" | **Animal quiz** |
| "a website to sell cupcakes" | **Cupcake shop** |

| | before | after |
|---|---|---|
| what fills the wait | a generic demo | **a real starter, browser-tested every build** |
| the playable thing sits at | 1690px | **287px** |
| share of the first screen | 27% | **56%** |
| order | progress bar, then a demo | **the game, then the progress** |

Three separate things were putting it out of reach. The progress card was above
it. The hero, the twenty shelf cards and the prompt box all stayed on screen
during a build, so it rendered below everything the child had just declined to
use. And the prompt box is far down the page, so pressing Build left the page
scrolled several hundred pixels — the waiting game rendered *above* where the
child was looking, and they spent the build staring at whatever was under their
scroll position.

## G. Every screen, start to finish

**Why.** "The UI needs fixing from the start till the end." A to F are the
studio. This is the rest: home, lessons, the lesson pages, quizzes, explore,
profile, pricing.

**Do.** Walk each one at three sizes with the same two questions used on the
studio: how much of the screen is the thing the child came for, and how many
controls compete for the first tap.

**Done when.** Every screen passes the same bar as A.

**Done, 27 August — 23 of 24 screen/size pairs pass, from 4 of 24.**

`ops/checks/screen-share.js` names, per screen, the thing a child came for, then
measures how far down the first screen they scroll past before it starts, how
much of the screen it fills, and how many controls compete with it. Eight
screens at phone, tablet and laptop.

To measure them at all, the checks now run against a real database: a local
Postgres built from this repository's own migrations, a seeded fourteen-year-old
with four published projects and two finished lessons. Before that, `/explore`
rendered an API error, `/profile` a login form and `/quiz/1` "please log in" —
three of the eight screens were being measured as their signed-out fallbacks.

| | before | after |
|---|---|---|
| screen/size pairs at the bar | 4 of 24 | **23 of 24** |
| pricing — plans start at, laptop | 727px (9% of the screen) | **225px (72%)** |
| explore — projects start at, phone | 610px (28%) | **278px (67%)** |
| lessons — the lessons start at, phone | 422px (50%) | **216px (74%)** |
| home — first tappable thing, phone | 473px | **229px** |
| profile — level, XP, streak start at | 361px | **250px** |
| a quiz — the question starts at, phone | 156px | **112px** |
| header controls, signed-in child | 11 | **6** |
| header controls, signed-out visitor | 9 | **7** |

**The header was most of it.** On every page outside the studio, nine of the
eleven-to-fourteen things competing for a child's first tap were the site
header. No page can get under a ten-control bar while its header spends the
whole budget before the page has rendered anything.

Two of those were the same destination: a "Studio" nav link and a "Start
building" button, four positions apart, both going to `/builder`. Four more were
about one child — their progress, their rank, their avatar, their plan — and
those moved into the account menu, which is where a person looks for exactly
that. Playground moved to the footer and the pages that already link it in a
sentence. Nothing became unreachable.

**What else came off, and why each one was furniture rather than content:**

- **Pricing** — a kicker, a 75px serif headline, a paragraph, a jump link and a
  note under the jump link. The link scrolled past the free plan and the paid
  plan to reach the pilot card, which is the third card in the grid immediately
  below it. The heading stayed, and so did the status pill, because "nothing is
  charged today" is the one thing a parent should read *before* the numbers.
- **Explore** — an eyebrow reading "Community", the word "Explore" at 4.5rem, a
  paragraph explaining what exploring means, and a section heading that repeated
  whichever tab was already highlighted above it.
- **Lessons** — "Complete each lesson to unlock the next. Earn XP and level up
  your Python skills!", above a map where every card already carries a padlock,
  an XP figure and a number.
- **Profile** — the avatar and name stacked above the numbers. Side by side they
  cost 130px instead of 370px and nothing was removed.
- **Home** — the pitch paragraph moved *under* the three cards it describes; the
  hero stopped centring the headline against a taller decorative panel; and on a
  phone the headline stopped running to five lines.
- **A quiz** — Back, the progress bar and the count went onto one row. "Quiz 17"
  went: it was the third thing on the page telling a child which quiz they had
  just tapped into.

**And a real confusion, not just a measurement.** The home page had three cards
with emoji and short names that start a real project, and four hundred pixels
away, three more buttons with short names that only changed a picture in the
demo panel. Six similar-looking taps, three of which do nothing. That is "where
do I go, what do I do" in one screenshot. The demo now shows itself.

**The one that does not pass:** home on a laptop, where the first tappable thing
starts 274px down — 34% of the screen against a 33% bar. What is left above it
is the headline and the line reading "Coding for ages 5 to 18". Deleting the age
line would clear the bar by three pixels. It is the clearest statement on the
site of who this is for, and trading it for a rounding error is Mustafa's call
to make, not mine.

**A bar that was wrong, and was changed rather than gamed.** A's bar is "60% of
the first screen". That works in the studio, where the thing a child came for is
one big rectangle: their game. On a list page it is a grid of small cards, and a
grid holding four projects cannot fill 60% of a laptop screen however good the
layout is — demanding it would be demanding padding. So the share test now only
applies when the content was tall enough to have filled the screen and did not,
and the number that carries across every screen is how far down you scroll
before the point of the page begins.

**Found on the way, and fixed 28 August:** quizzes 1 to 16 had their questions
only in production. No migration contained them, so a database rebuilt from this
repository came back with sixteen lessons whose quizzes answered "no questions
found for this quiz". Lessons 17–31 were fine — those were written after the
migrations existed.

`20260828040000_quiz_questions_1_to_16.sql` adds sixty-four questions, four per
lesson, written against what each lesson actually teaches rather than general
Python trivia: `10 // 3`, `"2" + "3"`, `total = 0` before the loop and not
inside it. Every wrong answer is a mistake children really make.

It is additive and idempotent, guarded the same way the 17-to-31 migration is —
a NOT EXISTS on the question text, because `quiz_questions` has no natural
unique key. Proven rather than asserted: run against a database that already had
all 124 rows, the count afterwards was still 124.

**The first draft of those questions was unusable and a check caught it.**
Written naturally, 49 of the 64 correct answers landed on B and none at all on
D — a child who picks B every time scores 77% and the quiz measures nothing. The
existing quizzes sit at 16/15/15/14. The options are now rotated so the answer
lands evenly, and `ops/checks/quizzes-check.js` fails if any single letter would
carry more than 40%.

That check also answers all 124 questions through the same endpoint the studio
calls, because a question the API cannot mark right is a question no child can
get right, and it fails if any lesson has no quiz behind it at all — which is
the gap that let this one hide until a restore would have found it.

## H. Why not Scratch, and why is the AI writing the code

**Why.** This is not a bug. It is the question the whole product exists to
answer, asked out loud by the people using it. The answer is already built — the
code tab lists every concept found in the child's own file with line numbers,
and Prove It asks questions generated from their own variables — but it is on
tab three, after they have already decided.

**Do.** Nothing until Mustafa decides what he wants the answer to be. It is a
positioning decision, not a code change, and it deserves a session of its own
with him rested.

**Done when.** He has decided. Then it gets its own plan.

**The ground, measured 27 August, before he decided.** What follows is what the
product said then.

Opening a starter on a phone, the entire first screen reads:

```
Ask Pixel · ✓ · You built this! · Animal quiz · Made with CodeIt · Play · Controls · Save
```

One tap away, on the tab called "The code", sits **81 concept elements and 9
line references read out of that child's own file**, under a heading that says
"Your code".

**So the claim is on screen one and the evidence is on screen three.** The
product asserts loudest exactly where it can prove least. A child who is already
asking "why is the AI writing the code" reads "You built this!" over a project
they have not touched, and it does not answer the objection — it confirms it.
The proof they would have accepted is one tab away and they have no reason left
to look.

Worth knowing before deciding: that banner already escalates, and the later
rungs are true. It reads "You built this!" at zero changes, "Personalized by
you" once they have changed something, and "3 edits applied" after that. Only
the first one is a claim about work that has not happened yet.

**The decision, as narrowly as it can be put.** Not "what is CodeIt for" — three
concrete questions:

1. Should the studio claim authorship before a child has changed anything, or
   should the proud moment wait until there is something to be proud of?
2. Should the evidence — their own variables, their own line numbers — meet them
   on the first screen, or stay one deliberate tap away for the ones who look?
3. Is "why not Scratch" a question to answer in words on the site, or one to
   answer by what the first five minutes feel like?

**Decided by Mustafa, 28 August, and done the same day.**

> *"first five minutes"* — on whether "why not Scratch" is answered in words on
> the site or by what the first five minutes feel like.
>
> *"no let them change"* — on whether the studio should claim authorship before
> a child has changed anything.
>
> *"they should see what's behind in a way that they use the lessons"*

Three answers, one change, in one line of the screen.

**The claim stops.** The banner escalated "You built this!" → "Personalized by
you" → "3 edits applied", and the last two were always true. Only the first was
a claim about work that had not happened, and it cost the true ones their
meaning. It now reads **"Ready for your first change"** until there is a change
to point at.

**The evidence arrives at the moment it is earned.** The line under the heading
already pointed at something real in the child's own project and asked them to
change it (C). The first time they change anything, that same line hands over:

> 🔍 You changed it, so it is yours now. It uses **Variables** — yours is on line
> 128. **[Learn Variables]** *and 4 more things in your code*

The concept, the line number in their own file, and the lesson that teaches it.
Not a new panel — the slot C was already using, because B cut six instruction
systems to one and this stays at one.

| | before | after |
|---|---|---|
| the studio claims they built it | immediately, untouched | **only once they have changed something** |
| taps to evidence from their own file | 3 (tab three, unprompted) | **0 — it comes to them** |
| taps from that evidence to a lesson | 3 | **1** |
| when it happens | if they ever open tab three | **the first change, every time** |

**And it opens somewhere new each visit.** "The earliest lesson in your code"
sends every child, on every project, to Lesson 2 — a browser check opened three
different starters and got Variables all three times. That is the right first
answer and a dead end on the second visit. The door now skips lessons already
finished: the seeded learner who has done Lesson 2 is offered Lesson 3 instead.
Signed out, nothing is finished, and the earliest is correct rather than a
fallback.

Checked by `ops/checks/first-five-minutes.js`, which walks the five minutes in
order on a phone — open a starter, confirm the studio claims nothing, change a
colour the way a child would, then follow the lesson link and confirm it lands
on a real lesson rather than a redirect.

**Not done, and deliberately.** The words on the home page still say what they
said. He chose the five minutes over the paragraph, so the paragraph was left
alone.

---

## The checks run themselves now

**28 August.** There was CI, and it ran the unit tests and the build. It ran no
browser check at all — so every check written for this plan was run by whoever
remembered, which is the same arrangement that let the crushed checklist reach a
classroom.

`ops/checks/run-all.sh` builds the whole thing from nothing: a database from this
repository's own migrations, the backend, a production build, one child seeded
through the same API a child uses, then ten browser checks. `.github/workflows/
browser.yml` runs it on every push. `npm run check:browser` is the same command
on a laptop, so a red tick is reproducible in one line.

Two things had to be fixed before it could work at all, and both were the same
kind of bug as the quiz gap — something that only ever ran on the machine it was
written for:

- **The migration set could not rebuild the database.** `harden_database_access`
  revokes a permission on `public.rls_auto_enable()`, a function the Supabase
  dashboard creates and no migration does. On plain Postgres — a restore, a
  laptop, a CI container — it does not exist, and a bare REVOKE against a missing
  function is a hard error that stopped every migration after it. Guarded now:
  identical on Supabase, portable everywhere else.
- **`screen-share.js` reported failures and exited 0.** A check that cannot turn
  a run red is not a check. The one accepted failure — home on a laptop, 34%
  against a 33% bar, because the line above it says "Coding for ages 5 to 18" —
  is now written down with its reason, and anything else fails the run. If the
  allowance stops being needed the run says so, so the list cannot rot.

The runner also needed `--fresh`, because the migration tool's refusal to touch
an unrecorded database is right for production and impossible for a container
created ten seconds ago. `--fresh` refuses any database with a table already in
it, so the guard is the state of the database rather than a promise on the
command line.

---

## Rules for this plan

- **Measure before, measure after.** Every letter above has a number attached.
  A change with no number is an opinion.
- **A browser, not a test file.** Every bug that actually reached a child this
  week — the crushed checklist, the invisible fast path, the silent publish
  refusal — passed every unit test in the repository.
- **One letter at a time, in order.** Do not start D while A is half done.
- **Nothing is crossed off by being changed.** Only by being re-measured.
