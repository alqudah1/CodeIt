const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'yaan*23AUG';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.use(authenticateToken);

// Test route to verify rewards router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Rewards router is working!', user: req.user });
});

// XP Calculation Constants
const XP_REWARDS = {
  lesson: {
    base: 100,
    perfectFirstAttempt: 25,
    review: 25
  },
  quiz: {
    base: 75,
    perfectScore: 50,
    retake: 25
  },
  game: {
    base: 50,
    highScore: 25,
    retry: 10
  },
  dailyLogin: {
    days1to7: 20,
    days8to14: 30,
    days15plus: 50
  },
  weeklyChallenge: 200,
  perfectWeekBonus: 100
};

// Helper function to calculate XP
function calculateXP(activityType, performance) {
  const rewards = XP_REWARDS[activityType];
  if (!rewards) return { baseXP: 0, bonusXP: 0, total: 0 };

  let baseXP = rewards.base || 0;
  let bonusXP = 0;

  switch (activityType) {
    case 'lesson':
      if (performance.isFirstAttempt && performance.isPerfect) {
        bonusXP = rewards.perfectFirstAttempt;
      }
      break;
    case 'quiz':
      if (performance.score === 100) {
        bonusXP = rewards.perfectScore;
      }
      break;
    case 'game':
      if (performance.isHighScore) {
        bonusXP = rewards.highScore;
      }
      break;
  }

  return { baseXP, bonusXP, total: baseXP + bonusXP };
}

async function updateStudentXP(studentId, xpEarned, activityType) {
  try {
    // Update total XP
    await pool.query(
      'UPDATE Students SET total_xp = total_xp + ?, weekly_xp = weekly_xp + ?, monthly_xp = monthly_xp + ?, last_activity = NOW() WHERE user_id = ?',
      [xpEarned, xpEarned, xpEarned, studentId]
    );

    // Log XP transaction
    await pool.query(
      'INSERT INTO XP_Transactions (student_id, activity_type, xp_earned, earned_at) VALUES (?, ?, ?, NOW())',
      [studentId, activityType, xpEarned]
    );

    return true;
  } catch (error) {
    console.error('Error updating student XP:', error);
    return false;
  }
}

