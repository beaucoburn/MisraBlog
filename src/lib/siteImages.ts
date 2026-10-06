// Drop-in site images: put the file at the expected path under src/assets/
// (any of the listed extensions) and it's picked up on the next build — no
// code change needed. Until then, callers render a fallback (text wordmark
// for the logo, a tinted placeholder band for the hero). The header logo is
// the one-line wordmark from the brand kit in src/assets/logo/.
//
// Bundled through astro:assets rather than served from public/ so the
// hero photo gets resized/re-encoded at build time instead of shipping a
// multi-megabyte camera original.
import type { ImageMetadata } from 'astro';

// Listed in preference order: the brand kit ships the wordmark as both SVG
// and PNG, and the vector should win.
const LOGO_EXTENSIONS = ['svg', 'webp', 'png'];
const logos = import.meta.glob<{ default: ImageMetadata }>('../assets/logo/logo-wordmark.{svg,png,webp}', {
  eager: true,
});
const heroes = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/hero.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

const first = (modules: Record<string, { default: ImageMetadata }>) =>
  Object.values(modules)[0]?.default;

export const logoImage: ImageMetadata | undefined = LOGO_EXTENSIONS.map(
  (ext) => logos[`../assets/logo/logo-wordmark.${ext}`]?.default,
).find(Boolean);
export const heroImage: ImageMetadata | undefined = first(heroes);
