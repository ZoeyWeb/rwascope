export type IntelligenceRegion = 'us' | 'eu' | 'hk' | 'sg' | 'uae' | 'global';
export type IntelligenceCategory = 'global_policy' | 'hk_observation' | 'narrative';
export type IntelligenceEventType =
  | 'regulation'
  | 'institutional'
  | 'project'
  | 'research'
  | 'data_milestone';

export interface IntelligenceMarketImpact {
  benefited_sectors: string[];
  affected_entity_types: string[];
  capital_flow: string;
  hk_relevance: string | null;
}

export interface PolicyImpactCapitalFlow {
  from: string;
  to: string;
  estimated_scale?: string;
  timeframe?: string;
}

export interface PolicyImpact {
  benefited_sectors: string[];
  affected_entities: string[];
  capital_flow: PolicyImpactCapitalFlow;
}

export interface IntelligenceItem {
  id: string;
  category: IntelligenceCategory;
  region: IntelligenceRegion;
  title: string;
  event_date: string;
  source_url: string;
  source_name: string;
  policy_summary: string;
  key_changes: string[];
  market_impact: IntelligenceMarketImpact;
  rwa_relevant: boolean;
  tags: string[];
  significance?: 'landmark' | 'major' | 'notable';
  timeline_significance?: string;
  source_note?: string;
  // Extended fields (v2)
  event_type?: IntelligenceEventType;
  is_data_snapshot?: boolean;
  source_entity?: string | null;
  is_forward_view?: boolean;
  // Narrative timeline fields (v3)
  narrative_impact_note?: string | null;
  policy_impact?: PolicyImpact | null;
  // Tier classification (v4)
  tier?: 'milestone' | 'news' | 'forward';
  // Stablecoin filter (v5)
  stablecoin_relevant?: boolean;
}

export interface IntelligenceWeeklyBrief {
  generated_at: string;
  period_start: string;
  period_end: string;
  headline: string;
  highlights: string[];
}

export interface IntelligenceMeta {
  last_compiled: string;
  version: string;
  disclaimer: string;
  coverage_note: string;
  regions_covered: IntelligenceRegion[];
}

export interface IntelligenceData {
  meta: IntelligenceMeta;
  weekly_brief: IntelligenceWeeklyBrief;
  intelligence_items: IntelligenceItem[];
}

// ── Narrative threads ─────────────────────────────────────────────────────────

export interface NarrativeExpectedEvent {
  quarter: string;
  description: string;
  impact: string;
}

export interface NarrativeThread {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  color: string | null;
  related_event_ids: string[];
  expected_next_events: NarrativeExpectedEvent[] | null;
  weekly_new_count: number;
  created_at: string;
  updated_at: string;
}

// ── Editor's Note ─────────────────────────────────────────────────────────────

export interface EditorNote {
  id: string;
  week_label: string;
  published_at: string;
  title: string | null;
  content: string;
  related_event_ids: string[];
  author: string;
}

// ── Dashboard aggregate ───────────────────────────────────────────────────────

export interface DashboardData {
  highlights: IntelligenceItem[];
  forward_view: IntelligenceItem[];
  narratives: NarrativeThread[];
  region_activity: Record<IntelligenceRegion, number>;
  editor_note: EditorNote | null;
  recent_timeline: IntelligenceItem[];
}

// ── Display metadata ──────────────────────────────────────────────────────────

export const REGION_META: Record<IntelligenceRegion, { label: string; color: string; bg: string; dot: string }> = {
  us:     { label: 'United States',  color: '#993C1D', bg: '#FAECE7', dot: '#993C1D' },
  eu:     { label: 'European Union', color: '#3C3489', bg: '#EEEDFE', dot: '#3C3489' },
  hk:     { label: 'Hong Kong',      color: '#0C447C', bg: '#E6F1FB', dot: '#0C447C' },
  sg:     { label: 'Singapore',      color: '#085041', bg: '#E1F5EE', dot: '#085041' },
  uae:    { label: 'UAE',            color: '#854F0B', bg: '#FAEEDA', dot: '#854F0B' },
  global: { label: 'Global',         color: '#374151', bg: '#F1F4F6', dot: '#737C7F' },
};

export const CATEGORY_META: Record<IntelligenceCategory, { label: string; icon: string }> = {
  global_policy:  { label: 'Policy',    icon: 'gavel' },
  hk_observation: { label: 'HK Watch',  icon: 'visibility' },
  narrative:      { label: 'Narrative', icon: 'trending_up' },
};

export const EVENT_TYPE_META: Record<IntelligenceEventType, {
  label: string;
  icon: string;
  bg: string;
  color: string;
}> = {
  regulation:     { label: 'Policy',      icon: 'gavel',          bg: '#F1F4F6', color: '#737C7F' },
  institutional:  { label: 'Institution', icon: 'account_balance', bg: '#F3F0FE', color: '#5B21B6' },
  project:        { label: 'Project',     icon: 'deployed_code',  bg: '#F0FDFA', color: '#0D9488' },
  research:       { label: 'Research',    icon: 'article',        bg: '#EFF6FF', color: '#1D4ED8' },
  data_milestone: { label: 'Data',        icon: 'bar_chart',      bg: '#FFFBEB', color: '#B45309' },
};
