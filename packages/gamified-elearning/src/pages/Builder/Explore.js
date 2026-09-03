import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BrowserSticker,
  ControllerSticker,
  QuestionSticker,
  ShopSticker,
} from '../../components/ArcadeArt/ArcadeArt';
import Header from '../Header/Header';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { reportFailure } from '../../utils/humanError';
import Icon from '../../components/Icon/Icon';
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

// One hand-drawn sticker per kind of project, instead of the same muddy
// gradient on every thumbnail. Each card leans its own way — a small tilt
// derived from the title, so a shelf of same-kind projects still reads as a
// pile of stickers rather than a printed grid.
const CATEGORY_ART = {
  game: ControllerSticker,
  quiz: QuestionSticker,
  web: BrowserSticker,
  tool: ShopSticker,
};

function titleTilt(title = '') {
  let h = 0;
  for (const ch of String(title)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return (h % 13) - 6; // −6° … +6°
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
      {/* Thumbnail. The heart used to live INSIDE this role="button" — a
          button nested in a button, which axe flags as serious because a
          screen reader announces one control and hides the other, and a
          keyboard user cannot reach the inner one predictably. The heart is
          now a sibling, positioned over the corner by the card's relative
          box, so both controls exist honestly. */}
      <div className="exp-card__thumb-wrap">
        <div
          className="exp-card__thumb"
          onClick={() => navigate(`/project/${project.publicId}`)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate(`/project/${project.publicId}`)}
          aria-label={`Play ${project.title}`}
        >
          <span className="exp-card__type-badge">
            {TYPE_LABEL[project.projectType] || project.projectType || 'Project'}
          </span>
          <span className="exp-card__thumb-burst" aria-hidden="true" />
          {(() => {
            // A shop gets the storefront even though it lives in the web
            // category — it is the drawing a child would pick for it.
            const raw = String(project.projectType || '').toLowerCase();
            const Art = ['shop', 'restaurant'].includes(raw)
              ? ShopSticker
              : (CATEGORY_ART[cat] || ControllerSticker);
            return <Art size={62} tilt={titleTilt(project.title)} />;
          })()}
          <span className="exp-card__thumb-title">{project.title}</span>
        </div>
        {!project.isShowcase && (
          <button
            className={`exp-card__heart${project.liked ? ' exp-card__heart--liked' : ''}`}
            onClick={() => onLike(project)}
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
        {/* A row of zeros reads as an abandoned site. A brand-new project is
            not abandoned, it is new — so say that, and show numbers only once
            there are numbers. */}
        {(project.plays || 0) + (project.likes || 0) + (project.remixes || 0) === 0 ? (
          <div className="exp-card__stats">
            <span className="exp-stat exp-stat--new"><Icon name="sparkle" size={15} /> Just made</span>
          </div>
        ) : (
          <div className="exp-card__stats">
            {(project.plays || 0) > 0 && <StatBadge icon="▶" count={project.plays} />}
            {!project.isShowcase && (project.likes || 0) > 0 && <StatBadge icon="♥" count={project.likes} />}
            {(project.remixes || 0) > 0 && <StatBadge icon="⤴" count={project.remixes} />}
          </div>
        )}
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
    <section className="exp-section" aria-label={title}>
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
      // Never the exception's own words. When the API answered with HTML
      // instead of JSON, this page printed
      //   Unexpected token '<', "<!doctype "... is not valid JSON
      // in the middle of the screen, to a parent, in place of the projects.
      // A person cannot act on a parser message, and it makes a working
      // product look broken beyond repair. The real error still goes to the
      // console for whoever is debugging.
      setError(reportFailure('Explore feed', e, 'We could not load the projects just now.'));
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
      showToast('Added to your projects. Opening the studio...');
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
    newest:      'Nothing published yet. Share your project.',
    mostPlayed:  'No plays recorded yet.',
    mostRemixed: 'No remixed projects yet.',
  };

  return (
    <div className="exp-page">
      <Header />

      {/* One line, and the projects start. What "Explore" means is obvious
          from the projects themselves; a paragraph explaining it, an eyebrow
          reading "Community" and a 4.5rem heading were 610px of preamble in
          front of the only thing on the page anyone came for. */}
      <div className="exp-hero">
        <div className="exp-hero__inner">
          <h1 className="exp-hero__title">Explore projects other learners made</h1>
          <div className="exp-hero__keys">
            {/* Interactive, not just a shelf: this opens one of the projects
                on screen at random. Kids press it repeatedly, which is the
                point — every press is another project played. */}
            <button
              type="button"
              className="exp-hero__cta exp-hero__cta--surprise"
              onClick={() => {
                const pool = [
                  ...(data?.trending || []), ...(data?.newest || []),
                  ...(data?.mostPlayed || []), ...(data?.mostRemixed || []),
                ].filter(p => p.publicId);
                if (!pool.length) return;
                const pick = pool[Math.floor(Math.random() * pool.length)];
                navigate(`/project/${pick.publicId}`);
              }}
            >
              <Icon name="target" size={18} /> Surprise me
            </button>
            {/* "Make one" used to sit here, going to /builder, four positions
                from the header key that already says Start building or Make
                something and goes to the same place. Two controls, one
                destination, on a page a child came to BROWSE: the screen-share
                check counted eleven controls competing for the first tap
                against a budget of ten, and this was the one that was not
                about browsing at all. Same mistake the header made with
                Studio, same fix. */}
          </div>
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
              <Section title="Newest projects" projects={data.newest} onLike={handleLike} onRemix={handleRemix} remixingId={remixingId} emptyMsg={EMPTY_MSGS.newest} />
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
