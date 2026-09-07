import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import CategoryNav from './CategoryNav.astro';

test('renders a nav link for each seeded category', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(CategoryNav);

  expect(result).toContain('aria-label="Categories"');
  for (const slug of ['music', 'art', 'cooking', 'writing']) {
    expect(result).toContain(`href="/category/${slug}"`);
  }
});
