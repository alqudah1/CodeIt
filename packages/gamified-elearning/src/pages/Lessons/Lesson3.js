import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonEditor from '../pythoneditor/PythonEditor';
import Header from '../Header/Header'; 
import './PythonLesson.css';

const Lesson3 = () => {
  const navigate = useNavigate();
  const [lessonOutput, setLessonOutput] = useState('');

  const goToDashboard = () => navigate('/MainPage');
  const goToQuiz = () => navigate('/quiz/4');

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">
        <button type="button" className="lesson-nav" onClick={goToDashboard}>
          ← Back to Dashboard
        </button>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 3</span>
            <h1>Lesson 3: Doing Math with Python</h1>
            <p className="lesson-subtitle">
              Turn Python into your summer calculator and explore how numbers dance together.
            </p>
          </header>

          <div className="lesson-content">
            <h2>Python as a Calculator</h2>
            <p>Python can do many types of math operations, just like a calculator!</p>

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
                  <tr>
                    <td>Addition</td>
                    <td>+</td>
                    <td>5 + 3</td>
                    <td>8</td>
                  </tr>
                  <tr>
                    <td>Subtraction</td>
                    <td>-</td>
                    <td>10 - 2</td>
                    <td>8</td>
                  </tr>
                  <tr>
                    <td>Multiplication</td>
                    <td>*</td>
                    <td>4 * 2</td>
                    <td>8</td>
                  </tr>
                  <tr>
                    <td>Division</td>
                    <td>/</td>
                    <td>16 / 4</td>
                    <td>4.0</td>
                  </tr>
                  <tr>
                    <td>Integer Division</td>
                    <td>//</td>
                    <td>17 // 3</td>
                    <td>5</td>
                  </tr>
                  <tr>
                    <td>Exponent</td>
                    <td>**</td>
                    <td>2 ** 3</td>
                    <td>8</td>
                  </tr>
                  <tr>
                    <td>Modulus</td>
                    <td>%</td>
                    <td>10 % 3</td>
                    <td>1</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change the numbers in the examples and see what happens!</p>
              <p>Try using **, %, and // in different ways.</p>
            </div>
            <PythonEditor initialCode='print(5 + 3)\nprint(10 - 2)\nprint(4 * 2)\nprint(16 / 4)' onOutput={setLessonOutput} />
           
          </div>

          <footer className="lesson-footer">
            <button type="button" className="quiz-button" onClick={goToQuiz}>
              Go to Quiz 3 🍍
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson3;