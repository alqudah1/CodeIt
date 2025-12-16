import React, { useEffect } from 'react';
import { getGameById, getGameLaunchUrl } from './gameCatalog';

const Game4 = () => {
  useEffect(() => {
    const game = getGameById('4');
    if (game) {
      window.location.href = getGameLaunchUrl(game, true);
    }
  }, []);

  const game = getGameById('4');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h2>Redirecting to Condition Game Master...</h2>
      <p>If you are not redirected automatically, <a href={getGameLaunchUrl(game, true)}>click here</a>.</p>
    </div>
  );
};

export default Game4;