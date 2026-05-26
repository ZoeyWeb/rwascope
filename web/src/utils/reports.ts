import type { Issuer } from '../types/licenses';
import type { Incident } from '../types/incidents';
import type { Asset } from '../types/assets';
import { SARM_DIMENSION_KEYS } from './sarm';
import { RARM_LAYER_KEYS, aggregateRARM } from './rarm';

// ── Licenses aggregation ──────────────────────────────────────────────────────

export interface LicenseSummary {
  totalApplicants: number;
  byStatus: Record<string, number>;
  /** per-dimension → signal → count across all issuers */
  sarmSignalDistribution: Record<string, Record<string, number>>;
}

export function aggregateLicensesData(issuers: Issuer[]): LicenseSummary {
  const byStatus: Record<string, number> = {};
  for (const issuer of issuers) {
    byStatus[issuer.status] = (byStatus[issuer.status] ?? 0) + 1;
  }

  const sarmSignalDistribution: Record<string, Record<string, number>> = {};
  for (const dim of SARM_DIMENSION_KEYS) {
    sarmSignalDistribution[dim] = { green: 0, yellow: 0, red: 0, gray: 0 };
    for (const issuer of issuers) {
      const sig = (issuer.sarm as unknown as Record<string, { signal: string }>)[dim]?.signal ?? 'gray';
      sarmSignalDistribution[dim][sig] = (sarmSignalDistribution[dim][sig] ?? 0) + 1;
    }
  }

  return { totalApplicants: issuers.length, byStatus, sarmSignalDistribution };
}

// ── Incidents aggregation ─────────────────────────────────────────────────────

export interface IncidentSummary {
  totalInPeriod: number;
  totalAllTime: number;
  hkRelated: number;
  globalReference: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  totalEstimatedLossUsd: number;
  sarmImplicated: number;
  rarmImplicated: number;
  incidents: Incident[];
  /** All-time for context charts when period has few/no events */
  allTimeBySeverity: Record<string, number>;
  allTimeByType: Record<string, number>;
}

export function aggregateIncidentsData(
  incidents: Incident[],
  periodStart: string,
  periodEnd: string,
): IncidentSummary {
  const inPeriod = incidents.filter(i => i.date >= periodStart && i.date <= periodEnd);

  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalLoss = 0;
  let sarmImplicated = 0;
  let rarmImplicated = 0;

  for (const incident of inPeriod) {
    bySeverity[incident.severity] = (bySeverity[incident.severity] ?? 0) + 1;
    byType[incident.type] = (byType[incident.type] ?? 0) + 1;
    if (incident.estimatedLossUsd) totalLoss += incident.estimatedLossUsd;
    if (incident.frameworkMapping.sarm) sarmImplicated++;
    if (incident.frameworkMapping.rarm) rarmImplicated++;
  }

  // All-time distributions for context charts
  const allTimeBySeverity: Record<string, number> = {};
  const allTimeByType: Record<string, number> = {};
  for (const incident of incidents) {
    allTimeBySeverity[incident.severity] = (allTimeBySeverity[incident.severity] ?? 0) + 1;
    allTimeByType[incident.type] = (allTimeByType[incident.type] ?? 0) + 1;
  }

  return {
    totalInPeriod: inPeriod.length,
    totalAllTime: incidents.length,
    hkRelated: inPeriod.filter(i => i.scope === 'hk-related').length,
    globalReference: inPeriod.filter(i => i.scope === 'global-reference').length,
    bySeverity,
    byType,
    totalEstimatedLossUsd: totalLoss,
    sarmImplicated,
    rarmImplicated,
    incidents: inPeriod,
    allTimeBySeverity,
    allTimeByType,
  };
}

// ── Assets aggregation ────────────────────────────────────────────────────────

export interface AssetSummary {
  totalAssets: number;
  totalTvlUsd: number;
  byCategory: Record<string, { count: number; tvlUsd: number }>;
  byRARMAggregate: Record<string, number>;
  layerSignalDistribution: Record<string, Record<string, number>>;
}

export function aggregateAssetsData(assets: Asset[]): AssetSummary {
  const byCategory: Record<string, { count: number; tvlUsd: number }> = {};
  const byRARMAggregate: Record<string, number> = { green: 0, yellow: 0, red: 0, gray: 0 };
  const layerSignalDistribution: Record<string, Record<string, number>> = {};

  for (const key of RARM_LAYER_KEYS) {
    layerSignalDistribution[key] = { green: 0, yellow: 0, red: 0, gray: 0 };
  }

  let totalTvl = 0;

  for (const asset of assets) {
    if (!byCategory[asset.assetCategory]) {
      byCategory[asset.assetCategory] = { count: 0, tvlUsd: 0 };
    }
    byCategory[asset.assetCategory].count++;
    byCategory[asset.assetCategory].tvlUsd += asset.tvlUsd ?? 0;
    totalTvl += asset.tvlUsd ?? 0;

    const summary = aggregateRARM(asset.rarm);
    byRARMAggregate[summary.dominant] = (byRARMAggregate[summary.dominant] ?? 0) + 1;

    for (const key of RARM_LAYER_KEYS) {
      const sig = asset.rarm[key].signal;
      layerSignalDistribution[key][sig] = (layerSignalDistribution[key][sig] ?? 0) + 1;
    }
  }

  return {
    totalAssets: assets.length,
    totalTvlUsd: totalTvl,
    byCategory,
    byRARMAggregate,
    layerSignalDistribution,
  };
}

// ── Formatting helpers (shared between browser + PDF) ────────────────────────

export function formatTvlM(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export function formatLoss(n: number): string {
  if (n >= 1_000_000_000) return `~$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `~$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

/** Build citation strings for a report */
export function buildCitations(
  reportTitle: string,
  quarter: string,
  publishedAt: string,
  slug: string,
): { apa: string; chicago: string; bibtex: string } {
  const url = `https://rwa-index.com/reports/${slug}`;
  const [year, month] = publishedAt.split('-');
  const monthName = new Date(publishedAt).toLocaleString('en-US', { month: 'long' });
  const monthShort = new Date(publishedAt).toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const bibtexKey = `rwaindex${year}${quarter.replace(' ', '').toLowerCase()}`;

  const apa = `RWA-Index Research. (${year}, ${monthName}). ${reportTitle}. RWA-Index. ${url}`;

  const chicago = `RWA-Index Research. "${reportTitle}." RWA-Index, ${monthName} ${new Date(publishedAt).getDate()}, ${year}. ${url}.`;

  const bibtex = `@techreport{${bibtexKey},\n  title     = {${reportTitle.replace(/—/g, '--')}},\n  author    = {{RWA-Index Research}},\n  institution = {RWA-Index},\n  year      = {${year}},\n  month     = ${monthShort},\n  url       = {${url}},\n  note      = {Accessed \\today}\n}`;

  return { apa, chicago, bibtex };
}
