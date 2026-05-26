import { test, expect } from '@playwright/test';

test.describe('Friction Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/friction');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('renders page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Asset Class Liquidity/i })).toBeVisible();
    await expect(page.getByText('Structural Barriers')).toBeVisible();
  });

  test('renders breadcrumb', async ({ page }) => {
    await expect(page.getByText('TOKENIZATION FRICTION', { exact: true })).toBeVisible();
  });

  test('renders all 3 friction cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Legal & Regulatory' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Valuation Integrity' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Secondary Liquidity' })).toBeVisible();
  });

  test('friction cards show correct indices', async ({ page }) => {
    await expect(page.getByText('82.4%')).toBeVisible();
    await expect(page.getByText('45.1%')).toBeVisible();
    await expect(page.getByText('91.8%')).toBeVisible();
  });

  test('friction cards show layer labels', async ({ page }) => {
    await expect(page.getByText('Layer 01').first()).toBeVisible();
    await expect(page.getByText('Layer 02').first()).toBeVisible();
    await expect(page.getByText('Layer 04').first()).toBeVisible();
  });

  test('cross-asset friction matrix renders', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Cross-Asset Friction Matrix' })).toBeVisible();
  });

  test('matrix legend items present', async ({ page }) => {
    await expect(page.getByText('Critical', { exact: true })).toBeVisible();
    await expect(page.getByText('Substantial', { exact: true })).toBeVisible();
    await expect(page.getByText('Nominal', { exact: true })).toBeVisible();
  });

  test('matrix column headers present', async ({ page }) => {
    for (const col of ['Real Estate', 'T-Bills', 'Private Equity']) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible();
    }
  });

  test('matrix row labels present', async ({ page }) => {
    await expect(page.getByText('Legal & Structuring (L1)')).toBeVisible();
    await expect(page.getByText('Valuation Dynamics (L2)')).toBeVisible();
    await expect(page.getByText('Secondary Liquidity (L4)')).toBeVisible();
  });

  test('matrix cell values present', async ({ page }) => {
    await expect(page.getByText('94/100')).toBeVisible();
    await expect(page.getByText('12/100')).toBeVisible();
    await expect(page.getByText('08/100')).toBeVisible();
  });

  test('aggregate delta column shows +/- values', async ({ page }) => {
    await expect(page.getByText('+4.2%')).toBeVisible();
    await expect(page.getByText('-1.8%')).toBeVisible();
    await expect(page.getByText('+12.4%')).toBeVisible();
  });

  test('historical trend chart renders 12 bars', async ({ page }) => {
    await expect(page.getByText('Historical Friction Trend (24M)')).toBeVisible();
    await expect(page.getByText('Q1 2022')).toBeVisible();
    await expect(page.getByText('Q1 2024')).toBeVisible();
  });

  test('protocol insight card present', async ({ page }) => {
    await expect(page.getByText('Protocol Insight')).toBeVisible();
    await expect(page.getByText(/atomic swap/i)).toBeVisible();
  });

  test('Export Analysis FAB button present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export Analysis/i })).toBeVisible();
  });

  test('Terminal Status: Nominal chip present', async ({ page }) => {
    await expect(page.getByText('Terminal Status: Nominal')).toBeVisible();
  });
});
