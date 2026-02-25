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

const Lesson6 = () => {
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

  // Auto-track daily login and initialize time tracking
  useEffect(() => {
    autoTrackDailyLogin();
  }, []);

  // Check if lesson can be considered complete (any one criteria is enough)
  const isLessonEligibleForCompletion = () => {
    return (
      lessonProgress.hasRunCode ||
      lessonProgress.hasModifiedCode ||
      lessonProgress.hasSeenOutput ||
      lessonProgress.hasCompletedChallenge
    );
  };

  // Update progress when code is run
  const handleCodeOutput = (output) => {
    setLessonOutput(output);

    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasSeenOutput: output.length > 0,
    };

    // Check if code was modified (not just the default)
    const defaultOutput = 'apple\nbanana\n3';
    const isModified = output !== defaultOutput && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
    }

    // Check if challenge is completed
    if (output.length > 0 && output !== defaultOutput) {
      newProgress.hasCompletedChallenge = true;
    }

    setLessonProgress(newProgress);

    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      markLessonComplete(6);
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
        const result = await trackStaticLessonCompletion(6, timeSpent);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(6);
        setIsCompleted(true);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
      }
    }
    navigate('/quiz/6');
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 6</span>
            <h1>Lesson 6: Lists and Tuples</h1>
            <p className="lesson-subtitle">
              Learn how Python keeps groups of things together — like a bag of your favourite snacks!
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is a List?</h2>
            <p>
              A <strong>list</strong> is like a shopping bag — it holds many items in one place.
              You can add, remove, or change items inside it.
            </p>
            <p>
              A <strong>tuple</strong> is like a sealed envelope — it also holds items, but once
              you create it, you cannot change what is inside.
            </p>

            <div className="code-example">
              <h3>Example 1: Creating a List</h3>
              <pre>{`# A list uses square brackets []
fruits = ["apple", "banana", "cherry"]
print(fruits[0])   # First item
print(fruits[1])   # Second item
print(len(fruits)) # How many items?`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>{`apple
banana
3`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Creating a Tuple</h3>
              <pre>{`# A tuple uses round brackets ()
colours = ("red", "green", "blue")
print(colours[0])  # First colour
print(colours[2])  # Third colour`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>{`red
blue`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change the fruit names to your favourites and add a fourth item to the list!</p>
              <p>Try printing <code>fruits[-1]</code> — what do you think it shows?</p>
            </div>
            <PythonEditor
              initialCode={`fruits = ["apple", "banana", "cherry"]\nprint(fruits[0])\nprint(fruits[1])\nprint(len(fruits))`}
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
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 6 🍇' :
               isLessonEligibleForCompletion() ? 'Ready for Quiz 6 🍇' :
               'Complete at least one activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson6;
