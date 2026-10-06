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

test('marks where the social link goes without inventing one', async () => {
  const result = await renderFooter('en');

  expect(result).toContain('TODO(content): add Instagram link once we have the handle');
  // No fabricated handle or href until we actually have it.
  expect(result).not.toContain('instagram.com');
});
