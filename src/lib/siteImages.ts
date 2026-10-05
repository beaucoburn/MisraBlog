// Drop-in site images: put the file in src/assets/ under the expected
// base name (any of the listed extensions) and it's picked up on the next
// build — no code change needed. Until then, callers render a fallback
// (wordmark for the logo, a tinted placeholder band for the hero).
//
// Bundled through astro:assets rather than served from public/ so the
// hero photo gets resized/re-encoded at build time instead of shipping a
// multi-megabyte camera original.
import type { ImageMetadata } from 'astro';

const logos = import.meta.glob<{ default: ImageMetadata }>('../assets/logo.{svg,png,webp}', {
  eager: true,
});
const heroes = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/hero.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

const first = (modules: Record<string, { default: ImageMetadata }>) =>
  Object.values(modules)[0]?.default;

export const logoImage: ImageMetadata | undefined = first(logos);
export const heroImage: ImageMetadata | undefined = first(heroes);
