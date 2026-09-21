import { expect, test, vi } from 'vitest';
import { CATEGORY_FIXTURES } from '../../lib/testFixtures';

// The about page itself fetches nothing (it's static site copy), but the
// shared header's CategoryNav does.
vi.mock('../../lib/sanity', () => ({
  sanityClient: { fetch: vi.fn().mockResolvedValue(CATEGORY_FIXTURES) },
}));

async function renderAbout(lang: string) {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: AboutPage } = await import('./about.astro');

  const container = await AstroContainer.create();
  return container.renderToString(AboutPage, { props: { lang } });
}

test('getStaticPaths returns one about page per locale', async () => {
  const { getStaticPaths } = await import('./about.astro');
  const paths = getStaticPaths();

  expect(paths).toContainEqual({ params: { lang: 'en' }, props: { lang: 'en' } });
  expect(paths).toContainEqual({ params: { lang: 'tr' }, props: { lang: 'tr' } });
});

test('renders the placeholder bio in each locale, and nothing invented', async () => {
  const en = await renderAbout('en');
  expect(en).toMatch(/<h1[^>]*>About<\/h1>/);
  expect(en).toContain('Bio coming soon.');
  expect(en).toContain('<title>About · Bir Misra Daha</title>');

  const tr = await renderAbout('tr');
  expect(tr).toMatch(/<h1[^>]*>Hakkında<\/h1>/);
  expect(tr).toContain('Yakında.');

  // No fabricated biography or social handle has crept into the page's own
  // copy (the footer's TODO comment legitimately names Instagram, so only
  // the <main> content is checked here).
  for (const result of [en, tr]) {
    const main = result.slice(result.indexOf('<main'), result.indexOf('</main>'));
    expect(main.toLowerCase()).not.toContain('instagram');
    expect(main).not.toContain('@');
  }
});

test('keeps the content TODO marker in the page source for easy finding', async () => {
  // Asserted against the source rather than the render: Astro drops HTML
  // comments that sit directly in slot content, and the marker's whole job
  // is to be findable in the repo when the real bio arrives.
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('./about.astro', import.meta.url), 'utf8');

  expect(source).toContain('TODO(content): replace with real bio from the friend');
});
