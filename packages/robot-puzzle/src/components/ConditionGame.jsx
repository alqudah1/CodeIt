import React, { useState, useEffect, useRef } from 'react';

const ConditionGame = () => {
  const canvasRef = useRef(null);
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [robotPosition, setRobotPosition] = useState({ x: 100, y: 300 });

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

        // Check for print statement
        const printPattern = /print\(/;
        if (!printPattern.test(codeInput)) {
          throw new Error('Include a print statement inside the if block');
        }

        // Check indentation
        const lines = codeInput.split('\n');
        if (lines.length > 1 && !lines[1].startsWith('    ') && !lines[1].startsWith('\t')) {
          throw new Error('Remember to indent code inside the if statement (4 spaces)');
        }

        setIsCodeValid(true);
        setErrorMessage('');
        
        // Move robot when code is valid
        setRobotPosition({ x: 300, y: 300 });
        
      } catch (error) {
        setIsCodeValid(false);
        setErrorMessage(error.message);
        setRobotPosition({ x: 100, y: 300 });
      }
    };

    const timeout = setTimeout(validateCode, 500);
    return () => clearTimeout(timeout);
  }, [codeInput]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const drawScene = () => {
      // Clear canvas
      ctx.clearRect(0, 0, 400, 400);

      // Background
      ctx.fillStyle = '#3A5FAD';
      ctx.fillRect(0, 0, 400, 400);

      // Draw path
      ctx.fillStyle = '#8E2929';
      ctx.fillRect(0, 350, 400, 50);

      // Draw door
      ctx.fillStyle = isCodeValid ? '#4CD964' : '#8B4513';
      ctx.fillRect(350, 250, 30, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText('DOOR', 355, 300);

      // Draw robot
      ctx.fillStyle = '#4CD964';
      ctx.fillRect(robotPosition.x, robotPosition.y, 40, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(robotPosition.x + 5, robotPosition.y + 5, 10, 10);
      ctx.fillRect(robotPosition.x + 25, robotPosition.y + 5, 10, 10);
      
      // Draw condition status
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(isCodeValid ? 'Condition: TRUE ✅' : 'Condition: FALSE ❌', 200, 50);
    };

    drawScene();
  }, [isCodeValid, robotPosition]);

  const handleReset = () => {
    setCodeInput('');
    setIsCodeValid(false);
    setErrorMessage('');
    setRobotPosition({ x: 100, y: 300 });
  };

  return (
    <div className="game-container">
      <div className="layout-container">
        {/* Code Input Section */}
        <div className="coding-challenge">
          <h2>🤖 If Statement Challenge</h2>
          <div className="code-instruction">
            <p>Write Python if statements to help the robot reach the door!</p>
            <p>The robot moves when your if statement is correct.</p>
          </div>

          <div className="code-editor">
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={`# Example if statement:\nif door_open == True:\n    print("The door is open!")`}
              className={`code-input ${errorMessage ? 'error' : ''}`}
              spellCheck="false"
              rows={6}
            />
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {isCodeValid && (
              <div className="success-message">
                ✅ Great! Your if statement is correct. The robot can move!
              </div>
            )}
          </div>

          <div className="math-examples">
            <h4>If Statement Examples:</h4>
            <div className="examples-grid">
              <div className="example">
                <code>if age {'>'} 5:</code>
              </div>
              <div className="example">
                <code>if password == "secret":</code>
              </div>
              <div className="example">
                <code>if number % 2 == 0:</code>
              </div>
              <div className="example">
                <code>if door_open == True:</code>
              </div>
            </div>
          </div>

          <button onClick={handleReset} className="reset-button">
            Reset Robot
          </button>
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
              <p>✨ Write an if statement to move the robot!</p>
              <p>Example: <code>if door_open == True:</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConditionGame;