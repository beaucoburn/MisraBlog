import { expect, test, vi } from 'vitest';
import {
  CATEGORY_FIXTURES,
  POST_EN_TRANSLATED_FIXTURE,
  POST_TR_UNTRANSLATED_FIXTURE,
  TRANSLATION_METADATA_FIXTURE,
} from '../../../lib/testFixtures';

const fetchMock = vi.fn();

vi.mock('../../../lib/sanity', () => ({
  sanityClient: { fetch: fetchMock },
}));

// The page now also renders SiteHeader (and therefore CategoryNav), so a
// render issues a third query on top of the post + translation lookups.
// Dispatch on the GROQ text rather than relying on call order.
function mockPageFetches(post: unknown) {
  fetchMock.mockReset();
  fetchMock.mockImplementation((query: string) => {
    if (query.includes('_type == "category"')) return Promise.resolve(CATEGORY_FIXTURES);
    if (query.includes('translation.metadata')) return Promise.resolve(TRANSLATION_METADATA_FIXTURE);
    return Promise.resolve(post);
  });
}

test('getStaticPaths returns one entry per post slug, per locale', async () => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((_query: string, params: { lang: string }) => {
    if (params.lang === 'en') return Promise.resolve([{ slug: POST_EN_TRANSLATED_FIXTURE.slug }]);
    return Promise.resolve([{ slug: POST_TR_UNTRANSLATED_FIXTURE.slug }]);
  });

  const { getStaticPaths } = await import('./[slug].astro');
  const paths = await getStaticPaths();

  expect(paths).toContainEqual({
    params: { lang: 'en', slug: POST_EN_TRANSLATED_FIXTURE.slug },
    props: { lang: 'en' },
  });
  expect(paths).toContainEqual({
    params: { lang: 'tr', slug: POST_TR_UNTRANSLATED_FIXTURE.slug },
    props: { lang: 'tr' },
  });
});

test('renders the real body and title when the post is translated', async () => {
  mockPageFetches(POST_EN_TRANSLATED_FIXTURE);

  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: PostPage } = await import('./[slug].astro');

  const container = await AstroContainer.create();
  const result = await container.renderToString(PostPage, {
    params: { lang: 'en', slug: POST_EN_TRANSLATED_FIXTURE.slug },
    props: { lang: 'en' },
  });

  expect(result).toContain(POST_EN_TRANSLATED_FIXTURE.title);
  expect(result).toContain('Daisies bloom in the margins.');
  expect(result).not.toContain("hasn't been translated");
});

test('wraps the body in an <article> and shows the date and category chips', async () => {
  mockPageFetches(POST_EN_TRANSLATED_FIXTURE);

  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: PostPage } = await import('./[slug].astro');

  const container = await AstroContainer.create();
  const result = await container.renderToString(PostPage, {
    params: { lang: 'en', slug: POST_EN_TRANSLATED_FIXTURE.slug },
    props: { lang: 'en' },
  });

  const expectedDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
    new Date(POST_EN_TRANSLATED_FIXTURE.publishedAt),
  );

  expect(result).toContain('<article');
  expect(result).toContain(expectedDate);
  expect(result).toContain('href="/en/category/writing"');
});

test('builds the SEO meta from the post itself and never emits an empty description', async () => {
  mockPageFetches(POST_EN_TRANSLATED_FIXTURE);

  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: PostPage } = await import('./[slug].astro');

  const container = await AstroContainer.create();
  const translated = await container.renderToString(PostPage, {
    params: { lang: 'en', slug: POST_EN_TRANSLATED_FIXTURE.slug },
    props: { lang: 'en' },
  });

  expect(translated).toContain(`content="${POST_EN_TRANSLATED_FIXTURE.excerpt}"`);
  expect(translated).toContain('property="og:type" content="article"');
  expect(translated).toContain(POST_EN_TRANSLATED_FIXTURE.coverImage?.asset?.url ?? '');
  expect(translated).toContain('rel="canonical"');
  expect(translated).toContain(`<title>${POST_EN_TRANSLATED_FIXTURE.title} · Bir Misra Daha</title>`);

  mockPageFetches(POST_TR_UNTRANSLATED_FIXTURE);
  const untranslated = await container.renderToString(PostPage, {
    params: { lang: 'tr', slug: POST_TR_UNTRANSLATED_FIXTURE.slug },
    props: { lang: 'tr' },
  });

  // Nothing truthful to describe on an untranslated stub — so no
  // description/og tags at all, rather than empty ones.
  expect(untranslated).not.toContain('name="description"');
  expect(untranslated).not.toContain('property="og:');
  expect(untranslated).toContain('rel="canonical"');
});

test('renders the localized placeholder, not the title/body, when the post is untranslated', async () => {
  mockPageFetches(POST_TR_UNTRANSLATED_FIXTURE);

  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: PostPage } = await import('./[slug].astro');

  const container = await AstroContainer.create();
  const result = await container.renderToString(PostPage, {
    params: { lang: 'tr', slug: POST_TR_UNTRANSLATED_FIXTURE.slug },
    props: { lang: 'tr' },
  });

  expect(result).toContain('Bu yazı henüz Türkçeye çevrilmedi.');
  expect(result).not.toContain(POST_EN_TRANSLATED_FIXTURE.title);
  expect(result).not.toContain('Daisies bloom in the margins.');
});

test('language switcher resolves the sibling slug via translation.metadata, not the current slug', async () => {
  mockPageFetches(POST_EN_TRANSLATED_FIXTURE);

  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: PostPage } = await import('./[slug].astro');

  const container = await AstroContainer.create();
  const result = await container.renderToString(PostPage, {
    params: { lang: 'en', slug: POST_EN_TRANSLATED_FIXTURE.slug },
    props: { lang: 'en' },
  });

  // The TR sibling has a different slug than the EN post — the switcher
  // must link to the sibling's own slug, not reuse the EN one.
  expect(result).toContain(`/tr/post/${POST_TR_UNTRANSLATED_FIXTURE.slug}`);
  expect(result).not.toContain(`/tr/post/${POST_EN_TRANSLATED_FIXTURE.slug}`);
});

test('the shared site header is present on post pages too', async () => {
  mockPageFetches(POST_EN_TRANSLATED_FIXTURE);

  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: PostPage } = await import('./[slug].astro');

  const container = await AstroContainer.create();
  const result = await container.renderToString(PostPage, {
    params: { lang: 'en', slug: POST_EN_TRANSLATED_FIXTURE.slug },
    props: { lang: 'en' },
  });

  // Category nav used to be homepage-only; it belongs on every page now.
  expect(result).toContain('aria-label="Categories"');
  expect(result).toContain('href="/en/about"');
  expect(result).toContain('href="/en/"');
});
