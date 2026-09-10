import { expect, test, vi } from 'vitest';
import {
  POST_EN_TRANSLATED_FIXTURE,
  POST_TR_UNTRANSLATED_FIXTURE,
  TRANSLATION_METADATA_FIXTURE,
} from '../../../lib/testFixtures';

const fetchMock = vi.fn();

vi.mock('../../../lib/sanity', () => ({
  sanityClient: { fetch: fetchMock },
}));

test('getStaticPaths returns one entry per post slug, per locale', async () => {
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
  fetchMock.mockReset();
  fetchMock.mockResolvedValueOnce(POST_EN_TRANSLATED_FIXTURE); // POST_BY_SLUG_QUERY
  fetchMock.mockResolvedValueOnce(TRANSLATION_METADATA_FIXTURE); // TRANSLATION_SIBLING_QUERY

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

test('renders the localized placeholder, not the title/body, when the post is untranslated', async () => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValueOnce(POST_TR_UNTRANSLATED_FIXTURE); // POST_BY_SLUG_QUERY
  fetchMock.mockResolvedValueOnce(TRANSLATION_METADATA_FIXTURE); // TRANSLATION_SIBLING_QUERY

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
  fetchMock.mockReset();
  fetchMock.mockResolvedValueOnce(POST_EN_TRANSLATED_FIXTURE); // POST_BY_SLUG_QUERY
  fetchMock.mockResolvedValueOnce(TRANSLATION_METADATA_FIXTURE); // TRANSLATION_SIBLING_QUERY

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
