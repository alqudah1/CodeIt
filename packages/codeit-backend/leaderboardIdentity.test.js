const test = require('node:test');
const assert = require('node:assert/strict');
const { coderAlias, publicLeaderboardRows } = require('./leaderboardIdentity');

test('coder aliases are stable and contain no personal data', () => {
  assert.equal(coderAlias(12), coderAlias(12));
  assert.match(coderAlias(12), /^[A-Za-z]+ [A-Za-z]+ \d{3}$/);
  assert.notEqual(coderAlias(12), coderAlias(13));
});

test('leaderboard removes ids and names while marking the current student', () => {
  const result = publicLeaderboardRows([
    { student_id: 4, name: 'Private Child Name', xp_points: 900 },
    { student_id: 8, name: 'Another Child', xp_points: 500 },
  ], 8);

  assert.equal(result.total_ranked, 2);
  assert.equal(result.current_rank, 2);
  assert.equal(result.xp_to_next_rank, 401);
  assert.equal(result.leaderboard[1].is_current_user, true);
  assert.equal('student_id' in result.leaderboard[0], false);
  assert.equal('name' in result.leaderboard[0], false);
});

test('current student remains visible when outside the top limit', () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({
    student_id: index + 1,
    xp_points: 1000 - index,
  }));
  const result = publicLeaderboardRows(rows, 25, 20);

  assert.equal(result.leaderboard.length, 21);
  assert.equal(result.leaderboard.at(-1).rank, 25);
  assert.equal(result.leaderboard.at(-1).is_current_user, true);
});
