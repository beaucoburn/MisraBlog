// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
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