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

const Lesson3 = () => {
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
    const isModified = output !== '8\n8\n8\n4.0' && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
    }
    
    // Check if challenge is completed
    if (output.length > 0 && output !== '8\n8\n8\n4.0') {
      newProgress.hasCompletedChallenge = true;
    }
    
    setLessonProgress(newProgress);
    
    // Check if lesson is now eligible for completion
    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      console.log('Lesson 3 is now eligible for completion!');
      // Mark lesson as complete in the progress context
      markLessonComplete(3);
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
        const result = await trackStaticLessonCompletion(3, timeSpent);
        
        // Show XP notification
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        
        // Update ProgressContext to mark lesson as complete
        markLessonComplete(3);
        
        setIsCompleted(true);
        console.log('Lesson 3 completed:', result);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
        // Continue to quiz even if tracking fails
      }
    }
    navigate('/quiz/3');
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 3</span>
            <h1>Lesson 3: Doing Math with Python</h1>
            <p className="lesson-subtitle">
              Turn Python into your summer calculator and explore how numbers dance together.
            </p>
          </header>

          <div className="lesson-content">
            <h2>Python as a Calculator</h2>
            <p>Python can do many types of math operations, just like a calculator!</p>

            <div className="math-table">
              <table>
                <thead>
                  <tr>
                    <th>Operation</th>
                    <th>Symbol</th>
                    <th>Example</th>
                    <th>Answer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Addition</td>
                    <td>+</td>
                    <td>5 + 3</td>
                    <td>8</td>
                  </tr>
                  <tr>
                    <td>Subtraction</td>
                    <td>-</td>
                    <td>10 - 2</td>
                    <td>8</td>
                  </tr>
                  <tr>
                    <td>Multiplication</td>
                    <td>*</td>
                    <td>4 * 2</td>
                    <td>8</td>
                  </tr>
                  <tr>
                    <td>Division</td>
                    <td>/</td>
                    <td>16 / 4</td>
                    <td>4.0</td>
                  </tr>
                  <tr>
                    <td>Integer Division</td>
                    <td>//</td>
                    <td>17 // 3</td>
                    <td>5</td>
                  </tr>
                  <tr>
                    <td>Exponent</td>
                    <td>**</td>
                    <td>2 ** 3</td>
                    <td>8</td>
                  </tr>
                  <tr>
                    <td>Modulus</td>
                    <td>%</td>
                    <td>10 % 3</td>
                    <td>1</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change the numbers in the examples and see what happens!</p>
              <p>Try using **, %, and // in different ways.</p>
            </div>
            <PythonEditor initialCode='print(5 + 3)\nprint(10 - 2)\nprint(4 * 2)\nprint(16 / 4)' onOutput={handleCodeOutput} />
           
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
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 3 🍍' : 
               isLessonEligibleForCompletion() ? 'Ready for Quiz 3 🍍' : 
               'Complete at least one activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson3;