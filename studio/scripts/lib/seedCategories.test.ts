import { describe, expect, test, vi } from 'vitest';
import { CATEGORY_SEEDS, seedCategories, toInternationalizedTitle } from './seedCategories.js';

describe('seedCategories', () => {
  test('calls createIfNotExists once per seed with deterministic ids, slugs, and EN/TR titles', async () => {
    const mockClient = { createIfNotExists: vi.fn().mockResolvedValue({}) };

    await seedCategories(mockClient);

    expect(mockClient.createIfNotExists).toHaveBeenCalledTimes(CATEGORY_SEEDS.length);

    CATEGORY_SEEDS.forEach(({ slug, title, titleTr }, index) => {
      const call = mockClient.createIfNotExists.mock.calls[index][0];
      expect(call._id).toBe(`category-${slug}`);
      expect(call._type).toBe('category');
      expect(call.title).toEqual(toInternationalizedTitle(slug, title, titleTr));
      expect(call.slug.current).toBe(slug);

      const enEntry = call.title.find((item: { language?: string }) => item.language === 'en');
      const trEntry = call.title.find((item: { language?: string }) => item.language === 'tr');
      expect(enEntry.value).toBe(title);
      expect(trEntry.value).toBe(titleTr);
    });
  });

  test('produces identical payloads across repeated calls (idempotent)', async () => {
    const mockClient = { createIfNotExists: vi.fn().mockResolvedValue({}) };

    await seedCategories(mockClient);
    const firstRoundCalls = mockClient.createIfNotExists.mock.calls.map((args) => args[0]);

    mockClient.createIfNotExists.mockClear();

    await seedCategories(mockClient);
    const secondRoundCalls = mockClient.createIfNotExists.mock.calls.map((args) => args[0]);

    expect(secondRoundCalls).toEqual(firstRoundCalls);
    expect(mockClient.createIfNotExists).toHaveBeenCalledTimes(CATEGORY_SEEDS.length);
  });
});
