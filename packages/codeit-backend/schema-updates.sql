-- Schema updates for reward system
-- Run these SQL commands to update your database

-- Add missing columns to existing tables
ALTER TABLE Students ADD COLUMN current_level_xp INT DEFAULT 0;
ALTER TABLE Students ADD COLUMN level_up_threshold INT DEFAULT 1000;

-- Add XP reward columns to Lessons table (for future use)
ALTER TABLE Lessons ADD COLUMN xp_reward INT DEFAULT 100;
ALTER TABLE Lessons ADD COLUMN perfect_attempt_bonus INT DEFAULT 25;

-- Add XP reward columns to Quizzes table
ALTER TABLE Quizzes ADD COLUMN xp_reward INT DEFAULT 75;
ALTER TABLE Quizzes ADD COLUMN perfect_score_bonus INT DEFAULT 50;

-- Add XP tracking to Game_Progress table
ALTER TABLE Game_Progress ADD COLUMN xp_earned INT DEFAULT 0;

-- Create Student_Levels table for level progression
CREATE TABLE IF NOT EXISTS Student_Levels (
    student_id INT NOT NULL,
    current_level INT DEFAULT 1,
    level_xp INT DEFAULT 0,
    total_xp_earned INT DEFAULT 0,
    level_up_date DATETIME,
    PRIMARY KEY (student_id),
    FOREIGN KEY (student_id) REFERENCES Students(user_id)
);

-- Insert sample badges
INSERT INTO Badges (badge_name, description, badge_type, requirement_type, requirement_value, xp_reward) VALUES
('First Lesson', 'Complete your first lesson', 'lesson', 'count', 1, 50),
('Lesson Master', 'Complete 10 lessons', 'lesson', 'count', 10, 200),
('Perfect Student', 'Get perfect score on 5 quizzes', 'quiz', 'count', 5, 300),
('Quiz Champion', 'Complete 20 quizzes', 'quiz', 'count', 20, 250),
('Game Master', 'Complete 15 games', 'game', 'count', 15, 300),
('Speed Learner', 'Complete a lesson in under 5 minutes', 'lesson', 'speed', 300, 100),
('Streak Master', 'Login for 30 consecutive days', 'streak', 'streak', 30, 500),
('Weekly Warrior', 'Complete 3 weekly challenges', 'special', 'count', 3, 400),
('Level Up', 'Reach level 5', 'level', 'count', 5, 300),
('XP Collector', 'Earn 5000 total XP', 'special', 'count', 5000, 500);

-- Create indexes for better performance
CREATE INDEX idx_xp_transactions_student ON XP_Transactions(student_id);
CREATE INDEX idx_xp_transactions_earned_at ON XP_Transactions(earned_at);
CREATE INDEX idx_student_badges_student ON Student_Badges(student_id);
CREATE INDEX idx_daily_streaks_student ON Daily_Streaks(student_id);
CREATE INDEX idx_student_progress_student ON Student_Progress(student_id);
CREATE INDEX idx_game_progress_student ON Game_Progress(student_id);

