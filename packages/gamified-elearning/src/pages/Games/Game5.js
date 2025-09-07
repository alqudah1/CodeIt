import React from 'react';
import { useNavigate } from 'react-router-dom';

const Game5 = () => {
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>Game 5 Content</h1>
      <button onClick={() => navigate('/MainPage')}>Back to Main</button>
    </div>
  );
};

export default Game5;