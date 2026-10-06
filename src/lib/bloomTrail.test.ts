import { expect, test } from 'vitest';
import {
  MAX_BLOOMS,
  MIN_SPAWN_DISTANCE_PX,
  MIN_SPAWN_INTERVAL_MS,
  createBloom,
  isFarEnoughAndLateEnough,
  isInsideAnyRect,
  keepoutRect,
  plant,
  type Bloom,
} from './bloomTrail';

test('the first move spawns; later ones need both time and distance', () => {
  const origin = { x: 100, y: 100 };
  expect(isFarEnoughAndLateEnough({ lastAt: -Infinity, last: null }, origin, 0)).toBe(true);

  const state = { lastAt: 1000, last: origin };
  const far = { x: 100 + MIN_SPAWN_DISTANCE_PX, y: 100 };
  const near = { x: 100 + MIN_SPAWN_DISTANCE_PX - 1, y: 100 };

  expect(isFarEnoughAndLateEnough(state, far, 1000 + MIN_SPAWN_INTERVAL_MS)).toBe(true);
  expect(isFarEnoughAndLateEnough(state, far, 1000 + MIN_SPAWN_INTERVAL_MS - 1)).toBe(false);
  expect(isFarEnoughAndLateEnough(state, near, 1000 + 10_000)).toBe(false);
});

test('points inside a content box, or within the margin of one, are kept out', () => {
  const box = { top: 100, right: 500, bottom: 300, left: 200 };

  expect(isInsideAnyRect({ x: 300, y: 200 }, [box])).toBe(true);
  expect(isInsideAnyRect({ x: 197, y: 200 }, [box], 6)).toBe(true);
  expect(isInsideAnyRect({ x: 150, y: 200 }, [box], 6)).toBe(false);
  expect(isInsideAnyRect({ x: 300, y: 50 }, [box], 6)).toBe(false);
});

test('a full-width keep-out (the rose nav band) blocks its whole row, edge to edge', () => {
  const navBar = { top: 200, right: 1260, bottom: 250, left: 180 };
  const rect = keepoutRect(navBar, 'full-width');

  // Out in the left page margin, but level with the band: blocked.
  expect(isInsideAnyRect({ x: 20, y: 225 }, [rect])).toBe(true);
  // Same margin, below the band: allowed.
  expect(isInsideAnyRect({ x: 20, y: 400 }, [rect])).toBe(false);
  // An ordinary keep-out only covers its own box.
  expect(isInsideAnyRect({ x: 20, y: 225 }, [keepoutRect(navBar, '')])).toBe(false);
});

test('blooms vary within the README ranges and are mostly white', () => {
  let seed = 1;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const blooms = Array.from({ length: 1000 }, (_, i) => createBloom(i, { x: 0, y: 0 }, random));

  for (const b of blooms) {
    expect(Math.abs(b.rotation)).toBeLessThanOrEqual(30);
    expect(b.scale).toBeGreaterThanOrEqual(0.8);
    expect(b.scale).toBeLessThanOrEqual(1.1);
    expect(Math.abs(b.x)).toBeLessThanOrEqual(6);
    expect(b.settled).toBe(false);
  }
  const pink = blooms.filter((b) => b.color === 'pink').length;
  expect(pink).toBeGreaterThan(150);
  expect(pink).toBeLessThan(350);
});

test('the garden is capped, and the oldest blooms make way for new ones', () => {
  const at = { x: 0, y: 0 };
  let garden: Bloom[] = [];
  for (let i = 0; i < MAX_BLOOMS + 5; i++) garden = plant(garden, createBloom(i, at));

  expect(garden).toHaveLength(MAX_BLOOMS);
  expect(garden[0].id).toBe(5);
  expect(garden.at(-1)?.id).toBe(MAX_BLOOMS + 4);
});
