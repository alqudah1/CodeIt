import { useState, useEffect, useMemo, useCallback } from 'react';
import './RobotAnimation.css';
import { trackPuzzleGameCompletion, showXPNotification, initializeTimeTracker } from '../utils/progressTracker';
import ProgressBar from './ProgressBar';

const TalkingRobot = ({ onUnlock }) => {
  const [codeInput, setCodeInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [gameCompleted, setGameCompleted] = useState(false);

  // Memoized regex pattern with case insensitivity
  const correctPattern = useMemo(() => 
    /^\s*print\s*\(\s*["']Hello! My name is Robo\.?["']\s*\)\s*$/i,
    []
  );

  // Mouse tracking for eye movement
  const handleMouseMove = useCallback((e) => {
    setMousePos({
      x: e.clientX - window.innerWidth / 2,
      y: e.clientY - window.innerHeight / 2
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Activation effect
  useEffect(() => {
    if (correctPattern.test(codeInput) && !gameCompleted) {
      setIsActive(true);
      setShowSpeech(true);
      setGameCompleted(true);
      
      // Track game completion with XP
      const completeGame = async () => {
        try {
          const timeSpent = timeTracker.getTimeSpent();
          const score = 100; // Perfect score for correct code
          const isHighScore = true; // First completion is always high score
          
          const result = await trackPuzzleGameCompletion(
            1, // lessonNumber (Lesson 1)
            'robot-puzzle', // gameType
            score,
            timeSpent
          );
          
          // Show XP notification
          showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
          
          console.log('Robot puzzle completed:', result);
        } catch (error) {
          console.error('Error tracking game completion:', error);
        }
      };
      
      completeGame();
      
      if (typeof onUnlock === 'function') {
        onUnlock();  // Call only if it's a function
      } else {
        console.warn("onUnlock is not a function or is undefined");
      }
  
      const timeout = setTimeout(() => setShowSpeech(false), 30000);
      return () => clearTimeout(timeout);
    } else if (!gameCompleted) {
      // Only set inactive if game is NOT completed yet
      setIsActive(false);
    }
    // If gameCompleted is true, keep isActive as true
  }, [codeInput, onUnlock, correctPattern, gameCompleted, timeTracker]);

  // Calculate eye movement based on mouse position
  const eyeMovement = {
    transform: `translate(
      ${mousePos.x * 0.02}px, 
      ${mousePos.y * 0.02}px
    )`
  };

  return (
    <div className="robot-page">
      {/* Progress Bar */}
      <ProgressBar currentStep="puzzle" />
      
      {/* Main Content */}
      <div className="robot-main-container">
        <div className="layout-wrapper">
          {/* Left Side - Code Editor */}
          <div className="code-section">
            <div className="code-header">
              <h2 className="code-title">🤖 Fix the Robot!</h2>
              <p className="code-description">
                Write Python code to make the robot introduce itself
              </p>
            </div>
            
            <div className="hint-box">
              <span className="hint-icon">💡</span>
              <p className="hint-text">
                Use the <code>print()</code> function to make Robo say: 
                <strong>"Hello! My name is Robo."</strong>
              </p>
            </div>

            <div className="code-editor-wrapper">
              <div className="code-editor-header">
                <span className="editor-label">Python Editor</span>
                <span className="editor-indicator"></span>
              </div>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="# Type your Python code here...\nprint('Hello! My name is Robo.')"
                spellCheck="false"
                autoFocus
                className="modern-code-textarea"
              />
            </div>

            {showSpeech && (
              <div className="success-panel">
                <div className="success-message">
                  <span className="success-icon">🎉</span>
                  <div className="success-content">
                    <h3>Puzzle Solved!</h3>
                    <p className="xp-reward">+75 XP Earned</p>
                  </div>
                </div>
                <button 
                  className="return-button" 
                  onClick={() => window.location.href = "http://localhost:3000/MainPage"}
                >
                  <span className="button-icon">🎮</span>
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Right Side - Robot Preview */}
          <div className="robot-section">
            <div className="robot-preview-header">
              <h3 className="preview-title">Robot Preview</h3>
              <div className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                <span className="status-dot"></span>
                {isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className="robot-display">
              <div className={`robot ${isActive ? 'active' : ''}`}>
                <div className="robot-head">
                  <div className="antenna">
                    <div className="antenna-light"></div>
                  </div>
                  <div className="face-plate">
                    <div className="eyes">
                      <div className="eye left">
                        <div className="pupil" style={eyeMovement}></div>
                        <div className="eyelid"></div>
                      </div>
                      <div className="eye right">
                        <div className="pupil" style={eyeMovement}></div>
                        <div className="eyelid"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="robot-body">
                  <div className="torso">
                    <div className="status-light"></div>
                  </div>
                </div>

                {showSpeech && (
                  <div className="speech-bubble">
                    <div className="speech-text">Hello! My name is Robo.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalkingRobot;