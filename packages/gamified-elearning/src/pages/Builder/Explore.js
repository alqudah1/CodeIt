import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../Header/Header';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import { journeyHeaders } from '../../utils/journey';
import './Explore.css';

// ── helpers ──────────────────────────────────────────────────────
const TYPE_LABEL = {
  game: 'Game', clicker: 'Clicker', runner: 'Runner', memory: 'Memory',
  reaction: 'Reaction', soccer: 'Soccer', platformer: 'Platformer',
  dodge: 'Dodge', racing: 'Racing', typing: 'Typing', tower: 'Tower',
  maze: 'Maze', survival: 'Survival', puzzle: 'Puzzle',
  basketball: 'Basketball', cooking: 'Cooking',
  quiz: 'Quiz', website: 'Website', portfolio: 'Portfolio',
  restaurant: 'Restaurant', shop: 'Shop', sports: 'Sports',
  blog: 'Blog', landing: 'Landing', tool: 'Tool',
};

function typeCategory(t = '') {
  const tl = t.toLowerCase();
  if (['quiz'].includes(tl)) return 'quiz';
  if (['website','portfolio','restaurant','shop','sports','blog','landing'].includes(tl)) return 'web';
  if (['tool'].includes(tl)) return 'tool';
  return 'game';
}

function CreatorBubble({ name = 'C', creator }) {
  const initial = (name || 'C')[0].toUpperCase();
  const colors = ['#FF7A00','#A855F7','#06B6D4','#10B981','#EC4899','#F59E0B'];
  const idx = initial.charCodeAt(0) % colors.length;
  return (
    <span className="exp-creator-bubble" style={{ background: colors[idx] }}>
      {initial}
    </span>
  );
}

function StatBadge({ icon, count }) {
  return (
    <span className="exp-stat">
      <span className="exp-stat__icon">{icon}</span>
      <span className="exp-stat__count">{count >= 1000 ? `${(count/1000).toFixed(1)}k` : count}</span>
    </span>
  );
}

