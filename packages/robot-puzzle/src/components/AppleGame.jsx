import { useState, useEffect, useRef } from 'react';
import './GameStyles.css';
import ProgressBar from './ProgressBar';
import { trackPuzzleGameCompletion, showXPNotification, initializeTimeTracker } from '../utils/progressTracker';

const AppleGame = () => {
  const canvasRef = useRef(null);
  const [applePos, setApplePos] = useState({ x: 0, y: 0 });
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [appleClicked, setAppleClicked] = useState(false);
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);

  // Regex pattern for Python variable declaration
  const varPattern = useRef(
    /^\s*x\s*=\s*\d+\s*(\n+|;+)\s*y\s*=\s*\d+\s*$|^\s*y\s*=\s*\d+\s*(\n+|;+)\s*x\s*=\s*\d+\s*$/
  );

  // Code validation effect
  useEffect(() => {
    const validateCode = () => {
      try {
        if (varPattern.current.test(codeInput)) {
          const xMatch = codeInput.match(/x\s*=\s*(\d+)/);
          const yMatch = codeInput.match(/y\s*=\s*(\d+)/);
          
          if (xMatch && yMatch) {
            const newX = parseInt(xMatch[1]);
            const newY = parseInt(yMatch[1]);
            
            if (newX > 400 || newY > 400) {
              throw new Error('Values must be less than 400');
            }
            
            setApplePos({ x: newX, y: newY });
            setIsCodeValid(true);
            setErrorMessage('');
            return;
          }
        }
        throw new Error('Invalid variable declaration. Use format:\nx = 185\ny = 310');
      } catch (error) {
        setIsCodeValid(false);
        setErrorMessage(error.message);
      }
    };

    const timeout = setTimeout(validateCode, 500);
    return () => clearTimeout(timeout);
  }, [codeInput]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const drawFrame = () => {
      ctx.clearRect(0, 0, 400, 400);

      // Background
      ctx.fillStyle = '#3A5FAD';
      ctx.fillRect(0, 0, 400, 400);

      // Frame borders
      const drawBorder = (points, color) => {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        points.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };

      drawBorder([[40,40], [50,50], [350,50], [360,40]], '#341919');
      drawBorder([[50,350], [40,360], [360,360], [350,350]], '#291414');
      drawBorder([[40,40], [50,50], [50,350], [40,360]], '#3E2424');
      drawBorder([[350,50], [360,40], [360,360], [350,350]], '#3E2424');
      
      // Main frame
      ctx.fillStyle = '#2C0000';
      ctx.fillRect(50, 50, 300, 300);

      // Table
      ctx.fillStyle = '#8E2929';
      ctx.beginPath();
      ctx.moveTo(50, 280);
      ctx.lineTo(320, 280);
      ctx.lineTo(275, 350);
      ctx.lineTo(50, 350);
      ctx.closePath();
      ctx.fill();

      // Draw apple only if code is valid
      if (isCodeValid) {
        ctx.fillStyle = '#FF0015';
        ctx.beginPath();
        ctx.moveTo(applePos.x, applePos.y);
        ctx.lineTo(applePos.x-40, applePos.y);
        ctx.lineTo(applePos.x-54, applePos.y-10);
        ctx.lineTo(applePos.x-54, applePos.y-50);
        ctx.lineTo(applePos.x-42, applePos.y-62);
        ctx.lineTo(applePos.x-27, applePos.y-62);
        ctx.lineTo(applePos.x-19, applePos.y-57);
        ctx.lineTo(applePos.x-11, applePos.y-62);
        ctx.lineTo(applePos.x+4, applePos.y-62);
        ctx.lineTo(applePos.x+14, applePos.y-50);
        ctx.lineTo(applePos.x+14, applePos.y-10);
        ctx.closePath();
        ctx.fill();

        // Stem and leaf
        ctx.strokeStyle = '#0F672E';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(applePos.x-19, applePos.y-57);
        ctx.lineTo(applePos.x-19, applePos.y-67);
        ctx.stroke();

        ctx.fillStyle = '#16B44E';
        ctx.beginPath();
        ctx.moveTo(applePos.x-19, applePos.y-68);
        ctx.lineTo(applePos.x-5, applePos.y-77);
        ctx.lineTo(applePos.x+6, applePos.y-77);
        ctx.lineTo(applePos.x-5, applePos.y-70);
        ctx.closePath();
        ctx.fill();
      }
    };

    drawFrame();
  }, [applePos, isCodeValid]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    if (!isCodeValid) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const distance = Math.hypot(
      mouseX - applePos.x,
      mouseY - applePos.y
    );

    if (distance < 55) {
      setAppleClicked(true);
    }
  };

  const handleMouseMove = (e) => {
    if (appleClicked && isCodeValid) {
      const rect = canvasRef.current.getBoundingClientRect();
      setApplePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = () => {
    setAppleClicked(false);
    if (isCodeValid && (applePos.y < 310 || applePos.x - 54 < 50 || applePos.x + 14 > 350)) {
      const fall = setInterval(() => {
        setApplePos(pos => {
          if (pos.y >= 310) {
            clearInterval(fall);
            return pos;
          }
          return { ...pos, y: pos.y + 2 };
        });
      }, 16);
    }
  };

  const handleComplete = async () => {
    if (!isCodeValid) {
      return;
    }

    try {
      const timeSpent = timeTracker.getTimeSpent();
      const score = 100; // Perfect score for completing the puzzle
      
      const result = await trackPuzzleGameCompletion(
        2, // lessonNumber (Lesson 2)
        'apple-game', // gameType
        score,
        timeSpent
      );
      
      // Show XP notification
      showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
      
      console.log('Apple game completed:', result);
      setIsCompleted(true);
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "http://localhost:3000/MainPage";
      }, 1500);
    } catch (error) {
      console.error('Error tracking game completion:', error);
      // Still allow navigation even if tracking fails
      setTimeout(() => {
        window.location.href = "http://localhost:3000/MainPage";
      }, 1000);
    }
  };

  return (
    <div className="apple-game-page">
      {/* Progress Bar */}
      <ProgressBar currentStep="puzzle" />
      
      {/* Main Content */}
      <div className="apple-main-container">
        <div className="apple-layout-wrapper">
          {/* Left Side - Code Editor */}
          <div className="apple-code-section">
            <div className="apple-code-header">
              <h2 className="apple-code-title">🍎 Apple Position Challenge</h2>
              <p className="apple-code-description">
                Use Python variables to set the apple's position on the canvas
              </p>
            </div>
            
            <div className="apple-hint-box">
              <span className="apple-hint-icon">💡</span>
              <div className="apple-hint-text">
                <p>Declare <code>x</code> and <code>y</code> coordinates to position the apple!</p>
                <p className="apple-hint-example">
                  Example: <code>x = 185</code> then <code>y = 310</code>
                </p>
              </div>
            </div>

            <div className="apple-code-editor-wrapper">
              <div className="apple-code-editor-header">
                <span className="apple-editor-label">Python Editor</span>
                <span className={`apple-editor-indicator ${isCodeValid ? 'valid' : ''}`}></span>
              </div>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="# Type your Python code here...\nx = 185\ny = 310"
                spellCheck="false"
                className="apple-code-textarea"
              />
              {errorMessage && (
                <div className="apple-error-message">
                  <span className="error-icon">⚠️</span>
                  {errorMessage}
                </div>
              )}
            </div>

            {isCodeValid && !isCompleted && (
              <div className="apple-success-hint">
                <span className="success-hint-icon">✅</span>
                <span>Great! Now try dragging the apple around!</span>
              </div>
            )}

            {isCodeValid && !isCompleted && (
              <div className="apple-complete-section">
                <button 
                  className="apple-complete-button" 
                  onClick={handleComplete}
                >
                  <span className="complete-button-icon">🎉</span>
                  Complete Puzzle
                </button>
                <p className="complete-hint">Click to finish and earn XP!</p>
              </div>
            )}

            {isCompleted && (
              <div className="apple-completion-panel">
                <div className="completion-message">
                  <span className="completion-icon">🎉</span>
                  <div className="completion-content">
                    <h3>Puzzle Completed!</h3>
                    <p className="xp-reward">+75 XP Earned</p>
                  </div>
                </div>
                <p className="redirect-text">Redirecting to dashboard...</p>
              </div>
            )}
          </div>

          {/* Right Side - Canvas Preview */}
          <div className="apple-preview-section">
            <div className="apple-preview-header">
              <h3 className="apple-preview-title">Canvas Preview</h3>
              <div className={`apple-status-badge ${isCodeValid ? 'active' : 'inactive'}`}>
                <span className="apple-status-dot"></span>
                {isCodeValid ? 'Valid Code' : 'Waiting...'}
              </div>
            </div>
            
            <div className="apple-canvas-display">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="apple-canvas"
                style={{ display: isCodeValid ? 'block' : 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {!isCodeValid && (
                <div className="apple-preview-placeholder">
                  <div className="placeholder-content">
                    <span className="placeholder-icon">🎨</span>
                    <p>Write correct Python code to reveal the apple!</p>
                    <p className="placeholder-hint">Start by declaring x and y variables</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleGame;