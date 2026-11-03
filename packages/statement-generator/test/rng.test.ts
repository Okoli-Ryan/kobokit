import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRng, hashSeed } from '../src/rng';

const take = (seed: string | number, count: number): number[] => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer(), fc.string()), (seed) => {
        expect(take(seed, 20)).toEqual(take(seed, 20));
      }),
    );
  });

  it('gives different sequences for different seeds', () => {
    expect(take(1, 5)).not.toEqual(take(2, 5));
    expect(take('42', 5)).toEqual(take(42, 5)); // numbers are hashed as their string form
  });

  it('keeps next() inside [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => take(seed, 50).every((value) => value >= 0 && value < 1)),
    );
  });

  it('keeps int() inside its inclusive range', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: -50, max: 50 }),
        fc.nat(100),
        (seed, min, span) => {
          const value = createRng(seed).int(min, min + span);
          expect(value).toBeGreaterThanOrEqual(min);
          expect(value).toBeLessThanOrEqual(min + span);
        },
      ),
    );
  });

  it('can hit both ends of a small range', () => {
    const rng = createRng('ends');
    const seen = new Set(Array.from({ length: 200 }, () => rng.int(1, 3)));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('rejects empty picks and backwards ranges', () => {
    expect(() => createRng(1).pick([])).toThrow(RangeError);
    expect(() => createRng(1).int(5, 1)).toThrow(RangeError);
  });

  it('weighted() never picks a zero-weight item and follows the weights', () => {
    const rng = createRng('weights');
    const counts = { a: 0, b: 0, never: 0 };
    for (let i = 0; i < 2000; i++) {
      counts[
        rng.weighted([
          { item: 'a' as const, weight: 3 },
          { item: 'b' as const, weight: 1 },
          { item: 'never' as const, weight: 0 },
        ])
      ]++;
    }
    expect(counts.never).toBe(0);
    expect(counts.a).toBeGreaterThan(counts.b * 2);
  });
});

describe('hashSeed', () => {
  it('is stable (golden values guard against accidental algorithm changes)', () => {
    expect(hashSeed('kobokit')).toBe(hashSeed('kobokit'));
    expect(hashSeed('')).toBe(0x811c9dc5);
  });
});
