'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// ── The weekly email says what the parent page says ─────────────────────────

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';

const queries = [];
require.cache[require.resolve('./db')] = {
  id: require.resolve('./db'), filename: require.resolve('./db'), loaded: true,
  exports: {
    dialect: 'postgres',
    async query(sql, params = []) {
      const s = sql.replace(/\s+/g, ' ').trim();
      queries.push([s, params]);
      if (/FROM ai_projects WHERE user_id = \? AND created_at >= NOW\(\) - INTERVAL '7 days'/.test(s)) return [[{ id: 1, title: 'Carrot Rain', prompt: 'a bunny that catches carrots', project_type: 'game', public_id: 'pub1', is_public: 1 }, { id: 2, title: 'Star Dodge', prompt: 'x', project_type: 'game', public_id: 'pub2', is_public: 0 }]];
      if (/completed_at >= NOW\(\) - INTERVAL '7 days'/.test(s)) return [[{ lesson_id: 101 }]];
      if (/SELECT lesson_id FROM Student_Lesson_Progress WHERE user_id = \? AND lesson_id > \? AND lesson_id <= \?$/.test(s)) return [[{ lesson_id: 101 }, { lesson_id: 102 }]];
      if (/FROM understanding_records/.test(s)) return [[{ project_title: 'Carrot Rain', skills: '["how many times a loop runs"]' }]];
      return [[]];
    },
  },
};
const { composeWeeklyEmail, gatherWeek, hasAnythingToSay, weekPeriodOf } = require('./weeklyEvidence');

test('the week period fits the seven-character digest log and changes on Mondays', () => {
  assert.equal(weekPeriodOf(new Date('2026-10-22T12:00:00Z')), '26W43');
  assert.equal(weekPeriodOf(new Date('2026-10-25T23:00:00Z')), '26W43', 'Sunday is still the same week');
  assert.equal(weekPeriodOf(new Date('2026-10-26T01:00:00Z')), '26W44', 'Monday starts the next');
  assert.ok(weekPeriodOf(new Date('2027-01-01T00:00:00Z')).length <= 7);
});

test('the week is gathered from the live tables: games, powers learned this week, the next power, ideas explained', async () => {
  const week = await gatherWeek(9);
  assert.deepEqual(week.projects.map(p => [p.title, p.publicId]), [['Carrot Rain', 'pub1'], ['Star Dodge', null]]);
  assert.deepEqual(week.powers, [{ name: 'Numbers', does: 'change how fast' }]);
  assert.deepEqual(week.nextPower, { name: 'Looks', does: 'pick who is in it' });
  assert.deepEqual(week.understood[0].skills, ['how many times a loop runs']);
  assert.ok(hasAnythingToSay(week));
  assert.ok(!hasAnythingToSay({ projects: [], powers: [], understood: [], nextPower: null }));
});

test('the email is the parent page: headline count, the game to play, learned in plain words, next, the page', async () => {
  const week = await gatherWeek(9);
  const email = composeWeeklyEmail({ studentName: 'Maya', week, unsubscribeToken: 'tok' });
  assert.equal(email.subject, 'Maya made 2 games this week.');
  assert.ok(email.html.includes('Carrot Rain'));
  assert.ok(email.html.includes('/project/pub1'), 'the newest published game is a link that plays');
  assert.ok(email.html.includes('Maya typed: <q>a bunny that catches carrots</q>'));
  assert.ok(email.html.includes('Also: Star Dodge.'));
  assert.ok(email.html.includes('Numbers: change how fast'));
  assert.ok(email.html.includes('how many times a loop runs (in Carrot Rain)'));
  assert.ok(email.html.includes('Next: <strong>Looks</strong>, pick who is in it.'));
  assert.ok(email.html.includes('/parent'));
  assert.ok(email.html.includes('/unsubscribe/tok'));
  assert.ok(!/—|!/.test(email.subject + email.text), 'no em dashes, no shouting');
  assert.ok(email.text.includes('Learned: Numbers: change how fast'));
});

test('a quiet week has an honest headline and no padding; a name cannot inject markup', () => {
  const email = composeWeeklyEmail({ studentName: '<b>Zed</b>', week: { projects: [], powers: [], understood: [], nextPower: { name: 'Numbers', does: 'change how fast' } }, unsubscribeToken: 't' });
  assert.equal(email.subject, '<b>Zed</b> has not built this week yet.');
  assert.ok(email.html.includes('&lt;b&gt;Zed&lt;/b&gt;'));
  assert.ok(!email.html.includes('<b>Zed</b>'));
  assert.ok(!email.html.includes('Learned, in plain words'));
  assert.ok(email.html.includes('Next: <strong>Numbers</strong>'));
});