// Helper function to check and award badges
async function checkAndAwardBadges(studentId, activityType, activityData) {
  try {
    // Get all badges that could be triggered by this activity
    const [badges] = await pool.query(
      'SELECT * FROM Badges WHERE badge_type = ? OR badge_type = ?',
      [activityType, 'special']
    );

    for (const badge of badges) {
      // Check if student already has this badge
      const [existing] = await pool.query(
        'SELECT * FROM Student_Badges WHERE student_id = ? AND badge_id = ?',
        [studentId, badge.badge_id]
      );

      if (existing.length > 0) continue; // Already has badge

      let shouldAward = false;
      let progress = 0;

      switch (badge.requirement_type) {
        case 'count':
          // Count completed activities
          const [countResult] = await pool.query(
            `SELECT COUNT(*) as count FROM XP_Transactions 
             WHERE student_id = ? AND activity_type = ?`,
            [studentId, activityType]
          );
          progress = countResult[0].count;
          shouldAward = progress >= badge.requirement_value;
          break;

        case 'score':
          // Check for perfect scores
          if (activityType === 'quiz' && activityData.score === 100) {
            const [perfectCount] = await pool.query(
              'SELECT COUNT(*) as count FROM Student_Quiz_Attempt WHERE student_id = ? AND score = 100',
              [studentId]
            );
            progress = perfectCount[0].count;
            shouldAward = progress >= badge.requirement_value;
          }
          break;

        case 'streak':
          // Check login streak
          const [streakData] = await pool.query(
            'SELECT current_streak FROM Daily_Streaks WHERE student_id = ?',
            [studentId]
          );
          if (streakData.length > 0) {
            progress = streakData[0].current_streak;
            shouldAward = progress >= badge.requirement_value;
          }
          break;

        case 'speed':
          // Check completion time (for lessons)
          if (activityType === 'lesson' && activityData.completionTime <= badge.requirement_value) {
            shouldAward = true;
            progress = 1;
          }
          break;
      }

      if (shouldAward) {
        // Award the badge
        await pool.query(
          'INSERT INTO Student_Badges (student_id, badge_id, earned_at, progress) VALUES (?, ?, NOW(), ?)',
          [studentId, badge.badge_id, progress]
        );

        // Award badge XP if specified
        if (badge.xp_reward > 0) {
          await updateStudentXP(studentId, badge.xp_reward, 'badge');
        }

        console.log(`Badge awarded: ${badge.badge_name} to student ${studentId}`);
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

// Track lesson completion
router.post('/lesson-complete', async (req, res) => {
  try {
    const { lessonId, isFirstAttempt, isPerfect, completionTime } = req.body;
    const studentId = req.user.user_id;

    if (!lessonId) {
      return res.status(400).json({ error: 'Lesson ID is required' });
    }

    // Check if student exists, create if not
    const [studentCheck] = await pool.query(
      'SELECT user_id FROM Students WHERE user_id = ?',
      [studentId]
    );

    if (studentCheck.length === 0) {
      console.log('Student not found, creating student record for user_id:', studentId);
      await pool.query(
        'INSERT INTO Students (user_id, level_id, total_xp, weekly_xp, monthly_xp, last_activity) VALUES (?, 1, 0, 0, 0, NOW())',
        [studentId]
      );
      console.log('Student record created successfully');
    }

    // Calculate XP
    const xpData = calculateXP('lesson', { isFirstAttempt, isPerfect });
    
    // Update student progress
    await pool.query(
      `INSERT INTO Student_Progress (student_id, lesson_id, status, completed_at, started_at, first_attempt, time_spent, xp_earned) 
       VALUES (?, ?, 'completed', NOW(), NOW(), ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       status = 'completed', completed_at = NOW(), time_spent = ?, xp_earned = ?`,
      [studentId, lessonId, isFirstAttempt ? 1 : 0, completionTime, xpData.total, completionTime, xpData.total]
    );

    // Update XP
    await updateStudentXP(studentId, xpData.total, 'lesson');

    // Check for badges
    await checkAndAwardBadges(studentId, 'lesson', { lessonId, isFirstAttempt, isPerfect, completionTime });

    res.json({
      success: true,
      xpEarned: xpData.total,
      baseXP: xpData.baseXP,
      bonusXP: xpData.bonusXP,
      message: 'Lesson completed successfully'
    });

  } catch (error) {
    console.error('Error tracking lesson completion:', error);
    res.status(500).json({ error: 'Failed to track lesson completion' });
  }
});

// Track game completion
router.post('/game-complete', async (req, res) => {
  try {
    const { lessonId, gameType, score, isHighScore, attempts, completionTime } = req.body;
    const studentId = req.user.user_id;

    if (!lessonId || !gameType) {
      return res.status(400).json({ error: 'Lesson ID and game type are required' });
    }

    // Check if student exists, create if not
    const [studentCheck] = await pool.query(
      'SELECT user_id FROM Students WHERE user_id = ?',
      [studentId]
    );

    if (studentCheck.length === 0) {
      console.log('Student not found, creating student record for user_id:', studentId);
      await pool.query(
        'INSERT INTO Students (user_id, level_id, total_xp, weekly_xp, monthly_xp, last_activity) VALUES (?, 1, 0, 0, 0, NOW())',
        [studentId]
      );
      console.log('Student record created successfully');
    }

    // Calculate XP
    const xpData = calculateXP('game', { isHighScore });
    
    // Update game progress
    await pool.query(
      `INSERT INTO Game_Progress (student_id, lesson_id, game_type, score, completion_time, attempts, completed, best_score, xp_earned, played_at) 
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       score = GREATEST(score, ?), completion_time = LEAST(completion_time, ?), attempts = attempts + 1, 
       completed = 1, best_score = GREATEST(best_score, ?), xp_earned = xp_earned + ?`,
      [studentId, lessonId, gameType, score, completionTime, attempts, score, xpData.total, score, completionTime, score, xpData.total]
    );

    // Update XP
    await updateStudentXP(studentId, xpData.total, 'game');

    // Check for badges
    await checkAndAwardBadges(studentId, 'game', { lessonId, gameType, score, isHighScore });

    res.json({
      success: true,
      xpEarned: xpData.total,
      baseXP: xpData.baseXP,
      bonusXP: xpData.bonusXP,
      message: 'Game completed successfully'
    });

  } catch (error) {
    console.error('Error tracking game completion:', error);
    res.status(500).json({ error: 'Failed to track game completion' });
  }
});

// Track daily login
router.post('/daily-login', async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const today = new Date().toISOString().split('T')[0];

    // Check if already logged in today
    const [existing] = await pool.query(
      'SELECT * FROM Daily_Streaks WHERE student_id = ? AND last_login_date = ?',
      [studentId, today]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Already logged in today', xpEarned: 0 });
    }

    // Get current streak
    const [streakData] = await pool.query(
      'SELECT * FROM Daily_Streaks WHERE student_id = ?',
      [studentId]
    );

    let currentStreak = 1;
    let longestStreak = 1;
    let totalLoginDays = 1;

    if (streakData.length > 0) {
      const lastLogin = new Date(streakData[0].last_login_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLogin.toDateString() === yesterday.toDateString()) {
        // Consecutive day
        currentStreak = streakData[0].current_streak + 1;
        longestStreak = Math.max(streakData[0].longest_streak, currentStreak);
        totalLoginDays = streakData[0].total_login_days + 1;
      } else if (lastLogin.toDateString() !== today) {
        // Streak broken
        currentStreak = 1;
        longestStreak = streakData[0].longest_streak;
        totalLoginDays = streakData[0].total_login_days + 1;
      }
    }

    // Calculate XP based on streak
    let xpEarned = 0;
    if (currentStreak <= 7) {
      xpEarned = XP_REWARDS.dailyLogin.days1to7;
    } else if (currentStreak <= 14) {
      xpEarned = XP_REWARDS.dailyLogin.days8to14;
    } else {
      xpEarned = XP_REWARDS.dailyLogin.days15plus;
    }

    // Update streak data
    await pool.query(
      `INSERT INTO Daily_Streaks (student_id, current_streak, longest_streak, last_login_date, total_login_days) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       current_streak = ?, longest_streak = ?, last_login_date = ?, total_login_days = ?`,
      [studentId, currentStreak, longestStreak, today, totalLoginDays, currentStreak, longestStreak, today, totalLoginDays]
    );

    // Update XP
    await updateStudentXP(studentId, xpEarned, 'daily_login');

    // Check for badges
    await checkAndAwardBadges(studentId, 'streak', { currentStreak });

    res.json({
      success: true,
      xpEarned,
      currentStreak,
      longestStreak,
      message: 'Daily login recorded'
    });

  } catch (error) {
    console.error('Error tracking daily login:', error);
    res.status(500).json({ error: 'Failed to track daily login' });
  }
});

// Get student progress and stats
router.get('/progress', async (req, res) => {
  try {
    const studentId = req.user.user_id;

    // Get student stats
    const [studentData] = await pool.query(
      'SELECT total_xp, weekly_xp, monthly_xp, total_badges FROM Students WHERE user_id = ?',
      [studentId]
    );

    // Get recent XP transactions
    const [xpTransactions] = await pool.query(
      `SELECT activity_type, xp_earned, earned_at, reason 
       FROM XP_Transactions 
       WHERE student_id = ? 
       ORDER BY earned_at DESC 
       LIMIT 10`,
      [studentId]
    );

    // Get earned badges
    const [badges] = await pool.query(
      `SELECT b.badge_name, b.description, b.icon_url, sb.earned_at 
       FROM Student_Badges sb 
       JOIN Badges b ON sb.badge_id = b.badge_id 
       WHERE sb.student_id = ? 
       ORDER BY sb.earned_at DESC`,
      [studentId]
    );

    // Get streak info
    const [streakData] = await pool.query(
      'SELECT current_streak, longest_streak, total_login_days FROM Daily_Streaks WHERE student_id = ?',
      [studentId]
    );

    res.json({
      success: true,
      stats: studentData[0] || { total_xp: 0, weekly_xp: 0, monthly_xp: 0, total_badges: 0 },
      recentXP: xpTransactions,
      badges: badges,
      streak: streakData[0] || { current_streak: 0, longest_streak: 0, total_login_days: 0 }
    });

  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ error: 'Failed to get progress data' });
  }
});

