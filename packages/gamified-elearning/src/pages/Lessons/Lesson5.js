import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PythonLesson.css';

const Lesson5 = () => {
  const navigate = useNavigate(); // Hook for navigating between pages

  return (
    <div className="python-lesson">
      {/* Back button to return to the main page */}
      <button className="back-button" onClick={() => navigate('/MainPage')}>
        Back to Main
      </button>
      
      {/* Lesson title */}
      <h1>Lesson 5: Loops – Repeating Things</h1>

      <div className="lesson-content">
        {/* Introduction to loops */}
        <h2>What is a Loop?</h2>
        <p>Loops allow Python to repeat actions multiple times without writing the same code over and over.</p>
        <p>
          <strong>A for loop</strong> runs a set number of times.
        </p>
        <p>
          <strong>A while loop</strong> runs as long as a condition is true.
        </p>

        {/* First example: Using a for loop to repeat an action */}
        <div className="code-example">
          <h3>Example 1: Counting with a For Loop</h3>
          <pre>{`
for i in range(5):
    print("I love Python!")
          `}</pre>
          <div className="output">
            <h3>Output:</h3>
            <pre>
I love Python!
I love Python!
I love Python!
I love Python!
I love Python!
            </pre>
          </div>
        </div>

        {/* Second example: Using a while loop to repeat an action based on a condition */}
        <div className="code-example">
          <h3>Example 2: Using a While Loop</h3>
          <pre>{`
count = 1
while count <= 3:
    print("This is loop number", count)
    count += 1
          `}</pre>
          <div className="output">
            <h3>Output:</h3>
            <pre>
This is loop number 1
This is loop number 2
This is loop number 3
            </pre>
          </div>
        </div>

      </div>

      {/* Button to navigate to the quiz for Lesson 5 */}
      <button className="back-button" onClick={() => navigate('/quiz/6')}>
        Go to Quiz 5
      </button>
    </div>
  );
};

export default Lesson5;
