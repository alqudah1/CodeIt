const ADJECTIVES = [
  'Brave', 'Bright', 'Curious', 'Daring', 'Epic', 'Happy',
  'Kind', 'Mighty', 'Quick', 'Super', 'Swift', 'Wise',
];

const CREATURES = [
  'Badger', 'Bear', 'Dolphin', 'Falcon', 'Fox', 'Koala',
  'Otter', 'Owl', 'Panda', 'Penguin', 'Tiger', 'Turtle',
];

function coderAlias(userId) {
  const id = Math.max(0, Number.parseInt(userId, 10) || 0);
  const adjective = ADJECTIVES[id % ADJECTIVES.length];
  const creature = CREATURES[Math.floor(id / ADJECTIVES.length) % CREATURES.length];
  const badge = String((id * 37) % 1000).padStart(3, '0');
  return `${adjective} ${creature} ${badge}`;
}

function publicLeaderboardRows(rows, currentUserId, limit = 20) {
  const ranked = rows.map((row, index) => ({
    rank: index + 1,
    display_name: coderAlias(row.student_id),
    xp_points: Number(row.xp_points) || 0,
    is_current_user: Number(row.student_id) === Number(currentUserId),
  }));

  const visible = ranked.slice(0, limit);
  const current = ranked.find((row) => row.is_current_user);
  if (current && current.rank > limit) visible.push(current);

  return {
    leaderboard: visible,
    total_ranked: ranked.length,
    current_rank: current?.rank || null,
    current_xp: current?.xp_points || 0,
    xp_to_next_rank: current && current.rank > 1
      ? Math.max(0, ranked[current.rank - 2].xp_points - current.xp_points + 1)
      : 0,
  };
}

module.exports = { coderAlias, publicLeaderboardRows };
