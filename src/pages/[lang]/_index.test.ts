import { expect, test, vi } from 'vitest';
import { CATEGORY_FIXTURES, FEED_POST_FIXTURES, POST_FIXTURES } from '../../lib/testFixtures';

// Feed posts returned for LATEST_POSTS_QUERY, swapped per test.
let feedPosts: unknown[] = FEED_POST_FIXTURES;

vi.mock('../../lib/sanity', () => ({
  sanityClient: {
    fetch: vi.fn((query: string) =>
      query.includes('_type == "category"')
        ? Promise.resolve(CATEGORY_FIXTURES)
        : Promise.resolve(feedPosts),
    ),
  },
}));

async function renderHome(lang: string) {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: HomePage } = await import('./index.astro');

  const container = await AstroContainer.create();
  return container.renderToString(HomePage, { props: { lang } });
}

test('getStaticPaths returns one homepage per locale', async () => {
  const { getStaticPaths } = await import('./index.astro');
  const paths = getStaticPaths();

  expect(paths).toContainEqual({ params: { lang: 'en' }, props: { lang: 'en' } });
  expect(paths).toContainEqual({ params: { lang: 'tr' }, props: { lang: 'tr' } });
});

test('the homepage renders a card per post instead of the old placeholder', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const result = await renderHome('en');

  expect(result).not.toContain('<h1>Astro</h1>');
  for (const post of FEED_POST_FIXTURES) {
    expect(result).toContain(`href="/en/post/${post.slug}"`);
    expect(result).toContain(post.title);
  }
  expect(result).toContain(POST_FIXTURES[0].excerpt);
});

test('the homepage title is the bare site name (no "· Bir Misra Daha" suffix)', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const result = await renderHome('en');

  expect(result).toContain('<title>Bir Misra Daha</title>');
  expect(result).toContain('rel="canonical"');
});

test('an empty feed shows a localized message rather than an empty list', async () => {
  feedPosts = [];

  expect(await renderHome('en')).toContain('No posts yet.');
  expect(await renderHome('tr')).toContain('Henüz yazı yok.');
});

test('the homepage carries the shared header and footer', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const result = await renderHome('tr');

  expect(result).toContain('aria-label="Categories"');
  expect(result).toContain('href="/tr/about"');
  expect(result).toContain('href="/en/"');
  expect(result).toContain(`© ${new Date().getFullYear()} Bir Misra Daha`);
});

test('the homepage asks for a capped number of latest posts and lays them out as a grid', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const { sanityClient } = await import('../../lib/sanity');
  const result = await renderHome('en');

  expect(sanityClient.fetch).toHaveBeenCalledWith(
    expect.stringContaining('[0...$limit]'),
    expect.objectContaining({ lang: 'en', limit: expect.any(Number) }),
  );
  expect(result).toContain('class="post-grid');
  expect(result).toContain('post-card--tile');
});

test('the homepage has a centered-logo header and a hero, falling back cleanly with no images yet', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const result = await renderHome('en');

  // No src/assets/logo.* or hero.* checked in yet: wordmark + placeholder.
  expect(result).toContain('site-header__wordmark');
  expect(result).toContain('class="hero');
  expect(result).toContain('hero__placeholder');
  // The visible site name lives in the header; the h1 is still present.
  expect(result).toMatch(/<h1[^>]*>Bir Misra Daha<\/h1>/);
});
