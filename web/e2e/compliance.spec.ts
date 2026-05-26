/**
 * Compliance-specific E2E tests.
 *
 * These tests verify the behaviour required by the compliance refactoring:
 *  1. Unauthenticated users see no scores anywhere on public pages
 *  2. Disclaimer modal appears on first visit within a session
 *  3. Registration requires all three consent checkboxes
 *  4. No tier labels / risk grades appear on public pages
 *  5. /about and /terms pages exist and contain required content
 */
import { test, expect } from '@playwright/test';

// ── 1. No scores on public pages ───────────────────────────────────────────
test.describe('Public pages: no platform scores visible', () => {
  const publicRoutes = ['/market', '/self-assessment', '/framework', '/friction', '/protocols'];

  for (const route of publicRoutes) {
    test(`${route} — no TIER labels`, async ({ page }) => {
      await page.goto(route);
      for (const tier of ['TIER 1', 'TIER 2', 'TIER 3', 'TIER 4']) {
        await expect(page.getByText(tier, { exact: true })).toHaveCount(0);
      }
    });

    test(`${route} — no risk-grade labels (EXTREME HIGH / CRITICAL)`, async ({ page }) => {
      await page.goto(route);
      for (const grade of ['EXTREME HIGH', 'MODERATE RISK', 'HIGH RISK']) {
        await expect(page.getByText(grade, { exact: true })).toHaveCount(0);
      }
    });

    test(`${route} — no "RCS" score column or panel`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText('RWA Confidence Score (RCS)')).toHaveCount(0);
      await expect(page.getByRole('columnheader', { name: 'RCS' })).toHaveCount(0);
    });
  }
});

// ── 2. Disclaimer modal ────────────────────────────────────────────────────
test.describe('Disclaimer modal', () => {
  test('appears on first visit to /market', async ({ page }) => {
    // Clear session storage to simulate first visit
    await page.goto('/market');
    // Disclaimer should be visible (no prior dismissal)
    await expect(page.getByRole('dialog', { name: /Disclaimer/i })).toBeVisible();
    await expect(page.getByText('I Understand')).toBeVisible();
  });

  test('dismisses when "I Understand" is clicked', async ({ page }) => {
    await page.goto('/market');
    await page.getByRole('button', { name: /I Understand/i }).click();
    await expect(page.getByRole('dialog', { name: /Disclaimer/i })).toHaveCount(0);
  });

  test('does NOT reappear after dismissal on same page', async ({ page }) => {
    await page.goto('/market');
    await page.getByRole('button', { name: /I Understand/i }).click();
    await page.goto('/framework');
    await expect(page.getByRole('dialog', { name: /Disclaimer/i })).toHaveCount(0);
  });

  test('links to /terms from modal', async ({ page }) => {
    await page.goto('/market');
    const termsLink = page.getByRole('link', { name: /Terms of Use/i }).first();
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/terms');
  });

  test('is bilingual (English and Chinese)', async ({ page }) => {
    await page.goto('/market');
    await expect(page.getByText('Important Disclaimer')).toBeVisible();
    await expect(page.getByText('重要聲明')).toBeVisible();
  });
});

// ── 3. Registration consent checkboxes ────────────────────────────────────
test.describe('Registration consent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Switch to register tab
    await page.getByRole('button', { name: 'Create Account' }).click();
  });

  test('Create Account button is disabled when no boxes are checked', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    const submitBtn = page.getByRole('button', { name: /Create Account/i }).last();
    await expect(submitBtn).toBeDisabled();
  });

  test('shows all three consent statements', async ({ page }) => {
    await expect(page.getByText(/academic research tool.*not a credit rating service/i)).toBeVisible();
    await expect(page.getByText(/scores.*reflect my own professional judgment/i)).toBeVisible();
    await expect(page.getByText(/Terms of Use and Disclaimer/i)).toBeVisible();
  });

  test('Create Account button remains disabled with only two boxes checked', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    // Check only first two
    const checkboxes = page.locator('label').filter({ hasText: /understand/ });
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    const submitBtn = page.getByRole('button', { name: /Create Account/i }).last();
    await expect(submitBtn).toBeDisabled();
  });

  test('Create Account button enabled when all three are checked', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    const labels = page.locator('label').filter({ hasText: /understand|Terms/i });
    const count = await labels.count();
    for (let i = 0; i < count; i++) {
      await labels.nth(i).click();
    }
    const submitBtn = page.getByRole('button', { name: /Create Account/i }).last();
    await expect(submitBtn).toBeEnabled();
  });
});

// ── 4. About page ──────────────────────────────────────────────────────────
test.describe('/about page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('renders heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /About RWAscope/i })).toBeVisible();
  });

  test('shows "Is NOT" list with credit rating entry', async ({ page }) => {
    await expect(page.getByText(/credit rating agency/i)).toBeVisible();
  });

  test('shows regulatory status section', async ({ page }) => {
    await expect(page.getByText(/Type 10/i)).toBeVisible();
    await expect(page.getByText(/SFC/)).toBeVisible();
  });

  test('links to Terms of Use', async ({ page }) => {
    const link = page.getByRole('button', { name: /Terms of Use/i });
    await expect(link).toBeVisible();
  });
});

// ── 5. Terms of Use page ───────────────────────────────────────────────────
test.describe('/terms page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/terms');
  });

  test('renders "Terms of Use & Disclaimer" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Terms of Use/i })).toBeVisible();
  });

  test('contains section on regulatory status', async ({ page }) => {
    await expect(page.getByText(/Type 10/)).toBeVisible();
    await expect(page.getByText(/Securities and Futures Commission/i)).toBeVisible();
  });

  test('contains section on user-generated scores', async ({ page }) => {
    await expect(page.getByText(/User Scores Are Private/i)).toBeVisible();
  });

  test('contains AI research assistant section', async ({ page }) => {
    await expect(page.getByText(/AI Research Assistant/i)).toBeVisible();
    await expect(page.getByText(/does not generate numeric scores/i)).toBeVisible();
  });
});
