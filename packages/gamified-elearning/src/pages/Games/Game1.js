import React from 'react';
import { useNavigate } from 'react-router-dom';

const Game1 = () => {
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>Game 1 Content</h1>
      <button onClick={() => navigate('/MainPage')}>Back to Main</button>
    </div>
  );
};

export default Game1;