import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SplineScene from '../SplineScene/SplineScene';
import './SplineHeroCard.css';

/**
 * SplineHeroCard
 * A dark glass card: text copy on the left, 3D Spline scene on the right.
 * Spotlight glow tracks the mouse cursor via CSS custom properties.
 *
 * props:
 *   scene       {string}  - Spline scene URL
 *   eyebrow     {string}  - small label above title
 *   title       {string}  - main heading
 *   description {string}  - paragraph text
 *   ctaLabel    {string}  - button label
 *   ctaRoute    {string}  - react-router path for the CTA button
 */
export default function SplineHeroCard({
  scene,
  eyebrow     = 'Interactive 3D',
  title       = 'Code Comes Alive',
  description = 'Python is not just text on a screen. Explore interactive 3D worlds built around the concepts you are learning.',
  ctaLabel    = 'Start Your Journey',
  ctaRoute    = '/journey',
}) {
  const cardRef  = useRef(null);
  const navigate = useNavigate();

  // Track mouse to move the spotlight radial gradient
  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    // Reset to centre when mouse leaves
    card.style.setProperty('--spot-x', '50%');
    card.style.setProperty('--spot-y', '50%');
  }, []);

  return (
    <div
      ref={cardRef}
      className="sphc-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Spotlight overlay — rendered via CSS custom properties */}
      <div className="sphc-spotlight" aria-hidden="true" />

      {/* Left: text */}
      <div className="sphc-copy">
        {eyebrow && <p className="sphc-eyebrow">{eyebrow}</p>}
        <h2 className="sphc-title">{title}</h2>
        <p className="sphc-desc">{description}</p>
        <button
          className="sphc-cta"
          onClick={() => navigate(ctaRoute)}
        >
          {ctaLabel}
        </button>
      </div>

      {/* Right: 3D scene */}
      <div className="sphc-scene-wrap">
        <SplineScene scene={scene} />
      </div>
    </div>
  );
}
