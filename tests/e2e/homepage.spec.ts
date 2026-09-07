import { expect, test } from '@playwright/test';

const SEEDED_SLUGS = ['music', 'art', 'cooking', 'writing'];

test('homepage loads and lists nav links for each seeded category', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  const nav = page.locator('nav[aria-label="Categories"]');
  await expect(nav).toBeVisible();

  for (const slug of SEEDED_SLUGS) {
    await expect(nav.locator(`a[href="/category/${slug}"]`)).toHaveCount(1);
  }
});
