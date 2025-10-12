import { useState, useEffect, useMemo, useCallback } from 'react';
import './RobotAnimation.css';
import { trackPuzzleGameCompletion, showXPNotification, initializeTimeTracker } from '../utils/progressTracker';

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
    } else {
      setIsActive(false);
    }
  }, [codeInput, onUnlock, correctPattern, gameCompleted, timeTracker]);

  // Calculate eye movement based on mouse position
  const eyeMovement = {
    transform: `translate(
      ${mousePos.x * 0.02}px, 
      ${mousePos.y * 0.02}px
    )`
  };

  return (
    <div className="robot-container">
      {/* Centered Robot Wrapper */}
      <div className="robot-container">
      <div className="game-instruction">
        <h2>Fix the Robot! 🤖</h2>
        <p className="hint">
          Hint: Use <code>print</code> command to make the robot say 
          "Hello! My name is Robo."
        </p>
      </div>
  </div>
      <div className="robot-wrapper">
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
              {/* Simplified Status Light without container */}
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

      <div className="code-input">
  <h3>Fix the robot by entering the correct Python command:</h3>
  <textarea
    value={codeInput}
    onChange={(e) => setCodeInput(e.target.value)}
    placeholder="Enter your Python code here..."
    spellCheck="false"
    autoFocus
    className="code-textarea"
  />
  
  {showSpeech && (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <div style={{ 
        backgroundColor: '#4ecca3', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '15px',
        fontWeight: 'bold'
      }}>
        🎉 Puzzle Solved! +75 XP Earned!
      </div>
      <button 
        className="gamified-btn" 
        onClick={() => window.location.href = "http://localhost:3000/MainPage"}
        style={{
          backgroundColor: '#2e9c81',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        🎮 Back to Gamified Learning!
      </button>
    </div>
  )}
</div>

    </div>
  );
};

export default TalkingRobot;