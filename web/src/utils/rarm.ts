
import type { RARMBlock, RARMLayerAssessment, RARMSignal, RARMSummary } from '../types/assets';

// ── Layer keys ────────────────────────────────────────────────────────────────

export const RARM_LAYER_KEYS: (keyof RARMBlock)[] = [
  'legal_jurisdictional',
  'valuation_oracles',
  'custody_asset_control',
  'kyc_aml_permissioning',
  'secondary_market_liquidity',
  'settlement_finality',
];

// ── Metadata ──────────────────────────────────────────────────────────────────

export const RARM_LAYER_META: Record<keyof RARMBlock, {
  label: string;
  shortLabel: string;
  description: string;
  index: number;
}> = {
  legal_jurisdictional: {
    label: 'Legal & Jurisdictional',
    shortLabel: 'Legal',
    description: 'Regulatory classification, investor rights, enforceability, and jurisdictional risk.',
    index: 1,
  },
  valuation_oracles: {
    label: 'Valuation & Oracles',
    shortLabel: 'Valuation',
    description: 'NAV methodology, pricing sources, oracle integrity, and fair-value reliability.',
    index: 2,
  },
  custody_asset_control: {
    label: 'Custody & Asset Control',
    shortLabel: 'Custody',
    description: 'Segregation, custodian quality, bankruptcy-remoteness, and audit coverage.',
    index: 3,
  },
  kyc_aml_permissioning: {
    label: 'KYC / AML & Permissioning',
    shortLabel: 'KYC/AML',
    description: 'Investor onboarding controls, sanctions screening, and on-chain transfer restrictions.',
    index: 4,
  },
  secondary_market_liquidity: {
    label: 'Secondary Market Liquidity',
    shortLabel: 'Liquidity',
    description: 'Market depth, redemption windows, bid-ask spreads, and transfer restrictions.',
    index: 5,
  },
  settlement_finality: {
    label: 'Settlement Finality',
    shortLabel: 'Settlement',
    description: 'DVP settlement, on-chain finality, reversibility risk, and dispute resolution.',
    index: 6,
  },
};

export const RARM_SIGNAL_META: Record<RARMSignal, {
  label: string;
  dot: string;
  bg: string;
  color: string;
  border: string;
}> = {
  green:  { label: 'Adequate',           dot: '#2E7D32', bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7' },
  yellow: { label: 'Notable Concerns',  dot: '#e09d2b', bg: '#FFF8E1', color: '#7B5800', border: '#FFD54F' },
  red:    { label: 'Material Concerns', dot: '#9e3f4e', bg: '#FCE4EC', color: '#880E4F', border: '#F48FB1' },
  gray:   { label: 'Insufficient Data', dot: '#9E9E9E', bg: '#F5F5F5', color: '#424242', border: '#E0E0E0' },
};

export const ASSET_CATEGORY_LABELS: Record<string, string> = {
  'tokenized-treasury':       'Tokenized Treasury',
  'tokenized-money-market':   'Tokenized Money Market',
  'tokenized-commodity':      'Tokenized Commodity',
  'tokenized-private-credit': 'Tokenized Private Credit',
  'tokenized-real-estate':    'Tokenized Real Estate',
  'tokenized-equity':         'Tokenized Equity',
  'other':                    'Other',
};

export const ASSET_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  'active':       { label: 'Active',       color: '#1B5E20', bg: '#E8F5E9' },
  'inactive':     { label: 'Inactive',     color: '#424242', bg: '#F5F5F5' },
  'under-review': { label: 'Under Review', color: '#7B5800', bg: '#FFF8E1' },
};

// ── Aggregation ───────────────────────────────────────────────────────────────

/**
 * Conservative RARM aggregate:
 *   1. Any gray  → gray  (incomplete assessment)
 *   2. Any red   → red
 *   3. ≥4 green, no red → green
 *   4. Otherwise → yellow
 */
export function aggregateRARM(rarm: RARMBlock): RARMSummary {
  const layers: RARMSignal[] = RARM_LAYER_KEYS.map(k => rarm[k].signal);
  const counts: Record<RARMSignal, number> = { green: 0, yellow: 0, red: 0, gray: 0 };
  for (const s of layers) counts[s]++;

  let dominant: RARMSignal;
  if (counts.gray > 0) {
    dominant = 'gray';
  } else if (counts.red > 0) {
    dominant = 'red';
  } else if (counts.green >= 4) {
    dominant = 'green';
  } else {
    dominant = 'yellow';
  }

  return {
    green: counts.green,
    yellow: counts.yellow,
    red: counts.red,
    gray: counts.gray,
    total: 6,
    dominant,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function hasRedLayer(rarm: RARMBlock): boolean {
  return RARM_LAYER_KEYS.some(k => rarm[k].signal === 'red');
}

export function grayLayerCount(rarm: RARMBlock): number {
  return RARM_LAYER_KEYS.filter(k => rarm[k].signal === 'gray').length;
}

export function layersBySeverity(
  rarm: RARMBlock,
): { key: keyof RARMBlock; layer: RARMLayerAssessment }[] {
  const order: RARMSignal[] = ['red', 'yellow', 'green', 'gray'];
  return [...RARM_LAYER_KEYS]
    .map(k => ({ key: k as keyof RARMBlock, layer: rarm[k as keyof RARMBlock] }))
    .sort((a, b) => order.indexOf(a.layer.signal) - order.indexOf(b.layer.signal));
}
