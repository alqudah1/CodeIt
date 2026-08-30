import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { getGameById, getGameRoute } from './gameCatalog';

/**
 * GameGate — checks that quiz N is complete before launching puzzle N.
 * If the quiz is not complete, shows a prompt to go take it.
 * If the quiz is complete, redirects to the game URL immediately.
 */
const GameGate = ({ gameId }) => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed]   = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(ENDPOINTS.quiz.progress, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const completed = (data.completedQuizzes || []).map(Number);
          if (completed.includes(Number(gameId))) {
            setAllowed(true);
          }
        }
      } catch (_) {
        // Fail open — don't block on network error
        setAllowed(true);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [gameId, user, token, authLoading, navigate]);

  // Navigate to challenge once allowed
  useEffect(() => {
    if (!allowed) return;
    const game  = getGameById(String(gameId));
    const route = getGameRoute(game);
    if (route) {
      navigate(route);
    } else {
      navigate('/games');
    }
  }, [allowed, gameId, navigate]);

  /* ── loading ── */
  if (checking || authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.sub}>Checking progress...</p>
        </div>
      </div>
    );
  }

  /* ── gate: quiz not yet complete ── */
  if (!allowed) {
    const game = getGameById(String(gameId));
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Complete Quiz {gameId} first</h2>
          <p style={styles.sub}>
            Finish Quiz {gameId} to unlock{game ? ` "${game.title}"` : ' this puzzle'}.
          </p>
          <div style={styles.actions}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => navigate(`/quiz/${gameId}`)}
            >
              Go to Quiz {gameId}
            </button>
            <button
              style={styles.btn}
              onClick={() => navigate('/games')}
            >
              Back to Puzzles
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── redirecting ── */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.sub}>Launching puzzle...</p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fef6ec 100%)',
    padding: '2rem',
    fontFamily: "'Nunito', 'Trebuchet MS', sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.92)',
    borderRadius: '1.5rem',
    padding: '3rem 2.5rem',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 48px rgba(59, 42, 34,0.12)',
    textAlign: 'center',
    backdropFilter: 'blur(12px)',
  },
  heading: {
    margin: '0 0 0.75rem',
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#3B2A22',
  },
  sub: {
    margin: '0 0 1.5rem',
    color: '#4a5568',
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  btn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: '1.5px solid rgba(255,138,61,0.22)',
    background: 'rgba(255,255,255,0.8)',
    color: '#3B2A22',
    fontFamily: "'Nunito', 'Trebuchet MS', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  btnPrimary: {
    background: 'linear-gradient(120deg, #FF8A3D, #FFD166)',
    border: 'none',
    boxShadow: '0 8px 24px rgba(255,138,61,0.30)',
  },
};

export default GameGate;
