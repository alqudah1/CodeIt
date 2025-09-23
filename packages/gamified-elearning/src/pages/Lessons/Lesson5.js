import React from 'react'
import { useNavigate } from 'react-router-dom'
import './PythonLesson.css'

const Lesson5 = () => {
  const navigate = useNavigate()

  const goToDashboard = () => navigate('/MainPage')
  const goToQuiz = () => navigate('/quiz/6')

  return (
    <div className="python-lesson">
      <div className="lesson-wrapper">
        <button type="button" className="lesson-nav" onClick={goToDashboard}>
          ← Back to Dashboard
        </button>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 5</span>
            <h1>Lesson 5: Loops – Repeating Things</h1>
            <p className="lesson-subtitle">
              Discover how Python keeps the fun going by repeating actions without breaking a sweat.
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is a Loop?</h2>
            <p>Loops allow Python to repeat actions multiple times without writing the same code over and over.</p>
            <p>
              <strong>A for loop</strong> runs a set number of times.
            </p>
            <p>
              <strong>A while loop</strong> runs as long as a condition is true.
            </p>

            <div className="code-example">
              <h3>Example 1: Counting with a For Loop</h3>
              <pre>{`for i in range(5):
    print("I love Python!")`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>
I love Python!
I love Python!
I love Python!
I love Python!
I love Python!
                </pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Using a While Loop</h3>
              <pre>{`count = 1
while count <= 3:
    print("This is loop number", count)
    count += 1`}</pre>
              <div className="output">
                <h3>What you&apos;ll see:</h3>
                <pre>
This is loop number 1
This is loop number 2
This is loop number 3
                </pre>
              </div>
            </div>
          </div>

          <footer className="lesson-footer">
            <button type="button" className="quiz-button" onClick={goToQuiz}>
              Go to Quiz 5 🍨
            </button>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Lesson5