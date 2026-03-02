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

const Lesson7 = () => {
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
    const defaultOutput = 'Hello, Python!';
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
      markLessonComplete(7);
      trackStaticLessonCompletion(7).catch(err => console.error('Lesson 7 completion error:', err));
    }
  };

  const goToQuiz = async () => {
    if (!isLessonEligibleForCompletion()) { showLessonLockedToast(7); return; }
    if (!isCompleted) {
      try {
        const result = await trackStaticLessonCompletion(7);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(7);
        setIsCompleted(true);
      } catch (error) { console.error('Error tracking lesson completion:', error); }
    }
    navigate('/quiz/7', { state: { source: 'lesson', lessonId: 7 } });
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">
        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 7</span>
            <h1>Lesson 7: File Handling</h1>
            <p className="lesson-subtitle">
              Discover how Python saves information to files — like writing in a diary and reading it later!
            </p>
          </header>

          <div className="lesson-content">
            <h2>Reading and Writing Files</h2>
            <p>
              Python can <strong>write</strong> text into a file and <strong>read</strong> it back any time.
              This is great for saving scores, notes, or any information you want to keep.
            </p>
            <p>
              We use the built-in <code>open()</code> function with a <strong>mode</strong>:
            </p>
            <ul>
              <li><code>"w"</code> — write (creates or overwrites the file)</li>
              <li><code>"r"</code> — read (opens an existing file)</li>
              <li><code>"a"</code> — append (adds to the end of the file)</li>
            </ul>

            <div className="code-example">
              <h3>Example 1: Writing to a File</h3>
              <pre>{`# Write a message to a file
with open("my_notes.txt", "w") as f:
    f.write("Hello, Python!")

print("File written!")`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`File written!`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Reading from a File</h3>
              <pre>{`# Read back what we saved
with open("my_notes.txt", "r") as f:
    content = f.read()

print(content)`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`Hello, Python!`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 3: Appending Lines</h3>
              <pre>{`with open("my_notes.txt", "a") as f:
    f.write("\\nPython is awesome!")

with open("my_notes.txt", "r") as f:
    print(f.read())`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`Hello, Python!\nPython is awesome!`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge 🌟</h3>
              <p>Change the message to something about yourself and print the file contents after writing.</p>
              <p>Try using <code>"a"</code> mode to add a second line without erasing the first!</p>
            </div>

            <PythonEditor
              initialCode={`with open("my_notes.txt", "w") as f:\n    f.write("Hello, Python!")\n\nwith open("my_notes.txt", "r") as f:\n    print(f.read())`}
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
              {isCompleted ? '✅ Lesson Completed — Quiz 7 📁' : isLessonEligibleForCompletion() ? 'Take Quiz 7 — File Handling 📁' : 'Complete an activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson7;
