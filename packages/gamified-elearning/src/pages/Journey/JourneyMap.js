import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Header from '../Header/Header';
import { world1 } from '../../data/journey/world1';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacter } from '../../context/CharacterContext';
import { getLevel, getLevelTitle, getNewlyUnlockedItems, getXpProgress, getNextUnlock, getNextUnlockLabel } from '../../data/unlocks';
import './JourneyMap.css';

// ── Node type config ────────────────────────────────────────────
const TYPE_COLOR = {
  start:    '#34c773',
  lesson:   '#7c5fc4',
  puzzle:   '#FF8A3D',
  quiz:     '#a78bfa',
  boss:     '#ef4444',
  big_quiz: '#e11d48',
};
const TYPE_LABEL = {
  start:    'START',
  lesson:   'LESSON',
  puzzle:   'PUZZLE',
  quiz:     'QUIZ',
  boss:     'BOSS',
  big_quiz: 'BIG QUIZ',
};
const TYPE_ICON = {
  start:    '▶',
  lesson:   'L',
  puzzle:   'P',
  quiz:     'Q',
  boss:     '★',
  big_quiz: 'B',
};

// ── Chapter markers — injected before each chapter's first node ─
const CHAPTER_MARKERS = {
  'lesson1':  { num: 1, title: 'The Basics',         sub: 'Lessons 1-3'   },
  'lesson4':  { num: 2, title: 'Going Further',       sub: 'Lessons 4-6'   },
  'lesson7':  { num: 3, title: 'Level Up',            sub: 'Lessons 7-9'   },
  'lesson10': { num: 4, title: 'Mastery',             sub: 'Lesson 10'     },
  'lesson11': { num: 5, title: 'Intermediate Python', sub: 'Lessons 11-16' },
};

// ── Progress helpers ────────────────────────────────────────────
// puzzleId (number) → string ID ("1A", "1B", "1BOSS", ...)
const SLOT_LABEL = { 1: 'A', 2: 'B', 3: 'BOSS' };
function pidToStr(numId) {
  const lesson = Math.floor(numId / 100);
  const slot   = SLOT_LABEL[numId % 100];
  return slot ? `${lesson}${slot}` : null;
}

function isNodeDone(node, prog) {
  if (node.type === 'start') return true;
  if (node.type === 'lesson') {
    const n = Number(node.id.replace('lesson', ''));
    return prog.completedLessons.includes(n);
  }
  if (node.type === 'quiz') {
    const n = Number(node.id.replace('quiz', ''));
    return prog.completedMiniQuizzes.includes(n);
  }
  if (node.type === 'big_quiz') {
    return node.quizId ? prog.completedBigQuizzes.includes(node.quizId) : false;
  }
  if (node.type === 'puzzle' || node.type === 'boss') {
    const str = node.puzzleId ? pidToStr(node.puzzleId) : null;
    return str ? prog.completedPuzzles.includes(str) : false;
  }
  return false;
}

function computeState(node, prog) {
  if (isNodeDone(node, prog)) return 'completed';
  const req = node.requires || {};
  const lessonsOk = (req.lessonComplete || []).every(id => prog.completedLessons.includes(id));
  const quizzesOk = (req.quizComplete   || []).every(id =>
    id <= 10
      ? prog.completedMiniQuizzes.includes(id)
      : prog.completedBigQuizzes.includes(id)
  );
  const puzzlesOk = (req.puzzleComplete || []).every(id => {
    const str = pidToStr(id);
    return str ? prog.completedPuzzles.includes(str) : false;
  });
  return (lessonsOk && quizzesOk && puzzlesOk) ? 'available' : 'locked';
}

function getMissingCount(node, prog) {
  const req = node.requires || {};
  let count = 0;
  for (const id of (req.lessonComplete || [])) {
    if (!prog.completedLessons.includes(id)) count++;
  }
  for (const id of (req.quizComplete || [])) {
    const done = id <= 10
      ? prog.completedMiniQuizzes.includes(id)
      : prog.completedBigQuizzes.includes(id);
    if (!done) count++;
  }
  for (const id of (req.puzzleComplete || [])) {
    const str = pidToStr(id);
    if (!str || !prog.completedPuzzles.includes(str)) count++;
  }
  return count;
}

function getLockMessage(node, prog) {
  const req = node.requires || {};
  const missing = [];
  for (const id of (req.lessonComplete || [])) {
    if (!prog.completedLessons.includes(id)) missing.push(`Lesson ${id}`);
  }
  for (const id of (req.quizComplete || [])) {
    const done = id <= 10
      ? prog.completedMiniQuizzes.includes(id)
      : prog.completedBigQuizzes.includes(id);
    if (!done) missing.push(id <= 10 ? `Mini Quiz ${id}` : `Big Quiz ${id - 10}`);
  }
  for (const id of (req.puzzleComplete || [])) {
    const str = pidToStr(id);
    if (!str || !prog.completedPuzzles.includes(str)) {
      const lesson = Math.floor(id / 100);
      const slot   = id % 100;
      missing.push(slot === 3 ? `Boss ${lesson}` : `Puzzle ${lesson}${slot === 1 ? 'A' : 'B'}`);
    }
  }
  if (missing.length === 0) return '';
  const parts = missing.length === 1
    ? missing[0]
    : missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1];
  return `Complete ${parts} to unlock`;
}

