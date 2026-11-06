'use strict';

// ── One answer to "may this account be offered a plan" ──────────────────────
//
// The backend decides it from date of birth: a managed profile never buys, and
// neither does anyone under 18. /api/billing/status answers it as canSubscribe,
// and routes/billing.js carries the note explaining why the role on the account
// stopped being usable for this the day an adult could hold a learner account.
//
// The pricing page was moved to that answer. Two other surfaces were not, and
// kept deciding it themselves with role !== 'student':
//
//   - the header's Get Plus button, the only always-visible way to the plan
//   - the studio's monthly-limit card, which is the one moment in the product
//     where someone is actually willing to pay
//
// So an adult working through the lessons on a learner account was told by
// /pricing that they could subscribe, and was never shown either control that
// goes there. The header did not even ask the server, because the fetch was
// gated on the same guess. And upgrade_prompt_shown, the event that is supposed
// to say how often the offer was put in front of anyone, was recorded under the
// same condition, so it undercounted by exactly the group being refused.
//
// This test exists because the divergence was invisible: every piece of it was
// individually reasonable, the pricing page was right, and nothing failed.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

// Every surface that offers a plan, and what the offer is attached to.
const SURFACES = [
  { file: 'pages/Header/Header.js', what: 'the Get Plus button in the top bar' },
  { file: 'pages/Builder/Builder.js', what: "the studio's monthly-limit card" },
  { file: 'pages/Pricing/Pricing.js', what: 'the price control on /pricing' },
];

function read(relative) {
  return fs.readFileSync(path.join(SRC, relative), 'utf8');
}

// Comments in these files quote the old rule on purpose, including this one's
// reasoning. Strip them, or the test fails on its own explanation.
function code(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^[ \t]*\/\/.*$/gm, ' ')
    .replace(/([^:])\/\/.*$/gm, '$1');
}

test('every surface that offers a plan reads the server answer', () => {
  for (const { file, what } of SURFACES) {
    const body = code(read(file));
    assert.ok(
      body.includes('canSubscribe'),
      `${file} decides whether to show ${what} without reading canSubscribe. `
      + 'Whether a family may be charged is the server\'s answer, on '
      + '/api/billing/status. A second rule in the browser is a rule that '
      + 'will disagree with it.'
    );
  }
});

// "role is student" is still a fair way to ask whether to show a child's nav
// bar, and Header.js uses it for exactly that. What it is not is a way to ask
// whether someone may be sold something, and the negated form is that question
// written down: "not a student" only ever means "an adult" to someone who has
// forgotten that an adult can hold a learner account.
test('no plan surface asks whether this is an adult by negating the role', () => {
  for (const { file, what } of SURFACES) {
    const body = code(read(file));
    const guesses = body.match(/role[^;\n]{0,40}!==\s*['"]student['"]/g) || [];
    assert.deepStrictEqual(
      guesses, [],
      `${file} works out "this is an adult" by negating the account role near `
      + `${what}: ${guesses.join(' / ')}. That was an age test only for as long `
      + 'as every student was a child. An adult learning from scratch holds a '
      + 'learner account, the server will sell to them, and this hides the '
      + 'control that takes their money.'
    );
  }
});

// The gate itself, line by line. The test above would pass a file that worked
// the role out into a variable first and gated on that, which is how the
// divergence got in: isAdultAccount read perfectly well and was wrong.
test('the line that gates the plan control names the server answer, not the role', () => {
  const GATES = [
    { file: 'pages/Header/Header.js', name: 'showGetPlus' },
    { file: 'pages/Builder/Builder.js', name: 'mayBuy' },
  ];
  for (const { file, name } of GATES) {
    const body = code(read(file));
    const assignment = new RegExp(`const\\s+${name}\\s*=([\\s\\S]*?);`).exec(body);
    assert.ok(assignment, `${file} no longer declares ${name}, which is what gates the plan control.`);
    const expression = assignment[1];
    assert.ok(
      expression.includes('canSubscribe'),
      `${file}'s ${name} is decided without the server's canSubscribe: ${expression.trim()}`
    );
    assert.ok(
      !/\brole\b/.test(expression),
      `${file}'s ${name} reads the account role: ${expression.trim()}. `
      + 'The role says what kind of account this is. It does not say how old '
      + 'the person holding it is, and age is the rule.'
    );
  }
});

test('the offer is shown only on an explicit yes, never on a pending answer', () => {
  // canSubscribe is null until the request comes back. A truthiness test would
  // read null as "no", which is right, but `!== false` would read it as "yes"
  // and flash a price at a nine-year-old on every page load.
  for (const { file } of SURFACES) {
    const body = code(read(file));
    const loose = body.match(/canSubscribe\s*!==\s*false/g) || [];
    assert.deepStrictEqual(
      loose, [],
      `${file} treats a pending canSubscribe as permission. It starts as null, `
      + 'so the test has to be an explicit === true: fail closed, and a child '
      + 'is never offered a price by a request that has not answered yet.'
    );
  }
});

test('the event that counts the offer is recorded wherever the offer is shown', () => {
  // The point of upgrade_prompt_shown is to make "how many people were asked"
  // answerable. If it is guarded by a different condition than the card it
  // describes, the number quietly means something else.
  const body = code(read('pages/Builder/Builder.js'));
  const lines = body.split('\n');
  const at = lines.findIndex(l => l.includes("'upgrade_prompt_shown'"));
  assert.ok(at >= 0, 'Builder.js no longer records upgrade_prompt_shown at the build limit.');

  // Look back over the guard that decides whether the line runs at all.
  const guard = lines.slice(Math.max(0, at - 6), at + 1).join('\n');
  assert.ok(
    /\bmayBuy\b/.test(guard),
    'upgrade_prompt_shown is recorded under a different condition than the '
    + 'card it is counting. Whatever decides that the offer is visible has to '
    + 'be what decides that the offer is counted, or the funnel number is not '
    + 'about the offer.'
  );
  // And it has to be tied to the card being up, not to the refusal arriving.
  // Those are different moments: the server's verdict can land between them,
  // and when it did, the card appeared and the count did not.
  assert.ok(
    /\bhasLimit\b/.test(guard),
    'upgrade_prompt_shown is recorded somewhere other than where the limit '
    + 'card is shown. The 402 and the card are two different moments, and the '
    + 'answer to "may this account be charged" can arrive between them.'
  );
});
