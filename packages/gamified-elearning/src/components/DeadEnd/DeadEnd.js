import { Link } from 'react-router-dom';
import Header from '../../pages/Header/Header';
import './DeadEnd.css';

// ── Every dead end is a room with doors ─────────────────────────────────────
//
// The walkthrough found a quiz with no questions rendering as a bare white
// card on a bare page: no header, no mascot, no way onward. To a kid that
// reads as "I broke it." This is the replacement, used anywhere content is
// missing or a screen fails: the header stays, Pixel shows up with ONE honest
// kid-readable sentence, and there are always two doors onward. Raw error
// strings never come through here — callers pass words, not exceptions.

const DeadEnd = ({ title, line, doors }) => (
  <div className="deadend">
    <Header />
    <main className="deadend__room">
      <img className="deadend__pixel" src="/brand/pixel-guide.png" alt="" width="96" height="96" />
      <h1 className="deadend__title">{title}</h1>
      <p className="deadend__line">{line}</p>
      <div className="deadend__doors">
        {(doors || []).map(door => (
          door.onClick ? (
            <button type="button" key={door.label} className={`deadend__door${door.primary ? ' deadend__door--primary' : ''}`} onClick={door.onClick}>
              {door.label}
            </button>
          ) : (
            <Link key={door.label} className={`deadend__door${door.primary ? ' deadend__door--primary' : ''}`} to={door.to}>
              {door.label}
            </Link>
          )
        ))}
      </div>
    </main>
  </div>
);

export default DeadEnd;
