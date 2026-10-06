import { expect, test } from 'vitest';
import { sanityClient } from './sanity';

test('sanity client is configured with real project settings', () => {
  const config = sanityClient.config();

  expect(typeof config.projectId).toBe('string');
  expect(config.projectId).not.toHaveLength(0);

  expect(typeof config.dataset).toBe('string');
  expect(config.dataset).not.toHaveLength(0);

  // Builds must read uncached content: a webhook-triggered build starts
  // seconds after a publish, before the API CDN reliably has the new version.
  expect(config.useCdn).toBe(false);
});
