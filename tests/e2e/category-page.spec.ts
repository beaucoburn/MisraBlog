import { expect, test } from '@playwright/test';

test('clicking a category nav link navigates to its category page', async ({ page }) => {
  await page.goto('/');

  const link = page.locator('nav[aria-label="Categories"] a[href="/category/music"]');
  const linkText = await link.textContent();
  await link.click();

  await expect(page).toHaveURL(/\/category\/music\/?$/);
  await expect(page.locator('h1')).toHaveText(linkText?.trim() ?? '');
});

test('visiting an unknown category slug returns a 404', async ({ page }) => {
  const response = await page.goto('/category/does-not-exist');
  expect(response?.status()).toBe(404);
});
