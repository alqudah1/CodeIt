-- Update quiz IDs from 2-6 to 1-5 to match the new standard approach
-- This script updates the database to use quiz IDs 1-5 instead of 2-6

-- Update Quiz_Questions table
UPDATE Quiz_Questions SET quiz_id = 1 WHERE quiz_id = 2;
UPDATE Quiz_Questions SET quiz_id = 2 WHERE quiz_id = 3;
UPDATE Quiz_Questions SET quiz_id = 3 WHERE quiz_id = 4;
UPDATE Quiz_Questions SET quiz_id = 4 WHERE quiz_id = 5;
UPDATE Quiz_Questions SET quiz_id = 5 WHERE quiz_id = 6;

-- Update Quizzes table (if it exists)
UPDATE Quizzes SET quiz_id = 1 WHERE quiz_id = 2;
UPDATE Quizzes SET quiz_id = 2 WHERE quiz_id = 3;
UPDATE Quizzes SET quiz_id = 3 WHERE quiz_id = 4;
UPDATE Quizzes SET quiz_id = 4 WHERE quiz_id = 5;
UPDATE Quizzes SET quiz_id = 5 WHERE quiz_id = 6;

-- Update Student_Quiz_Attempt table (if it exists)
UPDATE Student_Quiz_Attempt SET quiz_id = 1 WHERE quiz_id = 2;
UPDATE Student_Quiz_Attempt SET quiz_id = 2 WHERE quiz_id = 3;
UPDATE Student_Quiz_Attempt SET quiz_id = 3 WHERE quiz_id = 4;
UPDATE Student_Quiz_Attempt SET quiz_id = 4 WHERE quiz_id = 5;
UPDATE Student_Quiz_Attempt SET quiz_id = 5 WHERE quiz_id = 6;

-- Verify the changes
SELECT 'Quiz Questions after update:' as info;
SELECT quiz_id, COUNT(*) as question_count FROM Quiz_Questions GROUP BY quiz_id ORDER BY quiz_id;

SELECT 'Quizzes table after update:' as info;
SELECT quiz_id, quiz_name FROM Quizzes ORDER BY quiz_id;
