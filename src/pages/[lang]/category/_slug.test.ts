import { expect, test, vi } from 'vitest';
import { CATEGORY_FIXTURES, UNTRANSLATED_POST_LISTING_FIXTURE } from '../../../lib/testFixtures';

vi.mock('../../../lib/sanity', () => ({
  sanityClient: {
    // Different queries need different fixture shapes - dispatch on the
    // GROQ query string's root _type filter rather than a single blanket
    // mockResolvedValue.
    fetch: vi.fn((query: string) =>
      query.includes('_type == "category"')
        ? Promise.resolve(CATEGORY_FIXTURES)
        : Promise.resolve([UNTRANSLATED_POST_LISTING_FIXTURE]),
    ),
  },
}));

const SEEDED_SLUGS = ['music', 'art', 'cooking', 'writing'];
const LOCALES = ['en', 'tr'];

type StaticPathEntry = {
  params: { lang: string; slug: string };
  props: { category: { _id: string; title: string; slug: string }; lang: string };
};

test('getStaticPaths returns one entry per seeded category, per locale', async () => {
  const { getStaticPaths } = await import('./[slug].astro');
  const paths = (await getStaticPaths()) as StaticPathEntry[];

  for (const lang of LOCALES) {
    for (const slug of SEEDED_SLUGS) {
      const match = paths.find((p) => p.params.lang === lang && p.params.slug === slug);
      expect(match).toBeDefined();
      expect(match?.props.category._id).toBe(`category-${slug}`);
      expect(match?.props.lang).toBe(lang);
    }
  }
});

test('getStaticPaths does not produce duplicate lang+slug combinations', async () => {
  const { getStaticPaths } = await import('./[slug].astro');
  const paths = (await getStaticPaths()) as StaticPathEntry[];
  const combos = paths.map((p) => `${p.params.lang}/${p.params.slug}`);
  const uniqueCombos = new Set(combos);
  expect(uniqueCombos.size).toBe(combos.length);
});

test('an untranslated post in the listing falls back to a label instead of a blank link', async () => {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: CategoryPage } = await import('./[slug].astro');

  const container = await AstroContainer.create();
  const result = await container.renderToString(CategoryPage, {
    props: { lang: 'tr', category: { _id: 'category-music', title: 'Müzik', slug: 'music' } },
  });

  expect(result).toContain(`href="/tr/post/${UNTRANSLATED_POST_LISTING_FIXTURE.slug}"`);
  expect(result).toContain('Çevrilmemiş yazı');
  expect(result).not.toMatch(/<a[^>]*>\s*<\/a>/);
});
