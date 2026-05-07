import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import Header from '../Header/Header';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import CodeRunnerPython from '../../components/CodeRunnerPython';
import { PUZZLE_CONFIGS } from './puzzleConfigs';
import { API_BASE_URL } from '../../config/api';
import { usePlayerProgress } from '../../hooks/usePlayerProgress';
import { getXpProgress, getNextUnlock, getNextUnlockLabel } from '../../data/unlocks';
import './JourneyPuzzle.css';

// ── Next step map — button label + route, one source of truth ───────────────
// label → text shown on the "Continue to …" button
// route → passed to navigate() when the user clicks that button (manual only)
const NEXT_STEP = {
  // Lesson 1: A → B → Boss → Journey Map (Lesson 2 now unlocked there)
  '1-a':    { label: 'Puzzle 1B',      route: '/journey/puzzle/1/b?from=journey&node=puzzle1b' },
  '1-b':    { label: 'Boss 1',         route: '/journey/puzzle/1/boss?from=journey&node=boss1' },
  '1-boss': { label: 'Journey Map',    route: '/journey' },
  // Lesson 2: A → B → Boss → Journey Map (Lesson 3 now unlocked there)
  '2-a':    { label: 'Puzzle 2B',      route: '/journey/puzzle/2/b?from=journey&node=puzzle2b' },
  '2-b':    { label: 'Boss 2',         route: '/journey/puzzle/2/boss?from=journey&node=boss2' },
  '2-boss': { label: 'Journey Map',    route: '/journey' },
  // Lesson 3: A → B → Boss → Big Quiz 1
  '3-a':    { label: 'Puzzle 3B',      route: '/journey/puzzle/3/b?from=journey&node=puzzle3b' },
  '3-b':    { label: 'Boss 3',         route: '/journey/puzzle/3/boss?from=journey&node=boss3' },
  '3-boss': { label: 'Big Quiz 1',     route: '/quiz/11?from=journey&node=bigquiz1' },
  // Lesson 4: A → B → Boss → Journey Map (Lesson 5 now unlocked there)
  '4-a':    { label: 'Puzzle 4B',      route: '/journey/puzzle/4/b?from=journey&node=puzzle4b' },
  '4-b':    { label: 'Boss 4',         route: '/journey/puzzle/4/boss?from=journey&node=boss4' },
  '4-boss': { label: 'Journey Map',    route: '/journey' },
  // Lesson 5: A → B → Boss → Journey Map (Lesson 6 now unlocked there)
  '5-a':    { label: 'Puzzle 5B',      route: '/journey/puzzle/5/b?from=journey&node=puzzle5b' },
  '5-b':    { label: 'Boss 5',         route: '/journey/puzzle/5/boss?from=journey&node=boss5' },
  '5-boss': { label: 'Journey Map',    route: '/journey' },
  // Lesson 6: A → B → Boss → Big Quiz 2
  '6-a':    { label: 'Puzzle 6B',      route: '/journey/puzzle/6/b?from=journey&node=puzzle6b' },
  '6-b':    { label: 'Boss 6',         route: '/journey/puzzle/6/boss?from=journey&node=boss6' },
  '6-boss': { label: 'Big Quiz 2',     route: '/quiz/12?from=journey&node=bigquiz2' },
  // Lesson 7: A → B → Boss → Journey Map (Lesson 8 now unlocked there)
  '7-a':    { label: 'Puzzle 7B',      route: '/journey/puzzle/7/b?from=journey&node=puzzle7b' },
  '7-b':    { label: 'Boss 7',         route: '/journey/puzzle/7/boss?from=journey&node=boss7' },
  '7-boss': { label: 'Journey Map',    route: '/journey' },
  // Lesson 8: A → B → Boss → Journey Map (Lesson 9 now unlocked there)
  '8-a':    { label: 'Puzzle 8B',      route: '/journey/puzzle/8/b?from=journey&node=puzzle8b' },
  '8-b':    { label: 'Boss 8',         route: '/journey/puzzle/8/boss?from=journey&node=boss8' },
  '8-boss': { label: 'Journey Map',    route: '/journey' },
  // Lesson 9: A → B → Boss → Big Quiz 3
  '9-a':    { label: 'Puzzle 9B',      route: '/journey/puzzle/9/b?from=journey&node=puzzle9b' },
  '9-b':    { label: 'Boss 9',         route: '/journey/puzzle/9/boss?from=journey&node=boss9' },
  '9-boss': { label: 'Big Quiz 3',     route: '/quiz/13?from=journey&node=bigquiz3' },
  // Lesson 10: A → B → Boss → Journey Complete
  '10-a':   { label: 'Puzzle 10B',     route: '/journey/puzzle/10/b?from=journey&node=puzzle10b' },
  '10-b':   { label: 'Boss 10',        route: '/journey/puzzle/10/boss?from=journey&node=boss10' },
  '10-boss':{ label: 'Journey Complete', route: '/journey?complete=1' },
};

