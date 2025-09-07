import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import MainPage from './pages/MainPage/MainPage';
import { Lesson1, Lesson2, Lesson3, Lesson4, Lesson5 } from './pages/Lessons';
//import { Quiz1, Quiz2, Quiz3, Quiz4, Quiz5} from './pages/Quizzes';
import Quiz from './pages/Quizzes/Quiz';
// Import useParams to get the quizId from the URL
import { useParams } from 'react-router-dom';
import { Game1, Game2, Game3, Game4, Game5 } from './pages/Games';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/MainPage" element={<MainPage />} />
        
        {/* Lesson Routes */}
        <Route path="/lesson/1" element={<Lesson1 />} />
        <Route path="/lesson/2" element={<Lesson2 />} />
        <Route path="/lesson/3" element={<Lesson3 />} />
        <Route path="/lesson/4" element={<Lesson4 />} />
        <Route path="/lesson/5" element={<Lesson5 />} />
        
        {/* Quiz Routes */}
        {/* <Route path="/quiz/1" element={<Quiz1 />} />
        <Route path="/quiz/2" element={<Quiz2 />} />
        <Route path="/quiz/3" element={<Quiz3 />} />
        <Route path="/quiz/4" element={<Quiz4 />} />
        <Route path="/quiz/5" element={<Quiz5 />} /> */}
        {/* Quiz Routes - Use a single dynamic route */}
        <Route path="/quiz/:quizId" element={<QuizWrapper />} />
        {/* Game Routes */}
        <Route path="/game/1" element={<Game1 />} />
        <Route path="/game/2" element={<Game2 />} />
        <Route path="/game/3" element={<Game3 />} />
        <Route path="/game/4" element={<Game4 />} />
        <Route path="/game/5" element={<Game5 />} />
      </Routes>
    </Router>
  );
};
const QuizWrapper = () => {
  const { quizId } = useParams();
  // Validate quizId (must be between 1 and 5)
  if (!['2', '3', '4', '5','6'].includes(quizId)) {
    return <div>Invalid Quiz ID</div>;
  }
  return <Quiz quizId={quizId} />;
};


export default App;