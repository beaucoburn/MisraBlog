import { expect, test } from '@playwright/test';

const SEEDED_SLUGS = ['music', 'art', 'cooking', 'writing'];

test('homepage loads and lists nav links for each seeded category', async ({ page }) => {
  const response = await page.goto('/en/');
  expect(response?.status()).toBe(200);

  const nav = page.locator('nav[aria-label="Categories"]');
  await expect(nav).toBeVisible();

  for (const slug of SEEDED_SLUGS) {
    await expect(nav.locator(`a[href="/en/category/${slug}"]`)).toHaveCount(1);
  }
});

test('a bare "/" redirects to the default locale', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/en\/?$/);
});
