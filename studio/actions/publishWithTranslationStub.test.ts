import { describe, expect, test, vi } from 'vitest';
import { createTranslationReference, ensureTranslationStub, randomKey } from './publishWithTranslationStub';

describe('randomKey', () => {
  test('returns a non-empty string and is not obviously constant', () => {
    const a = randomKey();
    const b = randomKey();
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });
});

describe('createTranslationReference', () => {
  test('matches the internationalizedArrayReferenceValue shape used by @sanity/document-internationalization', () => {
    const ref = createTranslationReference('en', 'post-123', 'post');

    expect(ref._type).toBe('internationalizedArrayReferenceValue');
    expect(ref.language).toBe('en');
    expect(typeof ref._key).toBe('string');
    expect(ref.value).toEqual({
      _type: 'reference',
      _ref: 'post-123',
      _weak: true,
      _strengthenOnPublish: { type: 'post' },
    });
  });
});

function createMockClient(existingMetadata: unknown = null) {
  const create = vi.fn();
  const createIfNotExists = vi.fn();
  const commit = vi.fn().mockResolvedValue({});
  const fetch = vi.fn().mockResolvedValue(existingMetadata);
  const transaction = vi.fn().mockReturnValue({ create, createIfNotExists, commit });

  return { client: { fetch, transaction }, create, createIfNotExists, commit, fetch };
}

describe('ensureTranslationStub', () => {
  test('creates a Turkish stub post when an English post is published first', async () => {
    const { client, create, createIfNotExists, commit, fetch } = createMockClient(null);

    const categories = [{ _key: 'a1', _type: 'reference', _ref: 'category-music' }];
    await ensureTranslationStub(client, 'post-en-1', {
      _id: 'post-en-1',
      _type: 'post',
      language: 'en',
      slug: { _type: 'slug', current: 'my-post' },
      categories,
    } as any);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);

    const trDoc = create.mock.calls[0][0];
    expect(trDoc._type).toBe('post');
    expect(trDoc.language).toBe('tr');
    expect(trDoc.slug).toEqual({ _type: 'slug', current: 'my-post' });
    expect(trDoc.categories).toEqual(categories);
    expect(trDoc._id.startsWith('drafts.')).toBe(true);
    expect(trDoc.body).toBeUndefined();
    expect(trDoc.title).toBeUndefined();

    expect(createIfNotExists).toHaveBeenCalledTimes(1);
    const metadataDoc = createIfNotExists.mock.calls[0][0];
    expect(metadataDoc._type).toBe('translation.metadata');
    expect(metadataDoc.schemaTypes).toEqual(['post']);
    expect(metadataDoc.translations).toHaveLength(2);

    const enEntry = metadataDoc.translations.find((t: any) => t.language === 'en');
    const trEntry = metadataDoc.translations.find((t: any) => t.language === 'tr');
    expect(enEntry.value._ref).toBe('post-en-1');
    expect(enEntry.value._weak).toBe(true);
    expect(trEntry.value._ref).toBe(trDoc._id.replace('drafts.', ''));

    expect(commit).toHaveBeenCalledTimes(1);
  });

  test('creates an English stub post when a Turkish post is published first', async () => {
    const { client, create, createIfNotExists, commit, fetch } = createMockClient(null);

    await ensureTranslationStub(client, 'post-tr-1', {
      _id: 'post-tr-1',
      _type: 'post',
      language: 'tr',
      slug: { _type: 'slug', current: 'benim-yazim' },
    } as any);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);

    const enDoc = create.mock.calls[0][0];
    expect(enDoc._type).toBe('post');
    expect(enDoc.language).toBe('en');
    expect(enDoc.slug).toEqual({ _type: 'slug', current: 'benim-yazim' });
    expect(enDoc._id.startsWith('drafts.')).toBe(true);

    const metadataDoc = createIfNotExists.mock.calls[0][0];
    const trEntry = metadataDoc.translations.find((t: any) => t.language === 'tr');
    const enEntry = metadataDoc.translations.find((t: any) => t.language === 'en');
    expect(trEntry.value._ref).toBe('post-tr-1');
    expect(enEntry.value._ref).toBe(enDoc._id.replace('drafts.', ''));

    expect(commit).toHaveBeenCalledTimes(1);
  });

  test('is a no-op when a translation.metadata document already references the source post', async () => {
    const { client, create, createIfNotExists, commit } = createMockClient({ _id: 'existing-metadata' });

    await ensureTranslationStub(client, 'post-en-1', {
      _id: 'post-en-1',
      _type: 'post',
      language: 'en',
      slug: { _type: 'slug', current: 'my-post' },
    } as any);

    expect(create).not.toHaveBeenCalled();
    expect(createIfNotExists).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  test('is a no-op when the source document has no recognized language', async () => {
    const { client, create, createIfNotExists, commit, fetch } = createMockClient(null);

    await ensureTranslationStub(client, 'post-1', {
      _id: 'post-1',
      _type: 'post',
      slug: { _type: 'slug', current: 'my-post' },
    } as any);

    expect(fetch).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(createIfNotExists).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });
});
