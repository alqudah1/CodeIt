import { useState, useEffect, useMemo, useCallback } from 'react';
import './RobotAnimation.css';

const TalkingRobot = ({ onUnlock }) => {
  const [codeInput, setCodeInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    if (correctPattern.test(codeInput)) {
      setIsActive(true);
      setShowSpeech(true);
      
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
  }, [codeInput, onUnlock, correctPattern]);

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
    <button 
      className="gamified-btn" 
      onClick={() => window.location.href = "http://localhost:3000/MainPage"}
    >
      🎮 Back to Gamified Learning!
    </button>
  )}
</div>

    </div>
  );
};

export default TalkingRobot;