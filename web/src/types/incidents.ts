// ── Incident Module Types ─────────────────────────────────────────────────────

export type IncidentScope = 'hk-related' | 'global-reference';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus =
  | 'resolved'
  | 'ongoing'
  | 'under-investigation'
  | 'litigation'
  | 'settled';

export type IncidentType =
  | 'de-pegging'
  | 'smart-contract-exploit'
  | 'custody-incident'
  | 'redemption-failure'
  | 'regulatory-action'
  | 'governance-failure'
  | 'bank-failure-spillover'
  | 'sanctions'
  | 'other';

export type IncidentAssetClass =
  | 'stablecoin'
  | 'tokenized-treasury'
  | 'tokenized-real-estate'
  | 'tokenized-private-credit'
  | 'tokenized-commodity'
  | 'infrastructure'
  | 'other';

export type AffectedParties = 'institutional' | 'retail' | 'both' | 'unspecified';

export type SourceType =
  | 'regulatory-filing'
  | 'court-record'
  | 'official-statement'
  | 'major-media'
  | 'industry-media';

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface IncidentSource {
  title: string;
  publication: string;
  date: string;
  url: string;
  type: SourceType;
}

export interface TimelineEntry {
  date: string;
  event: string;
  sourceUrl?: string;
}

export interface RegulatoryResponseEntry {
  regulator: string;
  jurisdiction: string;
  actionType: string;
  date: string;
  outcome: string;
  sourceUrl?: string;
}

export interface FrameworkMapping {
  sarm?: {
    reserveImplicated: boolean;
    redemptionImplicated: boolean;
    governanceImplicated: boolean;
    explanation: string;
  };
  rarm?: {
    legalJurisdictional: boolean;
    assetValuationOracles: boolean;
    custodyAssetControl: boolean;
    kycAmlPermissioning: boolean;
    secondaryMarketLiquidity: boolean;
    settlementFinality: boolean;
    explanation: string;
  };
}

export interface RevisionNote {
  date: string;
  note: string;
}

// ── Core Incident type ────────────────────────────────────────────────────────

export interface Incident {
  slug: string;
  title: string;

  scope: IncidentScope;
  severity: IncidentSeverity;
  status: IncidentStatus;
  type: IncidentType;
  assetClass: IncidentAssetClass;

  date: string;          // ISO primary incident date
  endDate?: string;      // if event has duration

  primaryEntity: string;
  issuerOrOperator?: string;
  affectedParties: AffectedParties[];
  jurisdictions: string[];
  hkRelevance?: string;

  estimatedLossUsd?: number;
  estimatedLossNote?: string;

  summary: string;       // 1 paragraph, 3-5 sentences
  narrative: string;     // 3-5 paragraphs, separated by \n\n

  timeline: TimelineEntry[];

  regulatoryResponse: RegulatoryResponseEntry[];

  frameworkMapping: FrameworkMapping;

  lessons: string;
  relatedIncidentSlugs: string[];
  relatedIssuerSlugs: string[];

  sources: IncidentSource[];

  firstPublishedAt: string;
  lastUpdatedAt: string;
  revisionNotes?: RevisionNote[];
}
