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

    const defaultOutput = 'Buddy says: Woof!';
    const isModified = output !== defaultOutput && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
    }

    if (output.length > 0 && output !== defaultOutput) {
      newProgress.hasCompletedChallenge = true;
    }

    setLessonProgress(newProgress);

    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      markLessonComplete(10);
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
        const result = await trackStaticLessonCompletion(10, timeSpent);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(10);
        setIsCompleted(true);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
      }
    }
    navigate('/quiz/10');
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 10</span>
            <h1>Lesson 10: Classes and Objects</h1>
            <p className="lesson-subtitle">
              Learn how to build your own custom Python blueprints — like designing your very own game character!
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is a Class?</h2>
            <p>
              A <strong>class</strong> is like a blueprint or a recipe. It describes what something
              looks like and what it can do.
            </p>
            <p>
              An <strong>object</strong> is something you create from a class — like baking a
              cookie using a cookie cutter!
            </p>

            <div className="code-example">
              <h3>Example 1: Creating a Class</h3>
              <pre>{`# Define the blueprint
class Dog:
    def __init__(self, name):  # Set up the dog's name
        self.name = name

    def bark(self):            # What the dog can do
        print(self.name + " says: Woof!")

# Create an object (a real dog!) from the class
my_dog = Dog("Buddy")
my_dog.bark()`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>Buddy says: Woof!</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Two Objects from One Class</h3>
              <pre>{`class Dog:
    def __init__(self, name):
        self.name = name

    def bark(self):
        print(self.name + " says: Woof!")

dog1 = Dog("Rex")
dog2 = Dog("Luna")
dog1.bark()
dog2.bark()`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>{`Rex says: Woof!
Luna says: Woof!`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change <code>&quot;Buddy&quot;</code> to your own pet name — or invent one!</p>
              <p>Try adding a second method like <code>def sit(self):</code> that prints your dog sitting.</p>
            </div>
            <PythonEditor
              initialCode={`class Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def bark(self):\n        print(self.name + " says: Woof!")\n\nmy_dog = Dog("Buddy")\nmy_dog.bark()`}
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
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 10 🌟' :
               isLessonEligibleForCompletion() ? 'Ready for Quiz 10 🌟' :
               'Complete at least one activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson10;
