import { expect, test } from 'vitest';

async function renderFooter(lang: string) {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: SiteFooter } = await import('./SiteFooter.astro');

  const container = await AstroContainer.create();
  return container.renderToString(SiteFooter, { props: { lang } });
}

test('renders the copyright line, identically in both locales', async () => {
  const expected = `© ${new Date().getFullYear()} Bir Misra Daha`;

  expect(await renderFooter('en')).toContain(expected);
  expect(await renderFooter('tr')).toContain(expected);
});

test('marks where the social link goes without inventing one', async () => {
  const result = await renderFooter('en');

  expect(result).toContain('TODO(content): add Instagram link once we have the handle');
  // No fabricated handle or href until we actually have it.
  expect(result).not.toContain('instagram.com');
  expect(result).not.toContain('<a');
});
