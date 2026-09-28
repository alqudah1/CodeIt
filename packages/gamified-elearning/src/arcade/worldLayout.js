// ── Where every lesson stands in the world ───────────────────────────────────
//
// Pure geometry, so it can be tested without a browser. The path winds up the
// world from the bottom: lesson 1 at the foot, the boss lessons on the turns.
// Coordinates are in world units; the view scales them to its width and
// scrolls to the lit node.

export const WORLD_W = 360;
export const ROW = 112;
export const FOOT = 90;

/** Nodes for `count` lessons, bottom to top. */
export function layoutNodes(count) {
  const nodes = [];
  for (let i = 0; i < count; i += 1) {
    const t = i * 0.95;
    const x = WORLD_W / 2 + Math.sin(t) * WORLD_W * 0.28;
    const y = FOOT + i * ROW;
    nodes.push({ id: i + 1, x: Math.round(x), y });
  }
  return nodes;
}

export function worldHeight(count) { return FOOT + (count - 1) * ROW + FOOT; }

/** A smooth trail through the nodes, as an SVG path in world units. */
export function trailPath(nodes, upTo = nodes.length) {
  const pts = nodes.slice(0, Math.max(0, upTo));
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1], b = pts[i];
    const c1x = a.x, c1y = a.y + (b.y - a.y) * 0.5;
    const c2x = b.x, c2y = b.y - (b.y - a.y) * 0.5;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
  }
  return d;
}

/** done | next | ahead, given the set of completed lesson ids. */
export function statusFor(id, completed) {
  if (completed.includes(id)) return 'done';
  const next = nextLesson(completed);
  return id === next ? 'next' : 'ahead';
}

/** The first lesson not yet done: the one lit node. */
export function nextLesson(completed, total = 31) {
  for (let id = 1; id <= total; id += 1) if (!completed.includes(id)) return id;
  return total;
}

export function isBoss(id) { return id % 5 === 0; }
