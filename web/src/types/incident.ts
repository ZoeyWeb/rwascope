export type IncidentSeverity = 'catastrophic' | 'critical' | 'major';

export type RARMLayer = 'issuer' | 'custody' | 'oracle' | 'audit' | 'jurisdiction' | 'redemption';

export type IncidentAssetClass =
  | 'algorithmic_stablecoin'
  | 'fiat_stablecoin'
  | 'tokenized_real_estate'
  | 'tokenized_treasury'
  | 'tokenized_credit'
  | 'tokenized_commodity'
  | 'tokenized_royalty';

export interface IncidentCitationMeta {
  short_title: string;
  publisher: string;
  first_published_year: number;
}

export interface Incident {
  incident_id: string;
  incident_date: string;
  severity: IncidentSeverity;
  primary_asset_class: IncidentAssetClass;
  affected_rarm_layers: RARMLayer[];
  permalink: string;
  citation_meta: IncidentCitationMeta;
  // Projected from the parent project object
  slug: string;
  name: string;
  postmortem: {
    incident_date: string;
    root_cause: string;
    what_failed: Array<{ layer: string; layer_name: string; issue: string }>;
    outcome: string;
    rarm_lesson: string;
  };
  status?: string;
  asset_class?: string;
}
