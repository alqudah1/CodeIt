import { Link } from 'react-router-dom';
import { trackEvent } from '../../utils/trackEvent';

export default function FirstWinPanel({ token }) {
  return (
    <section className="mp-first-win" aria-labelledby="mp-first-win-title">
      <div className="mp-first-win__copy">
        <span>Start here</span>
        <h2 id="mp-first-win-title">Get your first win in about 10 minutes.</h2>
        <p>
          Begin with one short Python lesson. You will run real code, see the result,
          and unlock your first quiz.
        </p>
      </div>
      <div className="mp-first-win__steps" aria-label="Your first CodeIt session">
        <span><b>1</b> Run your first code</span>
        <span><b>2</b> Finish Lesson 1</span>
        <span><b>3</b> Try the quiz</span>
      </div>
      <div className="mp-first-win__actions">
        <Link
          to="/lesson/1"
          className="mp-first-win__primary"
          onClick={() => void trackEvent('learning_start', 'lesson-one', token)}
        >
          Start Lesson 1 <span aria-hidden="true">→</span>
        </Link>
        <Link to="/builder" className="mp-first-win__secondary">
          I want to build first
        </Link>
      </div>
    </section>
  );
}
