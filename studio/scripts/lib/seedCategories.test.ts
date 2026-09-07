import { describe, expect, test, vi } from 'vitest';
import { CATEGORY_SEEDS, seedCategories } from './seedCategories.js';

describe('seedCategories', () => {
  test('calls createIfNotExists once per seed with deterministic ids and slugs', async () => {
    const mockClient = { createIfNotExists: vi.fn().mockResolvedValue({}) };

    await seedCategories(mockClient);

    expect(mockClient.createIfNotExists).toHaveBeenCalledTimes(CATEGORY_SEEDS.length);

    CATEGORY_SEEDS.forEach(({ slug, title }, index) => {
      const call = mockClient.createIfNotExists.mock.calls[index][0];
      expect(call._id).toBe(`category-${slug}`);
      expect(call._type).toBe('category');
      expect(call.title).toBe(title);
      expect(call.slug.current).toBe(slug);
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
