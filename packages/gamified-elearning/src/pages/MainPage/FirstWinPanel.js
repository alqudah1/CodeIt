import { Link } from 'react-router-dom';
import { trackEvent } from '../../utils/trackEvent';

export default function FirstWinPanel({ token }) {
  return (
    <section className="mp-first-win" aria-labelledby="mp-first-win-title">
      <div className="mp-first-win__copy">
        <span>Start here</span>
        <h2 id="mp-first-win-title">Make something you can play in about 10 minutes.</h2>
        <p>
          Start with your own idea, get a working first version, then change it until
          the project feels like yours. Save it to earn your first 25 XP.
        </p>
      </div>
      <div className="mp-first-win__steps" aria-label="Your first CodeIt session">
        <span><b>1</b> Describe your idea</span>
        <span><b>2</b> Play the first version</span>
        <span><b>3</b> Change it and save it</span>
      </div>
      <div className="mp-first-win__actions">
        <Link
          to="/builder?welcome=1"
          className="mp-first-win__primary"
        >
          Build my first project <span aria-hidden="true">→</span>
        </Link>
        <Link
          to="/lesson/1"
          className="mp-first-win__secondary"
          onClick={() => void trackEvent('learning_start', 'lesson-one', token)}
        >
          Start with Lesson 1
        </Link>
      </div>
    </section>
  );
}
