import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addKobo, formatKobo, kobo, naira, subtractKobo } from '../src/money';

describe('kobo', () => {
  it.each([0.5, 1.1, Number.NaN, Infinity, 2 ** 53])('rejects %s', (bad) => {
    expect(() => kobo(bad)).toThrow(RangeError);
  });

  it('converts naira to kobo exactly', () => {
    expect(naira(1_500)).toBe(150_000);
  });
});

describe('formatKobo', () => {
  it.each([
    [0, '0.00'],
    [5, '0.05'],
    [100, '1.00'],
    [123_456_789, '1,234,567.89'],
    [-250_050, '-2,500.50'],
  ])('formats %i as %s', (amount, expected) => {
    expect(formatKobo(kobo(amount))).toBe(expected);
  });

  it('round-trips: digits of the output equal the kobo value', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e12 }), (amount) => {
        const digits = formatKobo(kobo(amount)).replace(/[,.]/g, '');
        expect(Number(digits)).toBe(amount);
      }),
    );
  });
});

describe('arithmetic', () => {
  it('is exact where floats are not (0.1 + 0.2 in naira)', () => {
    expect(addKobo(kobo(10), kobo(20))).toBe(30);
    expect(subtractKobo(kobo(30), kobo(10))).toBe(20);
  });
});
