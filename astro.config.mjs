// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  // Needed for absolute canonical/OG URLs (see src/layouts/Layout.astro) —
  // without this Astro falls back to http://localhost:4321 at build time.
  site: 'https://misrablog.netlify.app',
  integrations: [svelte()],
  // The brand typeface is Cormorant SC (the "Bir"/"Daha" lettering in the
  // logo), used for all site text outside post bodies. It's loaded as
  // Cormorant Garamond and set in small caps with CSS (see Layout.astro)
  // rather than as the "Cormorant SC" family: that family's small-cap
  // glyphs ignore Turkish casing and draw dotted i and dotless ı both as
  // a plain I ("Müzik" came out as MÜZIK), while CSS small caps follow the
  // page's lang and give MÜZİK. Same design, identical in English.
  //
  // Astro downloads it from Google Fonts at build time and serves it from
  // the site itself, so visitors' browsers never contact Google. latin-ext
  // covers Turkish (ğ, ş, ı, İ).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant',
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Georgia', 'serif'],
    },
  ],
  i18n: {
    // Keep in sync with src/lib/i18n.ts's LOCALES/DEFAULT_LOCALE.
    locales: ['en', 'tr'],
    defaultLocale: 'en',
    routing: {
      // Both locales always get a URL prefix (/en/..., /tr/...) — there is
      // no unprefixed "default" locale, so this is a low-stakes technical
      // fallback only, not a signal that English is primary content.
      prefixDefaultLocale: true,
      // Without this, a bare "/" hit returns a 404 instead of redirecting
      // to the default locale, since prefixDefaultLocale means "/" has no
      // matching page of its own.
      redirectToDefaultLocale: true,
    },
  },
});