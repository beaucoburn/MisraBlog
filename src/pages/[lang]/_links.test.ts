import { expect, test, vi } from 'vitest';
import { CATEGORY_FIXTURES, FEED_POST_FIXTURES } from '../../lib/testFixtures';

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

async function renderLinks(lang: string) {
  const { createTestContainer } = await import('../../lib/testContainer');
  const { default: LinksPage } = await import('./links.astro');

  const container = await createTestContainer();
  return container.renderToString(LinksPage, { props: { lang } });
}

test('getStaticPaths returns one links page per locale', async () => {
  const { getStaticPaths } = await import('./links.astro');

  expect(getStaticPaths()).toEqual([
    { params: { lang: 'en' }, props: { lang: 'en' } },
    { params: { lang: 'tr' }, props: { lang: 'tr' } },
  ]);
});

test('asks for only a handful of the latest posts in the page language', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const { sanityClient } = await import('../../lib/sanity');
  await renderLinks('tr');

  expect(sanityClient.fetch).toHaveBeenCalledWith(
    expect.stringContaining('[0...$limit]'),
    expect.objectContaining({ lang: 'tr', limit: 5 }),
  );
});

test('leads with a localized welcome and a card per latest post', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const en = await renderLinks('en');
  const tr = await renderLinks('tr');

  expect(en).toMatch(/<h1[^>]*>Welcome! Here’s what’s new on the blog\.<\/h1>/);
  expect(tr).toMatch(/<h1[^>]*>Hoş geldin! Blogdaki en yeni yazılar burada\.<\/h1>/);
  expect(en.match(/class="post-card /g)).toHaveLength(FEED_POST_FIXTURES.length);
  expect(en).toContain('<title>Links · Bir Misra Daha</title>');
});

test('ends with buttons to all posts, About, and her Instagram', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const tr = await renderLinks('tr');
  const buttons = tr.match(/<ul class="links-buttons[\s\S]*?<\/ul>/)?.[0] ?? '';

  expect(buttons).toContain('href="/tr/"');
  expect(buttons).toContain('Tüm yazılar');
  expect(buttons).toContain('href="/tr/about"');
  expect(buttons).toContain('href="https://www.instagram.com/misranaganlu/"');
});

test('the language switcher points at the other locale’s links page', async () => {
  feedPosts = FEED_POST_FIXTURES;
  const en = await renderLinks('en');

  expect(en).toContain('href="/tr/links"');
});

test('with no posts yet, it says so instead of showing an empty list', async () => {
  feedPosts = [];
  const en = await renderLinks('en');

  expect(en).toContain('No posts yet.');
  expect(en).not.toContain('class="links-posts');
});
