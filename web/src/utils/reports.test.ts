import { describe, it, expect } from 'vitest';
import {
  aggregateLicensesData,
  aggregateIncidentsData,
  aggregateAssetsData,
  formatTvlM,
  formatLoss,
  buildCitations,
} from './reports';
import type { Issuer } from '../types/licenses';
import type { Incident } from '../types/incidents';
import type { Asset } from '../types/assets';

// ── Mock factories ────────────────────────────────────────────────────────────

function mockIssuer(status: string, overrides: Partial<Issuer> = {}): Issuer {
  return {
    slug: 'test-issuer',
    name: 'Test Issuer',
    type: 'bank-subsidiary',
    status: status as Issuer['status'],
    jurisdiction: 'HK',
    pegCurrency: 'USD',
    targetPeg: 1,
    description: '',
    sarm: {
      capital_adequacy: { signal: 'gray', rationale: '', citations: [] },
      reserve_quality:  { signal: 'gray', rationale: '', citations: [] },
      governance:       { signal: 'gray', rationale: '', citations: [] },
      technology:       { signal: 'gray', rationale: '', citations: [] },
      redemption:       { signal: 'gray', rationale: '', citations: [] },
      disclosure:       { signal: 'gray', rationale: '', citations: [] },
    },
    sources: [],
    firstPublishedAt: '2026-01-01',
    lastUpdatedAt: '2026-01-01',
    ...overrides,
  } as unknown as Issuer;
}

function mockIncident(date: string, severity: Incident['severity'], type: Incident['type'], scope: Incident['scope'] = 'global-reference'): Incident {
  return {
    slug: `incident-${date}`,
    title: `Incident ${date}`,
    scope,
    severity,
    status: 'resolved',
    type,
    assetClass: 'other',
    date,
    primaryEntity: 'Test',
    affectedParties: ['retail'],
    jurisdictions: ['GLOBAL'],
    summary: '',
    narrative: '',
    timeline: [],
    regulatoryResponse: [],
    frameworkMapping: { sarm: null, rarm: null },
    lessons: '',
    relatedIncidentSlugs: [],
    relatedIssuerSlugs: [],
    sources: [],
    firstPublishedAt: date,
    lastUpdatedAt: date,
  } as unknown as Incident;
}

function mockAsset(category: Asset['assetCategory'], tvl: number): Asset {
  const makeLayer = () => ({ signal: 'gray' as const, rationale: '', citations: [] });
  return {
    slug: `asset-${category}`,
    name: 'Test Asset',
    ticker: 'TEST',
    issuerOrOperator: 'Test',
    assetCategory: category,
    underlyingAsset: '',
    chainOrPlatform: ['Ethereum'],
    domicile: 'US',
    tvlUsd: tvl,
    status: 'active' as const,
    description: '',
    rarm: {
      legal_jurisdictional:       makeLayer(),
      valuation_oracles:          makeLayer(),
      custody_asset_control:      makeLayer(),
      kyc_aml_permissioning:      makeLayer(),
      secondary_market_liquidity: makeLayer(),
      settlement_finality:        makeLayer(),
    },
    crossRefIncidentSlugs: [],
    crossRefIssuerSlugs: [],
    sources: [],
    firstPublishedAt: '2026-01-01',
    lastUpdatedAt: '2026-01-01',
  };
}

// ── aggregateLicensesData ─────────────────────────────────────────────────────

describe('aggregateLicensesData', () => {
  it('counts total applicants correctly', () => {
    const issuers = [mockIssuer('under_review'), mockIssuer('under_review'), mockIssuer('sandbox')];
    const result = aggregateLicensesData(issuers);
    expect(result.totalApplicants).toBe(3);
  });

  it('groups by status correctly', () => {
    const issuers = [mockIssuer('under_review'), mockIssuer('under_review'), mockIssuer('sandbox')];
    const result = aggregateLicensesData(issuers);
    expect(result.byStatus['under_review']).toBe(2);
    expect(result.byStatus['sandbox']).toBe(1);
  });

  it('computes SARM signal distribution for each dimension', () => {
    const issuers = [mockIssuer('under_review'), mockIssuer('under_review')];
    const result = aggregateLicensesData(issuers);
    expect(result.sarmSignalDistribution['capital_adequacy']['gray']).toBe(2);
    expect(result.sarmSignalDistribution['reserve_quality']['green']).toBe(0);
  });

  it('handles empty issuers array', () => {
    const result = aggregateLicensesData([]);
    expect(result.totalApplicants).toBe(0);
    expect(Object.keys(result.byStatus)).toHaveLength(0);
  });
});

// ── aggregateIncidentsData ────────────────────────────────────────────────────

