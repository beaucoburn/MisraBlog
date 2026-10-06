// Pure logic for the desktop daisy bloom trail (components/BloomTrail.svelte),
// kept free of the DOM so the spawn, keep-out and cap rules can be unit
// tested. Rules come from CLAUDE.md "Design: Daisy Motif"; timing and
// variety from src/assets/daisies/README.md.

export type DaisyColor = 'white' | 'pink';

export interface Bloom {
  id: number;
  x: number;
  y: number;
  color: DaisyColor;
  rotation: number; // degrees
  scale: number;
  // Once the bloom-in animation has finished, a bloom renders as a single
  // static stage-5 daisy, so a full garden stays cheap.
  settled: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Hard cap on how many blooms the garden holds; past it the oldest go.
export const MAX_BLOOMS = 180;
// Spawn spacing: at most one bloom per interval, and only after the cursor
// has travelled this far since the last one.
export const MIN_SPAWN_INTERVAL_MS = 70;
export const MIN_SPAWN_DISTANCE_PX = 40;
// Rendered size of a daisy before its random scale (README: 40–64px).
export const BLOOM_SIZE_PX = 52;
// Mostly white with some pink (chosen 2026-10-06, per the designer's README).
export const PINK_SHARE = 0.25;
// When each of the six stages starts fading in (ms): quick through the bud,
// slower into full bloom, as the README suggests.
export const STAGE_STARTS_MS = [0, 60, 130, 220, 330, 470] as const;
export const STAGE_FADE_MS = 90;
export const BLOOM_SETTLE_MS = STAGE_STARTS_MS[STAGE_STARTS_MS.length - 1] + STAGE_FADE_MS + 60;

// A bloom's centre must be at least this far outside a keep-out box. Its
// petals may still tuck under the box edge, which reads as the flower
// growing behind it, but never sit over the content.
export const KEEPOUT_MARGIN_PX = 6;

export interface SpawnState {
  lastAt: number;
  last: Point | null;
}

export function isFarEnoughAndLateEnough(state: SpawnState, point: Point, now: number): boolean {
  if (now - state.lastAt < MIN_SPAWN_INTERVAL_MS) return false;
  if (!state.last) return true;
  return Math.hypot(point.x - state.last.x, point.y - state.last.y) >= MIN_SPAWN_DISTANCE_PX;
}

export function isInsideAnyRect(point: Point, rects: readonly Rect[], margin = KEEPOUT_MARGIN_PX): boolean {
  return rects.some(
    (r) =>
      point.x >= r.left - margin &&
      point.x <= r.right + margin &&
      point.y >= r.top - margin &&
      point.y <= r.bottom + margin,
  );
}

// Elements opt in with `data-bloom-keepout`. A value of "full-width" means
// the element paints wider than its own box (the rose nav band, whose
// background bleeds to the screen edges), so its keep-out zone spans the
// whole viewport horizontally.
export function keepoutRect(box: Rect, mode: string | undefined): Rect {
  if (mode === 'full-width') {
    return { top: box.top, bottom: box.bottom, left: -Infinity, right: Infinity };
  }
  return { top: box.top, right: box.right, bottom: box.bottom, left: box.left };
}

export function createBloom(id: number, at: Point, random: () => number = Math.random): Bloom {
  return {
    id,
    // A little jitter so a straight mouse path doesn't plant a straight row.
    x: at.x + (random() - 0.5) * 12,
    y: at.y + (random() - 0.5) * 12,
    color: random() < PINK_SHARE ? 'pink' : 'white',
    rotation: (random() - 0.5) * 60, // ±30°
    scale: 0.8 + random() * 0.3, // 0.8–1.1
    settled: false,
  };
}

// Adds a bloom, dropping the oldest ones if the garden is full.
export function plant(blooms: readonly Bloom[], bloom: Bloom, max = MAX_BLOOMS): Bloom[] {
  const next = [...blooms, bloom];
  return next.length > max ? next.slice(next.length - max) : next;
}
