import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BANKS, getBank } from '../src/banks';
import { generateHolder } from '../src/identity';
import { createRng } from '../src/rng';

describe('generateHolder', () => {
  it('always makes a 10-digit account number starting with 000', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const holder = generateHolder(createRng(seed));
        expect(holder.accountNumber).toMatch(/^000\d{7}$/);
        expect(holder.name).toMatch(/^[A-Z]+ [A-Z]+$/);
      }),
    );
  });
});

describe('banks', () => {
  it('has four banks with distinct ids and all three format families in use', () => {
    expect(new Set(BANKS.map((b) => b.id)).size).toBe(4);
    expect(new Set(BANKS.map((b) => b.family)).size).toBe(3);
  });

  it('looks banks up by id and explains a miss', () => {
    expect(getBank('harmattan').name).toBe('Harmattan Bank');
    expect(() => getBank('x')).toThrow(/harmattan/);
  });
});
