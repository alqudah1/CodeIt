import React, { Suspense, lazy, Component, useEffect, useState } from 'react';
import './SplineScene.css';
import BrandLogo from '../BrandLogo/BrandLogo';

// Lazy-load @splinetool/react-spline so it never blocks the main bundle
const Spline = lazy(() => import('@splinetool/react-spline'));

/**
 * Returns true only if this browser can safely create a WebGL(2) context.
 * Run client-side only — never call during SSR.
 */
function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    // Spline requires WebGL2; also accept WebGL1 as a sanity check but
    // the scene itself will fail if the renderer needs WebGL2 features.
    const ctx =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!ctx) return false;
    // Some old Chromium builds expose a stub context whose methods throw.
    // clearBufferfv is one of the WebGL2 methods that crashes on such stubs.
    if (typeof ctx.clearBufferfv !== 'function') return false;
    // Clean up the context so the GPU memory is released immediately.
    const ext = ctx.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    return true;
  } catch (_) {
    return false;
  }
}

/** Error Boundary — catches any runtime crash inside the Spline renderer */
class SplineErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(err) {
    // Log for debugging without letting the error propagate to the root
    console.warn('[SplineScene] 3D scene error (showing fallback):', err?.message || err);
  }

  render() {
    if (this.state.crashed) return <SplineStaticFallback />;
    return this.props.children;
  }
}

/** Branded static fallback — intentional, not broken-looking */
function SplineStaticFallback() {
  return (
    <div className="spline-scene__static-fallback" aria-label="CodeIt interactive learning">
      <BrandLogo
        alt="CodeIt"
        className="spline-scene__fallback-logo"
      />
      <p className="spline-scene__fallback-tagline">Python learning, reimagined for kids</p>
    </div>
  );
}

/** Spinner shown while the Spline bundle downloads */
function SplineLoadingFallback() {
  return (
    <div className="spline-scene__loader" aria-label="Loading 3D scene">
      <div className="spline-scene__spinner" />
      <span className="spline-scene__loader-text">Loading scene</span>
    </div>
  );
}

/**
 * SplineScene
 * props:
 *   scene     {string}  - Spline scene URL (.splinecode)
 *   className {string}  - extra class for the wrapper div
 */
export default function SplineScene({ scene, className }) {
  // null = still detecting, true = supported, false = not supported
  const [webGLSupported, setWebGLSupported] = useState(null);

  useEffect(() => {
    // Detection must run client-side after mount (window/document required)
    setWebGLSupported(canUseWebGL());
  }, []);

  return (
    <div className={['spline-scene', className].filter(Boolean).join(' ')}>
      {/* Detecting — show spinner */}
      {webGLSupported === null && <SplineLoadingFallback />}

      {/* No WebGL support — skip Spline entirely, show branded fallback */}
      {webGLSupported === false && <SplineStaticFallback />}

      {/* WebGL confirmed — load Spline inside an Error Boundary */}
      {webGLSupported === true && (
        <SplineErrorBoundary>
          <Suspense fallback={<SplineLoadingFallback />}>
            <Spline scene={scene} className="spline-scene__canvas" />
          </Suspense>
        </SplineErrorBoundary>
      )}
    </div>
  );
}
