import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZE = {
  sm: { px: 300, fontSize: '0.72rem', tracking: '0.25em', radius: 130, gap: 40, imgPct: '72%', fw: 600 },
  md: { px: 400, fontSize: '0.85rem', tracking: '0.30em', radius: 158, gap: 30, imgPct: '74%', fw: 600 },
  lg: { px: 500, fontSize: '1rem',    tracking: '0.35em', radius: 185, gap: 20, imgPct: '76%', fw: 600 },
};

function usePreloadImages(images) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    Promise.all(
      images.map(
        (src) =>
          new Promise((res, rej) => {
            const img = new Image();
            img.src = src;
            img.onload = res;
            img.onerror = rej;
          })
      )
    )
      .then(() => setLoaded(true))
      .catch(() => {});
  }, [images]);
  return loaded;
}

function ImageOverlay({ src, imgPct }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: imgPct, height: imgPct,
          objectFit: 'cover', borderRadius: '50%',
          filter: 'brightness(0.88)',
        }}
      />
    </motion.div>
  );
}

export function CircularRevealHeading({ items, centerText, size = 'md', className }) {
  const cfg = SIZE[size] || SIZE.md;
  const [activeImg, setActiveImg] = useState(null);
  const ready = usePreloadImages(items.map((i) => i.image));

  const totalGap = cfg.gap * items.length;
  const available = 360 - totalGap;
  const segDeg = available / items.length;

  const segments = items.map((item, idx) => {
    const startPct = `${((idx * (segDeg + cfg.gap)) / 360) * 100}%`;
    return (
      <g key={idx}>
        <text
          style={{
            fontSize: cfg.fontSize,
            letterSpacing: cfg.tracking,
            fontWeight: cfg.fw,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          onMouseEnter={() => ready && setActiveImg(item.image)}
          onMouseLeave={() => setActiveImg(null)}
        >
          <textPath
            href="#crh-path"
            startOffset={startPct}
            textLength={`${segDeg * 1.8}`}
            lengthAdjust="spacingAndGlyphs"
            fill="url(#crh-grad)"
          >
            {item.text}
          </textPath>
        </text>
      </g>
    );
  });

  return (
    <>
      {/* silent preload */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {items.map((i, k) => <img key={k} src={i.image} alt="" />)}
      </div>

      <motion.div
        whileHover={{ boxShadow: '22px 22px 44px #bebebe, -22px -22px 44px #ffffff' }}
        whileTap={{ scale: 0.97 }}
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className={className}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: cfg.px,
          height: cfg.px,
          borderRadius: '50%',
          background: '#ebebeb',
          boxShadow: '16px 16px 32px #c8c8c8, -16px -16px 32px #ffffff',
          flexShrink: 0,
        }}
      >
        <AnimatePresence>
          {activeImg && ready && <ImageOverlay src={activeImg} imgPct={cfg.imgPct} />}
        </AnimatePresence>

        {/* rim layers */}
        <div style={{
          position: 'absolute', inset: 2, borderRadius: '50%', background: '#ebebeb',
          boxShadow: 'inset 6px 6px 12px #d2d2d2, inset -6px -6px 12px #ffffff',
        }} />
        <div style={{
          position: 'absolute', inset: 14, borderRadius: '50%', background: '#ebebeb',
          boxShadow: 'inset 4px 4px 8px #d2d2d2, inset -4px -4px 8px #ffffff',
        }} />

        {/* center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AnimatePresence>
            {!activeImg && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: 'relative', zIndex: 10,
                  padding: '1.4rem', borderRadius: '1.4rem', background: '#ebebeb',
                }}
              >
                {centerText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* spinning ring */}
        <motion.div
          style={{ position: 'absolute', inset: 0 }}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="crh-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF8A3D" />
                <stop offset="100%" stopColor="#1F2A44" />
              </linearGradient>
            </defs>
            <path
              id="crh-path"
              fill="none"
              d={`M 200,200 m -${cfg.radius},0 a ${cfg.radius},${cfg.radius} 0 1,1 ${cfg.radius * 2},0 a ${cfg.radius},${cfg.radius} 0 1,1 -${cfg.radius * 2},0`}
            />
            {segments}
          </svg>
        </motion.div>
      </motion.div>
    </>
  );
}
