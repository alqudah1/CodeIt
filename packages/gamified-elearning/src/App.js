import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom'; // Added Navigate
import { USE_ARTISTIC_HOMEPAGE } from './featureFlags';
import HomeOld from './legacy/HomeOld';
import Home from './pages/Home/Home';
import Builder from './pages/Builder/Builder';
import Playground from './pages/Playground/Playground';
import MainPage from './pages/MainPage/MainPage';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { CharacterProvider } from './context/CharacterContext';
import { Lesson1, Lesson1Interactive, Lesson2, Lesson2Interactive, Lesson3, Lesson3Interactive, Lesson4, Lesson4Interactive, Lesson5, Lesson5Interactive, Lesson6, Lesson6Interactive, Lesson7, Lesson7Interactive, Lesson8, Lesson8Interactive, Lesson9, Lesson9Interactive, Lesson10, Lesson10Interactive, LessonMap } from './pages/Lessons';
import Quiz from './pages/Quizzes/Quiz';
import { Game1, Game2, Game3, Game4, Game5, Game6, Game7, Game8, Game9, Game10, GameHub } from './pages/Games';
import CharacterLab from './pages/CharacterLab/CharacterLab';
import Leaderboard from './pages/Leaderboard';
import { AuthContext } from './context/AuthContext';
import './App.css';

const ActiveHome = USE_ARTISTIC_HOMEPAGE ? Home : HomeOld;

// Quiz Wrapper Component
const QuizWrapper = () => {
  const { quizId } = useParams();
  if (!['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(quizId)) {
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
        <CharacterProvider>
          <Router>
            {/* Place RouteLogger here, outside Routes but inside Router */}
            <RouteLogger />
            <Routes>
          <Route path="/" element={<ActiveHome />} />
          <Route path="/MainPage" element={<MainPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          {/* Lesson Map route */}
          <Route path="/lessons" element={<LessonMap />} />

          {/* Lesson Routes - All using Interactive versions */}
          <Route path="/lesson/1" element={<Lesson1Interactive />} />
          <Route path="/lesson/2" element={<Lesson2Interactive />} />
          <Route path="/lesson/3" element={<Lesson3Interactive />} />
          <Route path="/lesson/4" element={<Lesson4Interactive />} />
          <Route path="/lesson/5" element={<Lesson5Interactive />} />
          <Route path="/lesson/6" element={<Lesson6Interactive />} />
          <Route path="/lesson/7" element={<Lesson7Interactive />} />
          <Route path="/lesson/8" element={<Lesson8Interactive />} />
          <Route path="/lesson/9" element={<Lesson9Interactive />} />
          <Route path="/lesson/10" element={<Lesson10Interactive />} />
          {/* Quiz Routes */}
          <Route path="/quiz/:quizId" element={<QuizWrapper />} />
          
          {/* Game Routes */}
          <Route path="/games" element={<GameHub />} />
          <Route path="/game/1"  element={<Game1  />} />
          <Route path="/game/2"  element={<Game2  />} />
          <Route path="/game/3"  element={<Game3  />} />
          <Route path="/game/4"  element={<Game4  />} />
          <Route path="/game/5"  element={<Game5  />} />
          <Route path="/game/6"  element={<Game6  />} />
          <Route path="/game/7"  element={<Game7  />} />
          <Route path="/game/8"  element={<Game8  />} />
          <Route path="/game/9"  element={<Game9  />} />
          <Route path="/game/10" element={<Game10 />} />
          
          {/* Builder + Playground */}
          <Route path="/builder"    element={<Builder />} />
          <Route path="/playground" element={<Playground />} />

          {/* Character Lab Route */}
          <Route path="/character" element={<CharacterLab />} />
          
          {/* Leaderboard Route */}
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} /> {/* Now works with import */}
          </Routes>
        </Router>
        </CharacterProvider>
      </ProgressProvider>
    </AuthProvider>
  );
};

export default App;