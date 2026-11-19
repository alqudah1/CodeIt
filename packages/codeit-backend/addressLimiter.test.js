'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createAddressLimiter } = require('./addressLimiter');

// A school is one address. See addressLimiter.js for what was measured.

const MINUTE = 60 * 1000;

test('thirty pupils at one address each get their own allowance', () => {
  const limiter = createAddressLimiter({ perBrowser: 60, perAddress: 1200, windowMs: MINUTE });
  let refused = 0;
  for (let pupil = 0; pupil < 30; pupil += 1) for (let event = 0; event < 20; event += 1) if (!limiter.allow({ address: '81.2.3.4', browser: `pupil-${pupil}` }, 1000)) refused += 1;
  assert.equal(refused, 0, 'a class sending twenty events each in a minute is 600: all counted');
});

test('one browser that will not stop is cut off without using up the school', () => {
  const limiter = createAddressLimiter({ perBrowser: 60, perAddress: 1200, windowMs: MINUTE });
  let allowed = 0;
  for (let n = 0; n < 500; n += 1) if (limiter.allow({ address: '81.2.3.4', browser: 'stuck-in-a-loop' }, 1000)) allowed += 1;
  assert.equal(allowed, 60);
  // The rest of the school is untouched by it.
  assert.equal(limiter.allow({ address: '81.2.3.4', browser: 'someone-else' }, 1000), true);
});

test('an address has a ceiling however many browsers it claims to be', () => {
  const limiter = createAddressLimiter({ perBrowser: 60, perAddress: 1200, windowMs: MINUTE });
  let allowed = 0;
  for (let n = 0; n < 5000; n += 1) if (limiter.allow({ address: '81.2.3.4', browser: `made-up-${n}` }, 1000)) allowed += 1;
  assert.equal(allowed, 1200);
  // Another address is not affected.
  assert.equal(limiter.allow({ address: '90.9.9.9', browser: 'a-child-at-home' }, 1000), true);
});

test('a caller that names no browser is one browser', () => {
  const limiter = createAddressLimiter({ perBrowser: 60, perAddress: 1200, windowMs: MINUTE });
  let allowed = 0;
  for (let n = 0; n < 200; n += 1) if (limiter.allow({ address: '81.2.3.4', browser: null }, 1000)) allowed += 1;
  assert.equal(allowed, 60);
});

test('the allowance comes back when the window has passed', () => {
  const limiter = createAddressLimiter({ perBrowser: 2, perAddress: 10, windowMs: MINUTE });
  assert.equal(limiter.allow({ address: 'a', browser: 'b' }, 0), true);
  assert.equal(limiter.allow({ address: 'a', browser: 'b' }, 1), true);
  assert.equal(limiter.allow({ address: 'a', browser: 'b' }, 2), false);
  assert.equal(limiter.allow({ address: 'a', browser: 'b' }, MINUTE + 1), true);
});

test('the two routes a whole school reaches from one address have room for a school', () => {
  const analytics = fs.readFileSync(path.join(__dirname, 'routes', 'analytics.js'), 'utf8');
  const perBrowser = Number((analytics.match(/const EVENTS_PER_BROWSER = (\d+);/) || [])[1]);
  const perAddress = Number((analytics.match(/const EVENTS_PER_ADDRESS = (\d+);/) || [])[1]);
  assert.ok(perBrowser >= 60, 'a busy page sends more than one event a second for a moment');
  assert.ok(perAddress >= perBrowser * 20, 'twenty busy pupils at once is not a flood');
  assert.match(analytics, /normalizeJourneyId\(req\.get\('X-CodeIt-Journey'\)\)/);
  // Who is signed in is read before the limit is applied, so a browser with no journey id is still its own.
  assert.match(analytics, /router\.post\('\/event', optionalAuth, rateLimit,/);
  assert.match(analytics, /browser: journey \|\| \(req\.user\?\.user_id \? `user:\$\{req\.user\.user_id\}` : null\)/);

  const klass = fs.readFileSync(path.join(__dirname, 'routes', 'class.js'), 'utf8');
  const joins = Number((klass.match(/const JOIN_LIMIT = (\d+);/) || [])[1]);
  assert.ok(joins >= 300, 'ten classes of thirty in an hour, from one address');
  // A class of thirty joining at once must not hold the server still while it makes passwords.
  assert.doesNotMatch(klass, /bcrypt\.hashSync/);
});

test('a link for a friend is counted by browser, and the page says which browser it is', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes', 'unlisted.js'), 'utf8');
  assert.match(route, /router\.post\('\/', optionalAuth, linkLimit,/);
  assert.match(route, /const links = createAddressLimiter\(\{ perBrowser: RATE_LIMIT, perAddress: LINKS_PER_ADDRESS,/);
  const perAddress = Number((route.match(/const LINKS_PER_ADDRESS = (\d+);/) || [])[1]);
  assert.ok(perAddress >= 300, 'a school sharing its games in one hour');
  // The two that stay tight: one flags a link, one sends mail.
  assert.match(route, /router\.post\('\/:publicId\/report', rateLimit,/);
  assert.match(route, /router\.post\('\/:publicId\/email', rateLimit,/);
  assert.match(route, /const careful = createAddressLimiter\(\{ perBrowser: RATE_LIMIT, perAddress: RATE_LIMIT,/);
  // And the studio sends the journey id and the sign-in with the request.
  const studio = fs.readFileSync(path.join(__dirname, '..', 'gamified-elearning', 'src', 'pages', 'Builder', 'studioActions2.js'), 'utf8');
  const send = studio.slice(studio.indexOf('export function makeHandleSendToFriend'));
  assert.match(send.slice(0, 1200), /headers: \{ 'Content-Type': 'application\/json', \.\.\.journeyHeaders\(\), \.\.\.\(token \? \{ Authorization: `Bearer \$\{token\}` \} : \{\}\) \}/);
});
