import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import Icon from '../../components/Icon/Icon';
import { useCharacterDisplay } from '../../context/CharacterContext';
import { getXpProgress, getNextUnlock, getNextUnlockLabel } from '../../data/unlocks';
import { HOME_PICKS, STARTER_GAMES } from '../Builder/starterGames';
import { API_BASE_URL } from '../../config/api';
import { trackEvent } from '../../utils/trackEvent';
import YourShelf from './YourShelf';
import LiveFrame from './LiveFrame';
import RecentProjects from './RecentProjects';
import './MemberHome.css';

// ── A shelf, not a landing page ──────────────────────────────────────────────
//
// Rounds 66 and 67, reviewed on a real phone signed in as a learner with no
// saved projects: a two-line headline asking a question, a 40px avatar in a
// corner, two voids where the shelf should be, and a heading floating alone
// over more void. A day-two page shown on day one.
//
// The concept, so it can be checked against:
//
//   - Their stuff, big, running, first.
//   - Avatar and level visible beside it, with what unlocks next, which is
//     the one place the XP system is now seen.
//   - Three live starter games when the shelf is empty.
//   - No headline question, no paragraph, two text links at most.
//
// A child should land on it and tap something within one second without
// reading a word.

function LevelCard({ name, character, totalXP }) {
  const xp = getXpProgress(totalXP || 0);
  const next = getNextUnlock(xp.level);
  const nextLabel = getNextUnlockLabel(next);
  return (
    <Link to="/character" className="member__you" aria-label={`${name}, level ${xp.level}. Open the Avatar Lab`}>
      <span className="member__face" aria-hidden="true">
        <CharacterAvatar character={character} size={116} />
      </span>
      <span className="member__stats">
        <span className="member__name">{name}</span>
        <span className="member__level">Level {xp.level} · {xp.title}</span>
        <span className="member__bar" aria-hidden="true">
          <span className="member__bar-fill" style={{ width: `${Math.max(4, xp.pct)}%` }} />
        </span>
        <span className="member__next">
          {xp.hasNext
            ? `${xp.xpToNext} XP to level ${xp.level + 1}${nextLabel && next.atLevel === xp.level + 1 ? `, which unlocks ${nextLabel}` : ''}`
            : 'Top level. Everything is unlocked.'}
        </span>
      </span>
    </Link>
  );
}

export default function MemberHome({ user, token, shelf, latestProject }) {
  const { character, stats } = useCharacterDisplay();
  const name = user?.name || 'Builder';

  // The child's avatar is the player in the starters, on the home page too.
  // The sprite module pulls in react-dom/server, so it is loaded after the
  // page is up rather than before.
  const [sprite, setSprite] = useState('');
  const [inject, setInject] = useState(null);
  useEffect(() => {
    let live = true;
    import('../../utils/avatarSprite').then(({ avatarSpriteDataUri, injectPlayerSprite }) => {
      if (!live) return;
      setSprite(avatarSpriteDataUri(character));
      setInject(() => injectPlayerSprite);
    }).catch(() => {});
    return () => { live = false; };
  }, [character]);
  const prepare = useMemo(
    () => (inject && sprite ? (code) => inject(code, sprite) : (code) => code),
    [inject, sprite]
  );

  // The browser shelf is written for guests; a signed-in child's projects
  // live on their account, and the list the page already has carries no
  // code. Fetch the newest one so it can run on the shelf like everything
  // else. The starters stay until it arrives, so nothing on the page waits.
  const [saved, setSaved] = useState(null);
  useEffect(() => {
    if (!latestProject?.id || !token || typeof fetch !== 'function') { setSaved(null); return undefined; }
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/builder/projects/${encodeURIComponent(latestProject.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const p = data?.project;
        if (!p?.generated_code) return;
        setSaved({
          id: String(p.id),
          title: p.title || latestProject.title || 'My project',
          code: p.generated_code,
          projectType: p.project_type || 'game',
          updatedAt: Date.parse(p.updated_at || p.created_at) || Date.now(),
          href: `/builder?project=${encodeURIComponent(p.id)}`,
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [latestProject?.id, latestProject?.title, token]);

  const shelfProjects = useMemo(() => {
    if (!saved) return shelf;
    return [saved, ...shelf.filter((p) => p.id !== saved.id)];
  }, [saved, shelf]);

  // When the shelf is empty it shows the first three starters, so the row
  // below offers the next three rather than the same three again.
  const shelfEmpty = shelfProjects.length === 0;
  const picks = shelfEmpty ? STARTER_GAMES.slice(HOME_PICKS.length, HOME_PICKS.length + 3) : HOME_PICKS;

  return (
    <>
      <Header />
      <div className="studio-home studio-home--member">
        <main className="member">
          <section className="studio-member member__top" aria-labelledby="studio-title">
            <h1 id="studio-title" className="member__hello">Welcome back, {name}.</h1>

            <div className="member__row">
              <LevelCard name={name} character={character} totalXP={stats?.totalXP} />
              <YourShelf
                projects={shelfProjects}
                starters={HOME_PICKS}
                prepare={prepare}
                signedIn
                onOpen={() => trackEvent('landing_cta_click', shelfEmpty ? 'starter' : 'shelf')}
              />
            </div>

            <div className="studio-hero__actions member__actions">
              {latestProject ? (
                <Link
                  to={`/builder?project=${encodeURIComponent(latestProject.id)}`}
                  className="studio-button studio-button--primary"
                  onClick={() => trackEvent('landing_cta_click', 'member-resume-project', token)}
                >
                  Continue {latestProject.title} <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <Link to="/builder" className="studio-button studio-button--primary">
                  Describe your own idea <span aria-hidden="true">→</span>
                </Link>
              )}
              <Link to="/lessons" className="studio-hero__textlink">Next lesson</Link>
              <Link to="/MainPage" className="studio-hero__textlink" data-cta="member-progress">My progress</Link>
            </div>
          </section>

          <section className="studio-make member__make" aria-labelledby="studio-make-title">
            <h2 id="studio-make-title" className="member__make-title">Start something new</h2>
            <ul className="pick__row member__picks" aria-label="Games you can open now">
              {picks.map((game) => (
                <li key={game.id}>
                  <Link
                    className="member__pick"
                    to={`/builder?start=${game.id}`}
                    onClick={() => trackEvent('landing_cta_click', 'starter')}
                  >
                    <LiveFrame className="member__pick-frame" code={prepare(game.code)} title={`${game.label}, running`} />
                    <span className="member__pick-label">
                      <Icon name={game.icon} size={18} strokeWidth={2} />
                      {game.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <RecentProjects />
        </main>
      </div>
    </>
  );
}
