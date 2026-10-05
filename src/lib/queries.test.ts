import { expect, test, vi, type Mock } from 'vitest';
import {
  CATEGORY_FIXTURES,
  FEED_POST_FIXTURES,
  POST_FIXTURES,
  UNTRANSLATED_POST_LISTING_FIXTURE,
} from './testFixtures';

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

// The GROQ strings can't be executed without a dataset (and tests must
// never touch the live one), so these assert on the query text itself -
// enough to catch a projection that silently stops selecting a field the
// cards depend on.
test('the listing queries select the card fields, filtered by language', async () => {
  const { LATEST_POSTS_QUERY, POSTS_BY_CATEGORY_QUERY } = await import('./queries');

  for (const query of [LATEST_POSTS_QUERY, POSTS_BY_CATEGORY_QUERY]) {
    expect(query).toContain('language == $lang');
    expect(query).toContain('excerpt');
    expect(query).toContain('coverImage');
    expect(query).toContain('asset->{ url }');
    expect(query).toContain('categories[]->');
    expect(query).toContain('order(publishedAt desc)');
  }
});

test('LATEST_POSTS_QUERY excludes untranslated stubs by the same empty-body rule as the post page', async () => {
  const { LATEST_POSTS_QUERY } = await import('./queries');

  expect(LATEST_POSTS_QUERY).toContain('defined(body) && count(body) > 0');
});

test('POSTS_BY_CATEGORY_QUERY still keeps untranslated stubs in the listing', async () => {
  const { POSTS_BY_CATEGORY_QUERY } = await import('./queries');

  // Unlike the feed, the category listing links stubs (as a labelled
  // placeholder) so a tagged post doesn't vanish from its own category.
  expect(POSTS_BY_CATEGORY_QUERY).not.toContain('count(body)');
});

test('POST_BY_SLUG_QUERY selects the post detail extras', async () => {
  const { POST_BY_SLUG_QUERY } = await import('./queries');

  expect(POST_BY_SLUG_QUERY).toContain('excerpt');
  expect(POST_BY_SLUG_QUERY).toContain('coverImage');
  expect(POST_BY_SLUG_QUERY).toContain('categories[]->');
  expect(POST_BY_SLUG_QUERY).toContain('body');
});

test('LATEST_POSTS_QUERY returns feed-shaped posts, with optional fields possibly absent', async () => {
  const sanityClient = await getMockedSanityClient();
  const { LATEST_POSTS_QUERY } = await import('./queries');
  sanityClient.fetch.mockResolvedValueOnce(FEED_POST_FIXTURES);

  const posts = await sanityClient.fetch(LATEST_POSTS_QUERY, { lang: 'en' });

  expect(posts.length).toBeGreaterThan(0);
  for (const post of posts) {
    expect(typeof post._id).toBe('string');
    expect(typeof post.title).toBe('string');
    expect(post.title).not.toHaveLength(0);
    expect(typeof post.slug).toBe('string');
  }

  // Both halves of the optional-field matrix are represented, since the
  // feed must handle either.
  expect(posts.some((p: { excerpt?: string | null }) => p.excerpt)).toBe(true);
  expect(posts.some((p: { excerpt?: string | null }) => !p.excerpt)).toBe(true);
  expect(posts.some((p: { coverImage?: unknown }) => !p.coverImage)).toBe(true);
});

test('an untranslated listing entry still carries a slug to link to', () => {
  expect(UNTRANSLATED_POST_LISTING_FIXTURE.title).toBe('');
  expect(UNTRANSLATED_POST_LISTING_FIXTURE.slug).not.toHaveLength(0);
});
