// ── /join: the code on the board, your first name, in ───────────────────────
//
// Two boxes. The code as the teacher read it out (case, spaces and dashes
// are forgiven), and a first name for the class board. No email, no
// password, no age screen: the teacher who made the class is the adult on
// record, and the account the child lands on is a real one, so the games
// they make today are still there tomorrow.

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import { journeyHeaders } from '../../utils/journey';
import { reportFailure } from '../../utils/humanError';
import { isUnreachable, whyUnreachable } from '../../ds/Offline';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import '../../ds/ds.css';
import './Class.css';

export function tidyCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}

export default function Join() {
  useSEO({ canonical: 'https://codeitlearn.com/join', title: 'Join your class | CodeIt', description: 'Type the class code from the board and your first name.', robots: 'noindex,nofollow' });
  const { user, token, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const preset = new URLSearchParams(location.search || '').get('code');
  const [code, setCode] = useState(tidyCode(preset));
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { if (preset && nameRef.current) nameRef.current.focus(); }, [preset]);

  const ready = code.length >= 5 && (user || name.trim().length >= 2);

  async function join(e) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/class/${encodeURIComponent(code)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...journeyHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ first_name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && !data.error && res.status >= 500) throw new Error(`join ${res.status}`);
      if (!res.ok) throw new Error(data.error || 'Could not join. Check the code.');
      if (data.token) login({ user: data.user, token: data.token });
      navigate('/home', { replace: true, state: { joinedClass: data.class?.name } });
    } catch (err) {
      // The code is probably right. Blaming it would send a child back to
      // retype a code that was never the problem.
      const unreachable = isUnreachable(err) || /^join 5\d\d$/.test(String(err.message));
      if (unreachable) {
        console.error('join:', err);
        setError(`${whyUnreachable()} It is not your code. Wait a moment and press Join again.`);
        return;
      }
      setError(reportFailure('join', err, 'Could not join. Check the code and try again.'));
      setShake(true); setTimeout(() => setShake(false), 500);
    } finally { setBusy(false); }
  }

  return (
    <div className="cl">
      <Header />
      <main className="cl__join">
        <form className={`ci-blk ci-blk--paper cl__card ci-rise${shake ? ' is-shake' : ''}`} onSubmit={join} noValidate>
          <div className="ci-ey">Join a class</div>
          <h1 className="ci-h1 cl__title">Type the code on the board.</h1>
          <label className="cl__field">
            <span>Class code</span>
            <input
              className="cl__code"
              value={code}
              onChange={(e) => { setCode(tidyCode(e.target.value)); setError(''); }}
              placeholder="ROCKET42"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              aria-label="Class code"
            />
          </label>
          {user ? (
            <p className="ci-sub cl__as">You will join as <b>{user.name}</b>. <button type="button" className="cl__link" onClick={() => navigate('/profile')}>Not you?</button></p>
          ) : (
            <label className="cl__field">
              <span>Your first name</span>
              <input
                ref={nameRef}
                className="cl__name"
                value={name}
                onChange={(e) => { setName(e.target.value.slice(0, 24)); setError(''); }}
                placeholder="Maya"
                autoComplete="given-name"
                aria-label="Your first name"
              />
            </label>
          )}
          {error && <p className="cl__err" role="alert">{error}</p>}
          <button type="submit" className="ci-btn ci-btn--ink ci-btn--block" disabled={!ready || busy}>{busy ? 'Joining' : 'Join'}</button>
          {!user && <p className="cl__fine">No email, no password. Your teacher made the class, and your games save on this name.</p>}
          <p className="cl__fine">Teaching? <Link to="/teach">Make a class</Link>.</p>
        </form>
      </main>
      <TabBar />
    </div>
  );
}
