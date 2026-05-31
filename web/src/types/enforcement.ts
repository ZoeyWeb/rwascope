export type RarmLayer =
  | 'issuer' | 'custody' | 'oracle' | 'audit' | 'jurisdiction' | 'redemption';

export type SarmBlock =
  | 'reserve' | 'legal' | 'regulatory' | 'transparency' | 'settlement' | 'governance';

export type Regulator =
  | 'SEC' | 'CFTC' | 'DOJ' | 'OFAC' | 'NYDFS' | 'FinCEN'
  | 'SFC' | 'HKMA'
  | 'MAS'
  | 'FCA' | 'BaFin' | 'ESMA'
  | 'FSA' | 'FSC' | 'ASIC' | 'VARA';

export type Jurisdiction =
  | 'US' | 'HK' | 'SG' | 'UK' | 'EU' | 'DE'
  | 'JP' | 'KR' | 'AU' | 'AE' | 'CH' | 'CA';

export type TargetType =
  | 'stablecoin_issuer' | 'exchange' | 'fund'
  | 'custodian' | 'lending_platform' | 'tokenization_platform'
  | 'protocol' | 'dao' | 'individual' | 'mixer' | 'other';

export type ActionType =
  | 'order' | 'charges' | 'settlement' | 'conviction'
  | 'ban' | 'fine' | 'wells_notice' | 'sanctions'
  | 'investigation' | 'dismissal';

export type Status =
  | 'ongoing' | 'settled' | 'closed'
  | 'dismissed' | 'appealed' | 'overturned';

export type AssetClass =
  | 'stablecoin' | 'algo_stablecoin'
  | 'tokenised_securities' | 'tokenised_treasuries'
  | 'tokenised_real_estate' | 'tokenised_commodities'
  | 'crypto_lending' | 'yield_product' | 'staking_service'
  | 'crypto_native' | 'nft' | 'other';

export interface EnforcementAction {
  slug: string;
  action_date: string;
  regulator: Regulator;
  jurisdiction: Jurisdiction;
  target_entity: string;
  target_type: TargetType;
  action_type: ActionType;
  penalty_usd: number;
  penalty_note: string | null;
  summary: string;
  rwa_relevant: boolean;
  asset_classes: AssetClass[];
  rarm_layers: RarmLayer[];
  sarm_blocks: SarmBlock[];
  lessons: string[];
  related_incident_slugs: string[];
  related_issuer_slugs: string[];
  status: Status;
  sources: { label: string; url: string }[];
}

export interface EnforcementDataset {
  version: string;
  updated_at: string;
  actions: EnforcementAction[];
}
