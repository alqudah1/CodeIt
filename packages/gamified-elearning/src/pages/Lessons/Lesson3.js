import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PythonLesson.css';

const Lesson3 = () => {
  const navigate = useNavigate(); // Hook for navigating between pages

  return (
    <div className="python-lesson">
      {/* Back button to return to the main page */}
      <button className="back-button" onClick={() => navigate('/MainPage')}>
        Back to Main
      </button>
      
      {/* Lesson title */}
      <h1>Lesson 3: Doing Math with Python</h1>
      
      <div className="lesson-content">
        {/* Introduction to using Python for math */}
        <h2>Python as a Calculator</h2>
        <p>Python can do many types of math operations, just like a calculator!</p>
        
        {/* Table displaying different math operations in Python */}
        <div className="math-table">
          <table>
            <thead>
              <tr>
                <th>Operation</th>
                <th>Symbol</th>
                <th>Example</th>
                <th>Answer</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Addition</td><td>+</td><td>5 + 3</td><td>8</td></tr>
              <tr><td>Subtraction</td><td>-</td><td>10 - 2</td><td>8</td></tr>
              <tr><td>Multiplication</td><td>*</td><td>4 * 2</td><td>8</td></tr>
              <tr><td>Division</td><td>/</td><td>16 / 4</td><td>4.0</td></tr>
              <tr><td>Integer Division</td><td>//</td><td>17 // 3</td><td>5</td></tr>
              <tr><td>Exponent</td><td>**</td><td>2 ** 3</td><td>8</td></tr>
              <tr><td>Modulus</td><td>%</td><td>10 % 3</td><td>1</td></tr>
            </tbody>
          </table>
        </div>
        
        {/* Section encouraging students to try math operations in Python */}
        <div className="try-it">
          <h3>Try it Yourself!</h3>
          <p>Change the numbers in the examples and see what happens!</p>
          <p>Try using **, %, and // in different ways.</p>
        </div>
      </div>

      {/* Button to navigate to the quiz for Lesson 3 */}
      <button className="back-button" onClick={() => navigate('/quiz/4')}>
        Go to Quiz 3
      </button>
    </div>
  );
};

export default Lesson3;
