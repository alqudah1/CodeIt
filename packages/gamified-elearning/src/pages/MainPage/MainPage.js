import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { API_BASE_URL, ENDPOINTS } from '../../config/api';
import { world1 } from '../../data/journey/world1';
import Header from '../Header/Header';
import LeaderboardPreview from '../../components/LeaderboardPreview';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useSEO } from '../../hooks/useSEO';
import { getXpProgress, getNextUnlock, getNextUnlockLabel } from '../../data/unlocks';
import { isFirstWinState } from '../../utils/firstWin';
import { TOTAL_LESSONS, lessonSummaries } from '../Lessons/lessonRegistry';
import FirstWinPanel from './FirstWinPanel';
import useCountUp from '../../hooks/useCountUp';
import './MainPage.css';

// Live content totals — derived from the lesson registry, never typed by
// hand. This page used to say "3 of 16" while its own achievements card said
// "All 31 lessons done": two hardcoded counts on one screen, one of them
// years stale. One source of truth now.
const LESSON_TOTAL      = TOTAL_LESSONS;
const QUIZ_TOTAL        = TOTAL_LESSONS;   // every lesson has its own quiz

// Journey puzzle totals — only count puzzles with real map coordinates (xPct > 0)
// Lessons 1-3 each have 3 visible journey puzzles = 9 live puzzles
const PUZZLE_LESSON_MAX = 3;    // highest lesson with visible journey map puzzles
const LIVE_PUZZLE_TOTAL = world1.nodes.filter(
  n => (n.type === 'puzzle' || n.type === 'boss') && n.xPct > 0
).length;

const ALL_IDS = Array.from({ length: TOTAL_LESSONS }, (_, i) => i + 1);

// Titles come from the registry too — the hand-typed list stopped at 16.
const LESSON_TITLES = [null, ...lessonSummaries().map(l => l.title)];

// Achievement definitions — all derived from live progress data
const buildAchievements = (lessons, quizzes, puzzles, streak) => [
  { id: 'first_steps',    icon: '1L',  label: 'First Steps',    desc: 'Completed lesson 1',       unlocked: lessons  >= 1  },
  { id: 'halfway',        icon: '5L',  label: 'Halfway There',  desc: '5 lessons completed',      unlocked: lessons  >= 5  },
  { id: 'lesson_master',  icon: 'ALL', label: 'Lesson Master',  desc: `All ${TOTAL_LESSONS} lessons done`, unlocked: lessons  >= TOTAL_LESSONS },
  { id: 'quiz_starter',   icon: '1Q',  label: 'Quiz Starter',   desc: 'Completed first quiz',     unlocked: quizzes  >= 1  },
  { id: 'quiz_champ',     icon: '5Q',  label: 'Quiz Champion',  desc: '5 quizzes completed',      unlocked: quizzes  >= 5  },
  { id: 'puzzle_pioneer', icon: '1P',  label: 'Puzzle Pioneer', desc: 'Solved first puzzle',      unlocked: puzzles  >= 1  },
  { id: 'streak_3',       icon: '3d',  label: '3-Day Streak',   desc: '3 days in a row',          unlocked: streak   >= 3  },
];

