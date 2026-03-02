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

const Lesson6 = () => {
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
    const defaultOutput = 'Alex\nA';
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
      markLessonComplete(6);
      trackStaticLessonCompletion(6).catch(err => console.error('Lesson 6 completion error:', err));
    }
  };

  const goToQuiz = async () => {
    if (!isLessonEligibleForCompletion()) { showLessonLockedToast(6); return; }
    if (!isCompleted) {
      try {
        const result = await trackStaticLessonCompletion(6);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(6);
        setIsCompleted(true);
      } catch (error) { console.error('Error tracking lesson completion:', error); }
    }
    navigate('/quiz/6', { state: { source: 'lesson', lessonId: 6 } });
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">
        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 6</span>
            <h1>Lesson 6: Dictionaries &amp; Sets</h1>
            <p className="lesson-subtitle">
              Learn how Python stores labelled information — like a contact book — and keeps collections unique with sets!
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is a Dictionary?</h2>
            <p>
              A <strong>dictionary</strong> stores information as <strong>key: value</strong> pairs.
              Think of it like a real dictionary — the word (key) tells you where to find the meaning (value).
            </p>
            <p>
              Dictionaries use <code>{'{}'}</code> curly braces and each entry looks like <code>key: value</code>.
            </p>

            <div className="code-example">
              <h3>Example 1: Creating and Using a Dictionary</h3>
              <pre>{`# Create a dictionary
student = {"name": "Alex", "age": 10, "grade": "A"}

# Look up values using keys
print(student["name"])   # Alex
print(student["grade"])  # A`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`Alex\nA`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Adding and Updating Values</h3>
              <pre>{`pet = {"name": "Buddy", "type": "dog"}
pet["age"] = 3          # Add a new key
pet["type"] = "puppy"   # Update existing key
print(pet)`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`{'name': 'Buddy', 'type': 'puppy', 'age': 3}`}</pre>
              </div>
            </div>

            <h2>What is a Set?</h2>
            <p>
              A <strong>set</strong> is a collection of <strong>unique</strong> items — no duplicates allowed!
              Sets use <code>{'{}'}</code> too, but without key-value pairs.
            </p>

            <div className="code-example">
              <h3>Example 3: Sets Remove Duplicates</h3>
              <pre>{`colours = {"red", "blue", "red", "green", "blue"}
print(colours)  # Duplicates removed automatically`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`{'red', 'blue', 'green'}`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge 🌟</h3>
              <p>Change "Alex" to your own name. Add a new key <code>"favourite_colour"</code> with your favourite colour.</p>
              <p>Then print <code>student["age"]</code> — what does it show?</p>
            </div>

            <PythonEditor
              initialCode={`student = {"name": "Alex", "age": 10, "grade": "A"}\nprint(student["name"])\nprint(student["grade"])`}
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
              {isCompleted ? '✅ Lesson Completed — Quiz 6 🗂️' : isLessonEligibleForCompletion() ? 'Take Quiz 6 — Dictionaries & Sets 🗂️' : 'Complete an activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson6;
