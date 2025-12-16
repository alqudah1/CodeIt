import React, { useEffect } from 'react';
import { getGameById, getGameLaunchUrl } from './gameCatalog';

const Game5 = () => {
  useEffect(() => {
    const game = getGameById('5');
    if (game) {
      window.location.href = getGameLaunchUrl(game, true);
    }
  }, []);

  const game = getGameById('5');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h2>Redirecting to Loop Game Challenge...</h2>
      <p>If you are not redirected automatically, <a href={getGameLaunchUrl(game, true)}>click here</a>.</p>
    </div>
  );
};

export default Game5;