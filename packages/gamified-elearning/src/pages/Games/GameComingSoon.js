import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getGameById } from './gameCatalog';

const GameComingSoon = ({ gameId }) => {
  const navigate = useNavigate();
  const game = getGameById(String(gameId));

  return (
    <div style={{
      minHeight: '100vh',
      background: game?.gradient || 'linear-gradient(135deg, #f8f4ff, #ffeedd)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Nunito', 'Arvo', sans-serif",
      textAlign: 'center',
      gap: '1.5rem',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '2rem',
        padding: '3rem 2.5rem',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.2rem',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(120deg, #ff7a59, #ffaf40)',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          borderRadius: '999px',
          padding: '0.35rem 1rem',
        }}>
          Coming Soon
        </div>

        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#1a214b', lineHeight: 1.2 }}>
          {game?.title || `Puzzle ${gameId}`}
        </h1>

        <p style={{ margin: 0, color: '#4a4f87', lineHeight: 1.6, fontSize: '1rem' }}>
          {game?.summary || 'This puzzle is being built and will be available soon!'}
        </p>

        <div style={{
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <span style={{
            background: 'rgba(0,0,0,0.07)',
            borderRadius: '999px',
            padding: '0.3rem 0.8rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#1a214b',
          }}>
            {game?.difficulty || 'Unknown'}
          </span>
          <span style={{
            background: 'rgba(0,0,0,0.07)',
            borderRadius: '999px',
            padding: '0.3rem 0.8rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#1a214b',
          }}>
            {game?.xpReward || 0} XP on launch
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/games')}
          style={{
            marginTop: '0.5rem',
            background: 'linear-gradient(135deg, #ff7a8a, #ffb4c0)',
            border: 'none',
            borderRadius: '999px',
            padding: '0.85rem 2rem',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 12px 24px rgba(255,122,140,0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 18px 32px rgba(255,122,140,0.38)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(255,122,140,0.3)';
          }}
        >
          ← Back to Puzzle Arcade
        </button>
      </div>
    </div>
  );
};

export default GameComingSoon;
