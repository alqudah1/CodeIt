import React from 'react'
import { useNavigate } from 'react-router-dom'
import './PythonLesson.css'

const Lesson1 = () => {
  const navigate = useNavigate()

  const goToDashboard = () => navigate('/MainPage')
  const goToQuiz = () => navigate('/quiz/2')

  return (
    <div className="python-lesson">
      <div className="lesson-wrapper">
        <button type="button" className="lesson-nav" onClick={goToDashboard}>
          ← Back to Dashboard
        </button>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 1</span>
            <h1>Lesson 1: What is Python? (Printing Text & Basics)</h1>
            <p className="lesson-subtitle">
              Kick off your coding adventure with friendly commands that say hello to the world.
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is Python?</h2>
            <p>
              Python is a computer language that helps us talk to computers. It is easy to learn and is used
              for making games, websites, and apps!
            </p>

            <h2>How Do We Talk to a Computer?</h2>
            <p>
              We use commands to give instructions. One important command is <code>print()</code>, which tells
              Python to show something on the screen.
            </p>

            <div className="code-example">
              <pre>{`print("Hello, Python!")`}</pre>
              <pre>{`print("I love coding!")`}</pre>
            </div>

            <div className="output">
              <h3>What you&apos;ll see:</h3>
              <pre>Hello, Python!</pre>
              <pre>I love coding!</pre>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge:</h3>
              <p>Change &quot;Hello, Python!&quot; to your own message and see what happens!</p>
            </div>
          </div>

          <footer className="lesson-footer">
            <button type="button" className="quiz-button" onClick={goToQuiz}>
              Go to Quiz 1 🍉
            </button>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Lesson1