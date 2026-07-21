import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import Header from '../Header/Header';
import './PublicProject.css';

export default function PublicProject() {
  const { publicId }        = useParams();
  const { user, token }     = useContext(AuthContext);
  const navigate            = useNavigate();

  const [project, setProject]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [remixStatus, setRemixStatus] = useState(null); // null | 'remixing' | 'error'
  const [copyStatus, setCopyStatus] = useState(null);   // null | 'copied'

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/builder/pub/${publicId}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Not found');
        if (!cancelled) setProject(data.project);
        // Fire-and-forget view count
        fetch(`${API_BASE_URL}/api/builder/pub/${publicId}/view`, { method: 'POST' }).catch(() => {});
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [publicId]);

  // After login redirect, auto-complete remix if intent was saved
  useEffect(() => {
    if (!user || !token) return;
    const intent = sessionStorage.getItem('codeit_remix_intent');
    if (intent && intent === publicId) {
      sessionStorage.removeItem('codeit_remix_intent');
      doRemix();
    }
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doRemix() {
    setRemixStatus('remixing');
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/pub/${publicId}/remix`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Remix failed');
      navigate(`/builder?remix=${data.projectId}`);
    } catch (_) {
      setRemixStatus('error');
      setTimeout(() => setRemixStatus(null), 3000);
    }
  }

  function handleRemix() {
    if (!user || !token) {
      sessionStorage.setItem('codeit_remix_intent', publicId);
      navigate('/login');
      return;
    }
    doRemix();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (_) {}
  }

  function timeAgo(dateStr) {
    const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return Math.floor(s / 86400) === 1 ? 'yesterday' : `${Math.floor(s / 86400)}d ago`;
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="pp-loading">
          <span className="pp-spinner" />
          <p>Loading project...</p>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <Header />
        <div className="pp-error-page">
          <div className="pp-error-card">
            <div className="pp-error-icon">!</div>
            <h2 className="pp-error-title">Project not found</h2>
            <p className="pp-error-sub">This project may have been unpublished or the link is incorrect.</p>
            <Link to="/builder" className="pp-cta-btn pp-cta-btn--primary">Build your own</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pp-page">

        {/* ── Meta strip ─────────────────────────────────────────── */}
        <div className="pp-meta">
          <span className="pp-badge">Built with CodeIt</span>
          <h1 className="pp-title">{project.title}</h1>
          <div className="pp-meta-row">
            <span className="pp-creator">by {project.creator_name || 'a CodeIt creator'}</span>
            <span className="pp-dot" />
            <span className="pp-time">{timeAgo(project.created_at)}</span>
            {project.view_count > 0 && (
              <>
                <span className="pp-dot" />
                <span className="pp-views">{project.view_count.toLocaleString()} {project.view_count === 1 ? 'view' : 'views'}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Live preview iframe ─────────────────────────────────── */}
        <div className="pp-frame-wrap">
          <div className="pp-browser">
            <div className="pp-browser__chrome">
              <div className="pp-browser__dots">
                <span className="pp-browser__dot pp-browser__dot--red" />
                <span className="pp-browser__dot pp-browser__dot--yellow" />
                <span className="pp-browser__dot pp-browser__dot--green" />
              </div>
              <div className="pp-browser__bar">
                codeitlearn.com/project/{publicId}
              </div>
            </div>
            <iframe
              className="pp-iframe"
              srcDoc={project.generated_code}
              title={project.title}
              sandbox="allow-scripts allow-forms allow-pointer-lock"
            />
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="pp-actions">
          <button
            className="pp-cta-btn pp-cta-btn--remix"
            onClick={handleRemix}
            disabled={remixStatus === 'remixing'}
          >
            {remixStatus === 'remixing'
              ? <><span className="pp-spinner pp-spinner--sm" />Remixing...</>
              : remixStatus === 'error' ? 'Try again'
              : 'Remix this'}
          </button>
          <Link to="/builder" className="pp-cta-btn pp-cta-btn--build">
            Build your own
          </Link>
          <button
            className="pp-cta-btn pp-cta-btn--copy"
            onClick={handleCopyLink}
          >
            {copyStatus === 'copied' ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        {/* ── Footer attribution ──────────────────────────────────── */}
        <div className="pp-attribution">
          <span>Made on</span>
          <Link to="/" className="pp-attribution__brand">CodeIt</Link>
          <span>— the creative playground for builders</span>
        </div>

      </div>
    </>
  );
}
