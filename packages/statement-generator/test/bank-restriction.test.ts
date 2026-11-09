import { describe, expect, it } from 'vitest';
import { BANKS, getBank, requireKnownBank } from '../src/banks';
import { generateStatement } from '../src/build';
import { renderPdf } from '../src/pdf/render';

const options = { seed: 1, persona: 'trader', months: 1 } as const;

describe('only the built-in fictional banks can be used', () => {
  it('generateStatement accepts bank ids only', () => {
    expect(generateStatement({ ...options, bank: 'kola' }).bank.name).toBe('Kola Digital');
    // @ts-expect-error a profile object is no longer accepted
    expect(() => generateStatement({ ...options, bank: BANKS[0] })).toThrow(/Unknown bank/);
    expect(() => generateStatement({ ...options, bank: 'some-other-bank' })).toThrow(/harmattan/);
  });

  it('renderPdf rejects a profile with a different name, even under a built-in id', async () => {
    const { statement, bank } = generateStatement({ ...options, bank: 'kola' });
    await expect(renderPdf(statement, { ...bank, name: 'Renamed Bank' })).rejects.toThrow(
      /fictional banks/,
    );
  });

  it('renderPdf rejects an unknown id and a changed layout or date style', async () => {
    const { statement, bank } = generateStatement({ ...options, bank: 'kola' });
    await expect(renderPdf(statement, { ...bank, id: 'made-up' })).rejects.toThrow(RangeError);
    await expect(renderPdf(statement, { ...bank, family: 'grouped-by-date' })).rejects.toThrow(
      RangeError,
    );
    await expect(renderPdf(statement, { ...bank, dateStyle: 'DD/MM/YYYY' })).rejects.toThrow(
      RangeError,
    );
  });

  it('renderPdf still accepts a faithful copy of a built-in profile', async () => {
    const { statement, bank } = generateStatement({ ...options, bank: 'ember' });
    const copy = structuredClone(bank);
    expect((await renderPdf(statement, copy)).byteLength).toBeGreaterThan(1000);
  });

  it('requireKnownBank hands back the built-in profile', () => {
    expect(requireKnownBank(structuredClone(getBank('savanna')))).toBe(getBank('savanna'));
  });
});
