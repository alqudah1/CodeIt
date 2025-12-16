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

const Lesson4 = () => {
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
      lessonProgress.hasRunCode || // Has run code
      lessonProgress.hasModifiedCode || // Has modified code
      lessonProgress.hasSeenOutput || // Has seen output
      lessonProgress.hasCompletedChallenge // Has completed challenge
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
    const isModified = output !== 'You are older than 5!' && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
    }
    
    // Check if challenge is completed
    if (output.length > 0 && output !== 'You are older than 5!') {
      newProgress.hasCompletedChallenge = true;
    }
    
    setLessonProgress(newProgress);
    
    // Check if lesson is now eligible for completion
    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      console.log('Lesson 4 is now eligible for completion!');
      // Mark lesson as complete in the progress context
      markLessonComplete(4);
      setHasMarkedComplete(true);
    }
  };

  const goToDashboard = () => navigate('/MainPage');
  
  const goToQuiz = async () => {
    // Check if lesson is eligible for completion (any one criteria is enough)
    if (!isLessonEligibleForCompletion()) {
      alert('🎯 Almost there! Complete any one of these activities to unlock the quiz:\n\n• Run some code in the editor\n• Modify the code and see the output\n• Complete the challenge\n\nYou only need to do ONE of these to proceed!');
      return;
    }

    if (!isCompleted) {
      try {
        const timeSpent = timeTracker.getTimeSpent();
        const result = await trackStaticLessonCompletion(4, timeSpent);
        
        // Show XP notification
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        
        // Update ProgressContext to mark lesson as complete
        markLessonComplete(4);
        
        setIsCompleted(true);
        console.log('Lesson 4 completed:', result);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
        // Continue to quiz even if tracking fails
      }
    }
    navigate('/quiz/4');
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 4</span>
            <h1>Lesson 4: Making Decisions with If Statements</h1>
            <p className="lesson-subtitle">
              Learn how Python chooses different paths—just like picking your favorite summer adventure.
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is an &quot;If Statement&quot;?</h2>
            <p>
              An if statement allows the computer to make decisions based on conditions. It checks if something
              is true and runs the code only if the condition is met.
            </p>

            <div className="code-example">
              <h3>Example 1: Checking Age</h3>
              <pre>{`age = 10
if age > 5:
  print("You are older than 5!")`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>You are older than 5!</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Checking a Password</h3>
              <pre>{`password = "python123"
if password == "python123":
  print("Access Granted!")`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>Access Granted!</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change the password variable and see what happens.</p>
              <p>Use if and else to check if a number is even or odd.</p>
            </div>
            <PythonEditor initialCode='age = 10\nif age > 5:\n  print("You are older than 5!")' onOutput={handleCodeOutput} />
            
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
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: '20px', 
                backgroundColor: lessonProgress.hasRunCode ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.hasRunCode ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.hasRunCode ? '✅' : '⭕'} Run Code
              </div>
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: '20px', 
                backgroundColor: lessonProgress.hasModifiedCode ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.hasModifiedCode ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.hasModifiedCode ? '✅' : '⭕'} Modify Code
              </div>
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: '20px', 
                backgroundColor: lessonProgress.hasSeenOutput ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.hasSeenOutput ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.hasSeenOutput ? '✅' : '⭕'} See Output
              </div>
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: '20px', 
                backgroundColor: lessonProgress.hasCompletedChallenge ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.hasCompletedChallenge ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
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
              <p>You've completed enough activities to proceed to the quiz!</p>
            </div>
          )}

          <footer className="lesson-footer">
            <button 
              type="button" 
              className="quiz-button" 
              onClick={goToQuiz}
              style={{ 
                backgroundColor: isCompleted ? '#2e9c81' : 
                               isLessonEligibleForCompletion() ? '#4ecca3' : '#cccccc',
                opacity: isCompleted ? 0.8 : 1,
                cursor: isLessonEligibleForCompletion() ? 'pointer' : 'not-allowed'
              }}
            >
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 4 🍋' : 
               isLessonEligibleForCompletion() ? 'Ready for Quiz 4 🍋' : 
               'Complete at least one activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson4;