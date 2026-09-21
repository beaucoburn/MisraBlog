import { expect, test } from 'vitest';
import { POST_FIXTURES, POST_WITHOUT_OPTIONAL_FIELDS_FIXTURE } from '../lib/testFixtures';

// Built here from Intl directly (rather than from formatDate) so the
// assertion is independent of the helper under test, and computed rather
// than hardcoded so it can't fail on a machine in a non-UTC timezone.
function expectedDate(iso: string, locale: 'en-US' | 'tr-TR') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
}

async function renderCard(props: Record<string, unknown>) {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: PostCard } = await import('./PostCard.astro');

  const container = await AstroContainer.create();
  return container.renderToString(PostCard, { props });
}

test('renders title, date, excerpt, cover image and category chips when all are present', async () => {
  const post = POST_FIXTURES[0];
  const result = await renderCard({ lang: 'en', post });

  expect(result).toContain(`href="/en/post/${post.slug}"`);
  expect(result).toContain(post.title);
  expect(result).toContain(post.excerpt);
  expect(result).toContain(post.coverImage?.asset?.url);
  expect(result).toContain(`alt="${post.coverImage?.alt}"`);
  expect(result).toContain('href="/en/category/music"');
  // Locale-formatted publish date, alongside a machine-readable <time>.
  expect(result).toContain(expectedDate(post.publishedAt, 'en-US'));
  expect(result).toContain(`datetime="${post.publishedAt}"`);
});

test('omits the image, excerpt and chips entirely when the post has none of them', async () => {
  const post = POST_WITHOUT_OPTIONAL_FIELDS_FIXTURE;
  const result = await renderCard({ lang: 'en', post });

  expect(result).toContain(post.title);
  // No broken-image placeholder and no empty summary/chip list.
  expect(result).not.toContain('<img');
  expect(result).not.toContain('post-card__excerpt');
  expect(result).not.toContain('post-card__categories');
});

test('falls back to the post title for alt text when the cover image has no alt', async () => {
  const post = {
    ...POST_FIXTURES[0],
    coverImage: { asset: { url: 'https://cdn.example.test/no-alt.jpg' }, alt: null },
  };
  const result = await renderCard({ lang: 'en', post });

  expect(result).toContain(`alt="${post.title}"`);
});

test('formats the date and links in the reading locale', async () => {
  const result = await renderCard({ lang: 'tr', post: POST_FIXTURES[0] });

  expect(result).toContain(`href="/tr/post/${POST_FIXTURES[0].slug}"`);
  expect(result).toContain('href="/tr/category/music"');
  expect(result).toContain(expectedDate(POST_FIXTURES[0].publishedAt, 'tr-TR'));
  expect(result).not.toContain(expectedDate(POST_FIXTURES[0].publishedAt, 'en-US'));
});

test('headingLevel controls the card title tag so host pages never skip a level', async () => {
  const asH2 = await renderCard({ lang: 'en', post: POST_FIXTURES[0] });
  const asH3 = await renderCard({ lang: 'en', post: POST_FIXTURES[0], headingLevel: 3 });

  expect(asH2).toMatch(/<h2[^>]*class="[^"]*post-card__title/);
  expect(asH3).toMatch(/<h3[^>]*class="[^"]*post-card__title/);
});
