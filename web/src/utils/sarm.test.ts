/**
 * Unit tests for SARM pure functions.
 * Run with: npx vitest run src/utils/sarm.test.ts
 *
 * These tests cover the aggregation logic without any rendering.
 */

import { describe, it, expect } from 'vitest';
import {
  aggregateSARM,
  hasRedFlag,
  grayCount,
  dimensionsBySeverity,
  SARM_DIMENSION_KEYS,
} from './sarm';
import type { SARMBlock } from '../types/licenses';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBlock(signals: Record<string, string>): SARMBlock {
  const base = {
    key: 'test', label: 'Test', rationale: '', sources: [],
  };
  return {
    capital_adequacy: { ...base, key: 'capital_adequacy', label: 'Capital Adequacy', signal: signals.capital_adequacy as any ?? 'gray' },
    reserve_quality:  { ...base, key: 'reserve_quality',  label: 'Reserve Quality',  signal: signals.reserve_quality  as any ?? 'gray' },
    governance:       { ...base, key: 'governance',       label: 'Governance',       signal: signals.governance       as any ?? 'gray' },
    technology:       { ...base, key: 'technology',       label: 'Technology',       signal: signals.technology       as any ?? 'gray' },
    redemption:       { ...base, key: 'redemption',       label: 'Redemption',       signal: signals.redemption       as any ?? 'gray' },
    disclosure:       { ...base, key: 'disclosure',       label: 'Disclosure',       signal: signals.disclosure       as any ?? 'gray' },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('aggregateSARM', () => {
  it('counts all-gray correctly', () => {
    const block = makeBlock({
      capital_adequacy: 'gray', reserve_quality: 'gray', governance: 'gray',
      technology: 'gray', redemption: 'gray', disclosure: 'gray',
    });
    const result = aggregateSARM(block);
    expect(result.gray).toBe(6);
    expect(result.green).toBe(0);
    expect(result.yellow).toBe(0);
    expect(result.red).toBe(0);
    expect(result.total).toBe(6);
    expect(result.dominant).toBe('gray');
  });

  it('dominant is green when most dimensions are green', () => {
    const block = makeBlock({
      capital_adequacy: 'green', reserve_quality: 'green', governance: 'green',
      technology: 'yellow', redemption: 'gray', disclosure: 'gray',
    });
    const result = aggregateSARM(block);
    expect(result.green).toBe(3);
    expect(result.yellow).toBe(1);
    expect(result.dominant).toBe('green');
  });

  it('dominant is red when red is the plurality non-gray', () => {
    const block = makeBlock({
      capital_adequacy: 'red', reserve_quality: 'red', governance: 'yellow',
      technology: 'gray', redemption: 'gray', disclosure: 'gray',
    });
    const result = aggregateSARM(block);
    expect(result.red).toBe(2);
    expect(result.dominant).toBe('red');
  });

  it('total is always 6', () => {
    const block = makeBlock({
      capital_adequacy: 'green', reserve_quality: 'yellow', governance: 'red',
      technology: 'gray', redemption: 'green', disclosure: 'yellow',
    });
    expect(aggregateSARM(block).total).toBe(SARM_DIMENSION_KEYS.length);
  });
});

describe('hasRedFlag', () => {
  it('returns false when no red dimensions', () => {
    const issuer = { sarm: makeBlock({ capital_adequacy: 'green', reserve_quality: 'yellow', governance: 'gray', technology: 'gray', redemption: 'gray', disclosure: 'gray' }) } as any;
    expect(hasRedFlag(issuer)).toBe(false);
  });

  it('returns true when at least one dimension is red', () => {
    const issuer = { sarm: makeBlock({ capital_adequacy: 'green', reserve_quality: 'red', governance: 'gray', technology: 'gray', redemption: 'gray', disclosure: 'gray' }) } as any;
    expect(hasRedFlag(issuer)).toBe(true);
  });
});

describe('grayCount', () => {
  it('counts gray dimensions correctly', () => {
    const issuer = { sarm: makeBlock({ capital_adequacy: 'green', reserve_quality: 'gray', governance: 'gray', technology: 'gray', redemption: 'yellow', disclosure: 'gray' }) } as any;
    expect(grayCount(issuer)).toBe(4);
  });

  it('returns 0 when no gray dimensions', () => {
    const issuer = { sarm: makeBlock({ capital_adequacy: 'green', reserve_quality: 'green', governance: 'green', technology: 'green', redemption: 'green', disclosure: 'green' }) } as any;
    expect(grayCount(issuer)).toBe(0);
  });
});

describe('dimensionsBySeverity', () => {
  it('places red first, then yellow, green, gray', () => {
    const block = makeBlock({
      capital_adequacy: 'gray', reserve_quality: 'green', governance: 'red',
      technology: 'yellow', redemption: 'gray', disclosure: 'gray',
    });
    const sorted = dimensionsBySeverity(block);
    expect(sorted[0].signal).toBe('red');
    expect(sorted[1].signal).toBe('yellow');
    expect(sorted[2].signal).toBe('green');
    expect(sorted[3].signal).toBe('gray');
  });
});
