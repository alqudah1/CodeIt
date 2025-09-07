import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Quiz.css';

const Quiz = ({ quizId }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [xp, setXp] = useState(0);
  const studentId = 3;

  const quizIdMap = {
    '2': 1,
    '3': 2,
    '4': 3,
    '5': 4,
    '6': 5,
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/quiz/${quizId}/questions`);
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

        console.log('Response is an array with length:', response.data.length);

        if (response.data.length === 0) {
          console.log('No questions found');
          setFeedback('No questions found for this quiz.');
          return;
        }

        console.log('Transforming questions...');
        const transformedQuestions = response.data.map((q, index) => {
          console.log(`Processing question ${index + 1}:`, q);
          return {
            question_id: q.question_id,
            question: q.question_text || 'Question text missing',
            options: [
              q.option_a || '',
              q.option_b || '',
              q.option_c || '',
              q.option_d || ''
            ].filter(opt => opt !== ''),
            answer: q.correct_answer || 'Answer missing'
          };
        });
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
  }, [quizId]);

  const handleAnswerChange = async (selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: selectedOption
    }));

    try {
      const response = await axios.post('http://localhost:5000/api/quiz/submit', {
        studentId,
        questionId: questions[currentQuestion].question_id,
        answer: selectedOption,
      });

      setFeedback(response.data.isCorrect ? '✅ Correct!' : `❌ Incorrect. Correct answer: ${response.data.answer || 'not provided'}`);
      setXp(prevXp => prevXp + (response.data.xpEarned || 0));
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
  };

  const goToNext = () => {
    // Redirect to the single puzzle in Robot-puzzle app without query parameters
    //window.location.href = `http://localhost:3001/puzzle`;
    if (quizId === '2') {
      // Redirect to Robot Puzzle after Quiz 1
      window.location.href = `http://localhost:3001/puzzle`;
    } else if (quizId === '3') {
      // Redirect to Apple Game after Quiz 2
      window.location.href = `http://localhost:3001/apple-game`;
    } else {
      console.warn("Quiz ID not mapped for redirection.");
    }
  };

  if (questions.length === 0 && !feedback) {
    return <div className="quiz-container">Loading...</div>;
  }

  if (feedback && questions.length === 0) {
    return <div className="quiz-container">{feedback}</div>;
  }

  return (
    <div className="quiz-container">
      <h1 className="quiz-title">Quiz {quizIdMap[quizId]}</h1>
      <p>Total XP: {xp}</p>

      {score === null ? (
        <div className="question">
          <p>{currentQuestion + 1}. {questions[currentQuestion].question}</p>
          {questions[currentQuestion].options.map((option, i) => (
            <div key={i} className="answer-option">
              <input
                type="radio"
                id={`q${currentQuestion}-${i}`}
                name={`q${currentQuestion}`}
                value={option}
                onChange={() => handleAnswerChange(option)}
                checked={answers[currentQuestion] === option}
              />
              <label htmlFor={`q${currentQuestion}-${i}`}>{option}</label>
            </div>
          ))}

          {feedback && <p className="feedback">{feedback}</p>}

          <div className="quiz-buttons">
            {currentQuestion > 0 && (
              <button onClick={() => setCurrentQuestion(currentQuestion - 1)}>Previous</button>
            )}
            {currentQuestion < questions.length - 1 ? (
              <button onClick={nextQuestion}>Next</button>
            ) : (
              <button onClick={checkScore}>Submit Quiz</button>
            )}
          </div>
        </div>
      ) : (
        <div className="score">
          <p>Your score: {score} out of {questions.length}</p>
          <p>Total XP Earned: {xp}</p>
          <button onClick={goToNext}>
            Congrats on completing the quiz, Click here to enjoy your game!
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;