import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('root redirects to /market', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/market');
  });

  test('top nav links navigate to all screens', async ({ page }) => {
    await page.goto('/market');
    await page.setViewportSize({ width: 1440, height: 900 });

    const routes: [string, string][] = [
      ['Self-assessment', '/self-assessment'],
      ['Six-layer framework', '/framework'],
      ['Tokenization friction', '/friction'],
      ['Protocol Directory', '/protocols'],
      ['Market', '/market'],
      ['About', '/about'],
    ];

    for (const [label, path] of routes) {
      await page.getByRole('link', { name: label }).first().click();
      await expect(page).toHaveURL(path);
    }
  });

  test('/leaderboard redirects to /protocols', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page).toHaveURL('/protocols');
  });

  test('/terms renders Terms of Use page', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /Terms of Use/i })).toBeVisible();
  });

  test('/about renders About page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /About RWAscope/i })).toBeVisible();
  });

  test('side nav highlights active item', async ({ page }) => {
    await page.goto('/market');
    await page.setViewportSize({ width: 1440, height: 900 });
    const overviewLink = page.locator('aside nav a[href="/market"]');
    await expect(overviewLink).toHaveClass(/border-r-4/);
    await expect(overviewLink).toHaveClass(/border-\[#5E5C75\]/);
  });

  test('side nav item navigates on click', async ({ page }) => {
    await page.goto('/market');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('aside nav a[href="/friction"]').click();
    await expect(page).toHaveURL('/friction');
    await expect(page.locator('aside nav a[href="/friction"]')).toHaveClass(/border-r-4/);
  });

  test('side nav shows "Academic Research Tool" subtitle', async ({ page }) => {
    await page.goto('/market');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('aside').getByText('Academic Research Tool')).toBeVisible();
  });

  test('side nav does NOT show "Institutional Grade" or "Terminal"', async ({ page }) => {
    await page.goto('/market');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('aside').getByText('Institutional Grade')).toHaveCount(0);
    await expect(page.locator('aside').getByText('Terminal v1.0')).toHaveCount(0);
  });
});
