import { describe, it, expect } from 'vitest';
import { aggregateRARM, hasRedLayer, grayLayerCount } from './rarm';
import type { RARMBlock, RARMSignal } from '../types/assets';

function makeBlock(
  signals: [RARMSignal, RARMSignal, RARMSignal, RARMSignal, RARMSignal, RARMSignal],
): RARMBlock {
  const [legal, valuation, custody, kyc, liquidity, settlement] = signals;
  const make = (signal: RARMSignal) => ({ signal, rationale: '', citations: [] });
  return {
    legal_jurisdictional:       make(legal),
    valuation_oracles:          make(valuation),
    custody_asset_control:      make(custody),
    kyc_aml_permissioning:      make(kyc),
    secondary_market_liquidity: make(liquidity),
    settlement_finality:        make(settlement),
  };
}

// ── aggregateRARM ─────────────────────────────────────────────────────────────

describe('aggregateRARM', () => {
  it('all gray → dominant is gray', () => {
    const b = makeBlock(['gray', 'gray', 'gray', 'gray', 'gray', 'gray']);
    expect(aggregateRARM(b).dominant).toBe('gray');
  });

  it('gray takes precedence over red', () => {
    const b = makeBlock(['gray', 'red', 'red', 'red', 'red', 'red']);
    expect(aggregateRARM(b).dominant).toBe('gray');
  });

  it('gray takes precedence over all other signals', () => {
    const b = makeBlock(['green', 'green', 'green', 'green', 'green', 'gray']);
    expect(aggregateRARM(b).dominant).toBe('gray');
  });

  it('all red → dominant is red', () => {
    const b = makeBlock(['red', 'red', 'red', 'red', 'red', 'red']);
    expect(aggregateRARM(b).dominant).toBe('red');
  });

  it('all green → dominant is green', () => {
    const b = makeBlock(['green', 'green', 'green', 'green', 'green', 'green']);
    expect(aggregateRARM(b).dominant).toBe('green');
  });

  it('exactly 4 green 2 yellow (no red, no gray) → dominant is green', () => {
    const b = makeBlock(['green', 'green', 'green', 'green', 'yellow', 'yellow']);
    expect(aggregateRARM(b).dominant).toBe('green');
  });

  it('3 green 3 yellow (no red, no gray) → dominant is yellow', () => {
    const b = makeBlock(['green', 'green', 'green', 'yellow', 'yellow', 'yellow']);
    expect(aggregateRARM(b).dominant).toBe('yellow');
  });

  it('all yellow → dominant is yellow', () => {
    const b = makeBlock(['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow']);
    expect(aggregateRARM(b).dominant).toBe('yellow');
  });

  it('1 red 5 green (no gray) → dominant is red', () => {
    const b = makeBlock(['red', 'green', 'green', 'green', 'green', 'green']);
    expect(aggregateRARM(b).dominant).toBe('red');
  });

  it('signal counts are correct', () => {
    const b = makeBlock(['green', 'green', 'yellow', 'red', 'gray', 'gray']);
    const s = aggregateRARM(b);
    expect(s.green).toBe(2);
    expect(s.yellow).toBe(1);
    expect(s.red).toBe(1);
    expect(s.gray).toBe(2);
    expect(s.total).toBe(6);
    expect(s.dominant).toBe('gray');
  });
});

// ── hasRedLayer ───────────────────────────────────────────────────────────────

describe('hasRedLayer', () => {
  it('returns true if any layer is red', () => {
    expect(
      hasRedLayer(makeBlock(['red', 'green', 'green', 'green', 'green', 'green'])),
    ).toBe(true);
  });

  it('returns false if no layers are red', () => {
    expect(
      hasRedLayer(makeBlock(['green', 'yellow', 'gray', 'green', 'green', 'green'])),
    ).toBe(false);
  });

  it('returns false for all-gray block', () => {
    expect(
      hasRedLayer(makeBlock(['gray', 'gray', 'gray', 'gray', 'gray', 'gray'])),
    ).toBe(false);
  });
});

// ── grayLayerCount ────────────────────────────────────────────────────────────

describe('grayLayerCount', () => {
  it('counts 6 for all-gray block', () => {
    expect(grayLayerCount(makeBlock(['gray', 'gray', 'gray', 'gray', 'gray', 'gray']))).toBe(6);
  });

  it('counts partial gray correctly', () => {
    expect(grayLayerCount(makeBlock(['green', 'gray', 'yellow', 'green', 'gray', 'green']))).toBe(2);
  });

  it('counts 0 for no-gray block', () => {
    expect(grayLayerCount(makeBlock(['green', 'green', 'green', 'green', 'green', 'green']))).toBe(0);
  });
});
