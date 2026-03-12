import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '@/components/workspace/BlindBidding';

describe('calculateSettlement', () => {
  it('returns settled=true when ranges overlap', () => {
    const result = calculateSettlement([10000, 20000], [15000, 25000]);
    expect(result.settled).toBe(true);
    expect(result.amount).toBeDefined();
    expect(result.gap).toBeUndefined();
  });

  it('returns settled=false when ranges do not overlap', () => {
    const result = calculateSettlement([10000, 14000], [16000, 20000]);
    expect(result.settled).toBe(false);
    expect(result.gap).toBeDefined();
    expect(result.amount).toBeUndefined();
  });

  it('gap is correct distance between ranges', () => {
    const result = calculateSettlement([10000, 14000], [16000, 20000]);
    expect(result.settled).toBe(false);
    expect(result.gap).toBe(2000); // overlapMin=16000, overlapMax=14000 → |16000-14000|=2000
  });

  it('exact match at a single point (touching ranges) settles', () => {
    // aRange max === bRange min → overlapMin = bRange[0] = aRange[1] = 15000
    // overlapMax = aRange[1] = 15000 → overlap = 0, which satisfies <= condition
    const result = calculateSettlement([10000, 15000], [15000, 20000]);
    expect(result.settled).toBe(true);
    expect(result.amount).toBe(15000);
  });

  it('RCB algorithm rewards the party with wider range (higher weight)', () => {
    // Party A wide range [0, 10000], Party B narrow [5000, 6000]
    // overlap: [5000, 6000], aWidth=10000, bWidth=1000, total=11000
    // aWeight = 10000/11000 ≈ 0.909
    // amount = 5000 + (6000-5000) * 0.909 = 5000 + 909.09 ≈ 5909.09 → rounds to 5909.09
    const result = calculateSettlement([0, 10000], [5000, 6000]);
    expect(result.settled).toBe(true);
    expect(result.amount).toBeGreaterThan(5000);
    expect(result.amount).toBeLessThan(6000);
    // Wide party A has higher weight → settlement closer to B's min than center
    expect(result.amount!).toBeGreaterThan(5500);
  });

  it('equal widths produce midpoint settlement', () => {
    // A: [0, 100], B: [50, 150] → overlap [50, 100]
    // aWidth = bWidth = 100 → aWeight = 0.5
    // amount = 50 + (100-50) * 0.5 = 75
    const result = calculateSettlement([0, 100], [50, 150]);
    expect(result.settled).toBe(true);
    expect(result.amount).toBe(75);
  });

  it('returns amount rounded to 2 decimal places', () => {
    const result = calculateSettlement([0, 3], [1, 4]);
    if (result.settled && result.amount !== undefined) {
      const str = result.amount.toString();
      const decimals = str.includes('.') ? str.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    }
  });

  it('handles zero-width ranges with 0.5 weight fallback', () => {
    // Both zero-width: total = 0 → aWeight = 0.5
    const result = calculateSettlement([50, 50], [50, 50]);
    expect(result.settled).toBe(true);
    expect(result.amount).toBe(50);
  });

  it('handles negative ranges (e.g. temperature, loss scenarios)', () => {
    const result = calculateSettlement([-100, -50], [-75, -25]);
    expect(result.settled).toBe(true);
    expect(result.amount).toBeDefined();
    expect(result.amount!).toBeLessThanOrEqual(-50);
    expect(result.amount!).toBeGreaterThanOrEqual(-75);
  });

  it('handles large settlement amounts (e.g. corporate deals)', () => {
    const result = calculateSettlement([1000000, 5000000], [3000000, 7000000]);
    expect(result.settled).toBe(true);
    expect(result.amount).toBeGreaterThan(3000000);
    expect(result.amount).toBeLessThan(5000000);
  });
});
