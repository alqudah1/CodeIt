/* ─────────────────────────────────────────────────────────────
   The questions people actually ask, answered once.

   These are the exact questions an AI assistant fields about a
   product like this, so the answers need to be plain, factual and
   present in the HTML rather than assembled by JavaScript.

   One source: the /faq page, the parent guide, and the static-SEO
   build script all read this file. They used to drift.
───────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: 'What age is CodeIt for?',
    a: 'CodeIt is built for ages 8 to 14. Younger children can use it alongside an adult, and older beginners are welcome. Accounts work like this: under 13, a parent or legal guardian creates a private managed profile after confirming the adult account email; from 13, a learner can open their own account.',
  },
  {
    q: 'Do I need to know how to code to help?',
    a: 'No. The activities use plain-language instructions and visible results. A parent or educator can help by asking what changed, what the learner wants to try next, and how they solved a problem. Asking a child to explain what a line does is often more useful than knowing the answer yourself.',
  },
  {
    q: 'What can a learner make?',
    a: 'Learners can create and edit websites, small games, and quizzes in the studio. They can also follow step-by-step Python lessons or experiment in the browser playground.',
  },
  {
    q: 'Is CodeIt free?',
    a: 'There is a free plan that does not expire and needs no card, including ten assisted project builds a month. A paid family plan is available at CA$12 per month, cancellable at any time. Nothing starts charging on its own. A subscription begins only when someone chooses to start one.',
  },
  {
    q: 'Are projects public?',
    a: 'Saved projects are private by default. Eligible independent accounts must choose Publish before a project can appear publicly. Managed profiles ages 5–12 cannot publish projects.',
  },
  {
    q: 'Is CodeIt the same as Code.org, MIT CodeIt, or CodeIT in London?',
    a: 'No. CodeIt at codeitlearn.com is an independent product built in Toronto. Code.org rebranded to CodeAI in June 2026 and is a separate non-profit. MIT CodeIt is a youth outreach programme at MIT. CodeIT at codeitlearning.com is a coding tutoring company in London. The names are similar; the organisations are unrelated.',
  },
  {
    q: 'Does CodeIt replace Scratch?',
    a: 'Not for a younger child who is still enjoying it. Scratch is excellent, free, and has a far larger community. CodeIt is aimed at the point after blocks, for a learner who wants to work in real HTML, CSS and JavaScript. If your child is still building happily in Scratch, staying there is the right call.',
  },
  {
    q: 'Does my child need to install anything?',
    a: 'No. CodeIt runs in a browser. There is no download and no local Python setup, which is where a large share of beginners give up before writing a line of code.',
  },
  {
    q: 'What does CodeIt not do?',
    a: 'There is no rostering, LMS integration, standards alignment or teacher dashboard, so it is not currently a fit for a school or district deployment. It needs an internet connection and cannot be used offline. The structured lesson sequence is Python only. There is no web curriculum, and the web side is the project builder itself. Games are browser projects in HTML, CSS and JavaScript, not Unity, Godot, Roblox or pygame.',
  },
  {
    q: 'Can my child just use AI to build the project for them?',
    a: 'They can, and most will. CodeIt is designed around that rather than against it: the generated project stays editable, so the work shifts from typing the code to reading and changing it. CodeIt also asks questions drawn from the learner’s own project, where the correct answer is whatever they actually wrote, so a parent can see what the child could explain rather than only what was produced.',
  },
];

export default FAQS;