const MainPage = () => {
  useSEO({
    canonical:   '/MainPage',
    robots:      'noindex,nofollow',
  });

  const navigate = useNavigate();
  const { user, token, logout, loading } = useContext(AuthContext);
  const { character, characterLoaded } = useCharacter();

  // Progress arrays (not just counts — needed for "next item" logic)
  const [completedLessonsArr, setCompletedLessonsArr] = useState([]);
  const [completedQuizzesArr, setCompletedQuizzesArr] = useState([]);
  const [completedPuzzlesArr, setCompletedPuzzlesArr] = useState([]);
  const [xp,     setXp]     = useState(null);
  const [streak, setStreak] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);

  // Her machines: the projects this kid has actually made, shown as arcade
  // cabinets in her own room. null = still loading, [] = none yet.
  const [machines, setMachines] = useState(null);

  // Counts derived from arrays
  const completedLessons = completedLessonsArr.length;
  const completedQuizzes = completedQuizzesArr.length;
  const completedPuzzles = completedPuzzlesArr.length;


  useEffect(() => {
    if (!loading && (!user || !user.name)) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const headers = { Authorization: `Bearer ${token}` };

    const fetchProgress = async () => {
      try {
        const [journeyRes, profileRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/journey/progress`, { headers, cache: 'no-store' }),
          fetch(ENDPOINTS.profile.get, { headers }),
        ]);

        if (journeyRes.ok) {
          const data = await journeyRes.json();
          if (data.success) {
            setCompletedLessonsArr(data.completedLessons      || []);
            setCompletedQuizzesArr(data.completedMiniQuizzes  || []);
            setCompletedPuzzlesArr(data.completedPuzzles      || []);
            setXp(data.xp ?? 0);
          }
        }
        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.success && pData.stats) {
            setStreak(pData.stats.currentStreak ?? 0);
          }
        }
      } catch (_) {
        /* silently ignore */
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgress();

    // Her machines, for the room. A failure just means the shelf stays quiet.
    fetch(`${API_BASE_URL}/api/builder/projects`, { headers })
      .then(r => r.json())
      .then(d => setMachines(d.success ? (d.projects || []).slice(0, 6) : []))
      .catch(() => setMachines([]));
  }, [user, token]);

  // "Your Next Mission" — sequential: lesson → quiz → puzzle (puzzles only for lessons 1-PUZZLE_LESSON_MAX)
  const nextMission = useMemo(() => {
    if (progressLoading) return null;
    for (let n = 1; n <= TOTAL_LESSONS; n++) {
      if (!completedLessonsArr.includes(n)) {
        return {
          type:    'lesson',
          title:   `Lesson ${n}: ${LESSON_TITLES[n]}`,
          meta:    completedLessons === 0
                     ? 'No experience needed. Start here.'
                     : `${completedLessons} of ${LESSON_TOTAL} lessons done`,
          onClick: () => navigate(`/lesson/${n}`),
          allDone: false,
        };
      }
      if (!completedQuizzesArr.includes(n)) {
        return {
          type:    'quiz',
          title:   `Quiz ${n}: ${LESSON_TITLES[n]}`,
          meta:    `Lesson ${n} complete. Test your knowledge and earn XP!`,
          onClick: () => navigate(`/quiz/${n}`),
          allDone: false,
        };
      }
      // Only check journey puzzles for lessons that have visible map nodes
      if (n <= PUZZLE_LESSON_MAX) {
        for (const [key, routeSlot] of [['A', 'a'], ['B', 'b'], ['BOSS', 'boss']]) {
          if (!completedPuzzlesArr.includes(`${n}${key}`)) {
            return {
              type:    'puzzle',
              title:   `Lesson ${n}. Puzzle ${key === 'BOSS' ? 'Boss Challenge' : key}`,
              meta:    `Quiz ${n} complete. Time for the coding challenge!`,
              onClick: () => navigate(`/journey/puzzle/${n}/${routeSlot}`),
              allDone: false,
            };
          }
        }
      }
    }
    return {
      type:    'complete',
      title:   'All Lessons Complete!',
      meta:    `${LESSON_TOTAL} lessons, ${QUIZ_TOTAL} quizzes, and ${LIVE_PUZZLE_TOTAL} journey puzzles done.`,
      onClick: () => navigate('/journey'),
      allDone: true,
    };
  }, [progressLoading, completedLessonsArr, completedQuizzesArr, completedPuzzlesArr, completedLessons, navigate]);

  // Next item in each individual track — used by summary cards
  const nextLessonId = useMemo(
    () => progressLoading ? null : ALL_IDS.find(n => !completedLessonsArr.includes(n)) ?? null,
    [progressLoading, completedLessonsArr]
  );
  const nextQuizId = useMemo(
    () => progressLoading ? null : ALL_IDS.find(n => !completedQuizzesArr.includes(n)) ?? null,
    [progressLoading, completedQuizzesArr]
  );
  const nextJourneyPuzzle = useMemo(() => {
    if (progressLoading) return null;
    // Only surface puzzles that are visible on the journey map (lessons 1-PUZZLE_LESSON_MAX)
    for (let n = 1; n <= PUZZLE_LESSON_MAX; n++) {
      for (const [key, routeSlot] of [['A', 'a'], ['B', 'b'], ['BOSS', 'boss']]) {
        if (!completedPuzzlesArr.includes(`${n}${key}`)) {
          return {
            label: `Lesson ${n}. Puzzle ${key === 'BOSS' ? 'Boss' : key}`,
            route: `/journey/puzzle/${n}/${routeSlot}`,
          };
        }
      }
    }
    return null;
  }, [progressLoading, completedPuzzlesArr]);

  const achievements = useMemo(
    () => buildAchievements(completedLessons, completedQuizzes, completedPuzzles, streak ?? 0),
    [completedLessons, completedQuizzes, completedPuzzles, streak]
  );

  const levelInfo = useMemo(() => getXpProgress(xp), [xp]);
  // Juice: the XP total counts up when the room opens (reduced-motion users get the real number instantly).
  const shownXp = useCountUp(xp ?? 0);
  const showFirstWin = isFirstWinState({
    loading: progressLoading,
    completedLessons,
    completedQuizzes,
    completedPuzzles,
    xp,
  });

  // Microcopy — one place for all contextual hints throughout the dashboard
  const mc = useMemo(() => {
    if (progressLoading) return {};
    const lessonsLeft = LESSON_TOTAL - completedLessons;
    const quizzesLeft = QUIZ_TOTAL   - completedQuizzes;

    // Mission card — below the meta line
    let mission = null;
    if (completedLessons > 0 && lessonsLeft > 0) {
      if (lessonsLeft === 1)                          mission = 'Last lesson. Finish strong!';
      else if (completedLessons >= LESSON_TOTAL - 4)  mission = "You're doing great. Almost there!";
      else                                            mission = `${lessonsLeft} lessons left to complete`;
    }

    // Level card — below the XP-to-next line
    let level = null;
    if ((xp ?? 0) > 0 && levelInfo.hasNext) {
      level = levelInfo.pctToNext >= 75
        ? `Only ${levelInfo.xpToNext} XP to reach Level ${levelInfo.level + 1}!`
        : null;
    }

    // Lessons track header
    let lessons = null;
    if      (completedLessons === LESSON_TOTAL) lessons = 'All lessons complete. Python mastered!';
    else if (lessonsLeft === 1)                 lessons = 'Just 1 lesson left!';
    else if (completedLessons > 0)              lessons = `${completedLessons} of ${LESSON_TOTAL} done. Keep going!`;

    // Quizzes track header
    let quizzes = null;
    if      (completedLessons === 0)  quizzes = 'Complete a lesson first to unlock quizzes';
    else if (completedQuizzes === 0)  quizzes = 'Lesson done. Take your first quiz to earn XP!';
    else if (quizzesLeft === 1)       quizzes = 'Just 1 knowledge check left!';
    else if (completedQuizzes > 0)    quizzes = `${completedQuizzes} of ${QUIZ_TOTAL} done. Keep going!`;

    // Puzzles track header
    let puzzles = null;
    if      (completedQuizzes === 0)                    puzzles = 'Pass a quiz to unlock your first coding challenge';
    else if (completedPuzzles === 0)                    puzzles = 'Quiz done. Your first puzzle is unlocked!';
    else if (completedPuzzles >= LIVE_PUZZLE_TOTAL)     puzzles = `All ${LIVE_PUZZLE_TOTAL} challenges solved. Well done!`;
    else                                                puzzles = `${completedPuzzles} of ${LIVE_PUZZLE_TOTAL} challenges solved`;

    return { mission, level, lessons, quizzes, puzzles };
  }, [progressLoading, completedLessons, completedQuizzes, completedPuzzles, xp, levelInfo]);

  const motivate = (p, label) => {
    if (p === 100) return `All ${label.toLowerCase()} complete!`;
    if (p === 0)   return `Ready to start?`;
    if (p < 25)    return 'Great start!';
    if (p < 50)    return 'Keep going!';
    if (p < 75)    return "You're halfway there!";
    return 'Almost done!';
  };

  const navigateToLesson = (num) => navigate(`/lesson/${num}`);
  const navigateToQuiz   = (num) => navigate(`/quiz/${num}`);
  const navigateToLogin     = () => navigate('/login');
  const navigateToRegister  = () => navigate('/register');

  if (loading) return <div>Loading...</div>;
  if (!user || !user.name) return <div>Please log in to access the dashboard.</div>;

  const firstName = (user.name || 'Coder').split(' ')[0];

  const pct = (done, total) => Math.round((done / total) * 100);

  return (
    <div className="main-page">
      <Header
        user={user}
        logout={logout}
        navigateToLogin={navigateToLogin}
        navigateToRegister={navigateToRegister}
      />
      <main className="main-content">
        {/* Visually hidden H1 for SEO. Dashboard is auth-gated so content H1 is fine here */}
        <h1 className="seo-only">
          {firstName ? `${firstName}'s Python Dashboard` : 'Your progress'}. CodeIt
        </h1>

        {showFirstWin && <FirstWinPanel token={token} />}

        {/* ══════════════════════════════════════════════════════
            YOUR NEXT MISSION. Lesson-focused top action card
        ══════════════════════════════════════════════════════ */}
        {!progressLoading && nextMission && (
          <section className={`mp-mission${nextMission.allDone ? ' mp-mission--done' : ''}`}>
            <div className="mp-mission__inner">
              <span className="mp-mission__eyebrow">
                {nextMission.type === 'quiz'     ? 'Time to Test'
                 : nextMission.type === 'puzzle' ? 'Puzzle Challenge'
                 : nextMission.type === 'complete' ? 'Journey Complete'
                 : 'Your Next Mission'}
              </span>
              <h2 className="mp-mission__title">{nextMission.title}</h2>
              <p className="mp-mission__meta">{nextMission.meta}</p>
              {mc.mission && <span className="mc">{mc.mission}</span>}
              <button
                type="button"
                className="mp-mission__btn"
                onClick={nextMission.onClick}
              >
                {nextMission.type === 'quiz'       ? 'Take Quiz'
                 : nextMission.type === 'puzzle'   ? 'Start Challenge'
                 : nextMission.type === 'complete' ? 'View Journey'
                 : 'Continue'} &rarr;
              </button>
            </div>
            <div className="mp-mission__visual" aria-hidden="true">
              <div className="mp-mission__ring">
                <svg viewBox="0 0 56 56" className="mp-mission__ring-svg">
                  <circle cx="28" cy="28" r="23" className="mp-mission__ring-bg" />
                  <circle
                    cx="28" cy="28" r="23"
                    className="mp-mission__ring-fill"
                    strokeDasharray={`${pct(completedLessons, LESSON_TOTAL) * 1.445} 144.5`}
                  />
                </svg>
                <div className="mp-mission__ring-label">
                  <strong>{pct(completedLessons, LESSON_TOTAL)}%</strong>
                  <span>lessons</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            YOUR MACHINES. The kid's own projects as arcade cabinets —
            the reason this page is a room and not a menu.
        ══════════════════════════════════════════════════════ */}
        {Array.isArray(machines) && machines.length > 0 && (
          <section className="mp-machines" aria-labelledby="mp-machines-title">
            <h2 id="mp-machines-title" className="mp-machines__title">Your machines</h2>
            <ul className="mp-machines__row">
              {machines.map((m, i) => (
                <li key={m.id}>
                  <Link to={`/builder?project=${m.id}`} className="mp-machine">
                    <span className={`mp-machine__marquee mp-machine__marquee--${i % 4}`} aria-hidden="true">
                      {({ game: '🕹️', quiz: '❓', shop: '🧁', website: '🌐', tool: '🔧', story: '📖' })[m.project_type] || '✨'}
                    </span>
                    <span className="mp-machine__name">{m.title}</span>
                    <span className="mp-machine__play">▶ PLAY</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/builder" className="mp-machine mp-machine--new">
                  <span className="mp-machine__marquee mp-machine__marquee--new" aria-hidden="true">＋</span>
                  <span className="mp-machine__name">New machine</span>
                  <span className="mp-machine__play">Make it</span>
                </Link>
              </li>
            </ul>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            CHARACTER IDENTITY CARD
        ══════════════════════════════════════════════════════ */}
        {characterLoaded && (
          <section className="mp-char-card">
            <div className="mp-char-card__avatar">
              <CharacterAvatar character={character} size={72} />
            </div>
            <div className="mp-char-card__info">
              <span className="mp-char-card__name">
                {character.nickname || (user?.name?.split(' ')[0]) || 'Coder'}
              </span>
              {!progressLoading && (
                <span className="mp-char-card__level">
                  Level {levelInfo.level}. {levelInfo.title}
                </span>
              )}
              {!progressLoading && levelInfo.hasNext && (
                <div className="mp-char-card__bar">
                  <div
                    className="mp-char-card__bar-fill"
                    style={{ width: `${levelInfo.pctToNext}%` }}
                  />
                </div>
              )}
              {!progressLoading && (() => {
                const nu = getNextUnlock(levelInfo.level);
                if (!nu) return null;
                return (
                  <span className="mp-char-card__next-unlock">
                    Next unlock: {getNextUnlockLabel(nu)} at Level {nu.atLevel}
                  </span>
                );
              })()}
            </div>
            <Link to="/character" className="mp-char-card__link">
              Customize
            </Link>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            STATS ROW. Level + Streak side by side
        ══════════════════════════════════════════════════════ */}
        {!progressLoading && (
          <div className="cp-stats-row">

            <section className="mp-level-card">
              <div className="mp-level-card__left">
                <div className="mp-level-card__badge">
                  <span className="mp-level-card__lvl-sup">LVL</span>
                  <span className="mp-level-card__lvl-num">{levelInfo.level}</span>
                </div>
                <div className="mp-level-card__identity">
                  <span className="mp-level-card__title">{levelInfo.title}</span>
                  <span className="mp-level-card__xp-total">
                    {shownXp.toLocaleString()} XP total
                  </span>
                </div>
              </div>
              <div className="mp-level-card__right">
                <div className="mp-level-card__bar-header">
                  <span className="mp-level-card__bar-label">
                    {levelInfo.hasNext
                      ? `Level ${levelInfo.level} → ${levelInfo.level + 1}`
                      : 'Max level reached'}
                  </span>
                  <span className="mp-level-card__bar-pct">{levelInfo.pctToNext}%</span>
                </div>
                <div className="mp-level-card__bar-wrap">
                  <div className="mp-level-card__bar-fill" style={{ width: `${levelInfo.pctToNext}%` }} />
                </div>
                <span className="mp-level-card__bar-sub">
                  {levelInfo.hasNext
                    ? `${levelInfo.xpToNext} XP needed for Level ${levelInfo.level + 1}`
                    : `${(xp ?? 0).toLocaleString()} XP, and still going`}
                </span>
                {mc.level && <span className="mc mc--urgent">{mc.level}</span>}
                {!progressLoading && (() => {
                  const nu = getNextUnlock(levelInfo.level);
                  if (!nu) return null;
                  return (
                    <span className="mc mc--unlock">
                      Next reward: {getNextUnlockLabel(nu)} unlocks at Level {nu.atLevel}
                    </span>
                  );
                })()}
              </div>
            </section>

            <section className={`mp-streak-card${(streak ?? 0) === 0 ? ' mp-streak-card--cold' : (streak ?? 0) >= 3 ? ' mp-streak-card--hot' : ''}`}>
              <div className="mp-streak-card__number">{streak ?? 0}</div>
              <div className="mp-streak-card__body">
                <span className="mp-streak-card__label">
                  {(streak ?? 0) === 1 ? '1-day streak' : `${streak ?? 0}-day streak`}
                </span>
                <p className="mp-streak-card__message">
                  {(streak ?? 0) === 0 ? 'Start your streak today!' : 'Keep your streak alive!'}
                </p>
              </div>
              <div className="mp-streak-card__dots" aria-hidden="true">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <span
                    key={d}
                    className={`mp-streak-card__dot${d <= (streak ?? 0) ? ' mp-streak-card__dot--active' : ''}`}
                  />
                ))}
              </div>
            </section>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            PROGRESS CARD
        ══════════════════════════════════════════════════════ */}
        <section className="cp-progress-card">
          <h3 className="cp-progress-card__heading">Your Progress</h3>
          <div className="progress-tracks">
            {[
              { key: 'lessons', label: 'Lessons',           done: completedLessons, total: LESSON_TOTAL       },
              { key: 'quizzes', label: 'Knowledge Checks', done: completedQuizzes, total: QUIZ_TOTAL          },
              { key: 'puzzles', label: 'Coding Challenges', done: completedPuzzles, total: LIVE_PUZZLE_TOTAL  },
            ].map(({ key, label, done, total }) => {
              const p = progressLoading ? 0 : pct(done, total);
              return (
                <div key={key} className={`progress-track${p === 100 ? ' progress-track--complete' : ''}`}>
                  <div className="progress-track__top">
                    <span className="progress-track__label">{label}</span>
                    <span className={`progress-track__pct progress-track__pct--${key}`}>
                      {progressLoading ? '…' : `${p}%`}
                    </span>
                  </div>
                  <div className="progress-track__sub">
                    <span className="progress-track__motivation">
                      {progressLoading ? '' : motivate(p, label)}
                    </span>
                    <span className="progress-track__count">
                      {progressLoading ? '' : `${done} of ${total}`}
                    </span>
                  </div>
                  <div className="progress-track__bar-wrap">
                    <div
                      className={`progress-track__bar-fill progress-track__bar-fill--${key}`}
                      style={{ width: progressLoading ? '0%' : `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            ACHIEVEMENTS
        ══════════════════════════════════════════════════════ */}
        <section className="mp-achievements" aria-labelledby="mp-ach-heading">
          <h2 id="mp-ach-heading" className="mp-achievements__heading">Achievements</h2>
          <div className="mp-achievements__list">
            {achievements.map(ach => (
              <div
                key={ach.id}
                className={`mp-ach-card${ach.unlocked ? ' mp-ach-card--unlocked' : ''}`}
                title={ach.unlocked ? 'Unlocked!' : 'Locked. Keep going'}
              >
                <div className="mp-ach-card__icon">{ach.icon}</div>
                <div className="mp-ach-card__label">{ach.label}</div>
                <div className="mp-ach-card__desc">{ach.desc}</div>
                {ach.unlocked && <div className="mp-ach-card__badge">Unlocked</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TRACKS GRID. Lessons / Quizzes / Journey Puzzles
        ══════════════════════════════════════════════════════ */}
        <section className="tracks-grid">

          {/* Lessons */}
          <article className="track-card lessons">
            <header className="track-header">
              <span className="track-icon lessons" />
              <div>
                <h2>
                  Lessons
                  <span className="track-total-badge">{completedLessons}/{LESSON_TOTAL}</span>
                </h2>
                <p>Step-by-step Python lessons. One concept at a time.</p>
                {mc.lessons && <span className="mc">{mc.lessons}</span>}
              </div>
            </header>
            <div className="track-summary-bar">
              <div
                className="track-summary-fill track-summary-fill--lessons"
                style={{ width: progressLoading ? '0%' : `${pct(completedLessons, LESSON_TOTAL)}%` }}
              />
            </div>
            {!progressLoading && nextLessonId && (
              <div className="track-next">
                <div className="track-next__info">
                  <span className="track-next__eyebrow">Up next</span>
                  <span className="track-next__name">Lesson {nextLessonId}: {LESSON_TITLES[nextLessonId]}</span>
                </div>
                <button
                  type="button"
                  className="track-next__btn track-next__btn--lesson"
                  onClick={() => navigateToLesson(nextLessonId)}
                >
                  Continue &rarr;
                </button>
              </div>
            )}
            <Link to="/lessons" className="track-view-all">View all lessons &rarr;</Link>
          </article>

          {/* Quizzes */}
          <article className="track-card quizzes">
            <header className="track-header">
              <span className="track-icon quizzes" />
              <div>
                <h2>
                  Knowledge Checks
                  <span className="track-total-badge">{completedQuizzes}/{QUIZ_TOTAL}</span>
                </h2>
                <p>One quiz per lesson. Test your knowledge and earn XP.</p>
                {mc.quizzes && <span className={`mc${completedLessons === 0 ? ' mc--locked' : ''}`}>{mc.quizzes}</span>}
              </div>
            </header>
            <div className="track-summary-bar">
              <div
                className="track-summary-fill track-summary-fill--quizzes"
                style={{ width: progressLoading ? '0%' : `${pct(completedQuizzes, QUIZ_TOTAL)}%` }}
              />
            </div>
            {!progressLoading && nextQuizId && completedLessons > 0 && (
              <div className="track-next">
                <div className="track-next__info">
                  <span className="track-next__eyebrow">Up next</span>
                  <span className="track-next__name">Quiz {nextQuizId}: {LESSON_TITLES[nextQuizId]}</span>
                </div>
                <button
                  type="button"
                  className="track-next__btn track-next__btn--quiz"
                  onClick={() => navigateToQuiz(nextQuizId)}
                >
                  Take Quiz &rarr;
                </button>
              </div>
            )}
            <Link to="/lessons" className="track-view-all">View all lessons &rarr;</Link>
          </article>

          {/* Coding Challenges */}
          <article className="track-card games">
            <header className="track-header">
              <span className="track-icon games" />
              <div>
                <h2>
                  Coding Challenges
                  <span className="track-total-badge">{completedPuzzles}/{LIVE_PUZZLE_TOTAL}</span>
                </h2>
                <p>Journey puzzles unlocked after each quiz. Write real Python to pass.</p>
                {mc.puzzles && <span className={`mc${completedQuizzes === 0 ? ' mc--locked' : ' mc--accent'}`}>{mc.puzzles}</span>}
              </div>
            </header>
            <div className="track-summary-bar">
              <div
                className="track-summary-fill track-summary-fill--puzzles"
                style={{ width: progressLoading ? '0%' : `${pct(completedPuzzles, LIVE_PUZZLE_TOTAL)}%` }}
              />
            </div>
            {!progressLoading && nextJourneyPuzzle && completedQuizzes > 0 && (
              <div className="track-next">
                <div className="track-next__info">
                  <span className="track-next__eyebrow">Up next</span>
                  <span className="track-next__name">{nextJourneyPuzzle.label}</span>
                </div>
                <button
                  type="button"
                  className="track-next__btn track-next__btn--puzzle"
                  onClick={() => navigate(nextJourneyPuzzle.route)}
                >
                  Play &rarr;
                </button>
              </div>
            )}
            <button
              type="button"
              className="track-cta-btn track-cta-btn--puzzle"
              onClick={() => navigate('/journey')}
            >
              Open Journey Map &rarr;
            </button>
          </article>

        </section>

        {/* ══════════════════════════════════════════════════════
            AI BUILDER CTA. Quick-access from dashboard
        ══════════════════════════════════════════════════════ */}
        <section className="mp-builder-cta">
          <div className="mp-builder-cta__copy">
            <span className="mp-builder-cta__badge">Studio</span>
            <h2 className="mp-builder-cta__title">Turn your idea into a real project</h2>
            <p className="mp-builder-cta__sub">
              Start with a quiz, game, or portfolio, then change the design and code until the project feels like yours.
            </p>
          </div>
          <Link to="/builder" className="mp-builder-cta__btn">
            Open the studio &rarr;
          </Link>
        </section>

        {/* ── Leaderboard ───────────────────────────────────── */}
        <section className="cp-leaderboard">
          <LeaderboardPreview />
        </section>

      </main>

      <footer className="main-footer">
        &copy; {new Date().getFullYear()} <strong>CodeIt</strong>. All rights reserved. |
        <Link to="/builder"> Studio</Link> |
        <Link to="/privacy"> Privacy</Link> |
        <Link to="/terms"> Terms</Link>
      </footer>
    </div>
  );
};

export default MainPage;
