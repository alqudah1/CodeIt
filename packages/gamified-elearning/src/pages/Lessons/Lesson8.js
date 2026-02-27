import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonEditor from '../pythoneditor/PythonEditor';
import Header from '../Header/Header';
import './PythonLesson.css';
import {
  trackStaticLessonCompletion,
  showXPNotification,
  initializeTimeTracker,
  autoTrackDailyLogin,
  showLessonLockedToast
} from '../../utils/progressTracker';
import { useProgress } from '../../context/ProgressContext';

const Lesson8 = () => {
  const navigate = useNavigate();
  const { markLessonComplete } = useProgress();
  const [lessonOutput, setLessonOutput] = useState('');
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);

  const [lessonProgress, setLessonProgress] = useState({
    hasRunCode: false,
    hasModifiedCode: false,
    hasSeenOutput: false,
    hasCompletedChallenge: false
  });

  useEffect(() => { autoTrackDailyLogin(); }, []);

  const isLessonEligibleForCompletion = () =>
    lessonProgress.hasRunCode || lessonProgress.hasModifiedCode ||
    lessonProgress.hasSeenOutput || lessonProgress.hasCompletedChallenge;

  const handleCodeOutput = (output) => {
    setLessonOutput(output);
    const defaultOutput = "Oops! Can't divide by zero.";
    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasSeenOutput: output.length > 0,
      hasModifiedCode: output !== defaultOutput && output.length > 0,
      hasCompletedChallenge: output.length > 0 && output !== defaultOutput,
    };
    setLessonProgress(newProgress);
    if ((newProgress.hasRunCode || newProgress.hasModifiedCode) && !isCompleted && !hasMarkedComplete) {
      markLessonComplete(8);
      setHasMarkedComplete(true);
    }
  };

  const goToQuiz = async () => {
    if (!isLessonEligibleForCompletion()) { showLessonLockedToast(8); return; }
    if (!isCompleted) {
      try {
        const result = await trackStaticLessonCompletion(8);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(8);
        setIsCompleted(true);
      } catch (error) { console.error('Error tracking lesson completion:', error); }
    }
    navigate('/quiz/8', { state: { source: 'lesson', lessonId: 8 } });
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">
        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 8</span>
            <h1>Lesson 8: Exception Handling</h1>
            <p className="lesson-subtitle">
              Learn how Python handles mistakes gracefully — like catching a ball before it hits the floor!
            </p>
          </header>

          <div className="lesson-content">
            <h2>What are Exceptions?</h2>
            <p>
              Sometimes code goes wrong — dividing by zero, opening a missing file, or converting bad input.
              Instead of crashing, Python lets you <strong>catch</strong> these errors and handle them nicely.
            </p>
            <p>
              We use <code>try</code> and <code>except</code> to do this.
            </p>

            <div className="code-example">
              <h3>Example 1: Catching a Division Error</h3>
              <pre>{`try:
    result = 10 / 0
except ZeroDivisionError:
    print("Oops! Can't divide by zero.")`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`Oops! Can't divide by zero.`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Handling Any Error + Finally</h3>
              <pre>{`try:
    number = int("hello")  # This will fail!
except ValueError as e:
    print("Error:", e)
finally:
    print("This always runs!")`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`Error: invalid literal for int() with base 10: 'hello'\nThis always runs!`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 3: Raising Your Own Error</h3>
              <pre>{`age = -5
if age < 0:
    raise ValueError("Age cannot be negative!")
print("Age is:", age)`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`ValueError: Age cannot be negative!`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge 🌟</h3>
              <p>Change <code>10 / 0</code> to <code>10 / 2</code> — what happens now?</p>
              <p>Try wrapping <code>int("abc")</code> in a try/except and printing a friendly message.</p>
            </div>

            <PythonEditor
              initialCode={`try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print("Oops! Can't divide by zero.")`}
              onOutput={handleCodeOutput}
            />
          </div>

          <div className="progress-indicator" style={{ background: '#f8f9fa', border: '2px solid #e9ecef', borderRadius: '10px', padding: '20px', margin: '20px 0', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Your Progress</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
              {[['Run Code', 'hasRunCode'], ['Modify Code', 'hasModifiedCode'], ['See Output', 'hasSeenOutput'], ['Challenge', 'hasCompletedChallenge']].map(([label, key]) => (
                <div key={key} style={{ padding: '8px 12px', borderRadius: '20px', backgroundColor: lessonProgress[key] ? '#4ecca3' : '#e9ecef', color: lessonProgress[key] ? 'white' : '#6c757d', fontSize: '14px', fontWeight: 'bold' }}>
                  {lessonProgress[key] ? '✅' : '⭕'} {label}
                </div>
              ))}
            </div>
            <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#6c757d' }}>Complete any one activity above to unlock the quiz!</p>
          </div>

          {isLessonEligibleForCompletion() && !isCompleted && (
            <div className="completion-status" style={{ background: 'linear-gradient(135deg, #4ecca3, #2e9c81)', color: 'white', padding: '15px', borderRadius: '10px', margin: '20px 0', textAlign: 'center', boxShadow: '0 4px 15px rgba(78, 204, 163, 0.3)' }}>
              <h3>🎉 Great Progress!</h3>
              <p>You've completed enough activities to proceed to the quiz!</p>
            </div>
          )}

          <footer className="lesson-footer">
            <button
              type="button"
              className="quiz-button"
              onClick={goToQuiz}
              style={{ backgroundColor: isCompleted ? '#2e9c81' : isLessonEligibleForCompletion() ? '#4ecca3' : '#cccccc', opacity: isCompleted ? 0.8 : 1, cursor: isLessonEligibleForCompletion() ? 'pointer' : 'not-allowed' }}
            >
              {isCompleted ? '✅ Lesson Completed — Quiz 8 🛡️' : isLessonEligibleForCompletion() ? 'Take Quiz 8 — Exception Handling 🛡️' : 'Complete an activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson8;
