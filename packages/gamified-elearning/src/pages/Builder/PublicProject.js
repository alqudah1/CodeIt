import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import Header from '../Header/Header';
import { trackEvent } from '../../utils/trackEvent';
import { journeyHeaders } from '../../utils/journey';
import './PublicProject.css';
import {
  injectPreviewStorage,
  isStorageMessage,
  loadPreviewStorage,
  savePreviewStorage,
} from './previewStorage';

export default function PublicProject() {
  const { publicId }        = useParams();
  // "u-" marks a link nobody had to make an account to create.
  const unlistedId = /^u-[a-f0-9]{12}$/.test(publicId || '') ? publicId.slice(2) : null;
  const { user, token }     = useContext(AuthContext);
  const navigate            = useNavigate();

  const [project, setProject]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [remixStatus, setRemixStatus] = useState(null); // null | 'remixing' | 'error'
  const [shareStatus, setShareStatus] = useState(null); // null | 'copied' | 'shared'

  // A published game runs in the same sandboxed, opaque-origin frame as the
  // studio preview, so `localStorage` throws there too — and this is the page
  // where a child's friends actually play it. Same shim, same reasoning: the
  // frame keeps its isolation and gets storage that works, scoped to this
  // project and kept on the visitor's own device.
  const frameRef = useRef(null);
  const storageSeed = useRef(null);
  if (storageSeed.current === null) storageSeed.current = loadPreviewStorage(`x${publicId}`);

  useEffect(() => {
    function onMessage(event) {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isStorageMessage(event.data)) return;
      savePreviewStorage(`x${publicId}`, event.data.data);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [publicId]);

  const playableCode = useMemo(
    () => injectPreviewStorage(project?.generated_code || '', storageSeed.current),
    [project?.generated_code]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // ── Two kinds of link on one route ────────────────────────────────
        //
        // A published project belongs to an account and lives at
        // /project/<id>. An unlisted one belongs to nobody, collects no
        // personal data, and the server mints it at /project/u-<id>.
        //
        // The unlisted feature shipped complete: the route, the rate limit,
        // the report flag, the tables created in production on 1 September.
        // Nothing in the browser had ever called it, and the server was
        // handing back a path this page could not read, because it sent
        // "u-<id>" to an endpoint that only knows published ids.
        //
        // A prefix rather than a second route, so the four lists that have to
        // agree for any new URL stay as they are.
        const res = await fetch(unlistedId
          ? `${API_BASE_URL}/api/builder/unlisted/${unlistedId}`
          : `${API_BASE_URL}/api/builder/pub/${publicId}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Not found');
        if (!cancelled) {
          // The two endpoints name the code field differently. Normalised here
          // rather than in the render, so nothing below has to know which kind
          // of link it is looking at.
          setProject(unlistedId
            ? { ...data.project, generated_code: data.project.code }
            : data.project);
        }
        // Fire-and-forget view count. The unlisted read counts its own views
        // server-side, so this only applies to published projects.
        if (!unlistedId) {
          fetch(`${API_BASE_URL}/api/builder/pub/${publicId}/view`, { method: 'POST' }).catch(() => {});
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [publicId, unlistedId]);

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
        headers: { Authorization: `Bearer ${token}`, ...journeyHeaders() },
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
      navigate('/login', { state: { from: `/project/${publicId}` } });
      return;
    }
    doRemix();
  }

  async function handleShare() {
    const shareUrl = new URL(`/project/${publicId}`, window.location.origin);
    shareUrl.searchParams.set('utm_source', 'project-share');
    const url = shareUrl.toString();
    const title = project?.title || 'A CodeIt project';
    const text = `Try "${title}", made with CodeIt, then remix it or build your own.`;
    let completed = false;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setShareStatus('shared');
        completed = true;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    if (!completed) {
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus('copied');
        completed = true;
      } catch (_) {}
    }

    if (completed) {
      void trackEvent('project_share', 'viewer', token);
      setTimeout(() => setShareStatus(null), 2000);
    }
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

        {/* ── The game, framed like a game ────────────────────────────
            This used to sit inside a pretend browser window — traffic-light
            dots and a fake address bar — the exact furniture A removed from
            the studio, still living on here. On the one page that strangers
            see, the child's game looked like an embed. Now it gets the same
            ink-outlined toy screen the studio gives it. */}
        <div className="pp-frame-wrap">
          <div className="pp-arcade-frame">
            <iframe
              ref={frameRef}
              className="pp-iframe"
              srcDoc={playableCode}
              title={project.title}
              sandbox="allow-scripts allow-forms allow-pointer-lock"
            />
          </div>
        </div>

        {/* ── The invitation ──────────────────────────────────────────
            This page is where CodeIt grows or does not. A child sends their
            game to a friend; the friend plays it; and in that exact moment —
            "someone my age MADE this" — the friend is more persuadable than
            any advert will ever find them. The page used to answer that
            moment with three equal grey-ish buttons.

            Now Pixel does what he does in the studio: greets them and says
            the true thing. Making one is free and starts right now. The
            buttons keep their old accessible names — the tests, and any
            child's muscle memory, keep working. */}
        <div className="pp-invite">
          <img className="pp-invite__pixel" src="/brand/pixel-guide.png" alt="" />
          <div className="pp-invite__bubble">
            <strong className="pp-invite__hi">
              You just played {project.creator_name ? `${project.creator_name}'s` : 'a'} game.
            </strong>
            <p className="pp-invite__line">
              Someone learning to code made this. You can make your own — free,
              nothing to download, and it starts right now.
            </p>
            <div className="pp-actions">
              <Link
                to="/builder"
                className="pp-cta-btn pp-cta-btn--build"
                onClick={() => void trackEvent('landing_cta_click', 'public-project-build')}
              >
                Build your own
              </Link>
              {!unlistedId && (
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
              )}
              <button
                className="pp-cta-btn pp-cta-btn--copy"
                onClick={handleShare}
              >
                {shareStatus === 'shared' ? 'Shared!'
                  : shareStatus === 'copied' ? 'Link copied!'
                  : 'Share project'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer attribution ──────────────────────────────────── */}
        <div className="pp-attribution">
          <span>Made on</span>
          <Link to="/" className="pp-attribution__brand">CodeIt</Link>
          <span>,  the creative playground for builders</span>
        </div>

      </div>
    </>
  );
}
