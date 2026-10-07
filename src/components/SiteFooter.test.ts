import { expect, test } from 'vitest';

async function renderFooter(lang: string) {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: SiteFooter } = await import('./SiteFooter.astro');

  const container = await AstroContainer.create();
  return container.renderToString(SiteFooter, { props: { lang } });
}

test('renders the copyright line, identically in both locales', async () => {
  const { wordmarkImage } = await import('../lib/siteImages');
  // The name is the brand wordmark (alt text carries it) when the file
  // exists, plain text otherwise.
  const expected = wordmarkImage
    ? new RegExp(`© ${new Date().getFullYear()}\\s*<img[^>]*alt="Bir Misra Daha"`)
    : new RegExp(`© ${new Date().getFullYear()}\\s*Bir Misra Daha`);

  expect(await renderFooter('en')).toMatch(expected);
  expect(await renderFooter('tr')).toMatch(expected);
});

test('credits the hero photo with Unsplash attribution links in both locales', async () => {
  for (const lang of ['en', 'tr']) {
    const result = await renderFooter(lang);
    expect(result).toContain('>Ivo Rainha</a>');
    expect(result).toContain('href="https://unsplash.com/@ivoafr?utm_source=unsplash');
    expect(result).toContain(
      'href="https://unsplash.com/photos/library-with-stairs-and-shelves-Lg9NLmu4B_A?utm_source=unsplash',
    );
  }

  expect(await renderFooter('en')).toContain('Photo by');
  expect(await renderFooter('tr')).toContain('Fotoğraf:');
});

test('links to her Instagram in both locales', async () => {
  for (const lang of ['en', 'tr']) {
    const result = await renderFooter(lang);
    expect(result).toContain('href="https://www.instagram.com/misranaganlu/"');
    expect(result).toContain('@misranaganlu');
  }
});

test('carries the About link, in its own labelled nav, in both locales', async () => {
  const en = await renderFooter('en');
  const tr = await renderFooter('tr');

  expect(en).toMatch(/<nav class="site-footer__nav"[^>]*aria-label="Pages"/);
  expect(en).toMatch(/href="\/en\/about"[^>]*>About<\/a>/);
  expect(tr).toMatch(/href="\/tr\/about"[^>]*>Hakkında<\/a>/);
});
