import { expect, test, vi } from 'vitest';
import { CATEGORY_FIXTURES } from '../lib/testFixtures';

vi.mock('../lib/sanity', () => ({
  sanityClient: { fetch: vi.fn().mockResolvedValue(CATEGORY_FIXTURES) },
}));

test('renders a nav link for each seeded category', async () => {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: CategoryNav } = await import('./CategoryNav.astro');

  const container = await AstroContainer.create();
  const result = await container.renderToString(CategoryNav, { props: { lang: 'en' } });

  expect(result).toContain('aria-label="Categories"');
  for (const slug of ['music', 'art', 'cooking', 'writing']) {
    expect(result).toContain(`href="/en/category/${slug}"`);
  }
});
