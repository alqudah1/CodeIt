import React from 'react';
import { Link } from 'react-router-dom';
import './SiteFooter.css';

const LESSONS = [
  { id: 1,  label: 'Hello Python' },
  { id: 2,  label: 'Variables' },
  { id: 3,  label: 'Strings' },
  { id: 4,  label: 'If Statements' },
  { id: 5,  label: 'For Loops (range)' },
  { id: 6,  label: 'For Loops (strings)' },
  { id: 7,  label: 'Lists' },
  { id: 8,  label: 'Loops with Lists' },
  { id: 9,  label: 'Functions' },
  { id: 10, label: 'Combining Concepts' },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">

        <div className="site-footer__col">
          <strong>Python Lessons</strong>
          <ul>
            {LESSONS.map(l => (
              <li key={l.id}>
                <Link to={`/lesson/${l.id}`}>Lesson {l.id}: {l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer__col">
          <strong>Learn</strong>
          <ul>
            <li><Link to="/lessons">All Lessons</Link></li>
            <li><Link to="/games">Coding Games</Link></li>
            <li><Link to="/journey">Learning Journey</Link></li>
            <li><Link to="/playground">Python Playground</Link></li>
          </ul>
          <strong>Topics</strong>
          <ul>
            <li><Link to="/learn-python-for-kids">Learn Python for Kids</Link></li>
            <li><Link to="/coding-for-kids">Coding for Kids</Link></li>
            <li><Link to="/python-games-for-kids">Python Games for Kids</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <strong>Blog</strong>
          <ul>
            <li><Link to="/blog">All Articles</Link></li>
            <li><Link to="/blog/learn-python-for-kids">Learn Python for Kids Guide</Link></li>
            <li><Link to="/blog/python-coding-games">Python Coding Games</Link></li>
            <li><Link to="/blog/how-to-start-coding-for-beginners">How to Start Coding</Link></li>
            <li><Link to="/blog/best-coding-games-for-kids">Best Coding Games for Kids</Link></li>
            <li><Link to="/blog/python-basics-for-beginners">Python Basics for Beginners</Link></li>
            <li><Link to="/blog/is-python-good-for-kids">Is Python Good for Kids?</Link></li>
            <li><Link to="/blog/coding-for-kids-beginner-guide">Coding for Kids Guide</Link></li>
          </ul>
        </div>

      </div>
      <p className="site-footer__copy">
        &copy; {new Date().getFullYear()} CodeIt &mdash; Free Python lessons for beginners.
        &nbsp;<a href="https://codeitlearn.com/sitemap.xml">Sitemap</a>
      </p>
    </footer>
  );
}
