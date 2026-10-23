'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// ── What a parent is told ───────────────────────────────────────────────────
//
// The evidence a parent page and the weekly email read: the newest games,
// how many were made this week (counted, not inferred from the three shown),
// the powers learned (progress rows 101 to 112, which have no lessons row
// and so were invisible to the lessons join) and the next one.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';

const queries = [];
require.cache[require.resolve('./db')] = {
  id: require.resolve('./db'), filename: require.resolve('./db'), loaded: true,
  exports: {
    dialect: 'postgres',
    async query(sql, params = []) {
      const s = sql.replace(/\s+/g, ' ').trim();
      queries.push(s);
      if (/FROM parent_child_links/.test(s)) return [params[1] === 4 ? [{ child_user_id: 4 }] : []];
      if (/FROM ai_projects WHERE user_id = \? ORDER BY updated_at/.test(s)) return [[{ id: 9, title: 'Carrot Rain', prompt: 'a bunny', project_type: 'game', generated_code: '<html>', created_at: 'c', updated_at: 'u' }]];
      if (/FROM Student_Lesson_Progress lp JOIN lessons/.test(s)) return [[{ lesson_id: 3, title: 'Strings' }]];
      if (/FROM understanding_records/.test(s)) return [[{ project_key: 'k', project_title: 'Carrot Rain', skills: '["how many times a loop runs"]', created_at: 'c', updated_at: 'u' }]];
      if (/COUNT\(\*\) AS n FROM ai_projects/.test(s)) return [[{ n: '2' }]];
      if (/lesson_id > \? AND lesson_id <= \?/.test(s)) return [[{ lesson_id: 101, completed_at: 'a' }, { lesson_id: 102, completed_at: 'b' }]];
      return [[]];
    },
  },
};
const { getChildEvidence } = require('./familyAccounts');

test('a parent gets the count for the week, the powers learned by name, and the next one', async () => {
  const ev = await getChildEvidence(1, 4);
  assert.equal(ev.weekCount, 2);
  assert.deepEqual(ev.powers.map((p) => p.name), ['Numbers', 'Words']);
  assert.deepEqual(ev.nextPower, { slug: 'looks', name: 'Looks', does: 'pick who is in it' });
  assert.equal(ev.projects[0].title, 'Carrot Rain');
  assert.deepEqual(ev.lessonsDone, [{ id: 3, title: 'Strings' }]);
  assert.deepEqual(ev.understood[0].skills, ['how many times a loop runs']);
  await assert.rejects(() => getChildEvidence(1, 5), /No such learner/);
});
