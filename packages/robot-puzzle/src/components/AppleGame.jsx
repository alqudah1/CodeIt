import { useState, useEffect, useRef } from 'react';
import './GameStyles.css';

const AppleGame = () => {
  const canvasRef = useRef(null);
  const [applePos, setApplePos] = useState({ x: 0, y: 0 });
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [appleClicked, setAppleClicked] = useState(false);

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

  return (
    <div className="game-container">
      <div className="layout-container">
        {/* Code Input Section */}
        <div className="coding-challenge">
          <h2>🍎 Apple Position Challenge</h2>
          <div className="code-instruction">
            <p>Declare x and y coordinates to create the apple!</p>
            <p>Example: <code>x = 185</code> followed by <code>y = 310</code></p>
          </div>

          <div className="code-editor">
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={`# Python code here\nx = 185\ny = 310`}
              className={`code-input ${errorMessage ? 'error' : ''}`}
              spellCheck="false"
            />
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </div>
        </div>

        {/* Game Preview Section */}
        <div className="game-preview">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            style={{ display: isCodeValid ? 'block' : 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {!isCodeValid && (
            <div className="preview-placeholder">
              <p>✨ Write correct Python code to reveal the apple!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppleGame;