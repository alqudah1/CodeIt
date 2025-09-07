import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PythonLesson.css';

const Lesson4 = () => {
  const navigate = useNavigate(); // Hook for navigating between pages

  return (
    <div className="python-lesson">
      {/* Back button to return to the main page */}
      <button className="back-button" onClick={() => navigate('/MainPage')}>
        Back to Main
      </button>
      
      {/* Lesson title */}
      <h1>Lesson 4: Making Decisions with If Statements</h1>
      
      <div className="lesson-content">
        {/* Explanation of If Statements */}
        <h2>What is an "If Statement"?</h2>
        <p>An if statement allows the computer to make decisions based on conditions. It checks if something is true and runs the code only if the condition is met.</p>
        
        {/* First example: Using an if statement to check age */}
        <div className="code-example">
          <h3>Example 1: Checking Age</h3>
          <pre>{`age = 10\nif age > 5:\n  print("You are older than 5!")`}</pre>
          <div className="output">
            <h3>Output:</h3>
            <pre>You are older than 5!</pre>
          </div>
        </div>
        
        {/* Second example: Using an if statement to check a password */}
        <div className="code-example">
          <h3>Example 2: Checking a Password</h3>
          <pre>{`password = "python123"\nif password == "python123":\n  print("Access Granted!")`}</pre>
          <div className="output">
            <h3>Output:</h3>
            <pre>Access Granted!</pre>
          </div>
        </div>
        
        {/* Encouraging students to try modifying the code */}
        <div className="try-it">
          <h3>Try it Yourself!</h3>
          <p>Change the password variable and see what happens.</p>
          <p>Use if and else to check if a number is even or odd.</p>
        </div>
      </div>

      {/* Button to navigate to the quiz for Lesson 4 */}
      <button className="back-button" onClick={() => navigate('/quiz/5')}>
        Go to Quiz 4
      </button>
    </div>
  );
};

export default Lesson4;
