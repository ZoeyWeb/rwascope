// ── Tokenized Asset Risk Observatory — Types ─────────────────────────────────

export type RARMSignal = 'green' | 'yellow' | 'red' | 'gray';

export type AssetCategory =
  | 'tokenized-treasury'
  | 'tokenized-money-market'
  | 'tokenized-commodity'
  | 'tokenized-private-credit'
  | 'tokenized-real-estate'
  | 'tokenized-equity'
  | 'other';

export type AssetStatus = 'active' | 'inactive' | 'under-review';

export type AssetSourceType =
  | 'whitepaper'
  | 'official-statement'
  | 'regulatory-filing'
  | 'major-media'
  | 'industry-media';

// ── RARM sub-types ────────────────────────────────────────────────────────────

export interface RARMCitation {
  title: string;
  url: string;
  date?: string;
}

export interface RARMLayerAssessment {
  signal: RARMSignal;
  rationale: string;
  citations: RARMCitation[];
}

export interface RARMBlock {
  legal_jurisdictional:      RARMLayerAssessment;
  valuation_oracles:         RARMLayerAssessment;
  custody_asset_control:     RARMLayerAssessment;
  kyc_aml_permissioning:     RARMLayerAssessment;
  secondary_market_liquidity: RARMLayerAssessment;
  settlement_finality:       RARMLayerAssessment;
}

export interface RARMSummary {
  green:    number;
  yellow:   number;
  red:      number;
  gray:     number;
  total:    number;
  dominant: RARMSignal;
}

// ── Source ────────────────────────────────────────────────────────────────────

export interface AssetSource {
  title: string;
  url: string;
  date?: string;
  type: AssetSourceType;
}

// ── Audit report (populated by DeFiLlama enrichment cron) ────────────────────

export interface AuditReport {
  firm?: string;
  date?: string;
  url?: string;
  status: 'passed' | 'passed-with-findings' | 'in-progress' | 'unknown';
}

// ── Live enrichment (merged from assets-live.json at runtime) ─────────────────

export interface AssetLive {
  tvlUsd?: number;
  tvlUpdatedAt?: string;
  tvlSource?: string;
  change1d?: number;
  auditReports?: AuditReport[];
}

export interface AssetLiveIndex {
  updated_at: string;
  source: string;
  assets: Record<string, AssetLive>;
}

// ── Core Asset type ───────────────────────────────────────────────────────────

export interface Asset {
  slug: string;
  name: string;
  ticker: string;
  issuerOrOperator: string;
  assetCategory: AssetCategory;
  underlyingAsset: string;
  chainOrPlatform: string[];
  domicile: string;
  launchDate?: string;
  tvlUsd?: number;
  tvlNote?: string;
  tvlUpdatedAt?: string;
  tvlSource?: string;
  change1d?: number;
  auditReports?: AuditReport[];
  status: AssetStatus;
  description: string;
  rarm: RARMBlock;
  crossRefIncidentSlugs: string[];
  crossRefIssuerSlugs: string[];
  sources: AssetSource[];
  firstPublishedAt: string;
  lastUpdatedAt: string;
}
