import type {
  IncidentSeverity, IncidentStatus, IncidentScope,
  IncidentType, IncidentAssetClass, SourceType,
} from '../types/incidents';

// ── Severity metadata ─────────────────────────────────────────────────────────
export const SEVERITY_META: Record<IncidentSeverity, {
  label: string; color: string; bg: string; border: string; dot: string;
}> = {
  critical: { label: 'Critical', color: '#dc2626', bg: '#FEF2F2', border: '#FECACA', dot: '#dc2626' },
  high:     { label: 'High',     color: '#ea580c', bg: '#FFF7ED', border: '#FED7AA', dot: '#ea580c' },
  medium:   { label: 'Medium',   color: '#f59e0b', bg: '#FFFBEB', border: '#FDE68A', dot: '#f59e0b' },
  low:      { label: 'Low',      color: '#9ca3af', bg: '#F9FAFB', border: '#E5E7EB', dot: '#9ca3af' },
};

// ── Status metadata ───────────────────────────────────────────────────────────
export const INCIDENT_STATUS_META: Record<IncidentStatus, {
  label: string; color: string; bg: string;
}> = {
  resolved:              { label: 'Resolved',              color: '#2E7D32', bg: '#E8F5E9' },
  ongoing:               { label: 'Ongoing',               color: '#e09d2b', bg: '#FFF8E1' },
  'under-investigation': { label: 'Under Investigation',   color: '#1565C0', bg: '#E3F2FD' },
  litigation:            { label: 'Litigation',            color: '#7B1FA2', bg: '#F3E5F5' },
  settled:               { label: 'Settled',               color: '#737C7F', bg: '#ECEFF1' },
};

// ── Scope metadata ────────────────────────────────────────────────────────────
export const SCOPE_META: Record<IncidentScope, {
  label: string; color: string; bg: string; border: string;
}> = {
  'hk-related':       { label: 'HK',     color: '#9e3f4e', bg: '#FCE4EC', border: '#F48FB1' },
  'global-reference': { label: 'GLOBAL', color: '#5E5C75', bg: '#ECEFF1', border: '#CFD8DC' },
};

// ── Type labels ───────────────────────────────────────────────────────────────
export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  'de-pegging':           'De-pegging',
  'smart-contract-exploit': 'Smart Contract Exploit',
  'custody-incident':     'Custody Incident',
  'redemption-failure':   'Redemption Failure',
  'regulatory-action':    'Regulatory Action',
  'governance-failure':   'Governance Failure',
  'bank-failure-spillover': 'Bank Failure Spillover',
  'sanctions':            'Sanctions',
  'other':                'Other',
};

// ── Asset class labels ────────────────────────────────────────────────────────
export const INCIDENT_ASSET_LABELS: Record<IncidentAssetClass, string> = {
  'stablecoin':                'Stablecoin',
  'tokenized-treasury':        'Tokenized Treasury',
  'tokenized-real-estate':     'Tokenized Real Estate',
  'tokenized-private-credit':  'Tokenized Private Credit',
  'tokenized-commodity':       'Tokenized Commodity',
  'infrastructure':            'Infrastructure',
  'other':                     'Other',
};

// ── Source type labels ────────────────────────────────────────────────────────
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  'regulatory-filing': 'Regulatory Filing',
  'court-record':      'Court Record',
  'official-statement': 'Official Statement',
  'major-media':       'Major Media',
  'industry-media':    'Industry Media',
};

// ── Format USD loss ───────────────────────────────────────────────────────────
export function formatLossUsd(amount: number): string {
  if (amount >= 1_000_000_000) return `USD ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000)     return `USD ${(amount / 1_000_000).toFixed(0)}M`;
  return `USD ${amount.toLocaleString()}`;
}

// ── Severity threshold definitions (for methodology page) ────────────────────
export const SEVERITY_THRESHOLDS = [
  {
    level: 'critical' as IncidentSeverity,
    threshold: '≥ USD 1 billion impact OR systemic financial system effect',
  },
  {
    level: 'high' as IncidentSeverity,
    threshold: 'USD 100 million – 1 billion impact OR multi-jurisdictional regulatory action',
  },
  {
    level: 'medium' as IncidentSeverity,
    threshold: 'USD 10 million – 100 million impact OR formal single-jurisdiction enforcement action',
  },
  {
    level: 'low' as IncidentSeverity,
    threshold: 'Below USD 10 million impact, contained, no formal enforcement action',
  },
];
