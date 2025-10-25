import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom'; // Added Navigate
import Home from './pages/Home/Home';
import MainPage from './pages/MainPage/MainPage';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { Lesson1, Lesson1Interactive, Lesson2, Lesson2Interactive, Lesson3, Lesson3Interactive, Lesson4, Lesson5 } from './pages/Lessons';
import Quiz from './pages/Quizzes/Quiz';
import { Game1, Game2, Game3, Game4, Game5 } from './pages/Games';
import Leaderboard from './pages/Leaderboard';
import { AuthContext } from './context/AuthContext';
import './App.css';

// Quiz Wrapper Component
const QuizWrapper = () => {
  const { quizId } = useParams();
  if (!['1', '2', '3', '4', '5'].includes(quizId)) {
    return <div>Invalid Quiz ID</div>;
  }
  return <Quiz quizId={quizId} />;
};

// Route Logger Component
const RouteLogger = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext) || {}; // Fallback to empty object
  useEffect(() => {
    console.log('Navigated to:', location.pathname, 'User:', JSON.stringify(user));
  }, [location]);
  return null; // No rendering, just logging
};

const App = () => {
  return (
    <AuthProvider>
      <ProgressProvider>
        <Router>
          {/* Place RouteLogger here, outside Routes but inside Router */}
          <RouteLogger />
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/MainPage" element={<MainPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          {/* Lesson Routes */}
          <Route path="/lesson/1" element={<Lesson1 />} />
          <Route path="/lesson/2" element={<Lesson2 />} />
          <Route path="/lesson/3" element={<Lesson3 />} />
          <Route path="/lesson/4" element={<Lesson4 />} />
          <Route path="/lesson/5" element={<Lesson5 />} />
          <Route path="/lesson/1interactive" element={<Lesson1Interactive />} />
          <Route path="/lesson/2interactive" element={<Lesson2Interactive />} />
          <Route path="/lesson/3interactive" element={<Lesson3Interactive />} />
          {/* Quiz Routes */}
          <Route path="/quiz/:quizId" element={<QuizWrapper />} />
          
          {/* Game Routes */}
          <Route path="/game/1" element={<Game1 />} />
          <Route path="/game/2" element={<Game2 />} />
          <Route path="/game/3" element={<Game3 />} />
          <Route path="/game/4" element={<Game4 />} />
          <Route path="/game/5" element={<Game5 />} />
          
          {/* Leaderboard Route */}
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} /> {/* Now works with import */}
          </Routes>
        </Router>
      </ProgressProvider>
    </AuthProvider>
  );
};

export default App;