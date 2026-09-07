import { expect, test } from 'vitest';
import { sanityClient } from './sanity';

test('sanity client is configured with real project settings', () => {
  const config = sanityClient.config();

  expect(typeof config.projectId).toBe('string');
  expect(config.projectId).not.toHaveLength(0);

  expect(typeof config.dataset).toBe('string');
  expect(config.dataset).not.toHaveLength(0);

  expect(config.useCdn).toBe(true);
});
