import type { Issuer, SARMBlock, SARMSignal, SARMSummary } from '../types/licenses';

// ── SARM dimension keys in canonical order ────────────────────────────────────
export const SARM_DIMENSION_KEYS = [
  'capital_adequacy',
  'reserve_quality',
  'governance',
  'technology',
  'redemption',
  'disclosure',
] as const;

export type SARMDimensionKey = typeof SARM_DIMENSION_KEYS[number];

// ── Signal metadata ───────────────────────────────────────────────────────────
export const SIGNAL_META: Record<SARMSignal, { label: string; color: string; bg: string; border: string }> = {
  green:  { label: 'Satisfactory',  color: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7' },
  yellow: { label: 'Partial',       color: '#e09d2b', bg: '#FFF8E1', border: '#FFE082' },
  red:    { label: 'Significant Gap', color: '#9e3f4e', bg: '#FCE4EC', border: '#F48FB1' },
  gray:   { label: 'Insufficient Data', color: '#737C7F', bg: '#ECEFF1', border: '#CFD8DC' },
};

// ── Status metadata ───────────────────────────────────────────────────────────
export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  under_review: { label: 'Under Review',  color: '#5E5C75', bg: '#EDE7F6' },
  sandbox:      { label: 'Sandbox',       color: '#2E7D32', bg: '#E8F5E9' },
  licensed:     { label: 'Licensed',      color: '#1565C0', bg: '#E3F2FD' },
  withdrawn:    { label: 'Withdrawn',     color: '#737C7F', bg: '#ECEFF1' },
  rejected:     { label: 'Rejected',      color: '#9e3f4e', bg: '#FCE4EC' },
};

// ── TYPE_LABELS ───────────────────────────────────────────────────────────────
export const TYPE_LABELS: Record<string, string> = {
  fiat_backed:       'Fiat-backed',
  commodity_backed:  'Commodity-backed',
  algorithmic:       'Algorithmic',
};

// ── aggregateSARM ─────────────────────────────────────────────────────────────
// Pure function — counts signals across all SARM dimensions.
// Does NOT produce a letter grade or composite score.
export function aggregateSARM(sarm: SARMBlock): SARMSummary {
  const signals = SARM_DIMENSION_KEYS.map(k => sarm[k].signal);
  const counts: Record<SARMSignal, number> = { green: 0, yellow: 0, red: 0, gray: 0 };
  for (const s of signals) counts[s]++;

  // Dominant: non-gray signal with the highest count.
  // Tie-break priority: red > yellow > green.
  // Falls back to gray when all dimensions are gray.
  const nonGray: SARMSignal[] = ['red', 'yellow', 'green'];
  let dominant: SARMSignal = 'gray';
  let maxCount = 0;
  for (const sig of nonGray) {
    if (counts[sig] > maxCount) {
      maxCount = counts[sig];
      dominant = sig;
    }
  }

  return {
    green:   counts.green,
    yellow:  counts.yellow,
    red:     counts.red,
    gray:    counts.gray,
    total:   signals.length,
    dominant,
  };
}

// ── getOverallSignal ──────────────────────────────────────────────────────────
// Returns dominant signal for display on overview cards.
export function getOverallSignal(issuer: Issuer): SARMSignal {
  return aggregateSARM(issuer.sarm).dominant;
}

// ── Unit-testable helpers (pure) ──────────────────────────────────────────────

/** Returns true if any dimension is red. */
export function hasRedFlag(issuer: Issuer): boolean {
  return SARM_DIMENSION_KEYS.some(k => issuer.sarm[k].signal === 'red');
}

/** Returns the count of gray dimensions. */
export function grayCount(issuer: Issuer): number {
  return SARM_DIMENSION_KEYS.filter(k => issuer.sarm[k].signal === 'gray').length;
}

/** Returns dimensions sorted by signal severity (red first, then yellow, green, gray). */
export function dimensionsBySeverity(sarm: SARMBlock) {
  const order: SARMSignal[] = ['red', 'yellow', 'green', 'gray'];
  return SARM_DIMENSION_KEYS
    .map(k => sarm[k])
    .sort((a, b) => order.indexOf(a.signal) - order.indexOf(b.signal));
}
