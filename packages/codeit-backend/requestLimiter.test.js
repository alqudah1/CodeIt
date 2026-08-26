'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

// ── A limit that counted buildings instead of children ───────────────────────
//
// The generation limiter keyed anonymous users by IP address. A school, a
// library and a family home all share one public IP, so a class of thirty had
// five AI builds between them: the first five children got a project and the
// other twenty-five were told the helper needed a break, for the rest of the
// lesson.
//
// Nothing errors, nothing is logged, and it stops for everybody at the same
// moment, so the teacher has no way to work out what happened.
//
// These tests load the limiter out of the route file without starting a server
// or touching a database, by evaluating just the factory function.

function loadLimiter() {
  const fs = require('node:fs');
  const source = fs.readFileSync(path.join(__dirname, 'routes', 'builder.js'), 'utf8');

  const start = source.indexOf('function createRequestLimiter(');
  const end = source.indexOf('const generationLimiter =');
  assert.ok(start !== -1 && end > start, 'could not find the limiter in builder.js');

  const factory = source.slice(start, end);
  // normalizeJourneyId is the real one; everything else the slice needs is here.
  const { normalizeJourneyId } = require('./analyticsEvents');
  // eslint-disable-next-line no-new-func
  return new Function('normalizeJourneyId', `${factory}; return createRequestLimiter;`)(normalizeJourneyId);
}

const createRequestLimiter = loadLimiter();

const JOURNEY_A = '11111111-1111-4111-8111-111111111111';
const JOURNEY_B = '22222222-2222-4222-8222-222222222222';

function fakeRequest({ ip = '203.0.113.7', journey = null, userId = null } = {}) {
  return {
    ip,
    user: userId ? { user_id: userId } : undefined,
    get: header => (header === 'X-CodeIt-Journey' ? journey : undefined),
  };
}

function fakeResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    set(key, value) { this.headers[key] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

/** Run one request through the limiter. Returns true when it was allowed. */
function attempt(limiter, req) {
  const res = fakeResponse();
  let passed = false;
  limiter(req, res, () => { passed = true; });
  return { passed, res };
}

// ── The classroom ───────────────────────────────────────────────────────────

test('thirty children on one school connection all get their turn', () => {
  const limiter = createRequestLimiter({ anonymous: 5, authenticated: 20 });
  const schoolIp = '198.51.100.10';

  let served = 0;
  for (let child = 0; child < 30; child += 1) {
    const journey = `3${child.toString().padStart(7, '0')}-3333-4333-8333-333333333333`;
    const { passed } = attempt(limiter, fakeRequest({ ip: schoolIp, journey }));
    if (passed) served += 1;
  }

  // Before this change the answer was 5.
  assert.equal(served, 30, `only ${served} of 30 children could build anything`);
});

test('one child still gets their own limit, not the room’s', () => {
  const limiter = createRequestLimiter({ anonymous: 5, authenticated: 20 });
  const req = fakeRequest({ journey: JOURNEY_A });

  for (let i = 0; i < 5; i += 1) {
    assert.ok(attempt(limiter, req).passed, `request ${i + 1} should be allowed`);
  }
  assert.equal(attempt(limiter, req).passed, false, 'the sixth should be refused');
});

test('one child using it up does not stop the child next to them', () => {
  const limiter = createRequestLimiter({ anonymous: 2, authenticated: 20 });
  const sameRoom = '198.51.100.11';

  const a = fakeRequest({ ip: sameRoom, journey: JOURNEY_A });
  attempt(limiter, a);
  attempt(limiter, a);
  assert.equal(attempt(limiter, a).passed, false, 'A should be out of turns');

  const b = fakeRequest({ ip: sameRoom, journey: JOURNEY_B });
  assert.ok(attempt(limiter, b).passed, 'B is a different child and should be fine');
});

// ── The ceiling that still bounds the spend ─────────────────────────────────

test('one machine cannot spend an unbounded amount by inventing browsers', () => {
  // The journey id is spoofable, so the per-IP ceiling is what actually bounds
  // the money. It is set for a full class, not a family of five.
  const limiter = createRequestLimiter({ anonymous: 5, authenticated: 20, perSharedIp: 12 });
  const ip = '198.51.100.12';

  let served = 0;
  for (let i = 0; i < 40; i += 1) {
    const journey = `4${i.toString().padStart(7, '0')}-4444-4444-8444-444444444444`;
    if (attempt(limiter, fakeRequest({ ip, journey })).passed) served += 1;
  }
  assert.equal(served, 12, 'the shared ceiling should hold');
});

test('the ceiling is generous enough for a real class', () => {
  // Thirty children, two or three builds each, in one lesson.
  const limiter = createRequestLimiter({ anonymous: 5, authenticated: 20 });
  const ip = '198.51.100.13';

  let served = 0;
  for (let child = 0; child < 30; child += 1) {
    const journey = `5${child.toString().padStart(7, '0')}-5555-4555-8555-555555555555`;
    for (let go = 0; go < 3; go += 1) {
      if (attempt(limiter, fakeRequest({ ip, journey })).passed) served += 1;
    }
  }
  assert.ok(served >= 75, `only ${served} of 90 requests got through`);
});

// ── The cases that must not regress ─────────────────────────────────────────

test('a browser with no journey id falls back to its address', () => {
  const limiter = createRequestLimiter({ anonymous: 2, authenticated: 20 });
  const req = fakeRequest({ ip: '203.0.113.99', journey: null });
  assert.ok(attempt(limiter, req).passed);
  assert.ok(attempt(limiter, req).passed);
  assert.equal(attempt(limiter, req).passed, false);
});

test('a forged journey id is ignored, not trusted', () => {
  // normalizeJourneyId returns null for anything that is not a UUID, so a
  // header of "abc" must not create a fresh bucket per request.
  const limiter = createRequestLimiter({ anonymous: 2, authenticated: 20 });
  const ip = '203.0.113.50';
  assert.ok(attempt(limiter, fakeRequest({ ip, journey: 'abc' })).passed);
  assert.ok(attempt(limiter, fakeRequest({ ip, journey: 'not-a-uuid' })).passed);
  assert.equal(attempt(limiter, fakeRequest({ ip, journey: '../../etc' })).passed, false);
});

test('a signed-in child is counted by account, wherever they are sitting', () => {
  const limiter = createRequestLimiter({ anonymous: 5, authenticated: 2 });
  const school = fakeRequest({ ip: '198.51.100.20', journey: JOURNEY_A, userId: 77 });
  const home = fakeRequest({ ip: '203.0.113.77', journey: JOURNEY_B, userId: 77 });

  assert.ok(attempt(limiter, school).passed);
  assert.ok(attempt(limiter, home).passed);
  assert.equal(attempt(limiter, home).passed, false, 'the account limit follows the child');
});

test('being refused says how long, and never loses the project', () => {
  const limiter = createRequestLimiter({ anonymous: 1, authenticated: 20 });
  const req = fakeRequest({ journey: JOURNEY_A });
  attempt(limiter, req);
  const { res } = attempt(limiter, req);

  assert.equal(res.statusCode, 429);
  assert.equal(res.body.code, 'AI_LIMIT_REACHED');
  assert.ok(Number(res.headers['Retry-After']) > 0);
  assert.match(res.body.error, /project is safe/i);
});
