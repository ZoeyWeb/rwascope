// ── SARM Signal ───────────────────────────────────────────────────────────────
// Traffic-light only. No numerical scores. No letter grades.
// green  = satisfactory / meets standard
// yellow = partial / conditional / minor gaps
// red    = significant gap / non-compliant
// gray   = insufficient public information to assess
export type SARMSignal = 'green' | 'yellow' | 'red' | 'gray';

// ── Citation ──────────────────────────────────────────────────────────────────
export interface Citation {
  label: string;
  url: string;
  date?: string;
}

// ── SARM Dimension ────────────────────────────────────────────────────────────
export interface SARMDimension {
  key: string;
  label: string;
  signal: SARMSignal;
  rationale: string;
  sources: Citation[];
}

// ── SARM Block ────────────────────────────────────────────────────────────────
export interface SARMBlock {
  capital_adequacy: SARMDimension;
  reserve_quality: SARMDimension;
  governance: SARMDimension;
  technology: SARMDimension;
  redemption: SARMDimension;
  disclosure: SARMDimension;
}

// ── Jurisdiction Code ─────────────────────────────────────────────────────────
export type JurisdictionCode = 'HK' | 'SG' | 'EU' | 'UAE' | 'US' | 'JP';

// ── Issuer Status ─────────────────────────────────────────────────────────────
export type IssuerStatus =
  | 'under_review'
  | 'sandbox'
  | 'licensed'
  | 'withdrawn'
  | 'rejected';

// ── Issuer Type ───────────────────────────────────────────────────────────────
export type IssuerType = 'fiat_backed' | 'commodity_backed' | 'algorithmic';

// ── Issuer ────────────────────────────────────────────────────────────────────
export interface Issuer {
  slug: string;
  name: string;
  ticker: string;
  logo_url?: string;
  parent: string;
  jurisdiction: string;
  jurisdiction_code: JurisdictionCode;
  application_date: string;   // ISO date string or "Unknown"
  status: IssuerStatus;
  peg: string;                // e.g. "HKD", "USD"
  type: IssuerType;
  summary: string;
  sarm: SARMBlock;
  reserve_details: string;
  governance_notes: string;
  technology_notes: string;
  redemption_notes: string;
  disclosure_notes: string;
  citations: Citation[];
  last_reviewed: string;      // ISO date string
  reviewer_note: string;
}

// ── Regime Status ─────────────────────────────────────────────────────────────
export type RegimeStatus = 'active' | 'developing' | 'proposed' | 'none';

// ── Jurisdiction ──────────────────────────────────────────────────────────────
export interface Jurisdiction {
  code: JurisdictionCode;
  name: string;
  regulator: string;
  framework: string;
  framework_url: string;
  regime_status: RegimeStatus;
  regime_effective_date: string | null;
  summary: string;
}

// ── Aggregated SARM result ────────────────────────────────────────────────────
// Pure function output — describes the overall picture without combining into
// a single letter grade or numerical score.
export interface SARMSummary {
  green: number;
  yellow: number;
  red: number;
  gray: number;
  total: number;
  // Dominant signal: the most frequent non-gray signal, or gray if all gray.
  dominant: SARMSignal;
}
