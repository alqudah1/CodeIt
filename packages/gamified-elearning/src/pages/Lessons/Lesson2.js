import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PythonLesson.css';

const Lesson2 = () => {
  const navigate = useNavigate();
  
  return (
    <div className="python-lesson">
      {/* Back Button to navigate to MainPage */}
      <button className="back-button" onClick={() => navigate('/MainPage')}>Back to Main</button>
      
      {/* Lesson Title */}
      <h1>Lesson 2: Storing Information with Variables</h1>
      
      <div className="lesson-content">
        {/* Introduction to Variables */}
        <h2>What is a Variable?</h2>
        <p>A variable is like a box that stores information. You can use it to remember names, numbers, or messages.</p>
        
        {/* Code Example Section */}
        <div className="code-example">
          <pre>{`name = "Alex"`}</pre>
          <pre>{`age = 10`}</pre>
          <pre>{`print(name)`}</pre>
          <pre>{`print(age)`}</pre>
        </div>
        
        {/* Expected Output Section */}
        <div className="output">
          <h3>Output:</h3>
          <pre>Alex </pre>
          <pre>10 </pre>
        </div>
        
        {/* Interactive Section - Encouraging users to try modifying the code */}
        <div className="try-it">
          <h3>Try it Yourself:</h3>
          <p>Change "Alex" to your own name and run the code!</p>
        </div>
      </div>
      
      {/* Button to navigate to Quiz 2 */}
      <button className="back-button" onClick={() => navigate('/quiz/3')}>Go to Quiz 2</button>
    </div>
  );
};

export default Lesson2;
