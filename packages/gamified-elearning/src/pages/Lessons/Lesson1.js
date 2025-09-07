import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PythonLesson.css';

const Lesson1 = () => {
  const navigate = useNavigate();
  
  return (
    <div className="python-lesson">
      {/* Back Button to navigate to MainPage */}
      <button className="back-button" onClick={() => navigate('/MainPage')}>Back to Main</button>
      
      {/* Lesson Title */}
      <h1>Lesson 1: What is Python? (Printing Text & Basics)</h1>
      
      <div className="lesson-content">
        {/* Introduction to Python */}
        <h2>What is Python?</h2>
        <p>Python is a computer language that helps us talk to computers. It is easy to learn and is used for making games, websites, and apps!</p>
        
        {/* Explanation of Commands */}
        <h2>How Do We Talk to a Computer?</h2>
        <p>We use commands to give instructions. One important command is <code>print()</code>, which tells Python to show something on the screen.</p>
        
        {/* Code Example Section */}
        <div className="code-example">
          <pre>{`print("Hello, Python!")`}</pre>
          <pre>{`print("I love coding!")`}</pre>
        </div>
        
        {/* Expected Output Section */}
        <div className="output">
          <h3>Output:</h3>
          <pre>Hello, Python! </pre>
          <pre> I love coding!</pre>
        </div>
        
        {/* Interactive Section - Encouraging users to try the code */}
        <div className="try-it">
          <h3>Try it Yourself:</h3>
          <p>Change "Hello, Python!" to your own message and see what happens!</p>
        </div>
      </div>
      
      {/* Button to navigate to Quiz 1 */}
      <button className="back-button" onClick={() => navigate('/quiz/2')}>Go to Quiz 1</button>
    </div>
  );
};

export default Lesson1;