describe('aggregateIncidentsData', () => {
  const incidents = [
    mockIncident('2025-06-01', 'critical', 'custody-incident'),
    mockIncident('2025-06-15', 'high', 'de-pegging', 'hk-related'),
    mockIncident('2025-09-01', 'medium', 'regulatory-action'),
  ];

  it('filters incidents to the period', () => {
    const result = aggregateIncidentsData(incidents, '2025-06-01', '2025-07-31');
    expect(result.totalInPeriod).toBe(2);
  });

  it('counts HK-related vs global correctly', () => {
    const result = aggregateIncidentsData(incidents, '2025-06-01', '2025-07-31');
    expect(result.hkRelated).toBe(1);
    expect(result.globalReference).toBe(1);
  });

  it('returns 0 incidents for a period with no events', () => {
    const result = aggregateIncidentsData(incidents, '2026-01-01', '2026-03-31');
    expect(result.totalInPeriod).toBe(0);
    expect(result.totalEstimatedLossUsd).toBe(0);
  });

  it('aggregates severity counts within period', () => {
    const result = aggregateIncidentsData(incidents, '2025-01-01', '2025-12-31');
    expect(result.bySeverity['critical']).toBe(1);
    expect(result.bySeverity['high']).toBe(1);
    expect(result.bySeverity['medium']).toBe(1);
  });

  it('provides all-time distributions for context', () => {
    const result = aggregateIncidentsData(incidents, '2026-01-01', '2026-03-31');
    expect(result.totalAllTime).toBe(3);
    expect(result.allTimeBySeverity['critical']).toBe(1);
  });
});

// ── aggregateAssetsData ───────────────────────────────────────────────────────

describe('aggregateAssetsData', () => {
  const assets = [
    mockAsset('tokenized-treasury', 500_000_000),
    mockAsset('tokenized-treasury', 300_000_000),
    mockAsset('tokenized-commodity', 200_000_000),
  ];

  it('counts total assets correctly', () => {
    expect(aggregateAssetsData(assets).totalAssets).toBe(3);
  });

  it('sums TVL correctly', () => {
    expect(aggregateAssetsData(assets).totalTvlUsd).toBe(1_000_000_000);
  });

  it('groups by category with TVL', () => {
    const result = aggregateAssetsData(assets);
    expect(result.byCategory['tokenized-treasury'].count).toBe(2);
    expect(result.byCategory['tokenized-treasury'].tvlUsd).toBe(800_000_000);
    expect(result.byCategory['tokenized-commodity'].count).toBe(1);
  });

  it('all-gray assets show gray aggregate', () => {
    const result = aggregateAssetsData(assets);
    expect(result.byRARMAggregate['gray']).toBe(3);
    expect(result.byRARMAggregate['green']).toBe(0);
  });

  it('layer distribution is all-gray for all-gray assets', () => {
    const result = aggregateAssetsData(assets);
    expect(result.layerSignalDistribution['legal_jurisdictional']['gray']).toBe(3);
    expect(result.layerSignalDistribution['legal_jurisdictional']['green']).toBe(0);
  });
});

// ── formatTvlM ────────────────────────────────────────────────────────────────

describe('formatTvlM', () => {
  it('formats billions correctly', () => {
    expect(formatTvlM(1_500_000_000)).toBe('$1.5B');
  });
  it('formats millions correctly', () => {
    expect(formatTvlM(250_000_000)).toBe('$250M');
  });
  it('formats sub-million correctly', () => {
    expect(formatTvlM(500_000)).toBe('$500,000');
  });
});

// ── buildCitations ────────────────────────────────────────────────────────────

describe('buildCitations', () => {
  it('APA citation includes year and URL', () => {
    const c = buildCitations('HK Tokenization Q1 2026', 'Q1 2026', '2026-04-29', 'q1-2026-sample');
    expect(c.apa).toContain('2026');
    expect(c.apa).toContain('rwa-index.com/reports/q1-2026-sample');
  });

  it('BibTeX includes @techreport and URL', () => {
    const c = buildCitations('HK Tokenization Q1 2026', 'Q1 2026', '2026-04-29', 'q1-2026-sample');
    expect(c.bibtex).toContain('@techreport');
    expect(c.bibtex).toContain('rwa-index.com/reports/q1-2026-sample');
  });

  it('Chicago includes author, title, and publisher', () => {
    const c = buildCitations('HK Tokenization Q1 2026', 'Q1 2026', '2026-04-29', 'q1-2026-sample');
    expect(c.chicago).toContain('RWA-Index Research');
    expect(c.chicago).toContain('RWA-Index');
  });
});
