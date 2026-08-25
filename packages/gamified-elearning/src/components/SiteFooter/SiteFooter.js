import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../BrandLogo/BrandLogo';
import './SiteFooter.css';

const LESSONS = [
  { id: 1,  label: 'Hello Python' },
  { id: 2,  label: 'Variables' },
  { id: 4,  label: 'If Statements' },
  { id: 6,  label: 'Loops' },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">

        <div className="site-footer__brand">
          <Link className="site-footer__home" to="/" aria-label="CodeIt home">
            <BrandLogo className="site-footer__logo" />
          </Link>
          <p>Build something. Learn the code. Make it yours.</p>
          <Link className="site-footer__build" to="/builder">
            Build a free project <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="site-footer__col">
          <strong>Build &amp; learn</strong>
          <ul>
            <li><Link to="/builder">Studio</Link></li>
            <li><Link to="/ai-website-builder-for-kids">AI website builder for kids</Link></li>
            <li><Link to="/playground">Python playground</Link></li>
            <li><Link to="/lessons">All beginner lessons</Link></li>
            {LESSONS.map(l => (
              <li key={l.id}>
                <Link to={`/lesson/${l.id}`}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer__col">
          <strong>For families</strong>
          <ul>
            <li><Link to="/coding-for-kids">How CodeIt works</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/pricing">Join the family pilot</Link></li>
          </ul>
          <strong>Explore</strong>
          <ul>
            <li><Link to="/first-game-challenge">Build your first game challenge</Link></li>
            <li><Link to="/explore">Play and remix projects</Link></li>
            <li><Link to="/games">Coding games</Link></li>
            <li><Link to="/journey">Learning journey</Link></li>
            <li><Link to="/blog">Guides and project ideas</Link></li>
            <li><Link to="/guide">Coding guides for parents</Link></li>
            <li><Link to="/about">About CodeIt</Link></li>
            <li><Link to="/faq">Frequently asked questions</Link></li>
          </ul>
        </div>

      </div>
      <div className="site-footer__bottom">
        <span>&copy; {new Date().getFullYear()} CodeIt</span>
        <Link to="/privacy">Privacy &amp; safety</Link>
        <Link to="/terms">Terms</Link>
        <a href="/sitemap.xml">Sitemap</a>
      </div>
    </footer>
  );
}
