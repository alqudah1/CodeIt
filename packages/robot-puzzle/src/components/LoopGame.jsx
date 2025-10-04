import React, { useState, useEffect, useRef } from 'react';

const LoopGame = () => {
  const canvasRef = useRef(null);
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [loopResult, setLoopResult] = useState([]);

  const challenges = [
    {
      type: 'for',
      title: "For Loop: Collect Stars",
      description: "Use a for loop to collect 3 stars!",
      hint: "Use: for i in range(3):",
      example: `for i in range(3):\n    print("Collect star")`,
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
      example: `for step in range(5):\n    print("Step forward")`,
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
      example: `distance = 3\nwhile distance > 0:\n    print("Move closer")\n    distance -= 1`,
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
      example: `count = 3\nwhile count > 0:\n    print("Count:", count)\n    count -= 1`,
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

  return (
    <div className="game-container">
      <div className="layout-container">
        {/* Code Input Section */}
        <div className="coding-challenge">
          <h2>🔄 Loop Adventure</h2>
          
          <div className="challenge-progress">
            <span>Challenge {currentChallenge + 1} of {challenges.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${((currentChallenge + 1) / challenges.length) * 100}%`}}
              ></div>
            </div>
          </div>

          <div className="code-instruction">
            <h3>{challenges[currentChallenge].title}</h3>
            <p>{challenges[currentChallenge].description}</p>
            {challenges[currentChallenge].variables && (
              <p><strong>Variables:</strong> <code>{challenges[currentChallenge].variables.replace('let ', '')}</code></p>
            )}
          </div>

          <div className="code-editor">
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={challenges[currentChallenge].example}
              className={`code-input ${errorMessage ? 'error' : ''} ${isCodeValid ? 'success' : ''}`}
              spellCheck="false"
              rows={6}
            />
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {isCodeValid && (
              <div className="success-message">
                ✅ Great! Your loop is working perfectly!
              </div>
            )}
          </div>

          {loopResult.length > 0 && (
            <div className="loop-output">
              <h4>Loop Output:</h4>
              <div className="output-box">
                {loopResult.map((line, index) => (
                  <div key={index} className="output-line">{line}</div>
                ))}
              </div>
            </div>
          )}

          <div className="hint-box">
            <p>💡 <strong>Hint:</strong> {challenges[currentChallenge].hint}</p>
          </div>

          <div className="game-controls">
            <button onClick={handleReset} className="control-btn reset-btn">
              Reset
            </button>
            <div className="navigation-buttons">
              <button 
                onClick={handlePreviousChallenge} 
                disabled={currentChallenge === 0}
                className="control-btn nav-btn"
              >
                ← Previous
              </button>
              <button 
                onClick={handleNextChallenge} 
                disabled={currentChallenge === challenges.length - 1 || !isCodeValid}
                className="control-btn nav-btn"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="loop-examples">
            <h4>Loop Examples:</h4>
            <div className="examples-grid">
              <div className="example">
                <code>for i in range(5):</code><br/>
                <code>&nbsp;&nbsp;print("Hello")</code>
              </div>
              <div className="example">
                <code>count = 1</code><br/>
                <code>while count {'<='} 3:</code><br/>
                <code>&nbsp;&nbsp;print(count)</code><br/>
                <code>&nbsp;&nbsp;count += 1</code>
              </div>
            </div>
          </div>
        </div>

        {/* Game Preview Section */}
        <div className="game-preview">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
          />
          {!isCodeValid && (
            <div className="preview-placeholder">
              <p>✨ Write a {challenges[currentChallenge].type} loop to complete the challenge!</p>
              <p>Check the hint for help!</p>
            </div>
          )}
          {isCodeValid && currentChallenge === challenges.length - 1 && (
            <div className="completion-message">
              <h3>🎉 Congratulations!</h3>
              <p>You've mastered Python loops!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoopGame;