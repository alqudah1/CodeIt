import React, { useState, useEffect, useRef } from 'react';
import './LoopGame.css';
import ProgressBar from './ProgressBar';
import { trackPuzzleGameCompletion, showXPNotification, initializeTimeTracker } from '../utils/progressTracker';

const LoopGame = () => {
  const canvasRef = useRef(null);
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [loopResult, setLoopResult] = useState([]);
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState([]);

  const challenges = [
    {
      type: 'for',
      title: "For Loop: Collect Stars",
      description: "Use a for loop to collect 3 stars!",
      hint: "Use: for i in range(3):",
      steps: [
        "Type: for i in range(3):",
        "Press Enter and add 4 spaces",
        "Type: print(\"Collect star\")"
      ],
      starter: `for i in range(3):\n    `,
      example: `for i in range(3):\n    print("Collect star")`,
      expectedOutput: ["Collect star", "Collect star", "Collect star"],
      variables: "",
      test: (code) => {
        try {
          // Clean and normalize the code
          const cleanCode = code.trim();
          
          // Basic syntax checks
          if (!cleanCode.includes('for') || !cleanCode.includes('range(3)')) {
            return { passed: false, output: [] };
          }
          
          if (!cleanCode.includes('print')) {
            return { passed: false, output: [] };
          }
          
          // Count the print statements by simulating the loop
          let output = [];
          for (let i = 0; i < 3; i++) {
            if (cleanCode.includes('"Collect star"') || cleanCode.includes("'Collect star'")) {
              output.push("Collect star");
            } else if (cleanCode.includes('collect') || cleanCode.includes('star')) {
              output.push("Collect star"); // Accept variations
            }
          }
          
          // Check if we have exactly 3 outputs
          const passed = output.length === 3;
          return { passed, output };
        } catch (e) {
          return { passed: false, output: [] };
        }
      }
    },
    {
      type: 'for',
      title: "For Loop: Counting Steps",
      description: "Use a for loop to take 5 steps forward!",
      hint: "Use: for step in range(5):",
      steps: [
        "Type: for step in range(5):",
        "Press Enter and add 4 spaces",
        "Type: print(\"Step forward\")"
      ],
      starter: `for step in range(5):\n    `,
      example: `for step in range(5):\n    print("Step forward")`,
      expectedOutput: ["Step forward", "Step forward", "Step forward", "Step forward", "Step forward"],
      variables: "",
      test: (code) => {
        try {
          const cleanCode = code.trim();
          
          if (!cleanCode.includes('for') || !cleanCode.includes('range(5)')) {
            return { passed: false, output: [] };
          }
          
          let output = [];
          for (let i = 0; i < 5; i++) {
            if (cleanCode.includes('"Step forward"') || cleanCode.includes("'Step forward'")) {
              output.push("Step forward");
            } else if (cleanCode.includes('step') || cleanCode.includes('Step')) {
              output.push("Step forward");
            }
          }
          
          const passed = output.length === 5;
          return { passed, output };
        } catch (e) {
          return { passed: false, output: [] };
        }
      }
    },
    {
      type: 'while',
      title: "While Loop: Until Treasure",
      description: "Use a while loop to move until you reach the treasure!",
      hint: "Use: while distance > 0:",
      steps: [
        "Type: distance = 3",
        "Type: while distance > 0:",
        "Add 4 spaces and type: print(\"Move closer\")",
        "Add 4 spaces and type: distance -= 1"
      ],
      starter: `distance = 3\nwhile distance > 0:\n    \n    `,
      example: `distance = 3\nwhile distance > 0:\n    print("Move closer")\n    distance -= 1`,
      expectedOutput: ["Move closer", "Move closer", "Move closer"],
      variables: "let distance = 3;",
      test: (code) => {
        try {
          const cleanCode = code.trim();
          
          if (!cleanCode.includes('while') || !cleanCode.includes('distance')) {
            return { passed: false, output: [] };
          }
          
          let output = [];
          let distance = 3;
          
          // Simple simulation of the while loop
          while (distance > 0) {
            if (cleanCode.includes('"Move closer"') || cleanCode.includes("'Move closer'")) {
              output.push("Move closer");
            } else if (cleanCode.includes('move') || cleanCode.includes('Move')) {
              output.push("Move closer");
            }
            distance--;
            if (output.length > 10) break; // Prevent infinite loops
          }
          
          const passed = output.length === 3;
          return { passed, output };
        } catch (e) {
          return { passed: false, output: [] };
        }
      }
    },
    {
      type: 'while',
      title: "While Loop: Countdown",
      description: "Use a while loop to count down from 3!",
      hint: "Use: while count > 0:",
      steps: [
        "Type: count = 3",
        "Type: while count > 0:",
        "Add 4 spaces and type: print(\"Count:\", count)",
        "Add 4 spaces and type: count -= 1"
      ],
      starter: `count = 3\nwhile count > 0:\n    \n    `,
      example: `count = 3\nwhile count > 0:\n    print("Count:", count)\n    count -= 1`,
      expectedOutput: ["Count: 3", "Count: 2", "Count: 1"],
      variables: "let count = 3;",
      test: (code) => {
        try {
          const cleanCode = code.trim();
          
          if (!cleanCode.includes('while') || !cleanCode.includes('count')) {
            return { passed: false, output: [] };
          }
          
          let output = [];
          let count = 3;
          
          while (count > 0) {
            if (cleanCode.includes('print("Count:"')) {
              output.push(`Count: ${count}`);
            } else if (cleanCode.includes('count') && cleanCode.includes('print')) {
              output.push(`Count: ${count}`);
            }
            count--;
            if (output.length > 10) break;
          }
          
          const passed = output.length === 3 && 
                         output.includes("Count: 3") && 
                         output.includes("Count: 2") && 
                         output.includes("Count: 1");
          return { passed, output };
        } catch (e) {
          return { passed: false, output: [] };
        }
      }
    }
  ];

  // Code validation effect
  useEffect(() => {
    const validateCode = () => {
      try {
        if (codeInput.trim() === '') {
          setIsCodeValid(false);
          setErrorMessage('');
          setLoopResult([]);
          return;
        }

        const challenge = challenges[currentChallenge];
        
        // Basic syntax checks
        if (challenge.type === 'for') {
          if (!codeInput.includes('for')) {
            throw new Error('Use a for loop');
          }
          if (!codeInput.includes('range')) {
            throw new Error('Use range() in your for loop');
          }
        } else {
          if (!codeInput.includes('while')) {
            throw new Error('Use a while loop');
          }
        }
        
        if (!codeInput.includes('print')) {
          throw new Error('Include print statements to see your loop working');
        }

        // Test the code using our simplified test function
        const testResult = challenge.test(codeInput);
        
        if (testResult.passed) {
          setIsCodeValid(true);
          setErrorMessage('');
          setLoopResult(testResult.output);
        } else {
          throw new Error('Loop not working correctly. Check the hint for the expected format!');
        }
        
      } catch (error) {
        setIsCodeValid(false);
        setErrorMessage(error.message);
        setLoopResult([]);
      }
    };

    const timeout = setTimeout(validateCode, 800);
    return () => clearTimeout(timeout);
  }, [codeInput, currentChallenge]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const drawScene = () => {
      // Clear canvas
      ctx.clearRect(0, 0, 400, 400);

      // Background
      ctx.fillStyle = '#4A90E2';
      ctx.fillRect(0, 0, 400, 400);

      // Draw ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 350, 400, 50);

      const challenge = challenges[currentChallenge];
      
      if (challenge.type === 'for') {
        // For loop challenge - collect stars
        drawForLoopScene(ctx, isCodeValid, loopResult.length);
      } else {
        // While loop challenge - reach treasure
        drawWhileLoopScene(ctx, isCodeValid, loopResult.length);
      }
    };

    drawScene();
  }, [isCodeValid, currentChallenge, loopResult]);

  const drawForLoopScene = (ctx, isValid, starsCollected) => {
    // Draw path
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(50, 300, 300, 50);
    
    // Draw robot
    ctx.fillStyle = isValid ? '#4CD964' : '#FF6B6B';
    ctx.fillRect(70 + (starsCollected * 60), 280, 40, 40);
    
    // Draw face
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(80 + (starsCollected * 60), 295, 8, 8);
    ctx.fillRect(100 + (starsCollected * 60), 295, 8, 8);
    
    // Draw stars to collect
    for (let i = 0; i < 3; i++) {
      const x = 150 + (i * 60);
      const collected = i < starsCollected;
      
      ctx.fillStyle = collected ? '#FFD700' : '#CCCCCC';
      drawStar(ctx, x, 250, 5, 15, 8);
      
      if (collected) {
        ctx.fillStyle = '#4CD964';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('✓', x - 5, 255);
      }
    }
    
    // Draw instruction
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Collect ${3 - starsCollected} more stars!`, 200, 200);
  };

  const drawWhileLoopScene = (ctx, isValid, stepsTaken) => {
    // Draw path
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(50, 300, 300, 50);
    
    // Draw robot
    const progress = Math.min(stepsTaken / 3, 1);
    ctx.fillStyle = isValid ? '#4CD964' : '#FF6B6B';
    ctx.fillRect(70 + (progress * 240), 280, 40, 40);
    
    // Draw face
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(80 + (progress * 240), 295, 8, 8);
    ctx.fillRect(100 + (progress * 240), 295, 8, 8);
    
    // Draw treasure at the end
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(320, 260, 40, 40);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('💎', 330, 285);
    
    // Draw distance indicator
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Distance: ${3 - stepsTaken}`, 200, 200);
    
    if (stepsTaken >= 3) {
      ctx.fillStyle = '#4CD964';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Treasure Reached! 🎉', 200, 180);
    }
  };

  const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  const handleNextChallenge = () => {
    if (currentChallenge < challenges.length - 1) {
      // Mark current challenge as completed
      if (isCodeValid && !completedChallenges.includes(currentChallenge)) {
        setCompletedChallenges([...completedChallenges, currentChallenge]);
      }
      
      setCurrentChallenge(currentChallenge + 1);
      setCodeInput('');
      setIsCodeValid(false);
      setErrorMessage('');
      setLoopResult([]);
    }
  };

  const handlePreviousChallenge = () => {
    if (currentChallenge > 0) {
      setCurrentChallenge(currentChallenge - 1);
      setCodeInput('');
      setIsCodeValid(false);
      setErrorMessage('');
      setLoopResult([]);
    }
  };

  const handleReset = () => {
    setCodeInput('');
    setIsCodeValid(false);
    setErrorMessage('');
    setLoopResult([]);
  };

  const handleUseStarter = () => {
    setCodeInput(challenges[currentChallenge].starter);
  };

  const handleShowSolution = () => {
    setCodeInput(challenges[currentChallenge].example);
  };

  const handleComplete = async () => {
    // Mark current challenge as completed if valid
    if (isCodeValid && !completedChallenges.includes(currentChallenge)) {
      setCompletedChallenges([...completedChallenges, currentChallenge]);
    }

    const finalCompletedCount = completedChallenges.includes(currentChallenge) 
      ? completedChallenges.length 
      : completedChallenges.length + 1;

    try {
      const timeSpent = timeTracker.getTimeSpent();
      // Score based on challenges completed (25 points per challenge)
      const score = finalCompletedCount * 25;
      
      const result = await trackPuzzleGameCompletion(
        5, // lessonNumber (Lesson 5)
        'loop-game', // gameType
        score,
        timeSpent
      );
      
      // Show XP notification
      showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
      
      console.log('Loop game completed:', result);
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
    <div className="loop-game-page">
      {/* Progress Bar */}
      <ProgressBar currentStep="puzzle" />
      
      {/* Main Content */}
      <div className="loop-main-container">
        <div className="loop-layout-wrapper">
          {/* Left Side - Code Editor */}
          <div className="loop-code-section">
            <div className="loop-code-header">
              <h2 className="loop-code-title">🔄 Loop Adventure</h2>
              <p className="loop-code-description">
                Master Python loops by completing all challenges!
              </p>
            </div>
            
            {/* Challenge Progress */}
            <div className="loop-challenge-progress">
              <div className="challenge-info">
                <span className="challenge-number">Challenge {currentChallenge + 1} of {challenges.length}</span>
                <span className="challenge-completed">{completedChallenges.length + (isCodeValid && !completedChallenges.includes(currentChallenge) ? 1 : 0)}/{challenges.length} Completed</span>
              </div>
              <div className="challenge-progress-bar">
                <div 
                  className="challenge-progress-fill" 
                  style={{width: `${((completedChallenges.length + (isCodeValid && !completedChallenges.includes(currentChallenge) ? 1 : 0)) / challenges.length) * 100}%`}}
                ></div>
              </div>
            </div>

            {/* Current Challenge Info */}
            <div className="loop-challenge-card">
              <div className="challenge-header">
                <span className="challenge-type-badge">{challenges[currentChallenge].type} loop</span>
                <h3>{challenges[currentChallenge].title}</h3>
              </div>
              <p className="challenge-description">{challenges[currentChallenge].description}</p>
            </div>
            
            {/* Step-by-Step Instructions */}
            <div className="loop-steps-box">
              <h4>📝 Follow These Steps:</h4>
              <ol className="loop-steps-list">
                {challenges[currentChallenge].steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Expected Output */}
            <div className="loop-expected-output">
              <h4>🎯 What You Should See:</h4>
              <div className="expected-output-content">
                {challenges[currentChallenge].expectedOutput.map((line, index) => (
                  <div key={index} className="expected-line">{line}</div>
                ))}
              </div>
            </div>

            {/* Code Editor */}
            <div className="loop-code-editor-wrapper">
              <div className="loop-code-editor-header">
                <span className="loop-editor-label">Python Editor</span>
                <div className="editor-actions">
                  <button onClick={handleUseStarter} className="helper-btn starter-btn" title="Get code starter">
                    📋 Code Starter
                  </button>
                  <button onClick={handleShowSolution} className="helper-btn solution-btn" title="Show complete solution">
                    👀 Show Solution
                  </button>
                </div>
              </div>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Click 'Code Starter' to begin, or type your code here..."
                spellCheck="false"
                className="loop-code-textarea"
                rows={7}
              />
              {errorMessage && (
                <div className="loop-error-message">
                  <span className="error-icon">⚠️</span>
                  {errorMessage}
                </div>
              )}
            </div>

            {isCodeValid && !isCompleted && (
              <div className="loop-success-hint">
                <span className="success-hint-icon">✅</span>
                <span>Great! Your loop is working perfectly!</span>
              </div>
            )}

            {/* Loop Output */}
            {loopResult.length > 0 && (
              <div className="loop-output-box">
                <h4>Loop Output:</h4>
                <div className="output-content">
                  {loopResult.map((line, index) => (
                    <div key={index} className="output-line">
                      <span className="line-number">{index + 1}</span>
                      <span className="line-content">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="loop-navigation">
              <button 
                onClick={handlePreviousChallenge} 
                disabled={currentChallenge === 0}
                className="loop-nav-button prev"
              >
                <span className="button-icon">←</span>
                Previous
              </button>
              
              <button onClick={handleReset} className="loop-reset-button">
                <span className="button-icon">🔄</span>
                Reset
              </button>

              {currentChallenge < challenges.length - 1 ? (
                <button 
                  onClick={handleNextChallenge} 
                  disabled={!isCodeValid}
                  className="loop-nav-button next"
                >
                  Next
                  <span className="button-icon">→</span>
                </button>
              ) : (
                <button 
                  onClick={handleComplete} 
                  disabled={isCompleted}
                  className="loop-complete-button"
                >
                  <span className="button-icon">🎉</span>
                  Complete
                </button>
              )}
            </div>


            {isCompleted && (
              <div className="loop-completion-panel">
                <div className="completion-message">
                  <span className="completion-icon">🎉</span>
                  <div className="completion-content">
                    <h3>All Challenges Completed!</h3>
                    <p className="xp-reward">+75 XP Earned</p>
                  </div>
                </div>
                <p className="redirect-text">Redirecting to dashboard...</p>
              </div>
            )}
          </div>

          {/* Right Side - Canvas Preview */}
          <div className="loop-preview-section">
            <div className="loop-preview-header">
              <h3 className="loop-preview-title">Game Simulation</h3>
              <div className={`loop-status-badge ${isCodeValid ? 'active' : 'inactive'}`}>
                <span className="loop-status-dot"></span>
                {isCodeValid ? 'Running' : 'Waiting'}
              </div>
            </div>
            
            <div className="loop-canvas-display">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="loop-canvas"
              />
              {!isCodeValid && (
                <div className="loop-canvas-overlay">
                  <div className="overlay-content">
                    <span className="overlay-icon">🔄</span>
                    <p>Write a {challenges[currentChallenge].type} loop!</p>
                    <p className="overlay-hint">Check the hint for guidance</p>
                  </div>
                </div>
              )}
            </div>

            {/* Challenge Completion Status */}
            {currentChallenge === challenges.length - 1 && isCodeValid && !isCompleted && (
              <div className="final-challenge-banner">
                <span className="banner-icon">🏆</span>
                <span className="banner-text">Final Challenge Complete! Click "Complete" to finish.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoopGame;