import { beforeEach, expect, test, vi } from 'vitest';
import {
  CATEGORY_FIXTURES,
  POST_FIXTURES,
  UNTRANSLATED_POST_LISTING_FIXTURE,
} from '../../../lib/testFixtures';

// Posts returned for the listing query, swapped per test.
let listingPosts: unknown[] = [UNTRANSLATED_POST_LISTING_FIXTURE];

vi.mock('../../../lib/sanity', () => ({
  sanityClient: {
    // Different queries need different fixture shapes - dispatch on the
    // GROQ query string's root _type filter rather than a single blanket
    // mockResolvedValue.
    fetch: vi.fn((query: string) =>
      query.includes('_type == "category"')
        ? Promise.resolve(CATEGORY_FIXTURES)
        : Promise.resolve(listingPosts),
    ),
  },
}));

beforeEach(() => {
  listingPosts = [UNTRANSLATED_POST_LISTING_FIXTURE];
});

const SEEDED_SLUGS = ['music', 'art', 'cooking', 'writing'];
const LOCALES = ['en', 'tr'];

type StaticPathEntry = {
  params: { lang: string; slug: string };
  props: { category: { _id: string; title: string; slug: string }; lang: string };
};

async function renderCategoryPage(props: Record<string, unknown>) {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: CategoryPage } = await import('./[slug].astro');

  const container = await AstroContainer.create();
  return container.renderToString(CategoryPage, { props });
}

const MUSIC_CATEGORY = { _id: 'category-music', title: 'Müzik', slug: 'music' };

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
  const result = await renderCategoryPage({ lang: 'tr', category: MUSIC_CATEGORY });

  expect(result).toContain(`href="/tr/post/${UNTRANSLATED_POST_LISTING_FIXTURE.slug}"`);
  expect(result).toContain('Çevrilmemiş yazı');
  expect(result).not.toMatch(/<a[^>]*>\s*<\/a>/);
});

test('an untranslated post gets a plain link, not a titleless card', async () => {
  const result = await renderCategoryPage({ lang: 'tr', category: MUSIC_CATEGORY });

  expect(result).not.toContain('post-card__title');
  // Scoped to the listing: the site header carries the logo <img>.
  const listing = result.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
  expect(listing).not.toBe('');
  expect(listing).not.toContain('<img');
});

test('a translated post in the listing renders a full card', async () => {
  listingPosts = [POST_FIXTURES[0]];

  const result = await renderCategoryPage({
    lang: 'en',
    category: { ...MUSIC_CATEGORY, title: 'Music' },
  });

  expect(result).toContain('post-card__title');
  expect(result).toContain(POST_FIXTURES[0].title);
  expect(result).toContain(POST_FIXTURES[0].excerpt);
  expect(result).toContain(POST_FIXTURES[0].coverImage?.asset?.url);
});

test('the category description drives the meta description when it exists', async () => {
  const described = await renderCategoryPage({
    lang: 'en',
    category: { ...MUSIC_CATEGORY, title: 'Music', description: 'Fixture category description.' },
  });
  expect(described).toContain('name="description" content="Fixture category description."');
  expect(described).toContain('property="og:type" content="website"');

  const undescribed = await renderCategoryPage({ lang: 'en', category: MUSIC_CATEGORY });
  expect(undescribed).not.toContain('name="description"');
});

test('the shared site header replaces the old switcher-only nav', async () => {
  const result = await renderCategoryPage({ lang: 'en', category: MUSIC_CATEGORY });

  expect(result).toContain('aria-label="Categories"');
  expect(result).toContain('aria-label="Language switcher"');
  expect(result).toContain('href="/en/about"');
  // Category slugs are shared cross-locale, so the switcher just swaps the
  // locale segment here.
  expect(result).toContain('href="/tr/category/music"');
});
