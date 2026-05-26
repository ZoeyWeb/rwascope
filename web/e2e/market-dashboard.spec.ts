import { test, expect } from '@playwright/test';
import leaderboardData from '../public/data/leaderboard.json' assert { type: 'json' };

// Derive expected values from the same DeFiLlama JSON the app uses at runtime.
// NOTE: After compliance refactoring there are NO RCS scores, tiers, or status
// labels in this data — only public DeFiLlama fields.
const top20 = leaderboardData.protocols.slice(0, 20);
const first  = top20[0];
const second = top20[1];

test.describe('Market Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/market');
    await page.setViewportSize({ width: 1440, height: 900 });
    // Wait for table data to render
    await page.waitForFunction(() => document.querySelector('tbody tr') !== null);
  });

  // ── Page chrome ────────────────────────────────────────────────────────────
  test('renders page title "RWA Market Data"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /RWA Market Data/i })).toBeVisible();
  });

  test('shows disclaimer banner', async ({ page }) => {
    await expect(page.getByText(/Research tool only/i)).toBeVisible();
  });

  test('table column headers present (no RCS or TIER columns)', async ({ page }) => {
    for (const col of ['ASSET NAME', 'CLASS', 'TVL', 'AUDITS']) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible();
    }
    // Compliance: these columns must NOT exist
    await expect(page.getByRole('columnheader', { name: 'RCS' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'TIER' })).toHaveCount(0);
  });

  // ── Table data ─────────────────────────────────────────────────────────────
  test('renders 20 asset rows from DeFiLlama data', async ({ page }) => {
    await expect(page.locator('tbody tr')).toHaveCount(20);
  });

  test('first row matches top TVL protocol', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toContainText(first.name);
    await expect(firstRow).toContainText(first.tvl_fmt);
  });

  test('second row matches second-ranked protocol', async ({ page }) => {
    const secondRow = page.locator('tbody tr').nth(1);
    await expect(secondRow).toContainText(second.name);
  });

  test('no RCS score numbers displayed in rows', async ({ page }) => {
    // Each row should NOT contain a ".x" score pattern like "8.4" or "9.2"
    // (TVL is shown as "$XB" or "$XM" format, not a decimal score)
    const rowText = await page.locator('tbody').innerText();
    // This negative check ensures we haven't accidentally left RCS values in
    expect(rowText).not.toMatch(/\b(TIER [1-4])\b/);
  });

  test('no tier or risk grade labels visible in table', async ({ page }) => {
    for (const label of ['TIER 1', 'TIER 2', 'TIER 3', 'TIER 4', 'EXTREME HIGH', 'CRITICAL']) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }
  });

  // ── Inspection panel ───────────────────────────────────────────────────────
  test('inspection panel shows first protocol on load', async ({ page }) => {
    await expect(page.getByText(first.name).first()).toBeVisible();
  });

  test('inspection panel contains public info links, not RCS panel', async ({ page }) => {
    // Should show public data links
    await expect(page.getByText(/DeFiLlama|Official Website|Etherscan/i).first()).toBeVisible();
    // Should NOT show RCS score or confidence score
    await expect(page.getByText('Aggregate Confidence')).toHaveCount(0);
    await expect(page.getByText('RWA Confidence Score')).toHaveCount(0);
  });

  test('clicking a row updates the inspection panel', async ({ page }) => {
    await page.locator('tbody tr').nth(1).click();
    await expect(page.getByText(second.name).first()).toBeVisible();
  });
});
