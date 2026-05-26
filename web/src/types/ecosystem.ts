export type ParticipantType =
  | 'regulator'
  | 'exchange'
  | 'bank'
  | 'consortium'
  | 'asset_manager'
  | 'vatp'
  | 'international_org'
  | 'sovereign_bond'
  | 'commodity'
  | 'fund'
  | 'custody'
  | 'issuance_platform'
  | 'broker'
  | 'compliance_provider'
  | 'legal_firm'
  | 'audit_firm';

export type RARMSignal = 'green' | 'yellow' | 'red' | 'gray';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type GapType = 'data_gap' | 'market_gap' | 'research_gap';
export type GapSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface EcosystemParticipant {
  id: string;
  name: string;
  full_name: string;
  type: ParticipantType;
  role: string;
  tags: string[];
  url?: string;
  issuer_slug?: string;
  asset_slug?: string;
  asset_class?: string;
  issuer?: string;
  rarm_signal?: RARMSignal;
  confidence_level?: ConfidenceLevel;
}

export interface EcosystemLayer {
  id: string;
  order: number;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  participants: EcosystemParticipant[];
  participants_note?: string;
  applicants_note?: string;
  launched_at?: string;
  source?: string;
}

export interface EcosystemGap {
  id: string;
  layer_id: string;
  gap_type: GapType;
  title: string;
  description: string;
  severity: GapSeverity;
}

export interface EcosystemStats {
  regulators: number;
  licensed_stablecoin_issuers: number;
  stablecoin_applicants: number;
  ensembletx_institutions: number;
  licensed_vatps: number;
  hk_linked_rwa_protocols: number;
}

export interface ChartEntry {
  category: string;
  count: number;
  color: string;
}

export interface EcosystemMeta {
  version: string;
  last_compiled: string;
  title: string;
  description: string;
  disclaimer: string;
  sources: string[];
}

export interface EcosystemData {
  meta: EcosystemMeta;
  stats: EcosystemStats;
  layers: EcosystemLayer[];
  gaps: EcosystemGap[];
  participant_type_chart: ChartEntry[];
}
