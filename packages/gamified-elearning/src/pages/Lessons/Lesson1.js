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

const Lesson1 = () => {
  const navigate = useNavigate();
  const { markLessonComplete } = useProgress();
  const [lessonOutput, setLessonOutput] = useState('');
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  
  // Enhanced progress tracking states
  const [lessonProgress, setLessonProgress] = useState({
    stepsCompleted: 0,
    totalSteps: 5,
    achievements: [],
    currentStep: 0,
    hasRunCode: false,
    hasModifiedCode: false,
    hasSeenOutput: false,
    hasCompletedChallenge: false
  });
  
  const [showAchievement, setShowAchievement] = useState(null);
  const [currentXP, setCurrentXP] = useState(0);
  const [streak, setStreak] = useState(0);

  // Auto-track daily login and initialize time tracking
  useEffect(() => {
    autoTrackDailyLogin();
    loadProgress();
  }, []);

  // Load saved progress from localStorage
  const loadProgress = () => {
    const savedProgress = localStorage.getItem('lesson1_progress');
    if (savedProgress) {
      setLessonProgress(JSON.parse(savedProgress));
    }
    const savedXP = localStorage.getItem('total_xp');
    if (savedXP) {
      setCurrentXP(parseInt(savedXP));
    }
    const savedStreak = localStorage.getItem('learning_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak));
    }
  };

  // Save progress to localStorage
  const saveProgress = (newProgress) => {
    setLessonProgress(newProgress);
    localStorage.setItem('lesson1_progress', JSON.stringify(newProgress));
  };

  // Check for achievements
  const checkAchievements = (newProgress) => {
    const achievements = [];
    
    if (newProgress.hasRunCode && !lessonProgress.hasRunCode) {
      achievements.push({
        id: 'first_code_run',
        title: '🚀 First Code Run!',
        description: 'You ran your first Python code!',
        xp: 10
      });
    }
    
    if (newProgress.hasModifiedCode && !lessonProgress.hasModifiedCode) {
      achievements.push({
        id: 'code_explorer',
        title: '🔍 Code Explorer',
        description: 'You modified the code and experimented!',
        xp: 15
      });
    }
    
    if (newProgress.hasSeenOutput && !lessonProgress.hasSeenOutput) {
      achievements.push({
        id: 'output_master',
        title: '📺 Output Master',
        description: 'You saw your code output!',
        xp: 10
      });
    }
    
    if (newProgress.stepsCompleted >= 3 && lessonProgress.stepsCompleted < 3) {
      achievements.push({
        id: 'halfway_hero',
        title: '⭐ Halfway Hero',
        description: 'You completed half the lesson!',
        xp: 20
      });
    }
    
    if (newProgress.stepsCompleted === newProgress.totalSteps && lessonProgress.stepsCompleted < newProgress.totalSteps) {
      achievements.push({
        id: 'lesson_champion',
        title: '🏆 Lesson Champion',
        description: 'You completed the entire lesson!',
        xp: 50
      });
    }
    
    return achievements;
  };

  // Show achievement notification
  const showAchievementNotification = (achievement) => {
    setShowAchievement(achievement);
    setCurrentXP(prev => prev + achievement.xp);
    localStorage.setItem('total_xp', (currentXP + achievement.xp).toString());
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowAchievement(null);
    }, 3000);
  };

  // Update progress when code is run
  const handleCodeOutput = (output) => {
    setLessonOutput(output);
    
    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasSeenOutput: output.length > 0,
      stepsCompleted: Math.max(lessonProgress.stepsCompleted, 2)
    };
    
    // Check if code was modified (not just the default)
    const isModified = output !== 'Hello, Python!' && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
      newProgress.stepsCompleted = Math.max(lessonProgress.stepsCompleted, 3);
    }
    
    // Check if challenge is completed
    if (output.length > 0 && output !== 'Hello, Python!') {
      newProgress.hasCompletedChallenge = true;
      newProgress.stepsCompleted = Math.max(lessonProgress.stepsCompleted, 4);
    }
    
    saveProgress(newProgress);
    
    // Check if lesson is now eligible for completion
    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      console.log('Lesson 1 is now eligible for completion!');
      // Mark lesson as complete in the progress context
      markLessonComplete(1);
      setHasMarkedComplete(true);
    }
    
    // Check for new achievements
    const achievements = checkAchievements(newProgress);
    achievements.forEach(achievement => {
      showAchievementNotification(achievement);
    });
  };

  // Mark step as completed
  const completeStep = (stepNumber) => {
    const newProgress = {
      ...lessonProgress,
      stepsCompleted: Math.max(lessonProgress.stepsCompleted, stepNumber),
      currentStep: Math.max(lessonProgress.currentStep, stepNumber)
    };
    
    saveProgress(newProgress);
    
    // Check if lesson is now eligible for completion
    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      console.log('Lesson 1 is now eligible for completion!');
      // Mark lesson as complete in the progress context
      markLessonComplete(1);
      setHasMarkedComplete(true);
    }
    
    // Check for achievements
    const achievements = checkAchievements(newProgress);
    achievements.forEach(achievement => {
      showAchievementNotification(achievement);
    });
  };

  // Check if lesson can be considered complete (any one criteria is enough)
  const isLessonEligibleForCompletion = () => {
    return (
      lessonProgress.stepsCompleted >= 1 || // At least 1 step completed
      lessonProgress.hasRunCode || // Has run code
      lessonProgress.hasModifiedCode || // Has modified code
      lessonProgress.hasSeenOutput || // Has seen output
      lessonProgress.hasCompletedChallenge // Has completed challenge
    );
  };

  const goToDashboard = () => navigate('/MainPage');
  
  const goToQuiz = async () => {
    // Check if lesson is eligible for completion (any one criteria is enough)
    if (!isLessonEligibleForCompletion()) {
      alert('🎯 Almost there! Complete any one of these activities to unlock the quiz:\n\n• Click on any step to mark it complete\n• Run some code in the editor\n• Modify the code and see the output\n• Complete the challenge\n\nYou only need to do ONE of these to proceed!');
      return;
    }

    if (!isCompleted) {
      try {
        const timeSpent = timeTracker.getTimeSpent();
        const result = await trackStaticLessonCompletion(1, timeSpent);
        
        // Show XP notification
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        
        // Update ProgressContext to mark lesson as complete
        markLessonComplete(1);
        
        setIsCompleted(true);
        console.log('Lesson 1 completed:', result);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
        // Continue to quiz even if tracking fails
      }
    }
    navigate('/quiz/1');
  };

  return (
    <div className="python-lesson">
      <Header />

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <h3>{showAchievement.title}</h3>
            <p>{showAchievement.description}</p>
            <span className="achievement-xp">+{showAchievement.xp} XP</span>
          </div>
        </div>
      )}

      <div className="lesson-wrapper">

        {/* Progress Header */}
        <div className="progress-header">
          <div className="xp-display">
            <span className="xp-icon">⭐</span>
            <span className="xp-text">{currentXP} XP</span>
          </div>
          <div className="streak-display">
            <span className="streak-icon">🔥</span>
            <span className="streak-text">{streak} day streak</span>
          </div>
        </div>

        {/* Lesson Progress Bar */}
        <div className="lesson-progress-container">
          <div className="progress-label">
            <span>Lesson Progress</span>
            <span>{lessonProgress.stepsCompleted}/{lessonProgress.totalSteps}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(lessonProgress.stepsCompleted / lessonProgress.totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 1</span>
            <h1>Lesson 1: What is Python? (Printing Text & Basics)</h1>
            <p className="lesson-subtitle">
              Kick off your coding adventure with friendly commands that say hello to the world.
            </p>
          </header>

          <div className="lesson-content">
            {/* Step 1: Introduction */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 1 ? 'completed' : ''}`}>
              <div className="step-header" onClick={() => completeStep(1)}>
                <span className="step-number">1</span>
                <h2>What is Python?</h2>
                {lessonProgress.stepsCompleted >= 1 && <span className="step-check">✅</span>}
              </div>
              <p>
                Python is a computer language that helps us talk to computers. It is easy to learn and is used
                for making games, websites, and apps!
              </p>
            </div>

            {/* Step 2: Commands */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 2 ? 'completed' : ''}`}>
              <div className="step-header" onClick={() => completeStep(2)}>
                <span className="step-number">2</span>
                <h2>How Do We Talk to a Computer?</h2>
                {lessonProgress.stepsCompleted >= 2 && <span className="step-check">✅</span>}
              </div>
              <p>
                We use commands to give instructions. One important command is <code>print()</code>, which tells
                Python to show something on the screen.
              </p>
            </div>

            {/* Step 3: Code Examples */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 3 ? 'completed' : ''}`}>
              <div className="step-header" onClick={() => completeStep(3)}>
                <span className="step-number">3</span>
                <h2>Let's See Some Examples</h2>
                {lessonProgress.stepsCompleted >= 3 && <span className="step-check">✅</span>}
              </div>
              <div className="code-example">
                <pre>{`print("Hello, Python!")`}</pre>
                <pre>{`print("I love coding!")`}</pre>
              </div>
            </div>
            
            {/* Step 4: Interactive Challenge */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 4 ? 'completed' : ''}`}>
              <div className="step-header">
                <span className="step-number">4</span>
                <h2>Your Sunny Challenge</h2>
                {lessonProgress.stepsCompleted >= 4 && <span className="step-check">✅</span>}
              </div>
              <div className="try-it">
                <h3>🎯 Challenge Time!</h3>
                <p>Change "Hello, Python!" to your own message and see what happens!</p>
                {lessonProgress.hasRunCode && (
                  <div className="challenge-feedback">
                    <p>Great job! You're learning to code! 🎉</p>
                  </div>
                )}
              </div>

              <PythonEditor 
                initialCode='print("Hello, Python!")' 
                onOutput={handleCodeOutput} 
              />
            </div>

            {/* Step 5: Completion */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 5 ? 'completed' : ''}`}>
              <div className="step-header">
                <span className="step-number">5</span>
                <h2>Ready for the Quiz?</h2>
                {lessonProgress.stepsCompleted >= 5 && <span className="step-check">✅</span>}
              </div>
              <p>
                You've learned the basics of Python printing! Now let's test your knowledge with a fun quiz.
              </p>
            </div>
          </div>

          {/* Achievements Section */}
          {lessonProgress.achievements.length > 0 && (
            <div className="achievements-section">
              <h3>🏆 Your Achievements</h3>
              <div className="achievements-grid">
                {lessonProgress.achievements.map((achievement, index) => (
                  <div key={index} className="achievement-badge">
                    <span className="achievement-icon">{achievement.icon}</span>
                    <span className="achievement-title">{achievement.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                backgroundColor: lessonProgress.stepsCompleted >= 1 ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.stepsCompleted >= 1 ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.stepsCompleted >= 1 ? '✅' : '⭕'} Steps
              </div>
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
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 1 🍉' : 
               isLessonEligibleForCompletion() ? 'Ready for Quiz 1 🍉' : 
               'Complete at least one activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson1;
