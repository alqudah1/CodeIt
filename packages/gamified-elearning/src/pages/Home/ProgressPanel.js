// ── Your progress, in one panel ─────────────────────────────────────────────
//
// Level and title, the XP bar to the next level, then three numbers: days in
// a row, minutes on CodeIt today (this device), and how much of the 31-lesson
// course is done. Every number is real: the level and lessons come from the
// server, the streak from the server or the shelf, the minutes from this
// browser's own count. A guest sees 0 XP and the honest reason, as before.

import { Link } from 'react-router-dom';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacterDisplay } from '../../context/CharacterContext';
import { TOTAL_LESSONS } from '../Lessons/lessonRegistry';
import { LEVELS } from './today';
import './ProgressPanel.css';

/** How far through the current level, 0 to 100. */
export function levelPercent(level) {
  if (!level?.next) return 100;
  const base = (LEVELS.find((l) => l.n === level.n) || LEVELS[0]).at;
  return Math.max(0, Math.min(100, ((level.xp - base) / (level.next - base)) * 100));
}

export function coursePercent(lessonsDone, total = TOTAL_LESSONS) {
  const done = Math.max(0, Number(lessonsDone) || 0);
  return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
}

export default function ProgressPanel({ level, streak, minutes, lessonsDone, guest }) {
  const { character } = useCharacterDisplay();
  const done = Math.max(0, Number(lessonsDone) || 0);
  const pct = coursePercent(done);
  return (
    <section className="pp-panel ci-blk ci-rise" aria-labelledby="pp-panel-title" style={{ animationDelay: '.05s' }}>
      <div className="ci-ey pp-panel__ey" id="pp-panel-title">Your progress</div>
      <div className="pp-panel__top">
        <Link to="/character" className="pp-panel__avatar" aria-label="Change your look">
          <CharacterAvatar character={character} size={56} />
        </Link>
        <div className="pp-panel__level">
          <div className="pp-panel__lv">Level {level.n} <span>{level.title}</span></div>
          <div className="pp-panel__bar" role="progressbar" aria-valuenow={level.xp} aria-valuemin={0} aria-valuemax={level.next || level.xp} aria-label="XP">
            <i style={{ width: `${levelPercent(level)}%` }} />
          </div>
          <div className="pp-panel__xp">
            {guest
              ? '0 XP. Make an account to keep it.'
              : level.next ? `${level.xp} / ${level.next} XP` : `${level.xp} XP, top level`}
          </div>
        </div>
      </div>
      <div className="pp-panel__tiles">
        <div className="pp-panel__tile pp-panel__tile--streak">
          <div className="ci-num">{streak}</div>
          <div className="ci-cap">{streak === 1 ? 'day in a row' : 'days in a row'}</div>
        </div>
        <div className="pp-panel__tile pp-panel__tile--time">
          <div className="ci-num">{minutes}</div>
          <div className="ci-cap">{minutes === 1 ? 'minute today' : 'min today'}</div>
        </div>
        <Link to="/lessons" className="pp-panel__tile pp-panel__tile--course">
          <div className="ci-num">{pct}%</div>
          <div className="ci-cap">{done} of {TOTAL_LESSONS} lessons</div>
        </Link>
      </div>
    </section>
  );
}
