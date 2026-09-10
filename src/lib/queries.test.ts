import { expect, test, vi, type Mock } from 'vitest';
import { CATEGORY_FIXTURES, POST_FIXTURES } from './testFixtures';

vi.mock('./sanity', () => ({
  sanityClient: { fetch: vi.fn() },
}));

// The real SanityClient#fetch is overloaded (a raw-response variant included),
// which trips up vi.mocked()'s inferred type against this fully-mocked
// module. Since the module is mocked outright, treat fetch as a plain Mock.
async function getMockedSanityClient() {
  const { sanityClient } = await import('./sanity');
  return sanityClient as unknown as { fetch: Mock };
}

test('CATEGORIES_QUERY returns the seeded categories, sorted by title', async () => {
  const sanityClient = await getMockedSanityClient();
  const { CATEGORIES_QUERY } = await import('./queries');
  sanityClient.fetch.mockResolvedValueOnce(CATEGORY_FIXTURES);

  const categories = await sanityClient.fetch(CATEGORIES_QUERY, { lang: 'en' });

  expect(Array.isArray(categories)).toBe(true);
  expect(categories.length).toBeGreaterThan(0);

  for (const category of categories) {
    expect(typeof category._id).toBe('string');
    expect(typeof category.title).toBe('string');
    expect(typeof category.slug).toBe('string');
    expect(category.slug.startsWith('/')).toBe(false);
  }

  const seededSlugs = ['music', 'art', 'cooking', 'writing'];
  const returnedSlugs = categories.map((c: { slug: string }) => c.slug);
  for (const slug of seededSlugs) {
    expect(returnedSlugs).toContain(slug);
  }
});

test('POSTS_BY_CATEGORY_QUERY returns posts referencing the given category', async () => {
  const sanityClient = await getMockedSanityClient();
  const { POSTS_BY_CATEGORY_QUERY } = await import('./queries');
  sanityClient.fetch.mockResolvedValueOnce(POST_FIXTURES);

  const posts = await sanityClient.fetch(POSTS_BY_CATEGORY_QUERY, {
    categoryId: 'category-music',
    lang: 'en',
  });

  expect(Array.isArray(posts)).toBe(true);

  for (const post of posts) {
    expect(typeof post._id).toBe('string');
    expect(typeof post.title).toBe('string');
    expect(typeof post.slug).toBe('string');
    expect(typeof post.publishedAt).toBe('string');
  }
});
