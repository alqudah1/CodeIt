import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonEditor from '../pythoneditor/PythonEditor';
import Header from '../Header/Header'; 
import './PythonLesson.css';

const Lesson2 = () => {
  const navigate = useNavigate();
  const [lessonOutput, setLessonOutput] = useState(''); 

  const goToDashboard = () => navigate('/MainPage');
  const goToQuiz = () => navigate('/quiz/3');

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">
        <button type="button" className="lesson-nav" onClick={goToDashboard}>
          ← Back to Dashboard
        </button>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 2</span>
            <h1>Lesson 2: Storing Information with Variables</h1>
            <p className="lesson-subtitle">
              Discover how to save names, favorite numbers, and secret messages inside magical Python boxes.
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is a Variable?</h2>
            <p>
              A variable is like a box that stores information. You can use it to remember names, numbers, or
              messages.
            </p>

            <div className="code-example">
              <pre>{`name = "Alex"`}</pre>
              <pre>{`age = 10`}</pre>
              <pre>{`print(name)`}</pre>
              <pre>{`print(age)`}</pre>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change &quot;Alex&quot; to your own name and run the code!</p>
            </div>
            <PythonEditor initialCode='name = "Alex"\nage = 10\nprint(name)\nprint(age)' onOutput={setLessonOutput} />
            
          </div>

          <footer className="lesson-footer">
            <button type="button" className="quiz-button" onClick={goToQuiz}>
              Go to Quiz 2 🍓
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson2;