import { expect, test } from 'vitest';
import { sanityClient } from './sanity';
import { CATEGORIES_QUERY, POSTS_BY_CATEGORY_QUERY } from './queries';

type Category = { _id: string; title: string; slug: string };
type Post = { _id: string; title: string; slug: string; publishedAt: string };

test('CATEGORIES_QUERY returns the seeded categories, sorted by title', async () => {
  const categories: Category[] = await sanityClient.fetch(CATEGORIES_QUERY);

  expect(Array.isArray(categories)).toBe(true);
  expect(categories.length).toBeGreaterThan(0);

  for (const category of categories) {
    expect(typeof category._id).toBe('string');
    expect(typeof category.title).toBe('string');
    expect(typeof category.slug).toBe('string');
    expect(category.slug.startsWith('/')).toBe(false);
  }

  const seededSlugs = ['music', 'art', 'cooking', 'writing'];
  const returnedSlugs = categories.map((c) => c.slug);
  for (const slug of seededSlugs) {
    expect(returnedSlugs).toContain(slug);
  }

  const expectedOrder = [...categories].sort((a, b) => a.title.localeCompare(b.title));
  expect(categories.map((c) => c.title)).toEqual(expectedOrder.map((c) => c.title));
});

test('POSTS_BY_CATEGORY_QUERY returns posts referencing the given category', async () => {
  const posts: Post[] = await sanityClient.fetch(POSTS_BY_CATEGORY_QUERY, {
    categoryId: 'category-music',
  });

  expect(Array.isArray(posts)).toBe(true);

  for (const post of posts) {
    expect(typeof post._id).toBe('string');
    expect(typeof post.title).toBe('string');
    expect(typeof post.slug).toBe('string');
    expect(typeof post.publishedAt).toBe('string');
  }
});
