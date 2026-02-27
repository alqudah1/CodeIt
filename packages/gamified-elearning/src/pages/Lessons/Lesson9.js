import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonEditor from '../pythoneditor/PythonEditor';
import Header from '../Header/Header';
import './PythonLesson.css';
import {
  trackStaticLessonCompletion,
  showXPNotification,
  initializeTimeTracker,
  autoTrackDailyLogin,
  showLessonLockedToast
} from '../../utils/progressTracker';
import { useProgress } from '../../context/ProgressContext';

const Lesson9 = () => {
  const navigate = useNavigate();
  const { markLessonComplete } = useProgress();
  const [lessonOutput, setLessonOutput] = useState('');
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);

  const [lessonProgress, setLessonProgress] = useState({
    hasRunCode: false,
    hasModifiedCode: false,
    hasSeenOutput: false,
    hasCompletedChallenge: false
  });

  useEffect(() => { autoTrackDailyLogin(); }, []);

  const isLessonEligibleForCompletion = () =>
    lessonProgress.hasRunCode || lessonProgress.hasModifiedCode ||
    lessonProgress.hasSeenOutput || lessonProgress.hasCompletedChallenge;

  const handleCodeOutput = (output) => {
    setLessonOutput(output);
    const defaultOutput = 'Buddy says: Woof!\nBuddy is a dog aged 3';
    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasSeenOutput: output.length > 0,
      hasModifiedCode: output !== defaultOutput && output.length > 0,
      hasCompletedChallenge: output.length > 0 && output !== defaultOutput,
    };
    setLessonProgress(newProgress);
    if ((newProgress.hasRunCode || newProgress.hasModifiedCode) && !isCompleted && !hasMarkedComplete) {
      markLessonComplete(9);
      setHasMarkedComplete(true);
    }
  };

  const goToQuiz = async () => {
    if (!isLessonEligibleForCompletion()) { showLessonLockedToast(9); return; }
    if (!isCompleted) {
      try {
        const result = await trackStaticLessonCompletion(9);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(9);
        setIsCompleted(true);
      } catch (error) { console.error('Error tracking lesson completion:', error); }
    }
    navigate('/quiz/9', { state: { source: 'lesson', lessonId: 9 } });
  };

  return (
    <div className="python-lesson">
      <Header />
      <div className="lesson-wrapper">
        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 9</span>
            <h1>Lesson 9: Object-Oriented Programming</h1>
            <p className="lesson-subtitle">
              Learn how to build your own custom objects in Python — like creating blueprints for anything you can imagine!
            </p>
          </header>

          <div className="lesson-content">
            <h2>What is a Class?</h2>
            <p>
              A <strong>class</strong> is a blueprint for creating objects. Think of it like a cookie cutter — you
              define the shape once, then make as many cookies (objects) as you like!
            </p>
            <p>
              An <strong>object</strong> is an instance of a class — it has its own data (attributes) and actions (methods).
            </p>

            <div className="code-example">
              <h3>Example 1: Creating Your First Class</h3>
              <pre>{`class Dog:
    def __init__(self, name, breed, age):
        self.name = name
        self.breed = breed
        self.age = age

    def speak(self):
        print(f"{self.name} says: Woof!")

# Create an object (instance) of Dog
my_dog = Dog("Buddy", "dog", 3)
my_dog.speak()
print(f"{my_dog.name} is a {my_dog.breed} aged {my_dog.age}")`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`Buddy says: Woof!\nBuddy is a dog aged 3`}</pre>
              </div>
            </div>

            <div className="code-example">
              <h3>Example 2: Inheritance (Classes Sharing Powers!)</h3>
              <pre>{`class Animal:
    def __init__(self, name):
        self.name = name

    def eat(self):
        print(f"{self.name} is eating.")

class Cat(Animal):   # Cat inherits from Animal
    def speak(self):
        print(f"{self.name} says: Meow!")

kitty = Cat("Luna")
kitty.eat()    # Inherited from Animal
kitty.speak()  # Cat's own method`}</pre>
              <div className="output">
                <h3>What you'll see:</h3>
                <pre>{`Luna is eating.\nLuna says: Meow!`}</pre>
              </div>
            </div>

            <div className="try-it">
              <h3>Your sunny challenge 🌟</h3>
              <p>Change the dog's name to your favourite pet name. Add a new method <code>fetch()</code> that prints <code>"[name] fetched the ball!"</code>.</p>
              <p>Try creating two different Dog objects with different names!</p>
            </div>

            <PythonEditor
              initialCode={`class Dog:\n    def __init__(self, name, breed, age):\n        self.name = name\n        self.breed = breed\n        self.age = age\n\n    def speak(self):\n        print(f"{self.name} says: Woof!")\n\nmy_dog = Dog("Buddy", "dog", 3)\nmy_dog.speak()\nprint(f"{my_dog.name} is a {my_dog.breed} aged {my_dog.age}")`}
              onOutput={handleCodeOutput}
            />
          </div>

          <div className="progress-indicator" style={{ background: '#f8f9fa', border: '2px solid #e9ecef', borderRadius: '10px', padding: '20px', margin: '20px 0', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Your Progress</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
              {[['Run Code', 'hasRunCode'], ['Modify Code', 'hasModifiedCode'], ['See Output', 'hasSeenOutput'], ['Challenge', 'hasCompletedChallenge']].map(([label, key]) => (
                <div key={key} style={{ padding: '8px 12px', borderRadius: '20px', backgroundColor: lessonProgress[key] ? '#4ecca3' : '#e9ecef', color: lessonProgress[key] ? 'white' : '#6c757d', fontSize: '14px', fontWeight: 'bold' }}>
                  {lessonProgress[key] ? '✅' : '⭕'} {label}
                </div>
              ))}
            </div>
            <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#6c757d' }}>Complete any one activity above to unlock the quiz!</p>
          </div>

          {isLessonEligibleForCompletion() && !isCompleted && (
            <div className="completion-status" style={{ background: 'linear-gradient(135deg, #4ecca3, #2e9c81)', color: 'white', padding: '15px', borderRadius: '10px', margin: '20px 0', textAlign: 'center', boxShadow: '0 4px 15px rgba(78, 204, 163, 0.3)' }}>
              <h3>🎉 Great Progress!</h3>
              <p>You've completed enough activities to proceed to the quiz!</p>
            </div>
          )}

          <footer className="lesson-footer">
            <button
              type="button"
              className="quiz-button"
              onClick={goToQuiz}
              style={{ backgroundColor: isCompleted ? '#2e9c81' : isLessonEligibleForCompletion() ? '#4ecca3' : '#cccccc', opacity: isCompleted ? 0.8 : 1, cursor: isLessonEligibleForCompletion() ? 'pointer' : 'not-allowed' }}
            >
              {isCompleted ? '✅ Lesson Completed — Quiz 9 🏗️' : isLessonEligibleForCompletion() ? 'Take Quiz 9 — OOP 🏗️' : 'Complete an activity to unlock quiz'}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Lesson9;
