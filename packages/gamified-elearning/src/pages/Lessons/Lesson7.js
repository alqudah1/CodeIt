import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonEditor from '../pythoneditor/PythonEditor';
import Header from '../Header/Header';
import './PythonLesson.css';
import {
  trackStaticLessonCompletion,
  showXPNotification,
  initializeTimeTracker,
  autoTrackDailyLogin
} from '../../utils/progressTracker';
import { useProgress } from '../../context/ProgressContext';

const Lesson7 = () => {
  const navigate = useNavigate();
  const { markLessonComplete } = useProgress();
  const [lessonOutput, setLessonOutput] = useState('');
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);

  // Progress tracking states
  const [lessonProgress, setLessonProgress] = useState({
    hasRunCode: false,
    hasModifiedCode: false,
    hasSeenOutput: false,
    hasCompletedChallenge: false
  });

  useEffect(() => {
    autoTrackDailyLogin();
  }, []);

  const isLessonEligibleForCompletion = () => {
    return (
      lessonProgress.hasRunCode ||
      lessonProgress.hasModifiedCode ||
      lessonProgress.hasSeenOutput ||
      lessonProgress.hasCompletedChallenge
    );
  };

  const handleCodeOutput = (output) => {
    setLessonOutput(output);

    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasSeenOutput: output.length > 0,
    };

    const defaultOutput = 'Alex\nA';
    const isModified = output !== defaultOutput && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
    }

    if (output.length > 0 && output !== defaultOutput) {
      newProgress.hasCompletedChallenge = true;
    }

    setLessonProgress(newProgress);

    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      markLessonComplete(7);
      setHasMarkedComplete(true);
    }
  };

  const goToQuiz = async () => {
    if (!isLessonEligibleForCompletion()) {
      alert('🎯 Almost there! Complete any one of these activities to unlock the quiz:\n\n• Run some code in the editor\n• Modify the code and see the output\n• Complete the challenge\n\nYou only need to do ONE of these to proceed!');
      return;
    }

    if (!isCompleted) {
      try {
        const timeSpent = timeTracker.getTimeSpent();
        const result = await trackStaticLessonCompletion(7, timeSpent);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(7);
        setIsCompleted(true);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
      }
    }
    navigate('/quiz/7');
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 7</span>
            <h1>Lesson 7: Dictionaries and Sets</h1>
            <p className="lesson-subtitle">
              Discover how Python stores information using labels — like a contact book for your data!
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is a Dictionary?</h2>
            <p>
              A <strong>dictionary</strong> stores information as <strong>key: value</strong> pairs —
              just like a real dictionary where a word (key) has a meaning (value).
            </p>
            <p>
              A <strong>set</strong> is a collection of <strong>unique</strong> items — no duplicates allowed!
            </p>

            <div className="code-example">
              <h3>Example 1: Using a Dictionary</h3>
              <pre>{`# Create a dictionary with {}
student = {"name": "Alex", "age": 10, "grade": "A"}

# Access values using their keys
print(student["name"])
print(student["grade"])`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>{`Alex
A`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Using a Set</h3>
              <pre>{`# Sets remove duplicate items automatically
numbers = {1, 2, 3, 2, 1}
print(numbers)  # Only unique values kept`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>{`{1, 2, 3}`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change &quot;Alex&quot; to your own name and add a new key like <code>&quot;favourite_colour&quot;</code>.</p>
              <p>Try printing <code>student["age"]</code> — what does it show?</p>
            </div>
            <PythonEditor
              initialCode={`student = {"name": "Alex", "age": 10, "grade": "A"}\nprint(student["name"])\nprint(student["grade"])`}
              onOutput={handleCodeOutput}
            />
          </div>

          {/* Progress Indicator */}
          <div className="progress-indicator" style={{
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '10px',
            padding: '20px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Your Progress</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ padding: '8px 12px', borderRadius: '20px', backgroundColor: lessonProgress.hasRunCode ? '#4ecca3' : '#e9ecef', color: lessonProgress.hasRunCode ? 'white' : '#6c757d', fontSize: '14px', fontWeight: 'bold' }}>
                {lessonProgress.hasRunCode ? '✅' : '⭕'} Run Code
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '20px', backgroundColor: lessonProgress.hasModifiedCode ? '#4ecca3' : '#e9ecef', color: lessonProgress.hasModifiedCode ? 'white' : '#6c757d', fontSize: '14px', fontWeight: 'bold' }}>
                {lessonProgress.hasModifiedCode ? '✅' : '⭕'} Modify Code
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '20px', backgroundColor: lessonProgress.hasSeenOutput ? '#4ecca3' : '#e9ecef', color: lessonProgress.hasSeenOutput ? 'white' : '#6c757d', fontSize: '14px', fontWeight: 'bold' }}>
                {lessonProgress.hasSeenOutput ? '✅' : '⭕'} See Output
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '20px', backgroundColor: lessonProgress.hasCompletedChallenge ? '#4ecca3' : '#e9ecef', color: lessonProgress.hasCompletedChallenge ? 'white' : '#6c757d', fontSize: '14px', fontWeight: 'bold' }}>
                {lessonProgress.hasCompletedChallenge ? '✅' : '⭕'} Challenge
              </div>
            </div>
            <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
              Complete any one activity above to unlock the quiz!
            </p>
          </div>

          {/* Lesson Completion Status */}
          {isLessonEligibleForCompletion() && !isCompleted && (
            <div className="completion-status" style={{
              background: 'linear-gradient(135deg, #4ecca3, #2e9c81)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              margin: '20px 0',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(78, 204, 163, 0.3)'
            }}>
              <h3>🎉 Great Progress!</h3>
              <p>You&apos;ve completed enough activities to proceed to the quiz!</p>
            </div>
          )}

          <footer className="lesson-footer">
            <button
              type="button"
              className="quiz-button"
              onClick={goToQuiz}
              style={{
                backgroundColor: isCompleted ? '#2e9c81' : isLessonEligibleForCompletion() ? '#4ecca3' : '#cccccc',
                opacity: isCompleted ? 0.8 : 1,
                cursor: isLessonEligibleForCompletion() ? 'pointer' : 'not-allowed'
              }}
            >
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 7 🍊' :
               isLessonEligibleForCompletion() ? 'Ready for Quiz 7 🍊' :
               'Complete at least one activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson7;
