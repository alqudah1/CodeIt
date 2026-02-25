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

    const defaultOutput = 'Hello from Python!\nLearning is fun!\n';
    const isModified = output !== defaultOutput && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
    }

    if (output.length > 0 && output !== defaultOutput) {
      newProgress.hasCompletedChallenge = true;
    }

    setLessonProgress(newProgress);

    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      markLessonComplete(8);
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
        const result = await trackStaticLessonCompletion(8, timeSpent);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(8);
        setIsCompleted(true);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
      }
    }
    navigate('/quiz/8');
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 8</span>
            <h1>Lesson 8: File Input and Output</h1>
            <p className="lesson-subtitle">
              Learn how Python saves and reads information — like writing in a diary and reading it back!
            </p>
          </header>

          <div className="lesson-content">
            <h2>Writing and Reading Files</h2>
            <p>
              Python can <strong>write</strong> text into a file and <strong>read</strong> it back later.
              This is great for saving your work, high scores, or notes!
            </p>
            <p>
              We use <code>open()</code> with a <strong>mode</strong>:
              <strong> &quot;w&quot;</strong> to write, and <strong>&quot;r&quot;</strong> to read.
            </p>

            <div className="code-example">
              <h3>Example 1: Writing to a File</h3>
              <pre>{`# "w" means write mode
with open("notes.txt", "w") as f:
    f.write("Hello from Python!\\n")
    f.write("Learning is fun!\\n")

print("File saved!")`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>File saved!</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Reading from a File</h3>
              <pre>{`# Write first, then read it back
with open("notes.txt", "w") as f:
    f.write("Hello from Python!\\n")
    f.write("Learning is fun!\\n")

# "r" means read mode
with open("notes.txt", "r") as f:
    content = f.read()
    print(content)`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>{`Hello from Python!
Learning is fun!`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change the messages inside the file and read them back!</p>
              <p>Try adding a third line with your name.</p>
            </div>
            <PythonEditor
              initialCode={`with open("notes.txt", "w") as f:\n    f.write("Hello from Python!\\n")\n    f.write("Learning is fun!\\n")\n\nwith open("notes.txt", "r") as f:\n    content = f.read()\n    print(content)`}
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
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 8 🍑' :
               isLessonEligibleForCompletion() ? 'Ready for Quiz 8 🍑' :
               'Complete at least one activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson8;
