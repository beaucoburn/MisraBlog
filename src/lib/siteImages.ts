// Drop-in site images: put the file at the expected path under src/assets/
// (any of the listed extensions) and it's picked up on the next build — no
// code change needed. Until then, callers render a fallback (the site name
// as text for the logos, a tinted placeholder band for the hero). The logos
// come from the brand kit in src/assets/logo/ (see src/assets/README.md):
// the full cartouche logo in the header, the one-line wordmark in the
// footer's copyright line.
//
// Bundled through astro:assets rather than served from public/ so the
// hero photo gets resized/re-encoded at build time instead of shipping a
// multi-megabyte camera original.
import type { ImageMetadata } from 'astro';

type ImageModules = Record<string, { default: ImageMetadata }>;

// One glob per logo (globs need literal patterns), so only the files we
// use end up in the build rather than every export in the brand kit.
const fullLogos: ImageModules = import.meta.glob('../assets/logo/logo-full.{svg,png,webp}', {
  eager: true,
});
const wordmarks: ImageModules = import.meta.glob('../assets/logo/logo-wordmark.{svg,png,webp}', {
  eager: true,
});
const heroes: ImageModules = import.meta.glob('../assets/hero.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

const first = (modules: ImageModules) => Object.values(modules)[0]?.default;

// The brand kit ships each logo as both SVG and PNG; the vector should win.
const LOGO_EXTENSIONS = ['svg', 'webp', 'png'];
const preferVector = (modules: ImageModules) =>
  LOGO_EXTENSIONS.map(
    (ext) => Object.entries(modules).find(([path]) => path.endsWith(`.${ext}`))?.[1].default,
  ).find(Boolean);

export const logoImage: ImageMetadata | undefined = preferVector(fullLogos);
export const wordmarkImage: ImageMetadata | undefined = preferVector(wordmarks);
export const heroImage: ImageMetadata | undefined = first(heroes);
