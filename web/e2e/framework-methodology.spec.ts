import { test, expect } from '@playwright/test';

test.describe('Framework Methodology', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/framework');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('renders hero title with "Methodology" word', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Six-Layer Framework/i })).toBeVisible();
    await expect(page.getByText('Methodology').first()).toBeVisible();
  });

  test('renders breadcrumb', async ({ page }) => {
    await expect(page.getByText('METHODOLOGY', { exact: true })).toBeVisible();
    await expect(page.getByText('INSTITUTIONAL FRAMEWORK', { exact: true })).toBeVisible();
  });

  test('RARM overview section visible', async ({ page }) => {
    await expect(page.getByText('The Relative Asset Risk Matrix (RARM)')).toBeVisible();
    await expect(page.getByText('STRUCTURAL PROTOCOL')).toBeVisible();
    await expect(page.getByText('v2.4.0_STABLE')).toBeVisible();
    await expect(page.getByText('ISO-20022 COMPLIANT')).toBeVisible();
  });

  test('COEFFICIENTS UPDATED DAILY note present', async ({ page }) => {
    await expect(page.getByText('COEFFICIENTS UPDATED DAILY')).toBeVisible();
  });

  test('renders all 6 layer cards', async ({ page }) => {
    const layerTitles = [
      'Legal & Jurisdictional',
      'Asset Custody',
      'Data Integrity (PoR)',
      'Smart Contract Risk',
      'Secondary Liquidity',
      'Identity & AML',
    ];
    for (const title of layerTitles) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }
  });

  test('layer cards show LAYER_0N labels', async ({ page }) => {
    for (let i = 1; i <= 6; i++) {
      await expect(page.getByText(`LAYER_0${i}`)).toBeVisible();
    }
  });

  test('layer cards show criticality', async ({ page }) => {
    await expect(page.getByText('Criticality: High').first()).toBeVisible();
    await expect(page.getByText('Criticality: Severe')).toBeVisible();
    await expect(page.getByText('Criticality: Moderate')).toBeVisible();
    await expect(page.getByText('Criticality: Low')).toBeVisible();
  });

  test('weight matrix table renders', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Asset-Class Weight Matrix' })).toBeVisible();

    // Column headers
    for (const h of ['Asset Class', 'Legal (W1)', 'Custody (W2)', 'Data (W3)']) {
      await expect(page.getByRole('columnheader', { name: h })).toBeVisible();
    }

    // Row data
    for (const row of ['Real Estate', 'Gov. Treasuries', 'Private Equity', 'Trade Finance', 'Commodities']) {
      await expect(page.getByRole('cell', { name: row })).toBeVisible();
    }
  });

  test('weight values are present', async ({ page }) => {
    await expect(page.getByRole('cell', { name: '0.35' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: '0.40' }).first()).toBeVisible();
  });

  test('EXPORT CSV button present on weight matrix', async ({ page }) => {
    await expect(page.getByRole('button', { name: /EXPORT CSV/i })).toBeVisible();
  });

  test('footer shows system status', async ({ page }) => {
    await expect(page.getByText('Dynamic Calibration')).toBeVisible();
    await expect(page.getByText('NODE_CLUSTER_01: NOMINAL')).toBeVisible();
    await expect(page.getByText('v4.1.2-beta')).toBeVisible();
  });
});
