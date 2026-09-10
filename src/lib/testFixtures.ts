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

// A category-listing entry for a post that hasn't been translated into the
// listing's language yet - `title` comes back empty from
// POSTS_BY_CATEGORY_QUERY for this case (see src/lib/queries.ts), which the
// page must fall back away from rather than rendering a blank link.
export const UNTRANSLATED_POST_LISTING_FIXTURE: PostFixture = {
  _id: 'post-fixture-untranslated-1',
  title: '',
  slug: 'papatyalar-hakkinda-bir-yazi',
  publishedAt: '2026-01-01T00:00:00Z',
};

// A post document as returned by POST_BY_SLUG_QUERY: one document per
// language, `body` is a Portable Text block array (or empty/absent when
// untranslated).
export type PostDocFixture = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  body: Array<{ _type: 'block'; children: Array<{ _type: 'span'; text: string }> }>;
  language: 'en' | 'tr';
};

// A logical post that has a fully translated EN document...
export const POST_EN_TRANSLATED_FIXTURE: PostDocFixture = {
  _id: 'post-fixture-en-1',
  title: 'A Post About Daisies',
  slug: 'a-post-about-daisies',
  publishedAt: '2026-01-01T00:00:00Z',
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
