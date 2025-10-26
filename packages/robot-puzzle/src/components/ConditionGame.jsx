import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ConditionGame.css';
import ProgressBar from './ProgressBar';
import { trackPuzzleGameCompletion, showXPNotification, initializeTimeTracker } from '../utils/progressTracker';

const ConditionGame = () => {
  const canvasRef = useRef(null);
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [robotPosition, setRobotPosition] = useState({ x: 100, y: 300 });
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const animationFrameRef = useRef(null);

  // Robot animation function
  const startRobotAnimation = useCallback(() => {
    setIsAnimating(true);
    setDoorOpen(true);
    
    let currentX = 100;
    const targetX = 380; // Move through the door
    const speed = 2;
    
    const animate = () => {
      currentX += speed;
      
      if (currentX <= targetX) {
        setRobotPosition({ x: currentX, y: 300 });
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setRobotPosition({ x: targetX, y: 300 });
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Code validation effect
  useEffect(() => {
    const validateCode = () => {
      try {
        if (codeInput.trim() === '') {
          setIsCodeValid(false);
          setErrorMessage('');
          return;
        }

        // Check for basic if statement pattern
        const ifPattern = /^if\s+.+:/;
        if (!ifPattern.test(codeInput)) {
          throw new Error('Start with "if" followed by a condition and colon');
        }

        // Check for complete print statement with closing bracket
        const completePrintPattern = /print\s*\([^)]*\)/i;
        if (!completePrintPattern.test(codeInput)) {
          throw new Error('Include a complete print statement with closing bracket: print("...")');
        }

        // Extract the content inside print()
        const printMatch = codeInput.match(/print\s*\(\s*["']([^"']*)["']\s*\)/i);
        if (!printMatch) {
          throw new Error('Print statement should contain text in quotes: print("your text")');
        }

        const printContent = printMatch[1].toLowerCase();
        
        // Check if the print content contains 'door' or 'open'
        if (!printContent.includes('door') && !printContent.includes('open')) {
          throw new Error('Print statement must contain "door" or "open" to unlock the door!');
        }

        // Check indentation
        const lines = codeInput.split('\n');
        if (lines.length > 1 && !lines[1].startsWith('    ') && !lines[1].startsWith('\t')) {
          throw new Error('Remember to indent code inside the if statement (4 spaces)');
        }

        setIsCodeValid(true);
        setErrorMessage('');
        
        // Start robot animation when code is valid
        if (!isAnimating && robotPosition.x <= 100) {
          startRobotAnimation();
        }
        
      } catch (error) {
        setIsCodeValid(false);
        setErrorMessage(error.message);
        setDoorOpen(false);
        // Reset robot position if code becomes invalid
        if (robotPosition.x > 100) {
          setRobotPosition({ x: 100, y: 300 });
        }
      }
    };

    const timeout = setTimeout(validateCode, 500);
    return () => clearTimeout(timeout);
  }, [codeInput, isAnimating, robotPosition.x, startRobotAnimation]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const drawScene = () => {
      // Clear canvas
      ctx.clearRect(0, 0, 400, 400);

      // Background - gradient sky
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 400);

      // Draw path/floor
      ctx.fillStyle = '#8E2929';
      ctx.fillRect(0, 340, 400, 60);
      
      // Add floor lines
      ctx.strokeStyle = '#6B1F1F';
      ctx.lineWidth = 2;
      for (let i = 0; i < 400; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 340);
        ctx.lineTo(i, 400);
        ctx.stroke();
      }

      // Draw door frame
      ctx.fillStyle = '#654321';
      ctx.fillRect(340, 220, 50, 120);
      
      // Draw door (opens when valid)
      if (doorOpen) {
        // Open door (swung to the side)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(340, 220, 10, 120);
        
        // Door opened to the side
        ctx.save();
        ctx.translate(350, 280);
        ctx.rotate(-Math.PI / 3);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(0, -60, 8, 120);
        ctx.restore();
        
        ctx.fillStyle = '#4CD964';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('OPEN', 345, 285);
      } else {
        // Closed door
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(345, 220, 40, 120);
        
        // Door handle
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(375, 280, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DOOR', 365, 285);
      }

      // Draw robot (only if not fully through door)
      if (robotPosition.x < 370) {
        // Robot body
        ctx.fillStyle = '#4CD964';
        ctx.fillRect(robotPosition.x, robotPosition.y, 40, 40);
        
        // Robot border/outline
        ctx.strokeStyle = '#2E8B57';
        ctx.lineWidth = 2;
        ctx.strokeRect(robotPosition.x, robotPosition.y, 40, 40);
        
        // Robot eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(robotPosition.x + 8, robotPosition.y + 8, 10, 10);
        ctx.fillRect(robotPosition.x + 22, robotPosition.y + 8, 10, 10);
        
        // Robot pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(robotPosition.x + 13, robotPosition.y + 13, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(robotPosition.x + 27, robotPosition.y + 13, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot mouth
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(robotPosition.x + 20, robotPosition.y + 25, 8, 0, Math.PI);
        ctx.stroke();
        
        // Robot antenna
        ctx.strokeStyle = '#2E8B57';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(robotPosition.x + 20, robotPosition.y);
        ctx.lineTo(robotPosition.x + 20, robotPosition.y - 10);
        ctx.stroke();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(robotPosition.x + 20, robotPosition.y - 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw condition status at top
      ctx.fillStyle = isCodeValid ? '#4CD964' : '#FF6B6B';
      ctx.fillRect(10, 10, 380, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(isCodeValid ? 'Condition: TRUE ✅' : 'Condition: FALSE ❌', 200, 35);
      
      // Draw success message when robot reaches door
      if (robotPosition.x >= 340) {
        ctx.fillStyle = 'rgba(78, 204, 163, 0.9)';
        ctx.fillRect(50, 150, 300, 60);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 Robot Made It Through! 🎉', 200, 185);
      }
    };

    drawScene();
  }, [isCodeValid, robotPosition, doorOpen]);

  const handleReset = () => {
    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setCodeInput('');
    setIsCodeValid(false);
    setErrorMessage('');
    setRobotPosition({ x: 100, y: 300 });
    setIsAnimating(false);
    setDoorOpen(false);
  };

  const handleComplete = async () => {
    if (!isCodeValid) {
      return;
    }

    try {
      const timeSpent = timeTracker.getTimeSpent();
      const score = 100; // Perfect score for completing the puzzle
      
      const result = await trackPuzzleGameCompletion(
        4, // lessonNumber (Lesson 4)
        'condition-game', // gameType
        score,
        timeSpent
      );
      
      // Show XP notification
      showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
      
      console.log('Condition game completed:', result);
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
    <div className="condition-game-page">
      {/* Progress Bar */}
      <ProgressBar currentStep="puzzle" />
      
      {/* Main Content */}
      <div className="condition-main-container">
        <div className="condition-layout-wrapper">
          {/* Left Side - Code Editor */}
          <div className="condition-code-section">
            <div className="condition-code-header">
              <h2 className="condition-code-title">🤖 If Statement Challenge</h2>
              <p className="condition-code-description">
                Write Python if statements to help the robot reach the door!
              </p>
            </div>
            
            <div className="condition-hint-box">
              <span className="condition-hint-icon">💡</span>
              <div className="condition-hint-text">
                <p>Write an <code>if</code> statement with a <code>print</code> that contains the word <strong>"door"</strong> or <strong>"open"</strong>!</p>
                <p className="condition-hint-example">
                  Example: <code>print("The door is open!")</code>
                </p>
                <p className="condition-hint-example">
                  Don't forget to indent with 4 spaces or a tab
                </p>
              </div>
            </div>

            <div className="condition-code-editor-wrapper">
              <div className="condition-code-editor-header">
                <span className="condition-editor-label">Python Editor</span>
                <span className={`condition-editor-indicator ${isCodeValid ? 'valid' : ''}`}></span>
              </div>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder={`# Example if statement:\nif door_open == True:\n    print("Open the door!")`}
                spellCheck="false"
                className="condition-code-textarea"
                rows={8}
              />
              {errorMessage && (
                <div className="condition-error-message">
                  <span className="error-icon">⚠️</span>
                  {errorMessage}
                </div>
              )}
            </div>

            {isCodeValid && !isCompleted && (
              <div className="condition-success-hint">
                <span className="success-hint-icon">✅</span>
                <span>Great! Your if statement is correct. The robot can move!</span>
              </div>
            )}

            {/* Examples Box */}
            <div className="condition-examples-box">
              <h3>Valid Print Examples</h3>
              <div className="condition-examples-grid">
                <div className="condition-example">
                  <code>print("Open the door")</code>
                </div>
                <div className="condition-example">
                  <code>print("The door is open!")</code>
                </div>
                <div className="condition-example">
                  <code>print("door unlocked")</code>
                </div>
                <div className="condition-example">
                  <code>print("Please open")</code>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="condition-actions">
              <button onClick={handleReset} className="condition-reset-button">
                <span className="button-icon">🔄</span>
                Reset Robot
              </button>

              {isCodeValid && !isCompleted && (
                <button onClick={handleComplete} className="condition-complete-button">
                  <span className="button-icon">🎉</span>
                  Complete Puzzle
                </button>
              )}
            </div>

            {isCompleted && (
              <div className="condition-completion-panel">
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
          <div className="condition-preview-section">
            <div className="condition-preview-header">
              <h3 className="condition-preview-title">Robot Simulation</h3>
              <div className={`condition-status-badge ${isCodeValid ? 'active' : 'inactive'}`}>
                <span className="condition-status-dot"></span>
                {isCodeValid ? 'Door Open' : 'Door Closed'}
              </div>
            </div>
            
            <div className="condition-canvas-display">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="condition-canvas"
              />
              {!isCodeValid && (
                <div className="condition-canvas-overlay">
                  <div className="overlay-content">
                    <span className="overlay-icon">🚪</span>
                    <p>Write an if statement to open the door!</p>
                    <p className="overlay-hint">The robot needs your code to move forward</p>
                  </div>
                </div>
              )}
            </div>

            {/* Condition Status Display */}
            <div className={`condition-status-display ${isCodeValid ? 'true' : 'false'}`}>
              <span className="status-icon">
                {isCodeValid ? '✅' : '❌'}
              </span>
              <span className="status-text">
                Condition: {isCodeValid ? 'TRUE' : 'FALSE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionGame;