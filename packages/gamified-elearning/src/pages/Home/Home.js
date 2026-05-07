import { useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Header from '../Header/Header';
import './Home.css';

/* ── Station definitions ─────────────────────────────────────── */
const LARGE_STATIONS = [
  {
    id:     'game',
    label:  'Game Zone',
    action: 'Build a playable game',
    icon:   '🎮',
    bg:     '#FF7A00',
    textColor: '#fff',
    route:  '/builder?type=game',
    guestOk: true,
  },
  {
    id:     'website',
    label:  'Website Lab',
    action: 'Build a real website',
    icon:   '🌐',
    bg:     '#FF8E6E',
    textColor: '#1F2937',
    route:  '/builder?type=website',
    guestOk: true,
  },
];

const SMALL_STATIONS = [
  {
    id:      'ai',
    label:   'AI Playground',
    action:  'Experiment freely',
    icon:    '🤖',
    bg:      'rgba(184,242,208,0.55)',
    border:  'rgba(184,242,208,0.9)',
    textColor: '#1F2937',
    route:   '/builder',
    guestOk: true,
  },
  {
    id:      'creations',
    label:   'My Creations',
    action:  'Your saved projects',
    icon:    '📁',
    bg:      'rgba(255,255,255,0.80)',
    border:  'rgba(255,122,0,0.20)',
    textColor: '#1F2937',
    route:   '/builder?view=projects',
    guestOk: false,
  },
  {
    id:      'learn',
    label:   'Learn Arcade',
    action:  'Level up your skills',
    icon:    '🎓',
    bg:      'rgba(255,122,0,0.09)',
    border:  'rgba(255,122,0,0.22)',
    textColor: '#1F2937',
    route:   '/lessons',
    guestOk: true,
  },
  {
    id:      'avatar',
    label:   'Avatar Room',
    action:  'Dress up your coder',
    icon:    '🧑‍🚀',
    bg:      'rgba(255,142,110,0.14)',
    border:  'rgba(255,142,110,0.35)',
    textColor: '#1F2937',
    route:   '/character',
    guestOk: true,
  },
];

/* ── Station card — large (primary creation zones) ────────────── */
const LargeStation = ({ station, onEnter }) => {
  const [pressing, setPressing] = useState(false);

  const handleClick = useCallback(() => {
    setPressing(true);
    setTimeout(() => onEnter(station), 160);
  }, [station, onEnter]);

  return (
    <button
      className={`lobby-station lobby-station--large${pressing ? ' is-pressing' : ''}`}
      style={{ background: station.bg, color: station.textColor }}
      onClick={handleClick}
      aria-label={`Enter ${station.label}`}
    >
      <span className="lobby-station__icon">{station.icon}</span>
      <div className="lobby-station__copy">
        <span className="lobby-station__label">{station.label}</span>
        <span className="lobby-station__action">{station.action}</span>
      </div>
      <span className="lobby-station__arrow" aria-hidden="true">→</span>
    </button>
  );
};

/* ── Station card — small (support areas) ─────────────────────── */
const SmallStation = ({ station, onEnter, user }) => {
  const [pressing, setPressing] = useState(false);
  const navigate = useNavigate();

  const requiresLogin = !station.guestOk && !user;

  const handleClick = useCallback(() => {
    if (requiresLogin) { navigate('/register'); return; }
    setPressing(true);
    setTimeout(() => onEnter(station), 160);
  }, [station, onEnter, requiresLogin, navigate]);

  return (
    <button
      className={`lobby-station lobby-station--small${pressing ? ' is-pressing' : ''}`}
      style={{
        background:   station.bg,
        borderColor:  station.border,
        color:        station.textColor,
      }}
      onClick={handleClick}
      aria-label={requiresLogin ? `Sign up to access ${station.label}` : `Enter ${station.label}`}
    >
      <span className="lobby-station__icon lobby-station__icon--sm">{station.icon}</span>
      <span className="lobby-station__label">{station.label}</span>
      <span className="lobby-station__action lobby-station__action--sm">
        {requiresLogin ? 'Sign up to save' : station.action}
      </span>
    </button>
  );
};

/* ── Main lobby ────────────────────────────────────────────────── */
export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleEnter = useCallback((station) => {
    navigate(station.route);
  }, [navigate]);

  const greeting = user
    ? `Hey ${user.name || 'Coder'}! What are you building today?`
    : 'Welcome to CodeIt! Pick a station to start creating.';

  return (
    <>
      <Header />
      <div className="lobby">

        {/* ── Welcome bar ─────────────────────────────────────── */}
        <div className="lobby__welcome">
          <div className="lobby__welcome-inner">
            <div className="lobby__avatar-dot" aria-hidden="true" />
            <p className="lobby__greeting">{greeting}</p>
            {!user && (
              <button
                className="lobby__signup-nudge"
                onClick={() => navigate('/register')}
              >
                Sign up free
              </button>
            )}
          </div>
        </div>

        {/* ── Stations grid ───────────────────────────────────── */}
        <main className="lobby__grid" aria-label="Creative stations">

          {/* Large — primary creation */}
          {LARGE_STATIONS.map(s => (
            <LargeStation key={s.id} station={s} onEnter={handleEnter} />
          ))}

          {/* Small — support stations */}
          {SMALL_STATIONS.map(s => (
            <SmallStation key={s.id} station={s} onEnter={handleEnter} user={user} />
          ))}

        </main>

      </div>
    </>
  );
}
