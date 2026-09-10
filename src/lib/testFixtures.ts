// Static fixtures for tests that previously hit the live Sanity dataset.
// Mirrors the shape `seedCategories.mjs` produces, post-projection (the
// GROQ query itself resolves the internationalized-array title down to a
// plain string, so the fixture only needs the flat shape below).

export type CategoryFixture = { _id: string; title: string; slug: string };
export type PostFixture = { _id: string; title: string; slug: string; publishedAt: string };

export const CATEGORY_FIXTURES: CategoryFixture[] = [
  { _id: 'category-art', title: 'Art', slug: 'art' },
  { _id: 'category-cooking', title: 'Cooking', slug: 'cooking' },
  { _id: 'category-music', title: 'Music', slug: 'music' },
  { _id: 'category-writing', title: 'Writing', slug: 'writing' },
];

export const POST_FIXTURES: PostFixture[] = [
  {
    _id: 'post-fixture-1',
    title: 'A fixture post about music',
    slug: 'a-fixture-post-about-music',
    publishedAt: '2026-01-01T00:00:00Z',
  },
];