const JourneyPuzzle = () => {
  const { lessonId, slot } = useParams();
  const { user, token } = useContext(AuthContext);
  const { character } = useCharacter();
  const { xp: prePuzzleXp } = usePlayerProgress(token);
  const navigate = useNavigate();

  const configKey = `${lessonId}-${slot}`;
  const config = PUZZLE_CONFIGS[configKey];

  const [lastOutput, setLastOutput] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionXp, setCompletionXp] = useState(null);
  const [hintCount, setHintCount] = useState(0);
  const [editorSeed, setEditorSeed] = useState(0);
  const [injectedCode, setInjectedCode] = useState(null);

  // ── Reset all per-puzzle state when the route params change ─────────────────
  // React Router reuses the same JourneyPuzzle instance for all
  // /journey/puzzle/:lessonId/:slot routes. Reset state so a completed puzzle
  // never bleeds into the next one.
  useEffect(() => {
    setLastOutput('');
    setCheckResult(null);
    setAlreadyDone(false);
    setCompleting(false);
    setCompletionXp(null);
    setHintCount(0);
    setEditorSeed(0);
    setInjectedCode(null);
  }, [configKey]);

  // Check if already completed
  useEffect(() => {
    if (!token || !config) return;
    fetch(`${API_BASE_URL}/api/puzzles/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if ((data.completedPuzzles || []).map(String).includes(String(config.id))) {
          setAlreadyDone(true);
          setCheckResult({ pass: true, message: 'Already completed — well done!' });
        }
      })
      .catch(() => {});
  }, [token, config]);

  const handleOutput = useCallback((output) => {
    setLastOutput(output);
    setCheckResult(null);
  }, []);

  const handleTryThis = () => {
    setInjectedCode(config.hintCode);
    setEditorSeed(s => s + 1);
  };

  const handleCheck = async () => {
    if (!config) return;
    const result = config.validator(lastOutput);
    setCheckResult(result);

    if (!result.pass) {
      // Auto-reveal first hint when the answer is wrong
      setHintCount(c => Math.max(c, 1));
    }

    if (result.pass && !alreadyDone) {
      setCompleting(true);
      if (user && token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/puzzles/${config.id}/complete`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => ({}));
          if (!data.alreadyCompleted && data.xpEarned > 0) {
            setCompletionXp(data.xpEarned);
          }
        } catch (_) {}
      }
      setCompleting(false);
      setAlreadyDone(true);
    }
  };

  // Resolve the next step once from the single source of truth.
  // Both the UI label and the navigate() call read from this same object.
  const nextStep = NEXT_STEP[configKey] || null;

  const handleContinue = () => {
    console.log('[JourneyPuzzle] Continue clicked:', configKey, '→ label:', nextStep?.label, '→ route:', nextStep?.route ?? '/journey');
    navigate(nextStep?.route ?? '/journey');
  };

  const slotLabels = { a: 'A', b: 'B', boss: 'Boss' };

  if (!config) {
    return (
      <>
        <Header />
        <div className="jp-notfound">
          <h2>Puzzle not found</h2>
          <button className="jp-btn jp-btn--ghost" onClick={() => navigate('/journey')}>
            Back to Journey
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="jp-page">
        <div className="jp-container">
          <button className="jp-back" onClick={() => navigate('/journey')}>
            &#8592; Back to Journey
          </button>

          <div className="jp-header">
            <div className="jp-header__meta">
              <span className="jp-header__tag">Lesson {lessonId} &mdash; Puzzle {slotLabels[slot]}</span>
              {nextStep && (
                <span className="jp-header__next-hint">
                  Next: {nextStep.label}
                </span>
              )}
            </div>
            <h1 className="jp-header__title">{config.title}</h1>
          </div>

          <div className="jp-story">
            <p>{config.story}</p>
          </div>

          <div className="jp-goals">
            <h3 className="jp-goals__heading">Mission Goals</h3>
            <ul className="jp-goals__list">
              {config.goals.map((goal, i) => (
                <li key={i} className="jp-goals__item">
                  <span className="jp-goals__num">{i + 1}</span>
                  {goal}
                </li>
              ))}
            </ul>
          </div>

          <div className="jp-editor">
            <CodeRunnerPython
              key={`${configKey}-${editorSeed}`}
              starterCode={injectedCode ?? config.starterCode}
              title="Python Editor"
              onOutput={handleOutput}
            />
          </div>

          <div className="jp-check-area">
            {!alreadyDone && (
              <button
                className="jp-btn jp-btn--check"
                onClick={handleCheck}
                disabled={!lastOutput || completing}
              >
                {completing ? 'Saving...' : 'Check My Answer'}
              </button>
            )}

            {!alreadyDone && config.hints && config.hints.length > 0 && (
              <div className="jp-hints">
                {hintCount > 0 && (
                  <div className="jp-hint">
                    <span className="jp-hint__label">
                      Hint{config.hints.length > 1 ? ` ${hintCount}` : ''}
                    </span>
                    <span>{config.hints[hintCount - 1]}</span>
                  </div>
                )}
                {hintCount < config.hints.length && (
                  <button
                    type="button"
                    className="jp-btn jp-btn--hint"
                    onClick={() => setHintCount(c => c + 1)}
                  >
                    {hintCount === 0 ? 'Hint' : 'Next Hint'}
                  </button>
                )}
                {hintCount === config.hints.length && config.hintCode && (
                  <button
                    type="button"
                    className="jp-btn jp-btn--try"
                    onClick={handleTryThis}
                  >
                    Try this
                  </button>
                )}
              </div>
            )}

            {!lastOutput && !alreadyDone && (
              <p className="jp-check-hint">Run your code first, then click Check.</p>
            )}

            {checkResult && (
              <div className={`jp-result jp-result--${checkResult.pass ? 'pass' : 'fail'}`}>
                <span className="jp-result__icon">{checkResult.pass ? '+' : '!'}</span>
                <span className="jp-result__msg">{checkResult.message}</span>
              </div>
            )}

            {alreadyDone && (
              <div className="jp-done-actions">
                <div className="jp-done-reward">
                  {character && (
                    <div className="jp-done-reward__avatar">
                      <CharacterAvatar character={character} size={56} />
                    </div>
                  )}
                  <div className="jp-done-reward__text">
                    {completionXp > 0 && (
                      <span className="jp-done-xp">+{completionXp} XP</span>
                    )}
                    <span className="jp-done-reward__msg">
                      {checkResult?.message || 'Puzzle complete!'}
                    </span>
                    {completionXp > 0 && (() => {
                      const newXp = (prePuzzleXp || 0) + completionXp;
                      const info  = getXpProgress(newXp);
                      const nu    = getNextUnlock(info.level);
                      if (info.hasNext && info.pctToNext >= 70) {
                        return (
                          <span className="jp-done-level-hint jp-done-level-hint--urgent">
                            Only {info.xpToNext} XP to Level {info.level + 1}!
                          </span>
                        );
                      }
                      if (nu) {
                        return (
                          <span className="jp-done-level-hint">
                            Next reward: {getNextUnlockLabel(nu)} at Level {nu.atLevel}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <button
                  className="jp-btn jp-btn--primary"
                  onClick={handleContinue}
                >
                  {`Continue to ${nextStep?.label ?? 'Next Step'} →`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default JourneyPuzzle;
