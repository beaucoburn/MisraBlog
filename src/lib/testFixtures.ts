// Static fixtures for tests that previously hit the live Sanity dataset.
// Mirrors the shape `seedCategories.mjs` produces, post-projection (the
// GROQ query itself resolves the internationalized-array title down to a
// plain string, so the fixture only needs the flat shape below).

export type CategoryFixture = { _id: string; title: string; slug: string; description?: string | null };
export type PostFixture = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  // Optional post-schema fields (added after content already existed), so
  // every fixture below deliberately exercises one of the two states:
  // filled in, or absent entirely.
  excerpt?: string | null;
  coverImage?: { asset?: { url?: string } | null; hotspot?: unknown; alt?: string | null } | null;
  categories?: CategoryFixture[] | null;
};

export const CATEGORY_FIXTURES: CategoryFixture[] = [
  { _id: 'category-art', title: 'Art', slug: 'art', description: null },
  { _id: 'category-cooking', title: 'Cooking', slug: 'cooking', description: null },
  { _id: 'category-music', title: 'Music', slug: 'music', description: 'Fixture category description.' },
  { _id: 'category-writing', title: 'Writing', slug: 'writing', description: null },
];

export const POST_FIXTURES: PostFixture[] = [
  {
    _id: 'post-fixture-1',
    title: 'A fixture post about music',
    slug: 'a-fixture-post-about-music',
    publishedAt: '2026-01-01T00:00:00Z',
    excerpt: 'A short fixture excerpt.',
    coverImage: {
      asset: { url: 'https://cdn.example.test/fixture-cover.jpg' },
      hotspot: null,
      alt: 'Fixture cover alt text',
    },
    categories: [{ _id: 'category-music', title: 'Music', slug: 'music' }],
  },
];

// The other half of the optional-field matrix: a real, translated post
// that predates `excerpt`/`coverImage` and has neither, plus no categories.
// Cards must render it without an empty summary line or a broken-image box.
export const POST_WITHOUT_OPTIONAL_FIELDS_FIXTURE: PostFixture = {
  _id: 'post-fixture-2',
  title: 'A fixture post with no extras',
  slug: 'a-fixture-post-with-no-extras',
  publishedAt: '2026-02-02T00:00:00Z',
  excerpt: null,
  coverImage: null,
  categories: null,
};

// What the homepage feed gets back from LATEST_POSTS_QUERY: translated posts
// only (the query filters untranslated stubs out), newest first.
export const FEED_POST_FIXTURES: PostFixture[] = [
  POST_WITHOUT_OPTIONAL_FIELDS_FIXTURE,
  POST_FIXTURES[0],
];

// A category-listing entry for a post that hasn't been translated into the
// listing's language yet - `title` comes back empty from
// POSTS_BY_CATEGORY_QUERY for this case (see src/lib/queries.ts), which the
// page must fall back away from rather than rendering a blank link.
export const UNTRANSLATED_POST_LISTING_FIXTURE: PostFixture = {
  _id: 'post-fixture-untranslated-1',
  title: '',
  slug: 'papatyalar-hakkinda-bir-yazi',
  publishedAt: '2026-01-01T00:00:00Z',
  excerpt: null,
  coverImage: null,
  categories: [{ _id: 'category-music', title: 'Müzik', slug: 'music' }],
};

// A post document as returned by POST_BY_SLUG_QUERY: one document per
// language, `body` is a Portable Text block array (or empty/absent when
// untranslated).
export type PostDocFixture = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string | null;
  coverImage: { asset?: { url?: string } | null; hotspot?: unknown; alt?: string | null } | null;
  categories: CategoryFixture[] | null;
  body: Array<{ _type: 'block'; children: Array<{ _type: 'span'; text: string }> }>;
  language: 'en' | 'tr';
};

// A logical post that has a fully translated EN document...
export const POST_EN_TRANSLATED_FIXTURE: PostDocFixture = {
  _id: 'post-fixture-en-1',
  title: 'A Post About Daisies',
  slug: 'a-post-about-daisies',
  publishedAt: '2026-01-01T00:00:00Z',
  excerpt: 'Where the daisies grow.',
  coverImage: {
    asset: { url: 'https://cdn.example.test/daisies.jpg' },
    hotspot: null,
    alt: null,
  },
  categories: [{ _id: 'category-writing', title: 'Writing', slug: 'writing' }],
  body: [
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'Daisies bloom in the margins.' }],
    },
  ],
  language: 'en',
};

// ...and a sibling TR stub that exists (per the auto-created-stub behavior
// in studio/actions/publishWithTranslationStub.ts) but has no body yet —
// same logical post, deliberately a *different* slug, to exercise the
// "cross-locale linking must go through translation.metadata, not shared
// slugs" rule.
export const POST_TR_UNTRANSLATED_FIXTURE: PostDocFixture = {
  _id: 'post-fixture-tr-1',
  title: '',
  slug: 'papatyalar-hakkinda-bir-yazi',
  publishedAt: '2026-01-01T00:00:00Z',
  excerpt: null,
  coverImage: null,
  categories: [{ _id: 'category-writing', title: 'Yazı', slug: 'writing' }],
  body: [],
  language: 'tr',
};

// The translation.metadata document linking the two fixtures above, shaped
// per TRANSLATION_SIBLING_QUERY's projection.
export const TRANSLATION_METADATA_FIXTURE = {
  translations: [
    {
      language: 'en',
      post: { slug: POST_EN_TRANSLATED_FIXTURE.slug, body: POST_EN_TRANSLATED_FIXTURE.body },
    },
    {
      language: 'tr',
      post: { slug: POST_TR_UNTRANSLATED_FIXTURE.slug, body: POST_TR_UNTRANSLATED_FIXTURE.body },
    },
  ],
};
