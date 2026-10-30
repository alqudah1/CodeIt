# What real users said, and what has been done about it

Pinned here rather than in a chat window, because chats get compacted and this
list is not finished. **Nothing comes off this list until it is fixed and
checked in a browser.**

Reported by Mustafa AlQudah, 26 August 2026, from children actually using the
site and from watching them use it.

---

## The complaints, in his words

> people are using the website but i have complains on how and what do i do
> where do i go it takes so much time and how do i edit and what can i edit why
> dont we just use scratch and why are we not writing the code why is the ai
> writing the code and how can i edit and stuff like that and some of the stuff
> is not working people are creating games but some games dont work and its
> taking so much time the save and publish is not working 100% and a lot of
> stuff needs fixing

> the UI is bad so bad all around

---

## Where each one stands

### 1. "how and what do I do" / "where do I go" — **fixed, needs watching**

Extended 27 August: the same two questions were then asked of every screen
outside the studio — home, lessons, a lesson, a quiz, explore, profile, pricing
— at three sizes. 4 of 24 screen/size pairs were at the bar; 23 are now. The
detail is in `PLAN.md` under G.


Measured, not guessed. The studio's first screen on a phone was:

```
 77px  header
222px  hero — "Describe it. Build it. Make it yours."
158px  the guide, saying "Press Game, Website, or Quiz"
223px  What will you build today? → Build a Game · Website · Quiz · BUILD NOW
 ...   and, below the fold, twenty finished projects
```

Ten tappable things before anything happened, and the two loudest both led to
the slowest path in the product. The first thing on the page was "How much help
do you want?" — a self-assessment demanded before a child had seen anything to
assess.

Now: the twenty instant projects come first, the AI row comes after under "Or
ask for something nobody has made yet", the help question is folded into a
settings line, and the guide says "Tap a game to open it."

Measured after, same phone: **fifteen starter cards visible without scrolling,
where there were none.**

### 2. "it takes so much time" — **fixed, both halves**

Two different things wearing one complaint.

Fixed first: the fast path was hidden below the fold while the slow one filled
the screen. See above.

Fixed 27 August: the ten-to-twenty second blank screen. It was never entirely
blank — it showed a progress bar, and then one of five generic demo templates
(click the star; three questions about oceans) while twenty finished, browser-
tested projects sat unused in the same folder. And three things conspired to put
even that out of reach: the progress card sat above it, the hero and all twenty
shelf cards stayed rendered underneath during a build, and pressing Build left
the page scrolled several hundred pixels — so the demo rendered *above* where
the child was looking.

Now the wait shows the real starter closest to what they typed, first on the
page, scrolled to. Measured in a browser, on a phone:

| they typed | they play | after |
|---|---|---|
| "a space game where you dodge rocks" | Dodge the asteroids | **207ms**, at 321px |
| "a quiz about animals" | Animal quiz | **129ms**, at 301px |
| "a website to sell cupcakes" | Cupcake shop | **116ms**, at 301px |

Checked by `ops/checks/complaints-check.js`, which holds the build open for four
seconds so the screen a waiting child sees actually renders. Without that the
local server fails fast, hands back a fallback in 200ms, and the wait never
happens — an earlier run of this check watched exactly that and reported the
feature missing.

### 3. "the save and publish is not working" — **fixed**

It was not broken. It was refusing, and never saying so.

Publishing required a paid plan **and** age 13+, so on a free classroom account
it refused every child. The server sent a clear reason. The studio threw it
away with `catch (_)` and flashed "Try again" on the button for three seconds —
advice that could never work, since neither an age nor a plan changes by
pressing a button twice.

Publishing is now free on every plan. The under-13 rule is untouched and still
outranks everything. When publishing is refused the child reads the real
reason, and it stays on screen.

The pricing page had said "Build, edit, save, and publish projects" in the free
column the whole time. The site promised it and the server refused it.

### 4. "the UI is bad so bad all around" — **fixed, and it was measurable**

A photograph of a classroom monitor showed the four steps that tell a child
what to do next rendered like this:

```
    ✓ Pla     Chi    Pla   Save
      eve  2  one 3  it  4 your
           thi     ag     work
```

`grid-template-columns: repeat(4, minmax(0, 1fr))` — four columns at every
width, and `minmax(0, ...)` explicitly permits a column to shrink below its own
text.

Then a sweep of every screen found **289 more pieces of text below a readable
size**, some at 9.8px. Not a few bad spots: the design system defaulted to
sub-13px for labels. 344 declarations across 40 files were raised to a 13px
floor.

