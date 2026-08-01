'use strict';

const PROJECT_XP = Object.freeze({ created: 25, published: 25 });

async function initializeProjectRewards(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_project_xp_awards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      award_type VARCHAR(20) NOT NULL,
      xp_earned INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_ai_project_xp_award (project_id, award_type),
      INDEX idx_ai_project_xp_user (user_id)
    )
  `);
}

async function awardProjectXp(pool, ready, userId, projectId, awardType) {
  const xp = PROJECT_XP[awardType];
  if (!xp) return 0;
  await ready;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [students] = await connection.query(
      'SELECT user_id FROM Students WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    if (!students.length) {
      await connection.rollback();
      return 0;
    }

    const [award] = await connection.query(
      `INSERT IGNORE INTO ai_project_xp_awards
         (user_id, project_id, award_type, xp_earned)
       VALUES (?, ?, ?, ?)`,
      [userId, projectId, awardType, xp]
    );
    if (!award.affectedRows) {
      await connection.rollback();
      return 0;
    }

    await connection.query(
      `UPDATE Students
          SET total_xp = total_xp + ?, weekly_xp = weekly_xp + ?
        WHERE user_id = ?`,
      [xp, xp, userId]
    );
    await connection.commit();
    return xp;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { PROJECT_XP, initializeProjectRewards, awardProjectXp };
