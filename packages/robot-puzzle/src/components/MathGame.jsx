import React, { useState, useEffect, useRef } from 'react';
import './MathGame.module.css';

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
    <div className="game-container">
      <div className="game-header">
        <h1>Lesson 3 Game</h1>
        <p>Write math expressions to catch the orange numbers!</p>
      </div>
      
      <div className="game-stats">
        <div className="stat">
          <div>Score</div>
          <div className="stat-value">{score}</div>
        </div>
        <div className="stat">
          <div>Time</div>
          <div className="stat-value">{timeLeft}</div>
        </div>
        <div className="stat">
          <div>Numbers</div>
          <div className="stat-value">{numbersCaught}/{totalNumbers}</div>
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${progressWidth}%` }}
        ></div>
      </div>
      
      <div className="game-content">
        <div className="coding-section">
          <h2>Your Math Expression</h2>
          <textarea 
            className="code-input"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Example: 5 + 3"
          />
          <button className="submit-btn" onClick={evaluateExpression}>
            Check Answer!
          </button>
          <div className={`feedback ${feedbackClass}`}>
            {feedback}
          </div>
          <div className="example">
            <p>Try these: <code>3 + 2</code>, <code>10 - 4</code>, <code>2 * 3</code>, <code>8 / 2</code></p>
          </div>
        </div>
        
        <div className="game-canvas" ref={gameCanvasRef}>
          {/* Falling numbers are created dynamically */}
        </div>
      </div>
      
      <div className="game-info">
        <h3>Math Operators You Can Use</h3>
        <div className="operators-list">
          <span className="operator">+</span>
          <span className="operator">-</span>
          <span className="operator">*</span>
          <span className="operator">/</span>
          <span className="operator">( )</span>
        </div>
      </div>
      
      {showGameEnd && (
        <div className="game-end">
          <h2>Great Job! 🎉</h2>
          <p>Your final score: <strong>{finalScore}</strong></p>
          <p>{finalMessage}</p>
          <button className="restart-btn" onClick={initGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default MathGame;