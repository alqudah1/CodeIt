// ── Where everything stands in the world ─────────────────────────────────────
//
// Pure geometry, so it can be tested without a browser. The road is built
// bottom-up, one unit after another: a banner, the unit's lessons on a
// winding road (a chest after the first, a crown on the last), then the
// unit's trophy. Coordinates are in world units; the view scales them to
// its width and scrolls to the lit stone.

export const WORLD_W = 390;
export const CX = 195;
export const GAP = 108;
export const BANNER = 170;
export const FOOT = 60;
export const TOP = 260;
export const ZIG = [0, 70, 105, 70, 0, -70, -105, -70];

export const LANDS = ['meadow', 'river', 'evening'];

export const UNIT_COLOURS = [
  { colour: '#58CC02', dark: '#46A302', tint: '#B5E88A', tintD: '#8FCB62' },
  { colour: '#1CB0F6', dark: '#1899D6', tint: '#A9DEFA', tintD: '#7FC5EA' },
  { colour: '#CE82FF', dark: '#A560E8', tint: '#E4C4FF', tintD: '#C99CF0' },
  { colour: '#FF9600', dark: '#E08300', tint: '#FFD59A', tintD: '#F0B860' },
  { colour: '#FF4B4B', dark: '#D93A3A', tint: '#FFB5B5', tintD: '#F08A8A' },
  { colour: '#2B70C9', dark: '#1F55A0', tint: '#A8C6F0', tintD: '#7FA6DE' },
];

/** The first lesson not yet done: the one lit stone. */
export function nextLesson(completed, total = 31) {
  for (let id = 1; id <= total; id += 1) if (!completed.includes(id)) return id;
  return total;
}

/** done | next | ahead, given the set of completed lesson ids. */
export function statusFor(id, completed, total = 31) {
  if (completed.includes(id)) return 'done';
  return id === nextLesson(completed, total) ? 'next' : 'ahead';
}

/**
 * Lay out `units` ([{ name, lessons: [{ id, title, emoji }] }]) as items on
 * one road. Returns { items, height, road, units }. Items are one of:
 *   banner  { y, unit }
 *   lesson  { id, title, emoji, x, y, unit, boss }
 *   chest   { x, y, unit, lessonId }   opens once lessonId is done
 *   trophy  { x, y, unit }             lit once every lesson of the unit is done
 */
export function buildWorld(units) {
  const items = [];
  const total = units.reduce((n, u) => n + u.lessons.length, 0);
  let y = FOOT + total * GAP + units.length * (BANNER + 2 * GAP + 10) + TOP;
  const height = y;
  y -= FOOT;
  let zi = 0;
  units.forEach((u, ui) => {
    const unit = { index: ui + 1, name: u.name, land: LANDS[ui % LANDS.length], ...UNIT_COLOURS[ui % UNIT_COLOURS.length], lessonIds: u.lessons.map((l) => l.id) };
    items.push({ kind: 'banner', y, unit }); y -= BANNER;
    u.lessons.forEach((l, li) => {
      items.push({ kind: 'lesson', id: l.id, title: shortTitle(l.title), fullTitle: l.title, emoji: l.emoji, x: CX + ZIG[zi % 8], y, unit, boss: li === u.lessons.length - 1 }); zi += 1; y -= GAP;
      if (li === 0) { items.push({ kind: 'chest', x: CX + ZIG[zi % 8], y, unit, lessonId: l.id }); zi += 1; y -= GAP; }
    });
    items.push({ kind: 'trophy', x: CX + ZIG[zi % 8], y, unit }); zi += 1; y -= GAP + 10;
  });
  const road = items.filter((i) => i.kind !== 'banner');
  return { items, height, road, units: items.filter((i) => i.kind === 'banner').map((b) => b.unit) };
}

/** A smooth road through the given points, as an SVG path. */
export function roadPath(road) {
  if (road.length < 2) return '';
  let d = `M ${road[0].x} ${road[0].y}`;
  for (let i = 1; i < road.length; i += 1) {
    const a = road[i - 1], b = road[i];
    d += ` C ${a.x} ${a.y - (a.y - b.y) * 0.5}, ${b.x} ${b.y + (a.y - b.y) * 0.5}, ${b.x} ${b.y}`;
  }
  return d;
}

/** Bottom (banner y) and top (above the trophy) of one unit's land. */
export function unitBounds(items, unit) {
  const mine = items.filter((i) => i.unit === unit);
  return { bottom: mine.find((i) => i.kind === 'banner').y, top: Math.min(...mine.map((i) => i.y)) - 60 };
}

/** The title as it fits on a road sign: the part before the first ". " or ": ", at most 24 characters. */
export function shortTitle(title) {
  let t = String(title || '').split(/[.:] /)[0].trim();
  if (t.length > 24) { t = t.slice(0, 23).replace(/\s+\S*$/, ''); t += '…'; }
  return t;
}

/** The x of the road side (left 62 or right 328) farther from the road at height y. */
export function freeSide(road, y) {
  let nearest = road[0];
  for (const r of road) if (Math.abs(r.y - y) < Math.abs(nearest.y - y)) nearest = r;
  return nearest.x >= CX ? 62 : 328;
}
