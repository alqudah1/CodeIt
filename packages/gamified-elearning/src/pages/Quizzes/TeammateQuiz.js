import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Quiz.css';
import { useAuth } from '../../context/AuthContext'; 
import { useProgress } from '../../context/ProgressContext';

const Quiz = ({ quizId }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); 
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [xp, setXp] = useState(0);
  const { isQuizUnlocked, isPuzzleUnlocked, markQuizComplete } = useProgress();

 
  useEffect(() => {
    console.log('Quiz.js - AuthContext user:', user);
  }, [user]);

 
  const studentId = user?.id;

  const quizNumber = parseInt(quizId);
  const quizUnlocked = typeof quizNumber === 'number' && isQuizUnlocked(quizNumber);

  useEffect(() => {
    if (!quizUnlocked) {
      return;
    }

    if (loading || !studentId) {
      setFeedback(loading ? 'Loading...' : 'Please log in to take the quiz.');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/quiz/${quizId}/questions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('API Response:', response);
        console.log('Response Data:', response.data);

        if (response.data.error) {
          console.log('Error in response:', response.data.error);
          setFeedback(response.data.error);
          return;
        }

        if (!Array.isArray(response.data)) {
          console.log('Response is not an array:', response.data);
          setFeedback('Invalid response from server: Expected an array');
          return;
        }

        if (response.data.length === 0) {
          console.log('No questions found');
          setFeedback('No questions found for this quiz.');
          return;
        }

        const transformedQuestions = response.data.map((q, index) => ({
          question_id: q.question_id,
          question: q.question_text || 'Question text missing',
          options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(opt => opt),
          answer: q.correct_answer || 'Answer missing',
        }));
        console.log('Transformed Questions:', transformedQuestions);
        setQuestions(transformedQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
        if (error.response) {
          console.error('Error Response:', error.response.data);
          setFeedback(`Failed to load quiz questions: ${error.response.data.error || 'Unknown error'}`);
        } else if (error.request) {
          console.error('No response received:', error.request);
          setFeedback('Failed to load quiz questions: Server did not respond (CORS issue?)');
        } else {
          console.error('Error setting up request:', error.message);
          setFeedback(`Failed to load quiz questions: ${error.message}`);
        }
      }
    };
    fetchQuestions();
  }, [quizId, studentId, loading, quizUnlocked]); 

  const handleAnswerChange = async (selectedOption) => {
    if (loading || !studentId) {
      setFeedback(loading ? 'Loading...' : 'Please log in to submit answers.');
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: selectedOption,
    }));

    try {
      const response = await axios.post(
        'http://localhost:8080/api/quiz/submit',
        {
          studentId,
          questionId: questions[currentQuestion].question_id,
          answer: selectedOption,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setFeedback(response.data.isCorrect ? '✅ Correct!' : `❌ Incorrect. Correct answer: ${response.data.answer || 'not provided'}`);
      setXp((prevXp) => prevXp + (response.data.xpEarned || 0));
    } catch (error) {
      console.error('Error submitting answer:', error);
      if (error.response) {
        console.error('Error Response:', error.response.data);
        setFeedback(`Error submitting answer: ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        setFeedback('Error submitting answer: Server did not respond');
      } else {
        console.error('Error setting up request:', error.message);
        setFeedback(`Error submitting answer: ${error.message}`);
      }
    }
  };

  const nextQuestion = () => {
    setCurrentQuestion((prev) => prev + 1);
    setFeedback('');
  };

  const checkScore = () => {
    const newScore = xp / 10; 
    setScore(newScore);
    if (quizNumber) {
      markQuizComplete(quizNumber);
    }
  };

  const goToNext = () => {
    if (!quizNumber) {
      console.warn('Quiz ID not mapped for puzzle navigation.');
      return;
    }

    if (!isPuzzleUnlocked(quizNumber)) {
      markQuizComplete(quizNumber);
    }

    navigate(`/puzzle/${quizNumber}`);
  };

  const renderShell = (content) => (
    <div className="quiz-page">
      <div className="quiz-card">
        <button
          type="button"
          className="quiz-back"
          onClick={() => navigate('/MainPage')}
        >
          ← Back to Dashboard
        </button>
        <header className="quiz-hero">
          <span className="quiz-pill">Quiz {quizNumber || quizId}</span>
          <h1>Rainbow Challenge {quizNumber || quizId}</h1>
          <p>Answer the sunny questions below to boost your XP and unlock puzzles.</p>
        </header>
        {content}
      </div>
    </div>
  );

  if (!quizNumber) {
    return renderShell(
      <div className="quiz-locked">
        <p>We couldn&apos;t find that quiz. Try heading back to your lessons.</p>
        <button type="button" className="quiz-cta" onClick={() => navigate('/lesson/1')}>
          Go to Lessons
        </button>
      </div>
    );
  }

  if (!quizUnlocked) {
    return renderShell(
      <div className="quiz-locked">
        <p>Finish Lesson {quizNumber} to unlock this quiz.</p>
        <button type="button" className="quiz-cta" onClick={() => navigate(`/lesson/${quizNumber}`)}>
          Back to Lesson {quizNumber}
        </button>
      </div>
    );
  }

  if (loading || !studentId) {
    return renderShell(
      <div className="quiz-status">{feedback || 'Loading...'}</div>
    );
  }

  if (questions.length === 0 && !feedback) {
    return renderShell(<div className="quiz-status">Loading questions...</div>);
  }

  if (feedback && questions.length === 0) {
    return renderShell(<div className="quiz-status">{feedback}</div>);
  }

  return renderShell(
    <section className="quiz-body">
      <div className="quiz-meta">
        <span className="quiz-xp">Total XP: {xp}</span>
        <span className="quiz-progress">Question {currentQuestion + 1} of {questions.length}</span>
      </div>

      {score === null ? (
        <article className="quiz-question">
          <h2>{questions[currentQuestion].question}</h2>
          <div className="quiz-options">
            {questions[currentQuestion].options.map((option, i) => (
              <label key={i} className={`quiz-option ${answers[currentQuestion] === option ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name={`q${currentQuestion}`}
                  value={option}
                  onChange={() => handleAnswerChange(option)}
                  checked={answers[currentQuestion] === option}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          {feedback && <p className="quiz-feedback">{feedback}</p>}

          <div className="quiz-actions">
            {currentQuestion > 0 && (
              <button type="button" className="quiz-tertiary" onClick={() => setCurrentQuestion(currentQuestion - 1)}>
                ← Previous
              </button>
            )}
            {currentQuestion < questions.length - 1 ? (
              <button type="button" className="quiz-secondary" onClick={nextQuestion}>
                Next →
              </button>
            ) : (
              <button type="button" className="quiz-primary" onClick={checkScore}>
                Submit Quiz
              </button>
            )}
          </div>
        </article>
      ) : (
        <article className="quiz-results">
          <h2>Great job!</h2>
          <p>Your score: <strong>{score}</strong> out of <strong>{questions.length}</strong></p>
          <p>Total XP Earned: <strong>{xp}</strong></p>
          <button type="button" className="quiz-primary" onClick={goToNext}>
            Continue to Puzzle {quizNumber}
          </button>
        </article>
      )}
    </section>
  );
};

export default Quiz;