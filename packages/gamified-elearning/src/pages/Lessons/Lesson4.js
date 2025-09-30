import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonEditor from '../pythoneditor/PythonEditor';
import Header from '../Header/Header'; 
import './PythonLesson.css';

const Lesson4 = () => {
  const navigate = useNavigate();
  const [lessonOutput, setLessonOutput] = useState(''); 

  const goToDashboard = () => navigate('/MainPage');
  const goToQuiz = () => navigate('/quiz/5');

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">
        <button type="button" className="lesson-nav" onClick={goToDashboard}>
          ← Back to Dashboard
        </button>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 4</span>
            <h1>Lesson 4: Making Decisions with If Statements</h1>
            <p className="lesson-subtitle">
              Learn how Python chooses different paths—just like picking your favorite summer adventure.
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is an &quot;If Statement&quot;?</h2>
            <p>
              An if statement allows the computer to make decisions based on conditions. It checks if something
              is true and runs the code only if the condition is met.
            </p>

            <div className="code-example">
              <h3>Example 1: Checking Age</h3>
              <pre>{`age = 10
if age > 5:
  print("You are older than 5!")`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>You are older than 5!</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Checking a Password</h3>
              <pre>{`password = "python123"
if password == "python123":
  print("Access Granted!")`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>Access Granted!</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change the password variable and see what happens.</p>
              <p>Use if and else to check if a number is even or odd.</p>
            </div>
            <PythonEditor initialCode='age = 10\nif age > 5:\n  print("You are older than 5!")' onOutput={setLessonOutput} />
            
          </div>

          <footer className="lesson-footer">
            <button type="button" className="quiz-button" onClick={goToQuiz}>
              Go to Quiz 4 🍋
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson4;