`ops/checks/readable-check.js` now walks 8 screens at 3 sizes and fails on any
text that is clipped by its own box or under 13px. It passes.

### 5. "some games don't work" — **cause found and closed. Rate still unknown.**

The twenty starters are run in a real browser on every build and all twenty pass
at two sizes. What was never tested is what the model invents from a typed idea,
which is most of what children actually do.

Reading the generation path turned out to be decisive without needing an
example. Everything the server checked before handing a project to a child was a
search for words in the text: is it longer than 200 characters, does it contain
`<body`, `<style`, `</html>`, a `<script>` with 80 characters in it, and for a
game the words "score" and "restart" and "setInterval".

**Nothing anywhere asked whether the JavaScript could run.** A generated game
with one unbalanced brace contains every one of those words, passes every check,
reaches the child, and throws on the first frame. They press Play and nothing
happens. That is this complaint, exactly.

`generatedCode.js` now compiles every `<script>` with `new Function` — which
parses and never calls — at both decision points: the first pass and again after
the retry, because a project that failed, was sent back and came back still
broken used to ship anyway. All twenty starters pass it, so it blocks nothing
that works. Deleting one brace from a real starter makes it fail. Every fallback
project parses too; the rescue path had never been checked at all.

**Still open:** how often it actually happened. That needs about ten real
generations against production, which costs money and build quota, so it waits
for Mustafa's word. One broken example from a child would also do it.

### 6. "how do I edit and what can I edit" — **fixed**

Thirteen of the twenty starters are editable piece by piece and a browser check
proves it. Nothing on the screen said so at the moment a child was looking at
their project and wondering.

Now the screen names one real thing in their own file, and the check reads their
file to confirm the words it quotes are actually in it:

| project | what the screen says |
|---|---|
| Animal quiz | names **"🐾 How well do you know animals?"** from their own file |
| Cupcake shop | names **"Cupcakes baked this morning"** from their own file |
| Build a maze | names the walls — a repeated shape they can drag |
| Catch the stars | **silent, and right to be**: a canvas game has nothing to tap |

The silence is asserted too. Three things it wanted to point at had to be ruled
out on the way — an `<h2>Game over!</h2>` the stylesheet hides until you lose, a
tip line that fades out after three seconds, and anything carrying
`pointer-events: none`. All three are real markup a child cannot tap.

Steps to reach editing went from 2 to 1; the button stopped saying "Edit
elements" and started saying "Tap things to change them".

### 7. "why don't we just use Scratch" / "why is the AI writing the code" —
### **answered, 28 August — in the first five minutes, not in a paragraph**

This is not a bug report. It is a challenge to what the product is for, from
the people using it.

The answer already exists in the product: the code tab lists every concept
found *in the child's own file*, with counts and line numbers, and Prove It
asks questions generated from their own variables. GOAL.md says that exists to
answer *"the computer made it, so what did my child actually do?"*

If people are still asking, they are not finding it. It sits on tab three,
after they have already decided.

Nothing here is a code change until the decision is made. It deserves its own
session.

**28 August — Mustafa decided, and it is done.** Asked whether this gets
answered in words on the site or by what the first five minutes feel like, he
chose the five minutes. Asked whether the studio should call it theirs before
they have changed anything: *"no let them change."* And: *"they should see
what's behind in a way that they use the lessons."*

So the studio stopped saying "You built this!" over a project a child has not
touched — it says **"Ready for your first change"** until there is one. And the
first time they change anything, the line that had been asking them to change
something turns into what they just proved they can read:

> 🔍 You changed it, so it is yours now. It uses **Variables** — yours is on line
> 128. **[Learn Variables]** *and 4 more things in your code*

The concept, the line number in their own file, and one tap to the lesson.

| | before | after |
|---|---|---|
| claims they built it | immediately, untouched | **only after they change something** |
| taps to evidence from their own file | 3, if they ever look | **0 — it comes to them** |
| taps from there to a lesson | 3 | **1** |

It opens on a different lesson each time, too: lessons already finished are
skipped, so a child who has done Variables is offered Strings. Signed out,
nothing is finished and the earliest is right.

Checked by `ops/checks/first-five-minutes.js`, which walks those five minutes on
a phone and follows the lesson link to make sure it lands on a real lesson.

**The one thing deliberately not done:** the words on the home page. He chose
the five minutes over the paragraph, so the paragraph was left alone.

---

## The rule this list is held to

Nothing is marked fixed because it was changed. It is marked fixed because a
browser was pointed at it afterwards and the thing that was wrong is measurably
no longer wrong. Every item above that says "fixed" has a number next to it.
