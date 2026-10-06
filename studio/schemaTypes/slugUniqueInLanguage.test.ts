import { expect, test, vi } from 'vitest';
import { isSlugUniqueInLanguage } from './slugUniqueInLanguage';

function contextFor(document: Record<string, unknown> | undefined, result = true) {
  const fetch = vi.fn().mockResolvedValue(result);
  const context = { document, getClient: vi.fn(() => ({ fetch })) } as unknown as Parameters<
    typeof isSlugUniqueInLanguage
  >[1];
  return { context, fetch };
}

test('checks only posts in the same language, ignoring this post’s own draft and published copies', async () => {
  const { context, fetch } = contextFor({ _id: 'drafts.post-en-abc', _type: 'post', language: 'en' });

  await expect(isSlugUniqueInLanguage('any-given-day', context)).resolves.toBe(true);

  const [query, params] = fetch.mock.calls[0];
  expect(query).toContain('language == $language');
  expect(query).toContain('!(_id in [$draft, $published])');
  expect(params).toEqual({
    type: 'post',
    draft: 'drafts.post-en-abc',
    published: 'post-en-abc',
    slug: 'any-given-day',
    language: 'en',
  });
});

test('the same ids are excluded whether the open document is the draft or the published copy', async () => {
  const { context, fetch } = contextFor({ _id: 'post-tr-xyz', _type: 'post', language: 'tr' });

  await isSlugUniqueInLanguage('herhangi-bir-gun', context);

  expect(fetch.mock.calls[0][1]).toMatchObject({ draft: 'drafts.post-tr-xyz', published: 'post-tr-xyz' });
});

test('reports a clash when another post in the same language has the slug', async () => {
  const { context } = contextFor({ _id: 'drafts.post-en-abc', _type: 'post', language: 'en' }, false);

  await expect(isSlugUniqueInLanguage('taken', context)).resolves.toBe(false);
});

test('a document with no id yet is treated as unique without querying', async () => {
  const { context, fetch } = contextFor(undefined);

  await expect(isSlugUniqueInLanguage('anything', context)).resolves.toBe(true);
  expect(fetch).not.toHaveBeenCalled();
});
