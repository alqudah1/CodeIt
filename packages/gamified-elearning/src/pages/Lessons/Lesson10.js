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

const Lesson10 = () => {
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
    const defaultOutput = '3.141592653589793\n4.0';
    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasSeenOutput: output.length > 0,
      hasModifiedCode: output !== defaultOutput && output.length > 0,
      hasCompletedChallenge: output.length > 0 && output !== defaultOutput,
    };
    setLessonProgress(newProgress);
    if ((newProgress.hasRunCode || newProgress.hasModifiedCode) && !hasMarkedComplete) {
      setHasMarkedComplete(true);
      markLessonComplete(10);
      trackStaticLessonCompletion(10).catch(err => console.error('Lesson 10 completion error:', err));
    }
  };

  const goToQuiz = async () => {
    if (!isLessonEligibleForCompletion()) { showLessonLockedToast(10); return; }
    if (!isCompleted) {
      try {
        const result = await trackStaticLessonCompletion(10);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(10);
        setIsCompleted(true);
      } catch (error) { console.error('Error tracking lesson completion:', error); }
    }
    navigate('/quiz/10', { state: { source: 'lesson', lessonId: 10 } });
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">
        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 10</span>
            <h1>Lesson 10: Modules &amp; Libraries</h1>
            <p className="lesson-subtitle">
              Unlock Python's superpowers by importing ready-made tools — like opening a toolbox full of amazing gadgets!
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is a Module?</h2>
            <p>
              A <strong>module</strong> is a file containing Python code that you can reuse in your programs.
              Python comes with hundreds of built-in modules, plus millions more you can install.
            </p>
            <p>
              Use the <code>import</code> keyword to bring a module into your program.
            </p>

            <div className="code-example">
              <h3>Example 1: The math Module</h3>
              <pre>{`import math

print(math.pi)          # The value of π
print(math.sqrt(16))    # Square root of 16`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`3.141592653589793\n4.0`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: The random Module</h3>
              <pre>{`import random

# Pick a random number between 1 and 10
number = random.randint(1, 10)
print("Random number:", number)

# Pick a random item from a list
fruits = ["apple", "banana", "cherry"]
print("Random fruit:", random.choice(fruits))`}</pre>
              <div className="output">
                <h3>What you'll see (example):</h3>
                <pre>{`Random number: 7\nRandom fruit: banana`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 3: Import Just What You Need</h3>
              <pre>{`from math import sqrt, pi

# No need to write "math." now
print(sqrt(25))
print(round(pi, 2))`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`5.0\n3.14`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge 🌟</h3>
              <p>Use <code>math.sqrt()</code> to find the square root of 144. Then use <code>random.randint()</code> to roll a virtual dice (1–6)!</p>
              <p>Try <code>from math import ceil, floor</code> and use them on <code>3.7</code>.</p>
            </div>

            <PythonEditor
              initialCode={`import math\n\nprint(math.pi)\nprint(math.sqrt(16))`}
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
              <h3>🎉 Congratulations! You made it to the last lesson!</h3>
              <p>You're ready for the final quiz!</p>
            </div>
          )}

          <footer className="lesson-footer">
            <button
              type="button"
              className="quiz-button"
              onClick={goToQuiz}
              style={{ backgroundColor: isCompleted ? '#2e9c81' : isLessonEligibleForCompletion() ? '#4ecca3' : '#cccccc', opacity: isCompleted ? 0.8 : 1, cursor: isLessonEligibleForCompletion() ? 'pointer' : 'not-allowed' }}
            >
              {isCompleted ? '✅ All Done! — Final Quiz 10 🧩' : isLessonEligibleForCompletion() ? 'Take Final Quiz 10 — Modules & Libraries 🧩' : 'Complete an activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson10;
