# What CodeIt is for

Written down by Mustafa AlQudah, 25 August 2026, and kept here rather than in a
chat window so it outlives both.

Work does not stop until the product does all of this.

---

## The goal, in the owner's words

> I want the kids to know what to do alone and they can build what's on their
> mind, and they drag and drop and edit and click and edit and edit using a
> prompt also, then publish when it's perfect, and learn the code behind it,
> and connect with others and other projects like Bloxels, Roblox. And the
> website builder to build stuff like the best game engineer, web designer and
> best teacher.

Two more things he has said, and they are part of the goal:

> It has to look like Replit or a big ed-tech company, with all the
> functionality.

> No one should have to be there to make it work.

---

## What that means, concretely

Nine capabilities. Each one either works today or it does not, and this file
says which, with the evidence.

### 1. A child knows what to do without being told

**Partly there.** The front page is three tappable games; one tap and a real
game is playing. The studio has four pages (Play, Change, The code, Save), each
with a line saying what it is for, and a checklist that names the next step.

**Not there:** nobody has watched a child do this without help. That is the
open question this whole file depends on. See *The one number* below.

### 2. Build whatever is in their head

**There, with a caveat.** Type an idea, get a working project. Twenty starters
— ten games, five quizzes and five shop pages — load instantly for children who
would rather not type, on three labelled shelves in the studio.

**Caveat:** an AI build takes ten to twenty seconds, and a child watching a
blank screen for twenty seconds is a child losing interest.

### 3. Drag and drop

**Most of the way there now, and it was the biggest gap in the product.**

- Websites and quizzes: real click-to-select, drag-to-move, resize, delete,
  duplicate. This works today.
- Canvas games: **it does not work at all.** A canvas is one DOM element, so
  tapping a falling star selects the whole board. Those games get sliders and
  colour swatches instead of dragging.

The fix is to build worlds out of HTML elements rather than canvas, so the
editor that already exists works on them. **Thirteen of the twenty starters now
do.** Three games (build a maze, whack a mole, colour memory), five quizzes and
five shop pages put every piece in the page as a real element, and each game
re-reads its level every time it restarts, so a piece a child drags is the piece
the game plays. No new editor code was written for any of it.

`ops/checks/editable-worlds.js` proves it in a real browser rather than
asserting it here: it opens each one, turns on Edit elements, clicks a wall, a
hole, a pad, an answer button and a product row, and fails unless the studio
says it selected that element rather than the canvas or the whole page.

What is still not closed: the seven canvas games, and anything the AI builds
from a typed idea, which still comes back as canvas. The next step is teaching
the generator to prefer elements for simple games.

### 4. Click and edit

**There.** Tap any element: colours, text, padding, font size, six animations.
Applies live, writes into the real file.

### 5. Edit with a prompt, at the same time

**There.** A per-element prompt box sits beside the direct controls, so a child
can drag a heading and also ask for a change in words, on the same element.

### 6. Publish when it is perfect

**There.** Publish gives a public link and counts plays. Under-13 managed
profiles cannot publish, enforced on the server.

### 7. Learn the code behind it

**There, and it is the thing nothing else does.**

The code tab is a real editor over the child's own file. Underneath it, every
concept found *in their code* is listed with the count, the line number, the
child's own line, and how Python writes the same idea. Thirteen concepts, each
linking to the lesson that teaches it.

Then Prove It asks questions generated from their own project. If their game
has `fallSpeed = 3`, it asks what `fallSpeed` starts as, and the wrong answers
are other real numbers from the same file. It cannot be guessed or searched.
Only a first-time-correct answer counts as evidence.

This answers the question every parent of an AI-using child now has: *the
computer made it, so what did my child actually do?*

### 8. Connect with others and other projects

**Barely there.** Explore lists published projects, and a project can be
remixed. There are no friends, no comments, no following, no collections, no
challenges, nothing that makes a child come back because of another child.

Bloxels and Roblox are, in the end, social products. This is the second biggest
gap.

### 9. Teach like the best teacher

**Partly there.** Thirty-one Python lessons with steps, hints and quizzes.

**Not there:** every lesson is Python and every project the studio makes is
HTML, CSS and JavaScript. The two halves of the product teach different
languages and only the code tab admits it. There is no web curriculum.

---

## The one number

None of the above decides whether this is a company. This does:

> **100 children through the front door, and what fraction come back on day 7.**

What the product has actually done so far: 230 children started lesson 1,
**11 finished**, 2 ever published, and the longest streak on record is one day.

Above roughly 20% day-7 return, amplification is worth paying for. At 5% it is
not, and finding out costs nothing but a few weeks. **No ad spend before that
number exists.**

Everything else the owner wants — registering the company, investment, Google
and Meta and TikTok, ten million users — is downstream of it. An investor asks
for it in the first meeting.

---

## How the work is done

Rules that came out of finding real bugs, not out of theory.

- **Never invent a statistic.** The home page once carried five rounded usage
  numbers and the words "verified in July 2026", with nothing behind them. A
  test now fails the build if a usage figure reappears.
- **Check it in a browser.** Unit tests said the games were fine. A browser
  found that the flagship game ended before a child could move, that the
  asteroid game was invisible one load in three, and that the bottom control of
  every studio panel sat underneath the phone's fixed bar.
- **A number that did not change is not a pass.** Jest once reported "680
  passed" while a whole suite failed to compile. Read the count, not the colour.
- **One thing, one name.** `/builder` had seventeen labels. `vocabulary.test.js`
  fails when a retired name comes back.
- **Say the true thing.** Three pages told parents billing was not live while
  checkout was open. Two quoted US dollars. The pricing page advertised a
  "planned plan after testing" beside a working buy button.
- **Do not ship a promise the code cannot keep.** A slider that does nothing is
  worse than no slider.

---

## Nearest things to fix

1. **Drag and drop inside games** (§3) — thirteen of twenty starters prove it
   works; the generator still returns canvas. The remaining half of the hole.
2. **Anything social** (§8) — the reason a child returns tomorrow.
3. **A web curriculum** (§9) — so the lessons teach what the studio builds.
4. **Get it in front of real children** — see *The one number*.
