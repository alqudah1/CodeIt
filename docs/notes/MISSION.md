# The mission, pinned — 28 August 2026

In Mustafa's words, kept here so no compaction ever loses them:

> Imagine yourself as a kid and wanting to play and learn how to code and build
> websites and stuff like that. Create the UI to make it look fantastic — like
> you're in a game, in a fun website, in a safe environment, in a place that you
> wanna stay and build websites and learn more and more. Make it look nice.
> Change everything. I want the design to be something I have never seen before,
> something really nice that challenges other websites — challenges Scratch,
> challenges Blockly, challenges Roblox. I want people to get engaged. This is
> the most important task I give you in a while. After we make sure the UI and
> the UX is top notch — it's a little bit of a fifteen-million-dollar company, I
> want something nice — we make sure that the functionality is one hundred
> percent correct and that nothing is crammed. Today I'm showing my friend the
> website. The buttons are crammed and everything doesn't look good. The boxes
> don't look good. The games don't look good. The buttons don't look good. The
> hero — everything needs from zero to one hundred. It's your job today. And I
> want to get this website to a thousand paying users in the next three months.

## What that means as work

1. **A design language, not a coat of paint.** One system — colour, type,
   depth, motion, sound of voice — applied everywhere, so the site feels like
   one world a child is inside, not forty pages that share a logo.
2. **Nothing crammed.** The A–H measurements stay as guardrails: every screen
   keeps passing screen-share, readable-check, controls-check, device-sweep.
   Beauty that breaks the bars is not accepted.
3. **Functionality 100%.** Every change re-verified by the full browser suite.
   1343 frontend + 178 backend tests stay green.
4. **The three-month goal** — a thousand paying users — is a business outcome,
   not a CSS file. The UI work is the foundation; growth work (referral loops,
   share pages, the publish→show-your-friends moment) gets its own letters
   after the look is right.

## The rule

Same as PLAN.md: nothing is called done because it changed — only because a
browser was pointed at it afterwards and it measurably holds. For design that
means: screenshots before and after, every check green, and the site shown at
phone, tablet and laptop.


## The path to a thousand paying users, as built so far — 29 August

Nobody pays for a coding site. A parent pays at the meeting point of two
loops, and every letter of UI work above serves one of them:

**The child's pride loop.** Make → play → change → show someone. A child who
shows a friend their game comes back tomorrow; a child who comes back is the
only child a parent ever pays for. The studio, Pixel, and the press-down
keycaps all exist to get a child around that loop faster and prouder.

**The stranger's arrival loop.** Every shared project page is a landing page
seen by exactly the right audience: another child, mid-delight, who just
learned that someone their own age made this. That page now answers the
moment — Pixel greets them: "You just played their game. You can make your
own — free, nothing to download, starts right now." Remix keeps its
login-intent flow, so the deepest hook (start from your friend's game) leads
into an account. This is how a thousand users arrive without an advertising
budget: every proud child recruits the next one.

**The parent's evidence loop** — what did my child actually learn — is the
thing the money is for, and it is already honest in the product (concepts
with line numbers from the child's own file, one tap after the first change).
The parent-facing version of that evidence is the next growth letter.

No invented numbers anywhere in this file: user counts and conversion are
measured in the funnel, not asserted here.


**29 August — the parent's evidence loop is built.** A parent's profile now
answers "what did my child actually do" with the child's own lines:
`GET /api/family/children/:id/evidence` hands the linked adult the child's
newest files and finished lessons — permission is the parent-child link and
nothing else, a stranger gets a 404 that does not confirm the child exists —
and the panel reads them with the same concept finder the child's own code
tab uses, so parent and child are shown the same truth. Proven end to end
against a real database: consent wall, verified-email wall, the child's
`let score = 0` on the parent's screen, the stranger turned away.

**30 August — the paying-parent sprint.** Fourteen rounds in one sitting,
each verified before commit, each landed on his Mac with a tree-hash proof:

*Design.* The studio's first screen, the cabinet, Explore, the pricing page
and the homepage's hero mock now speak one language — Paper Arcade: paper
ground, ink borders, hard pop shadows, keycap presses. The giant yellow box
Mustafa hated turned out to be Pixel's coach ring outlining the whole screen;
it halos one shelf now. Six hand-drawn SVG stickers and three 1200×630 share
cards were drawn in the language itself. Explore stopped being a wall of
identical orange rectangles the same day the seed stopped typing every
project "game".

*A child alone.* Lessons and quizzes read themselves out loud to a Big-help
learner — Pixel's voice, one shared mute key — and `lesson-alone.js` walks
lesson 1 on a phone by taps with a keyboard tripwire at zero, plus a
solo-reader word budget over all 171 steps. A new starter, Cat and mouse
chase, is written for the child arriving from Scratch: eleven lines of real
JavaScript each naming the block they replace.

*The money.* The pricing page shows the monthly email instead of promising
it — and the email is real now: composed only from live records, previewed
by the owner before any family receives it, one send per family per month.
The comprehension evidence moved from one browser's localStorage to the
account (`understanding_records`), reaches a parent's phone through the
family panel, and migrates on sign-in so no family loses what their child
already showed. A parent who tries the studio from pricing gets one quiet
line back to the decision. Shared projects unfurl as the child's project
with a drawn card, not as the homepage.

*The measurements.* The lesson retention funnel is an admin table read live
from the tables, not a number in an argument. Every AI fallback now records
its cause — no-api-key, timeout, retry-timeout, invalid-output, error — so
the builder's real failure rate diagnoses itself on production traffic.

*Landed on the way.* Two production blockers found before they bit: the
Postgres adapter silently skips CREATE TABLE IF NOT EXISTS (the maintenance
button now uses a raw path), and the sealed-sensitive DATABASE_URL in Vercel
means the deployed backend is the only thing that can reach the production
database — which is why the pending fixes ship as one admin button.

Still open, honestly: the owner's push and two button presses close the loop
in production; my "I would pay for this" waits on seeing that happen live.