// Get leaderboards
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { period } = req.query;

    let query = '';
    let params = [];

    switch (type) {
      case 'weekly_xp':
        query = `
          SELECT s.user_id, u.name, s.weekly_xp as xp_points, 
                 ROW_NUMBER() OVER (ORDER BY s.weekly_xp DESC) as rank_position
          FROM Students s 
          JOIN Users u ON s.user_id = u.user_id 
          WHERE s.weekly_xp > 0 
          ORDER BY s.weekly_xp DESC 
          LIMIT 50
        `;
        break;

      case 'monthly_badges':
        query = `
          SELECT s.user_id, u.name, COUNT(sb.badge_id) as xp_points,
                 ROW_NUMBER() OVER (ORDER BY COUNT(sb.badge_id) DESC) as rank_position
          FROM Students s 
          JOIN Users u ON s.user_id = u.user_id 
          LEFT JOIN Student_Badges sb ON s.user_id = sb.student_id 
          WHERE sb.earned_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
          GROUP BY s.user_id, u.name 
          ORDER BY COUNT(sb.badge_id) DESC 
          LIMIT 50
        `;
        break;

      case 'streak':
        query = `
          SELECT s.user_id, u.name, ds.current_streak as xp_points,
                 ROW_NUMBER() OVER (ORDER BY ds.current_streak DESC) as rank_position
          FROM Students s 
          JOIN Users u ON s.user_id = u.user_id 
          JOIN Daily_Streaks ds ON s.user_id = ds.student_id 
          WHERE ds.current_streak > 0 
          ORDER BY ds.current_streak DESC 
          LIMIT 50
        `;
        break;

      case 'all_time':
        query = `
          SELECT s.user_id, u.name, s.total_xp as xp_points,
                 ROW_NUMBER() OVER (ORDER BY s.total_xp DESC) as rank_position
          FROM Students s 
          JOIN Users u ON s.user_id = u.user_id 
          WHERE s.total_xp > 0 
          ORDER BY s.total_xp DESC 
          LIMIT 50
        `;
        break;

      default:
        return res.status(400).json({ error: 'Invalid leaderboard type' });
    }

    const [results] = await pool.query(query, params);
    res.json({ success: true, leaderboard: results });

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get student progress status for lessons, quizzes, and puzzles
router.get('/progress-status', async (req, res) => {
  try {
    const studentId = req.user.user_id;

    // Get completed lessons
    const [lessons] = await pool.query(
      'SELECT lesson_id FROM Student_Progress WHERE student_id = ? AND status = "completed"',
      [studentId]
    );

    // Get completed quizzes (based on quiz attempts)
    const [quizzes] = await pool.query(
      `SELECT DISTINCT q.quiz_id 
       FROM Quizzes q 
       JOIN Student_Quiz_Attempt sqa ON q.quiz_id = sqa.quiz_id 
       WHERE sqa.student_id = ? 
       AND q.quiz_id IN (
         SELECT quiz_id FROM Student_Quiz_Attempt 
         WHERE student_id = ? 
         GROUP BY quiz_id 
         HAVING COUNT(*) >= (
           SELECT COUNT(*) FROM Quiz_Questions WHERE quiz_id = q.quiz_id
         )
       )`,
      [studentId, studentId]
    );

    // Get completed puzzles/games
    const [puzzles] = await pool.query(
      'SELECT lesson_id FROM Game_Progress WHERE student_id = ? AND completed = 1',
      [studentId]
    );

    // Convert to the format expected by ProgressContext
    const progress = {
      lessons: { 1: false, 2: false, 3: false, 4: false, 5: false },
      quizzes: { 1: false, 2: false, 3: false, 4: false, 5: false },
      puzzles: { 1: false, 2: false, 3: false, 4: false, 5: false }
    };

    // Mark completed lessons
    lessons.forEach(lesson => {
      if (lesson.lesson_id >= 1 && lesson.lesson_id <= 5) {
        progress.lessons[lesson.lesson_id] = true;
      }
    });

    // Mark completed quizzes
    quizzes.forEach(quiz => {
      if (quiz.quiz_id >= 1 && quiz.quiz_id <= 5) {
        progress.quizzes[quiz.quiz_id] = true;
      }
    });

    // Mark completed puzzles (using lesson_id as puzzle_id)
    puzzles.forEach(puzzle => {
      if (puzzle.lesson_id >= 1 && puzzle.lesson_id <= 5) {
        progress.puzzles[puzzle.lesson_id] = true;
      }
    });

    res.json({ success: true, progress });

  } catch (error) {
    console.error('Error getting progress status:', error);
    res.status(500).json({ error: 'Failed to get progress status' });
  }
});