function ProjectCard({ project, onLike, onRemix, remixingId }) {
  const navigate = useNavigate();
  const cat = typeCategory(project.projectType);

  return (
    <article className={`exp-card exp-card--${cat}`}>
      {/* Thumbnail */}
      <div
        className="exp-card__thumb"
        style={{ '--pc': project.primaryColor, '--ac': project.accentColor }}
        onClick={() => navigate(`/project/${project.publicId}`)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate(`/project/${project.publicId}`)}
        aria-label={`Play ${project.title}`}
      >
        <span className="exp-card__type-badge">
          {TYPE_LABEL[project.projectType] || project.projectType || 'Project'}
        </span>
        <span className="exp-card__thumb-title">{project.title}</span>
        {!project.isShowcase && (
          <button
            className={`exp-card__heart${project.liked ? ' exp-card__heart--liked' : ''}`}
            onClick={e => { e.stopPropagation(); onLike(project); }}
            aria-label={project.liked ? 'Unlike' : 'Like'}
          >
            {project.liked ? '♥' : '♡'}
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="exp-card__meta">
        <p className="exp-card__title">{project.title}</p>
        <div className="exp-card__creator">
          <CreatorBubble name={project.creatorName} creator={project.creator} />
          <span className="exp-card__creator-name">{project.creatorName}</span>
        </div>
        <div className="exp-card__stats">
          <StatBadge icon="▶" count={project.plays} />
          {!project.isShowcase && <StatBadge icon="♥" count={project.likes} />}
          <StatBadge icon="⤴" count={project.remixes} />
        </div>
      </div>

      {/* Actions */}
      <div className="exp-card__actions">
        <Link
          to={`/project/${project.publicId}`}
          className="exp-btn exp-btn--play"
        >
          Play
        </Link>
        <button
          className="exp-btn exp-btn--remix"
          onClick={() => onRemix(project)}
          disabled={remixingId === project.publicId}
        >
          {remixingId === project.publicId ? 'Remixing...' : 'Remix'}
        </button>
      </div>
    </article>
  );
}

function Section({ title, projects, onLike, onRemix, remixingId, emptyMsg }) {
  return (
    <section className="exp-section">
      <div className="exp-section__header">
        <h2 className="exp-section__title">{title}</h2>
      </div>
      {projects.length === 0 ? (
        <p className="exp-section__empty">{emptyMsg}</p>
      ) : (
        <div className="exp-grid">
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onLike={onLike}
              onRemix={onRemix}
              remixingId={remixingId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Main Explore Page ─────────────────────────────────────────────
export default function Explore() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [activeTab,  setActiveTab]  = useState('trending');
  const [remixingId, setRemixingId] = useState(null);
  const [toast,      setToast]      = useState('');

  useSEO({
    title: 'Student Coding Projects: Play, Remix & Learn | CodeIt',
    description: 'Explore websites, games, quizzes, and tools shared by CodeIt learners. Play a project, remix an idea, or build your own.',
    canonical: '/explore',
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/explore`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Could not load explore feed.');
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLike = useCallback(async (project) => {
    if (!user) { navigate('/login'); return; }
    // Optimistic update
    const toggleLike = (list) => list.map(p =>
      p.publicId === project.publicId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    );
    setData(prev => prev ? {
      ...prev,
      trending:    toggleLike(prev.trending),
      newest:      toggleLike(prev.newest),
      mostPlayed:  toggleLike(prev.mostPlayed),
      mostRemixed: toggleLike(prev.mostRemixed),
    } : prev);

    try {
      const res = await fetch(`${API_BASE_URL}/api/explore/like/${project.publicId}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback on error
      setData(prev => prev ? {
        ...prev,
        trending:    toggleLike(prev.trending),
        newest:      toggleLike(prev.newest),
        mostPlayed:  toggleLike(prev.mostPlayed),
        mostRemixed: toggleLike(prev.mostRemixed),
      } : prev);
    }
  }, [user, token, navigate]);

  const handleRemix = useCallback(async (project) => {
    if (!user) {
      sessionStorage.setItem('codeit_remix_intent', project.publicId);
      navigate('/login', { state: { from: `/project/${project.publicId}` } });
      return;
    }
    setRemixingId(project.publicId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/builder/pub/${project.publicId}/remix`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...journeyHeaders() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Remix failed');
      showToast('Added to your builds! Opening builder...');
      setTimeout(() => navigate(`/builder?remix=${json.projectId}`), 1200);
    } catch (e) {
      showToast(e.message || 'Could not remix project.');
    } finally {
      setRemixingId(null);
    }
  }, [user, token, navigate]);

  const TABS = [
    { id: 'trending',    label: 'Trending' },
    { id: 'newest',      label: 'New' },
    { id: 'mostPlayed',  label: 'Most Played' },
    { id: 'mostRemixed', label: 'Most Remixed' },
  ];

  const EMPTY_MSGS = {
    trending:    'No trending projects yet. Be the first to publish!',
    newest:      'Nothing published yet. Share your creation!',
    mostPlayed:  'No plays recorded yet.',
    mostRemixed: 'No remixed projects yet.',
  };

  return (
    <div className="exp-page">
      <Header />

      {/* Hero */}
      <div className="exp-hero">
        <div className="exp-hero__inner">
          <p className="exp-hero__eyebrow">Community</p>
          <h1 className="exp-hero__title">Discover</h1>
          <p className="exp-hero__sub">Play, remix, and get inspired by projects shared by CodeIt learners.</p>
          <Link to="/builder" className="exp-hero__cta">Build Your Own</Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="exp-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`exp-tab${activeTab === tab.id ? ' exp-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="exp-content">
        {loading && (
          <div className="exp-loader">
            <div className="exp-loader__spinner" />
            <p>Loading projects...</p>
          </div>
        )}

        {!loading && error && (
          <div className="exp-error">
            <p>{error}</p>
            <button className="exp-btn exp-btn--play" onClick={loadFeed}>Try again</button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {activeTab === 'trending' && (
              <Section title="Trending Now" projects={data.trending} onLike={handleLike} onRemix={handleRemix} remixingId={remixingId} emptyMsg={EMPTY_MSGS.trending} />
            )}
            {activeTab === 'newest' && (
              <Section title="Newest Creations" projects={data.newest} onLike={handleLike} onRemix={handleRemix} remixingId={remixingId} emptyMsg={EMPTY_MSGS.newest} />
            )}
            {activeTab === 'mostPlayed' && (
              <Section title="Most Played" projects={data.mostPlayed} onLike={handleLike} onRemix={handleRemix} remixingId={remixingId} emptyMsg={EMPTY_MSGS.mostPlayed} />
            )}
            {activeTab === 'mostRemixed' && (
              <Section title="Most Remixed" projects={data.mostRemixed} onLike={handleLike} onRemix={handleRemix} remixingId={remixingId} emptyMsg={EMPTY_MSGS.mostRemixed} />
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="exp-toast">{toast}</div>}
    </div>
  );
}
