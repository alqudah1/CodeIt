import React, { useState, useEffect, useRef } from 'react';
import './MathGame.css';
import ProgressBar from './ProgressBar';
import { trackPuzzleGameCompletion, showXPNotification, initializeTimeTracker } from '../utils/progressTracker';

const MathGame = () => {
  const [codeInput, setCodeInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [numbersCaught, setNumbersCaught] = useState(0);
  const [targetNumber, setTargetNumber] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [feedback, setFeedback] = useState('Type a math expression that equals the number in the circle!');
  const [feedbackClass, setFeedbackClass] = useState('feedback');
  const [showGameEnd, setShowGameEnd] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalMessage, setFinalMessage] = useState('');
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);

  const gameCanvasRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const numbersIntervalRef = useRef(null);
  const targetNumberRef = useRef(null);
  const fallingNumbersRef = useRef([]);

  const totalNumbers = 5;

  // Initialize the game
  const initGame = () => {
    setScore(0);
    setTimeLeft(45);
    setNumbersCaught(0);
    setGameActive(true);
    setFeedback('Type a math expression that equals the number in the circle!');
    setFeedbackClass('feedback');
    setShowGameEnd(false);
    
    // Clear any existing numbers
    fallingNumbersRef.current.forEach(num => {
      if (num.element && num.element.parentNode) {
        num.element.remove();
      }
    });
    fallingNumbersRef.current = [];
    
    if (targetNumberRef.current) {
      targetNumberRef.current.remove();
    }
    
    // Generate first target number
    generateTargetNumber();
    startTimers();
  };

  // Generate a target number
  const generateTargetNumber = () => {
    const newTargetNumber = Math.floor(Math.random() * 10) + 1;
    setTargetNumber(newTargetNumber);
    
    const targetElement = document.createElement('div');
    targetElement.className = 'target-number';
    targetElement.textContent = newTargetNumber;
    targetElement.style.left = `${Math.random() * (gameCanvasRef.current.offsetWidth - 70)}px`;
    targetElement.style.top = '0px';
    targetElement.id = 'target';
    
    gameCanvasRef.current.appendChild(targetElement);
    targetNumberRef.current = targetElement;
    
    // Animate the number falling
    let topPos = 0;
    const fallInterval = setInterval(() => {
      if (!gameActive) {
        clearInterval(fallInterval);
        return;
      }
      
      topPos += 0.8;
      targetElement.style.top = `${topPos}px`;
      
      if (topPos > gameCanvasRef.current.offsetHeight - 70) {
        clearInterval(fallInterval);
        targetElement.remove();
        if (gameActive) {
          generateTargetNumber();
        }
      }
    }, 100);
  };

  // Start game timers
  const startTimers = () => {
    // Countdown timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Generate random numbers
    numbersIntervalRef.current = setInterval(() => {
      if (!gameActive || fallingNumbersRef.current.length >= 2) return;
      createFallingNumber();
    }, 4000);
  };

  // Create a falling number
  const createFallingNumber = () => {
    const value = Math.floor(Math.random() * 10) + 1;
    const numberElement = document.createElement('div');
    numberElement.className = 'target-number';
    numberElement.style.backgroundColor = '#4a6fa5';
    numberElement.textContent = value;
    numberElement.style.left = `${Math.random() * (gameCanvasRef.current.offsetWidth - 70)}px`;
    numberElement.style.top = '0px';
    
    gameCanvasRef.current.appendChild(numberElement);
    
    const numberObj = {
      element: numberElement,
      value: value,
      top: 0
    };
    
    fallingNumbersRef.current.push(numberObj);
    
    // Animate the number falling
    const fallInterval = setInterval(() => {
      if (!gameActive) {
        clearInterval(fallInterval);
        return;
      }
      
      numberObj.top += 0.8;
      numberElement.style.top = `${numberObj.top}px`;
      
      if (numberObj.top > gameCanvasRef.current.offsetHeight - 70) {
        clearInterval(fallInterval);
        numberElement.remove();
        fallingNumbersRef.current = fallingNumbersRef.current.filter(n => n !== numberObj);
      }
    }, 100);
  };

  // Evaluate the expression
  const evaluateExpression = () => {
    if (!gameActive) return;
    
    try {
      const expression = codeInput.replace(/[^0-9+\-*/().\s]/g, '');
      
      if (expression.trim() === '') {
        setFeedback('Please enter a math expression!');
        setFeedbackClass('feedback incorrect');
        return;
      }
      
      const result = Function('"use strict"; return (' + expression + ')')();
      
      if (typeof result === 'number' && !isNaN(result)) {
        if (Math.abs(result - targetNumber) < 0.001) {
          // Correct expression
          const newScore = score + 10;
          const newNumbersCaught = numbersCaught + 1;
          
          setScore(newScore);
          setNumbersCaught(newNumbersCaught);
          setFeedback(`Correct! ${expression} = ${result} 🎉`);
          setFeedbackClass('feedback correct');
          
          if (newNumbersCaught >= totalNumbers) {
            endGame();
            return;
          }
          
          // Remove current target and generate new one
          if (targetNumberRef.current) {
            targetNumberRef.current.remove();
          }
          generateTargetNumber();
        } else {
          setFeedback(`Try again! ${expression} = ${result}, but we need ${targetNumber}`);
          setFeedbackClass('feedback incorrect');
        }
      } else {
        setFeedback('Please enter a valid math expression with numbers!');
        setFeedbackClass('feedback incorrect');
      }
    } catch (error) {
      setFeedback('Please check your math expression. Use numbers and +, -, *, /');
      setFeedbackClass('feedback incorrect');
    }
    
    setCodeInput('');
  };

  // End the game
  const endGame = () => {
    setGameActive(false);
    clearInterval(timerIntervalRef.current);
    clearInterval(numbersIntervalRef.current);
    
    // Remove all numbers
    fallingNumbersRef.current.forEach(num => {
      if (num.element && num.element.parentNode) {
        num.element.remove();
      }
    });
    fallingNumbersRef.current = [];
    
    if (targetNumberRef.current) {
      targetNumberRef.current.remove();
    }
    
    // Show game end screen
    setFinalScore(score);
    
    if (score >= 40) {
      setFinalMessage("Wow! You're a math superstar! 🌟");
    } else if (score >= 20) {
      setFinalMessage("Great job! You're really good at math! 👍");
    } else {
      setFinalMessage("Good effort! Keep practicing and you'll get even better! 💪");
    }
    
    setShowGameEnd(true);
  };

  const handleComplete = async () => {
    try {
      const timeSpent = timeTracker.getTimeSpent();
      const finalGameScore = gameActive ? score : finalScore;
      
      const result = await trackPuzzleGameCompletion(
        3, // lessonNumber (Lesson 3)
        'math-game', // gameType
        finalGameScore,
        timeSpent
      );
      
      // Show XP notification
      showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
      
      console.log('Math game completed:', result);
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

  // Handle key press for Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      evaluateExpression();
    }
  };

  // Initialize game on component mount
  useEffect(() => {
    initGame();
    
    // Cleanup on unmount
    return () => {
      clearInterval(timerIntervalRef.current);
      clearInterval(numbersIntervalRef.current);
    };
  }, []);

  const progressWidth = ((45 - timeLeft) / 45) * 100;

  return (
    <div className="math-game-page">
      {/* Progress Bar */}
      <ProgressBar currentStep="puzzle" />
      
      {/* Main Content */}
      <div className="math-main-container">
        <div className="math-layout-wrapper">
          {/* Left Side - Game Controls */}
          <div className="math-control-section">
            <div className="math-header">
              <h2 className="math-title">➕ Math Expression Challenge</h2>
              <p className="math-description">
                Solve math problems by creating expressions that match the target numbers!
              </p>
            </div>
            
            {/* Game Stats */}
            <div className="math-stats-grid">
              <div className="math-stat-card score">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <div className="stat-label">Score</div>
                  <div className="stat-value">{score}</div>
                </div>
              </div>
              <div className="math-stat-card time">
                <div className="stat-icon">⏱️</div>
                <div className="stat-info">
                  <div className="stat-label">Time</div>
                  <div className="stat-value">{timeLeft}s</div>
                </div>
              </div>
              <div className="math-stat-card numbers">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <div className="stat-label">Caught</div>
                  <div className="stat-value">{numbersCaught}/{totalNumbers}</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="math-progress-container">
              <div className="math-progress-label">
                <span>Game Progress</span>
                <span>{Math.round(progressWidth)}%</span>
              </div>
              <div className="math-progress-bar">
                <div 
                  className="math-progress-fill" 
                  style={{ width: `${progressWidth}%` }}
                ></div>
              </div>
            </div>
            
            {/* Code Editor */}
            <div className="math-hint-box">
              <span className="math-hint-icon">💡</span>
              <div className="math-hint-text">
                <p>Type a math expression that equals the <strong>orange number</strong>!</p>
                <p className="math-hint-example">
                  Try: <code>3 + 2</code>, <code>10 - 4</code>, <code>2 * 3</code>, <code>8 / 2</code>
                </p>
              </div>
            </div>

            <div className="math-code-editor-wrapper">
              <div className="math-code-editor-header">
                <span className="math-editor-label">Math Expression</span>
                <span className={`math-editor-indicator ${gameActive ? 'active' : ''}`}></span>
              </div>
              <textarea 
                className="math-code-textarea"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Example: 5 + 3"
                disabled={!gameActive}
              />
              <button 
                className="math-submit-button" 
                onClick={evaluateExpression}
                disabled={!gameActive}
              >
                <span className="submit-icon">🚀</span>
                Check Answer!
              </button>
            </div>

            {/* Feedback */}
            <div className={`math-feedback ${feedbackClass}`}>
              <span className="feedback-icon">
                {feedbackClass.includes('correct') ? '✅' : 
                 feedbackClass.includes('incorrect') ? '❌' : 'ℹ️'}
              </span>
              {feedback}
            </div>

            {/* Operators Info */}
            <div className="math-operators-box">
              <h3>Available Operators</h3>
              <div className="math-operators-list">
                <span className="math-operator">+</span>
                <span className="math-operator">-</span>
                <span className="math-operator">*</span>
                <span className="math-operator">/</span>
                <span className="math-operator">( )</span>
              </div>
            </div>
          </div>

          {/* Right Side - Game Canvas */}
          <div className="math-canvas-section">
            <div className="math-canvas-header">
              <h3 className="math-canvas-title">Game Area</h3>
              <div className={`math-status-badge ${gameActive ? 'active' : 'inactive'}`}>
                <span className="math-status-dot"></span>
                {gameActive ? 'Playing' : 'Paused'}
              </div>
            </div>
            
            <div className="math-canvas-display" ref={gameCanvasRef}>
              {!gameActive && !showGameEnd && (
                <div className="math-canvas-overlay">
                  <div className="overlay-content">
                    <span className="overlay-icon">🎮</span>
                    <p>Game Ready!</p>
                    <button className="start-game-btn" onClick={initGame}>
                      Start Game
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game End Modal */}
        {showGameEnd && !isCompleted && (
          <div className="math-game-end-modal">
            <div className="math-game-end-content">
              <h2>🎉 Great Job!</h2>
              <div className="final-score-display">
                <span className="final-score-label">Final Score</span>
                <span className="final-score-value">{finalScore}</span>
              </div>
              <p className="final-message">{finalMessage}</p>
              <div className="game-end-actions">
                <button className="math-restart-btn" onClick={initGame}>
                  🔄 Play Again
                </button>
                <button className="math-complete-btn" onClick={handleComplete}>
                  🎯 Complete & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Completion Modal */}
        {isCompleted && (
          <div className="math-game-end-modal">
            <div className="math-completion-panel">
              <div className="completion-message">
                <span className="completion-icon">🎉</span>
                <div className="completion-content">
                  <h3>Puzzle Completed!</h3>
                  <p className="xp-reward">+75 XP Earned</p>
                </div>
              </div>
              <p className="redirect-text">Redirecting to dashboard...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MathGame;