const EMPTY_PROG = {
  completedLessons:    [],
  completedMiniQuizzes: [],
  completedBigQuizzes:  [],
  completedPuzzles:     [],
  xp: 0,
};

// ── Component ───────────────────────────────────────────────────
export default function JourneyMap() {
  useSEO({
    title:       'Your Coding Journey | CodeIt',
    description: 'Track your progress through Python lessons, quizzes, and coding puzzles on CodeIt\'s interactive learning map.',
    canonical:   '/journey',
  });

  const { user, token, logout, loading: authLoading } = useContext(AuthContext);
  const { character } = useCharacter();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [prog, setProg]       = useState(EMPTY_PROG);
  const [loading, setLoading] = useState(true);

  // XP gain flash + level-up toast
  const prevXpRef = useRef(0);
  const [xpFlash, setXpFlash] = useState(null);    // { amount, key }
  const [levelUpToast, setLevelUpToast] = useState(null); // { newLevel, title, items, key }

  // Fetch unified progress with cache-bust
  const fetchProgress = useCallback(async () => {
    if (!user || !token) { setLoading(false); return; }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/journey/progress?t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      );
      if (res.status === 401 || res.status === 403) {
        logout();
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const newXp = Number(data.xp) || 0;
          if (newXp > prevXpRef.current && prevXpRef.current > 0) {
            const gained = newXp - prevXpRef.current;
            const prevLevel = getLevel(prevXpRef.current);
            const newLevel  = getLevel(newXp);
            setXpFlash({ amount: gained, key: Date.now() });
            setTimeout(() => setXpFlash(null), 2800);
            if (newLevel > prevLevel) {
              const items = getNewlyUnlockedItems(prevLevel, newLevel);
              setLevelUpToast({
                newLevel,
                title: getLevelTitle(newLevel),
                items,
                key: Date.now(),
              });
              setTimeout(() => setLevelUpToast(null), 5000);
            }
          }
          prevXpRef.current = newXp;
          setProg({
            completedLessons:     (data.completedLessons     || []).map(Number),
            completedMiniQuizzes: (data.completedMiniQuizzes || []).map(Number),
            completedBigQuizzes:  (data.completedBigQuizzes  || []).map(Number),
            completedPuzzles:     (data.completedPuzzles     || []),
            xp: newXp,
          });
        }
      }
    } catch (e) {
      console.error('JourneyMap fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, token, logout, navigate]);

  // Fetch on mount / auth change / route re-entry (location.key changes each visit)
  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetchProgress();
  }, [authLoading, fetchProgress, location.key]);

  // Fetch on window focus (user returns from a step)
  useEffect(() => {
    const onFocus = () => { if (user && token) fetchProgress(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, token, fetchProgress]);

  const buildRoute = (node) => {
    if (!node.route) return null;
    return `${node.route}?from=journey&node=${node.id}`;
  };

  const handleNodeClick = (node, state) => {
    if (state === 'locked' || !node.route) return;
    navigate(buildRoute(node));
  };

  const nodes     = world1.nodes;
  const currentNode = nodes.find(n => computeState(n, prog) === 'available');

  return (
    <>
      <Header />
      <div className="jm-page">

        {/* Banner */}
        <div className="jm-banner">
          <span className="jm-banner__world">World 1</span>
          <h1 className="jm-banner__title">Hello Python</h1>
          <p className="jm-banner__sub">Learn Python step by step. Write real code, solve challenges, and build something you're proud of.</p>

          {!loading && user && currentNode && (
            <button className="jm-cta" onClick={() => {
              const route = buildRoute(currentNode);
              console.log('[JourneyMap] Continue clicked: node=', currentNode.id, 'label=', currentNode.title, 'route=', route);
              navigate(route);
            }}>
              {`Continue to ${currentNode.title}`}
            </button>
          )}
          {!loading && user && !currentNode && (
            <span className="jm-cta jm-cta--done">World 1 Complete!</span>
          )}
          {!loading && !user && (
            <button className="jm-cta" onClick={() => navigate('/login')}>
              Sign in to track progress
            </button>
          )}

          {user && prog.xp > 0 && (() => {
            const info = getXpProgress(prog.xp);
            const nu   = getNextUnlock(info.level);
            return (
              <>
                <p className="jm-xp-pill">
                  {prog.xp} XP earned
                  {xpFlash && (
                    <span className="jm-xp-flash" key={xpFlash.key}>+{xpFlash.amount} XP</span>
                  )}
                </p>
                {info.hasNext && (
                  <p className="jm-level-hint">
                    {info.pctToNext >= 75
                      ? `Only ${info.xpToNext} XP to Level ${info.level + 1}!`
                      : nu
                        ? `Next reward: ${getNextUnlockLabel(nu)} at Level ${nu.atLevel}`
                        : `Level ${info.level}. ${info.xpToNext} XP to Level ${info.level + 1}`
                    }
                  </p>
                )}
              </>
            );
          })()}

          {levelUpToast && (
            <div className="jm-levelup-toast" key={levelUpToast.key} role="status">
              <span className="jm-levelup-toast__badge">Level {levelUpToast.newLevel}</span>
              <span className="jm-levelup-toast__title">{levelUpToast.title} reached!</span>
              {levelUpToast.items.length > 0 && (
                <span className="jm-levelup-toast__unlocks">
                  New in Avatar Lab:{' '}
                  {levelUpToast.items.map(i => i.value).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="jm-timeline">
          {(authLoading || loading) ? (
            <div className="jm-loading">Loading your journey...</div>
          ) : (
            nodes.map((node, idx) => {
              const state     = computeState(node, prog);
              const isCurrent = currentNode?.id === node.id;
              const isDone    = state === 'completed';
              const isAvail   = state === 'available';
              const isLocked  = state === 'locked';
              const color     = !isLocked ? TYPE_COLOR[node.type] : '#4b5563';
              const lockMsg   = isLocked ? getLockMessage(node, prog) : '';
              const isLast    = idx === nodes.length - 1;
              const chapter   = CHAPTER_MARKERS[node.id];

              if (node.type === 'start') {
                return (
                  <React.Fragment key={node.id}>
                    <div className="jm-tl-start">
                      <div className="jm-tl-start__dot" />
                      <span>Start</span>
                    </div>
                    {!isLast && <div className="jm-tl-connector" />}
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={node.id}>
                  {/* Chapter header. Injected before each chapter's first node */}
                  {chapter && (
                    <div className="jm-chapter">
                      <div className="jm-chapter__line" />
                      <div className="jm-chapter__inner">
                        <span className="jm-chapter__num">Chapter {chapter.num}</span>
                        <span className="jm-chapter__title">{chapter.title}</span>
                        <span className="jm-chapter__sub">{chapter.sub}</span>
                      </div>
                      <div className="jm-chapter__line" />
                    </div>
                  )}
                  {/* Checkpoint banner. Above big quiz milestone nodes */}
                  {node.type === 'big_quiz' && (
                    <div className="jm-checkpoint">
                      <div className="jm-checkpoint__bar" />
                      <span className="jm-checkpoint__label">Checkpoint</span>
                      <div className="jm-checkpoint__bar" />
                    </div>
                  )}
                  <div className="jm-tl-item">
                    {/* Connector line from previous node */}
                    <div className={`jm-tl-connector${isDone ? ' jm-tl-connector--done' : ''}`} />

                    {/* Player avatar sits on the path at the current node */}
                    {isCurrent && user && character && (
                      <div className="jm-player-position" aria-hidden="true">
                        <CharacterAvatar character={character} size={44} />
                      </div>
                    )}

                    <div
                      className={[
                        'jm-tl-node',
                        `jm-tl-node--${state}`,
                        `jm-tl-node--${node.type}`,
                        isCurrent ? 'jm-tl-node--current' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handleNodeClick(node, state)}
                      onKeyDown={e => e.key === 'Enter' && handleNodeClick(node, state)}
                      role={!isLocked ? 'button' : undefined}
                      tabIndex={!isLocked ? 0 : -1}
                      aria-label={`${node.title}: ${node.subtitle || ''}. ${state}`}
                      aria-disabled={isLocked}
                    >
                      {/* Circle */}
                      <div
                        className="jm-tl-circle"
                        style={{ background: color, borderColor: color }}
                      >
                        {isDone
                          ? <span className="jm-tl-check">&#10003;</span>
                          : <span className="jm-tl-icon">{TYPE_ICON[node.type]}</span>
                        }
                      </div>

                      {/* Text */}
                      <div className="jm-tl-text">
                        <span className="jm-tl-type-tag" style={!isLocked ? { color } : {}}>
                          {TYPE_LABEL[node.type]}
                          {isCurrent && <span className="jm-tl-next-tag">. Your next challenge</span>}
                          {isLocked && node.type === 'boss' && <span className="jm-tl-boss-tag">. Boss challenge</span>}
                        </span>
                        <strong className="jm-tl-title">{node.title}</strong>
                        {node.subtitle && (
                          <span className={`jm-tl-sub${isLocked ? ' jm-tl-sub--locked' : ''}`}>
                            {node.subtitle}
                          </span>
                        )}
                        {isLocked && lockMsg && (
                          <span className="jm-tl-lock-hint">{lockMsg}</span>
                        )}
                        {isLocked && getMissingCount(node, prog) === 1 && (
                          <span className="jm-tl-almost">1 step away. Almost there!</span>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className={`jm-tl-badge jm-tl-badge--${state}${isCurrent ? ' jm-tl-badge--current' : ''}`}>
                        {isDone    && 'Done'}
                        {isAvail   && (isCurrent ? 'Up Next' : 'Available')}
                        {isLocked  && 'Locked'}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {!loading && !currentNode && user && (
          <div className="jm-coming-soon">
            <span>You have completed the full journey. Well done!</span>
          </div>
        )}
      </div>
    </>
  );
}
