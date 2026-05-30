export type ProjectStatus = 'active' | 'pilot' | 'announced' | 'inactive' | 'failed' | 'paused';
export type ProjectAssetClass =
  | 'gov_bond' | 'real_estate' | 'commodity' | 'private_credit' | 'other'
  | 'stablecoin_algorithmic' | 'stablecoin_fiat_backed' | 'fintech_wrapper'
  | 'ip_revenue' | 'infrastructure' | 'insurance';
export type LessonsVisibility = 'active_only' | 'lessons_only' | 'both';

export interface PostmortemFailure {
  layer: string;
  layer_name: string;
  issue: string;
}

export interface Postmortem {
  incident_date: string;
  root_cause: string;
  what_failed: PostmortemFailure[];
  outcome: string;
  rarm_lesson: string;
}

export type EntityType =
  | 'asset_manager' | 'bank' | 'l1' | 'l2'
  | 'oracle' | 'law' | 'legal' | 'audit' | 'regulator'
  | 'custodian' | 'trust' | 'other';

export interface EntityEntry {
  name: string;
  type: EntityType;
  url?: string;
}

export interface SmartContractAudit {
  auditor: string;
  date: string;
  report_url?: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  type: string;
}

export interface ProjectSource {
  title: string;
  url: string;
}

export interface Project {
  slug: string;
  name: string;
  short_name: string;
  website: string;
  asset_class: ProjectAssetClass;
  jurisdiction: string;
  chain: string;
  status: ProjectStatus;
  launched_at: string;
  tvl_usd?: number;
  entity_map: {
    issuer?: EntityEntry;
    custodian?: EntityEntry;
    chain_infra?: EntityEntry;
    oracle?: EntityEntry;
    law_firm?: EntityEntry;
    auditor?: EntityEntry;
    regulator?: EntityEntry;
    token_standard?: string;
  };
  underlying_asset?: string;
  reserve_composition?: string;
  secondary_market?: string;
  min_investment_usd?: number;
  smart_contract_audit?: SmartContractAudit;
  oracle_provider?: string;
  redemption_mechanism?: string;
  upgrade_authority?: string;
  timeline?: TimelineEvent[];
  risk_flags?: string[];
  asset_slug?: string;
  summary: string;
  sources: Array<string | ProjectSource>;
  updated_at: string;
  lessons_visibility?: LessonsVisibility;
  peak_tvl_usd?: number;
  postmortem?: Postmortem;
  // RWAI Incident Registry fields (added 2026-05-30)
  incident_id?: string;
  incident_date?: string;
  severity?: 'catastrophic' | 'critical' | 'major';
  primary_asset_class?: string;
  affected_rarm_layers?: string[];
  permalink?: string;
  citation_meta?: { short_title: string; publisher: string; first_published_year: number };
}

// ── Metadata helpers ──────────────────────────────────────────────────────────

export const ASSET_CLASS_META: Record<ProjectAssetClass, { label: string; color: string }> = {
  gov_bond:                { label: 'Gov Bond',               color: '#60a5fa' },
  real_estate:             { label: 'Real Estate',            color: '#4ade80' },
  commodity:               { label: 'Commodity',              color: '#facc15' },
  private_credit:          { label: 'Private Credit',         color: '#f97316' },
  other:                   { label: 'Other',                  color: '#94a3b8' },
  stablecoin_algorithmic:  { label: 'Algorithmic Stablecoin', color: '#fb923c' }, // orange
  stablecoin_fiat_backed:  { label: 'Fiat-backed Stablecoin', color: '#60a5fa' }, // blue
  fintech_wrapper:         { label: 'Fintech Wrapper',        color: '#a855f7' }, // purple
  ip_revenue:              { label: 'IP / Revenue',           color: '#c084fc' }, // purple
  infrastructure:          { label: 'Infrastructure',         color: '#7dd3fc' }, // gray-blue
  insurance:               { label: 'Insurance',              color: '#34d399' }, // cyan-green
};

export const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#4ade80', bg: 'bg-green-950/40'  },
  pilot:     { label: 'Pilot',     color: '#f59e0b', bg: 'bg-amber-950/40'  },
  announced: { label: 'Announced', color: '#818cf8', bg: 'bg-indigo-950/40' },
  inactive:  { label: 'Inactive',  color: '#94a3b8', bg: 'bg-slate-800/40'  },
  failed:    { label: 'Failed',    color: '#f87171', bg: 'bg-red-950/40'    }, // red
  paused:    { label: 'Paused',    color: '#94a3b8', bg: 'bg-slate-700/40'  }, // gray
};

export const ENTITY_TYPE_META: Record<EntityType, { label: string; icon: string }> = {
  asset_manager: { label: 'Asset Manager', icon: 'account_balance' },
  bank:          { label: 'Bank',          icon: 'corporate_fare' },
  l1:            { label: 'L1 Chain',      icon: 'hub' },
  l2:            { label: 'L2 Chain',      icon: 'hub' },
  oracle:        { label: 'Oracle',        icon: 'data_object' },
  law:           { label: 'Law Firm',      icon: 'gavel' },
  legal:         { label: 'Law Firm',      icon: 'gavel' },
  audit:         { label: 'Auditor',       icon: 'fact_check' },
  regulator:     { label: 'Regulator',     icon: 'policy' },
  custodian:     { label: 'Custodian',     icon: 'lock' },
  trust:         { label: 'Trust Company', icon: 'verified' },
  other:         { label: 'Other',         icon: 'category' },
};