// Update progress status (for marking completions)
router.post('/update-progress', async (req, res) => {
  try {
    const { type, id } = req.body; // type: 'lesson', 'quiz', 'puzzle', id: number
    const studentId = req.user.user_id;

    if (!type || !id) {
      return res.status(400).json({ error: 'Type and ID are required' });
    }

    // Check if student exists, create if not
    const [studentCheck] = await pool.query(
      'SELECT user_id FROM Students WHERE user_id = ?',
      [studentId]
    );

    if (studentCheck.length === 0) {
      console.log('Student not found, creating student record for user_id:', studentId);
      await pool.query(
        'INSERT INTO Students (user_id, level_id, total_xp, weekly_xp, monthly_xp, last_activity) VALUES (?, 1, 0, 0, 0, NOW())',
        [studentId]
      );
      console.log('Student record created successfully');
    }

    let success = false;

    switch (type) {
      case 'lesson':
        // Mark lesson as complete
        await pool.query(
          `INSERT INTO Student_Progress (student_id, lesson_id, status, completed_at, started_at, first_attempt, time_spent, xp_earned) 
           VALUES (?, ?, 'completed', NOW(), NOW(), 1, 0, 100)
           ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
          [studentId, id]
        );
        success = true;
        break;

      case 'quiz':
        // Quiz completion is handled by the quiz submission endpoint
        // This endpoint just confirms the completion
        success = true;
        break;

      case 'puzzle':
        // Mark puzzle/game as complete
        await pool.query(
          `INSERT INTO Game_Progress (student_id, lesson_id, game_type, score, completion_time, attempts, completed, best_score, xp_earned, played_at) 
           VALUES (?, ?, 'puzzle', 100, 0, 1, 1, 100, 50, NOW())
           ON DUPLICATE KEY UPDATE completed = 1`,
          [studentId, id]
        );
        success = true;
        break;

      default:
        return res.status(400).json({ error: 'Invalid type. Must be lesson, quiz, or puzzle' });
    }

    res.json({ success, message: `${type} ${id} marked as complete` });

  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get user progress percentages for dashboard
router.get('/progress-percentages', async (req, res) => {
  console.log('📊 Progress percentages endpoint hit');
  console.log('User:', req.user);
  try {
    const studentId = req.user.user_id;

    // Check if student exists, create if not
    const [studentCheck] = await pool.query(
      'SELECT user_id FROM Students WHERE user_id = ?',
      [studentId]
    );

    if (studentCheck.length === 0) {
      console.log('Student not found, creating student record for user_id:', studentId);
      await pool.query(
        'INSERT INTO Students (user_id, level_id, total_xp, weekly_xp, monthly_xp, last_activity) VALUES (?, 1, 0, 0, 0, NOW())',
        [studentId]
      );
      console.log('Student record created successfully');
    }

    // Calculate lesson progress percentage (completed lessons / total lessons)
    console.log('🔍 Calculating lesson progress for student:', studentId);
    const [lessonStats] = await pool.query(
      `SELECT 
        COUNT(DISTINCT sp.lesson_id) as completed_lessons,
        (SELECT COUNT(*) FROM Lessons) as total_lessons
       FROM Student_Progress sp 
       WHERE sp.student_id = ? AND sp.status = 'completed'`,
      [studentId]
    );
    console.log('📚 Lesson stats:', lessonStats[0]);

    // Calculate quiz progress percentage (completed quizzes / total quizzes)
    const [quizStats] = await pool.query(
      `SELECT 
        COUNT(DISTINCT sqa.quiz_id) as completed_quizzes,
        (SELECT COUNT(*) FROM Quizzes) as total_quizzes
       FROM Student_Quiz_Attempt sqa 
       WHERE sqa.student_id = ? 
       AND sqa.quiz_id IN (
         SELECT q.quiz_id FROM Quizzes q
         WHERE q.quiz_id IN (
           SELECT quiz_id FROM Student_Quiz_Attempt 
           WHERE student_id = ? 
           GROUP BY quiz_id 
           HAVING COUNT(*) >= (
             SELECT COUNT(*) FROM Quiz_Questions WHERE quiz_id = q.quiz_id
           )
         )
       )`,
      [studentId, studentId]
    );

    // Calculate game progress percentage (completed games / total games)
    const [gameStats] = await pool.query(
      `SELECT 
        COUNT(DISTINCT gp.lesson_id) as completed_games,
        (SELECT COUNT(*) FROM Lessons) as total_games
       FROM Game_Progress gp 
       WHERE gp.student_id = ? AND gp.completed = 1`,
      [studentId]
    );

    // Calculate percentages
    const lessonPercentage = lessonStats[0].total_lessons > 0 
      ? Math.round((lessonStats[0].completed_lessons / lessonStats[0].total_lessons) * 100)
      : 0;

    const quizPercentage = quizStats[0].total_quizzes > 0 
      ? Math.round((quizStats[0].completed_quizzes / quizStats[0].total_quizzes) * 100)
      : 0;

    const gamePercentage = gameStats[0].total_games > 0 
      ? Math.round((gameStats[0].completed_games / gameStats[0].total_games) * 100)
      : 0;

    console.log('Progress calculation:', {
      lesson: `${lessonStats[0].completed_lessons}/${lessonStats[0].total_lessons} = ${lessonPercentage}%`,
      quiz: `${quizStats[0].completed_quizzes}/${quizStats[0].total_quizzes} = ${quizPercentage}%`,
      game: `${gameStats[0].completed_games}/${gameStats[0].total_games} = ${gamePercentage}%`
    });

    res.json({
      success: true,
      progress: {
        lesson: Math.min(100, lessonPercentage),
        quiz: Math.min(100, quizPercentage),
        game: Math.min(100, gamePercentage)
      }
    });

  } catch (error) {
    console.error('Error fetching progress percentages:', error);
    res.status(500).json({ error: 'Failed to fetch progress percentages' });
  }
});

// Get user's personal rank for a specific leaderboard type
router.get('/my-rank/:type', async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { type } = req.params;

    let query = '';
    
    switch (type) {
      case 'weekly_xp':
        query = `
          SELECT rank_position FROM (
            SELECT user_id, 
                   ROW_NUMBER() OVER (ORDER BY weekly_xp DESC) as rank_position
            FROM Students 
            WHERE weekly_xp > 0
          ) ranked 
          WHERE user_id = ?
        `;
        break;
        
      case 'monthly_badges':
        query = `
          SELECT rank_position FROM (
            SELECT s.user_id,
                   ROW_NUMBER() OVER (ORDER BY COUNT(sb.badge_id) DESC) as rank_position
            FROM Students s 
            LEFT JOIN Student_Badges sb ON s.user_id = sb.student_id 
            WHERE sb.earned_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            GROUP BY s.user_id
            HAVING COUNT(sb.badge_id) > 0
          ) ranked 
          WHERE user_id = ?
        `;
        break;
        
      case 'streak':
        query = `
          SELECT rank_position FROM (
            SELECT s.user_id,
                   ROW_NUMBER() OVER (ORDER BY ds.current_streak DESC) as rank_position
            FROM Students s 
            JOIN Daily_Streaks ds ON s.user_id = ds.student_id 
            WHERE ds.current_streak > 0
          ) ranked 
          WHERE user_id = ?
        `;
        break;
        
      case 'all_time':
        query = `
          SELECT rank_position FROM (
            SELECT user_id, 
                   ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank_position
            FROM Students 
            WHERE total_xp > 0
          ) ranked 
          WHERE user_id = ?
        `;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid leaderboard type' });
    }

    const [result] = await pool.query(query, [studentId]);
    res.json({ 
      success: true, 
      rank: result[0]?.rank_position || null,
      message: result[0] ? 'Rank found' : 'Not ranked yet' 
    });

  } catch (error) {
    console.error('Error getting user rank:', error);
    res.status(500).json({ error: 'Failed to get rank' });
  }
});

// Get recent achievers (latest badges/XP gains)
router.get('/recent-achievers', async (req, res) => {
  try {
    const [recentXP] = await pool.query(`
      SELECT u.name, xt.activity_type, xt.xp_earned, xt.earned_at
      FROM XP_Transactions xt
      JOIN Students s ON xt.student_id = s.user_id
      JOIN Users u ON s.user_id = u.user_id
      ORDER BY xt.earned_at DESC
      LIMIT 10
    `);

    const [recentBadges] = await pool.query(`
      SELECT u.name, b.badge_name, b.icon_url, sb.earned_at
      FROM Student_Badges sb
      JOIN Students s ON sb.student_id = s.user_id
      JOIN Users u ON s.user_id = u.user_id
      JOIN Badges b ON sb.badge_id = b.badge_id
      ORDER BY sb.earned_at DESC
      LIMIT 10
    `);

    res.json({ 
      success: true, 
      recentXP,
      recentBadges 
    });
  } catch (error) {
    console.error('Error getting recent achievers:', error);
    res.status(500).json({ error: 'Failed to get recent achievers' });
  }
});

module.exports = router;
