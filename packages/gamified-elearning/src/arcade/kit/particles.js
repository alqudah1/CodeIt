// ── Confetti and sparks, on a canvas over the shell ─────────────────────────
//
// One canvas, one loop, every burst in the child's shell. `burst(x, y)` takes
// coordinates in the canvas's own box. Cheap enough to leave running: the loop
// idles when there is nothing to draw.

const COLOURS = ['#FF7A00', '#FFC93C', '#17C08B', '#7C5CFF', '#3EB7F8', '#FF6B6B'];

export function createParticles(canvas) {
  const ctx = canvas.getContext('2d');
  let parts = [];
  let raf = 0;
  let w = 0, h = 0;

  function size() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    const d = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.vx *= 0.99; p.life -= 0.016; p.rot += 0.2;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      if (p.spark) { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2);
      ctx.restore();
    }
    raf = parts.length ? requestAnimationFrame(frame) : 0;
  }
  function burst(x, y, n = 60, spark = false) {
    if (!w) size();
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 7;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, life: 1, r: spark ? 2 + Math.random() * 2 : 4 + Math.random() * 4, c: COLOURS[i % COLOURS.length], rot: Math.random() * 6, spark });
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  size();
  window.addEventListener('resize', size);
  return { burst, destroy() { window.removeEventListener('resize', size); if (raf) cancelAnimationFrame(raf); } };
}
