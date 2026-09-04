import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MAX_DISMISSALS, challengeDone, conceptSentence, nextChallenge } from './challenges';
import { trackEvent } from '../../utils/trackEvent';
import './ChallengeCard.css';

// ── One rung at a time ───────────────────────────────────────────────────────
//
// The improvement ladder (challenges.js), on the Play page, beside the game it
// is about. It offers ONE challenge. The child does it however they like: the
// sliders, the Change tab, asking in words. Nothing here has a "done" button,
// because the file is re-read every time it changes and the check says whether
// the thing happened. When it did, the concept is named, as a reward, and the
// two-minute lesson is offered.
//
// Rules from the brief: never a list; dismissing costs nothing and shows no
// badge or counter; it never blocks building, publishing or leaving; and after
// three dismissals in a row it stops for the session.

const STREAK_KEY = 'codeit_ladder_dismissals';
const SKIP_KEY = 'codeit_ladder_skip';

function readSession(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeSession(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

export default function ChallengeCard({ code, projectKey, onOffer }) {
  const [skip, setSkip] = useState(() => readSession(SKIP_KEY, []));
  const [dismissals, setDismissals] = useState(() => readSession(STREAK_KEY, 0));
  const [offer, setOffer] = useState(null);      // { id, prompt, hint, lesson, before }
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(null);         // { sentence, lesson, id }
  const lastProjectRef = useRef(projectKey);

  const stopped = dismissals >= MAX_DISMISSALS;

  // A new project is a new ladder.
  useEffect(() => {
    if (lastProjectRef.current !== projectKey) {
      lastProjectRef.current = projectKey;
      setOffer(null);
      setDone(null);
      setShowHint(false);
    }
  }, [projectKey]);

  // Offer the next rung whenever there is a project and nothing on the table.
  useEffect(() => {
    if (!code || stopped || offer || done) return;
    const next = nextChallenge(code, { skip });
    if (next) {
      setOffer({ ...next, before: code });
      setShowHint(false);
    }
  }, [code, stopped, offer, done, skip]);

  // Tell the page which rung is up, so the ideas strip beside it does not
  // offer the same change in different words.
  useEffect(() => { onOffer?.(offer ? { id: offer.id, prompt: offer.prompt, variable: offer.variable || null } : null); }, [offer, onOffer]);

  // The check: every change to the file is read against the offer.
  useEffect(() => {
    if (!offer || done || !code || code === offer.before) return;
    if (challengeDone(offer.id, offer.before, code)) {
      const sentence = conceptSentence(offer.id, offer.before);
      setDone({ id: offer.id, sentence, lesson: offer.lesson });
      setOffer(null);
      const nextSkip = [...skip, offer.id];
      setSkip(nextSkip);
      writeSession(SKIP_KEY, nextSkip);
      // Doing one ends any run of dismissals.
      setDismissals(0);
      writeSession(STREAK_KEY, 0);
      void trackEvent('ladder_done', offer.id);
    }
  }, [code, offer, done, skip]);

  const dismiss = () => {
    if (!offer) return;
    const nextSkip = [...skip, offer.id];
    setSkip(nextSkip);
    writeSession(SKIP_KEY, nextSkip);
    const streak = dismissals + 1;
    setDismissals(streak);
    writeSession(STREAK_KEY, streak);
    setOffer(null);
    setShowHint(false);
    void trackEvent('ladder_skip', offer.id);
  };

  const hasNext = useMemo(() => (code ? Boolean(nextChallenge(code, { skip })) : false), [code, skip]);

  if (stopped && !done) return null;

  if (done) {
    return (
      <div className="ladder ladder--done" role="status" data-testid="ladder-done">
        <p className="ladder__kicker">You did it</p>
        <p className="ladder__sentence">{done.sentence}</p>
        <div className="ladder__actions">
          <Link className="ladder__lesson" to={`/lesson/${done.lesson}`} onClick={() => void trackEvent('ladder_lesson', done.id)}>
            Two minutes on this: lesson {done.lesson}
          </Link>
          {hasNext && !stopped && (
            <button type="button" className="ladder__next" onClick={() => setDone(null)}>
              Next challenge
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!offer) return null;

  return (
    <div className="ladder" data-testid="ladder-offer">
      <p className="ladder__kicker">Make it better</p>
      <p className="ladder__prompt">{offer.prompt}</p>
      {showHint && <p className="ladder__hint">{offer.hint}</p>}
      <div className="ladder__actions">
        {!showHint && (
          <button type="button" className="ladder__hint-btn" onClick={() => setShowHint(true)}>
            Show me a hint
          </button>
        )}
        <button type="button" className="ladder__skip" onClick={dismiss}>
          Skip this one
        </button>
      </div>
    </div>
  );
}
