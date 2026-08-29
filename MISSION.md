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
