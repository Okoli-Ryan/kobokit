import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BANKS } from '../src/banks';
import { generateStatement } from '../src/build';
import { WATERMARK_TEXT } from '../src/constants';
import { verifyBalances } from '../src/ledger';
import { renderPdf } from '../src/pdf/render';
import { BUILT_IN_PERSONAS } from '../src/personas-builtin';
import { tamperStatement } from '../src/tamper';
import { extractPdf } from './helpers/pdf-text';

const base = (seed: string | number = 5, persona = 'trader', bank = 'harmattan') =>
  generateStatement({ seed, persona, bank, months: 3 });

describe('amount tampering', () => {
  it('breaks reconciliation on exactly the rows the JSON lists', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.constantFrom(...BUILT_IN_PERSONAS.map((p) => p.id)),
        fc.integer({ min: 1, max: 4 }),
        (seed, persona, amounts) => {
          const { statement } = base(seed, persona);
          const tampered = tamperStatement(statement, seed, { amounts });
          const recorded = (tampered.tampering?.amountChanges ?? []).map((c) => c.index);
          expect(recorded).toHaveLength(amounts);
          expect(verifyBalances(tampered).badRows).toEqual(recorded);
          expect(verifyBalances(tampered).ok).toBe(false);
        },
      ),
      { numRuns: 40 },
    );
  });

  it('records exactly what changed, and nothing else differs', () => {
    const { statement } = base();
    const tampered = tamperStatement(statement, 5, { amounts: 3 });
    const diffs = statement.transactions.flatMap((before, index) => {
      const after = tampered.transactions[index];
      return (['debit', 'credit'] as const)
        .filter((field) => before[field] !== after?.[field])
        .map((field) => ({ index, field, original: before[field], tampered: after?.[field] }));
    });
    const recorded = (tampered.tampering?.amountChanges ?? []).map(
      ({ index, field, original, tampered: value }) => ({
        index,
        field,
        original,
        tampered: value,
      }),
    );
    expect(diffs).toEqual(recorded);
    expect(tampered.transactions.map((t) => t.balance)).toEqual(
      statement.transactions.map((t) => t.balance),
    );
    expect(tampered.closingBalance).toBe(statement.closingBalance);
  });

  it('records the page and line of each change', () => {
    const { statement } = base();
    const tampered = tamperStatement(statement, 5, { amounts: 2 });
    for (const change of tampered.tampering?.amountChanges ?? []) {
      const tx = statement.transactions[change.index];
      expect([change.page, change.line, change.id]).toEqual([tx?.page, tx?.line, tx?.id]);
    }
  });

  it('is deterministic and leaves the original statement untouched', () => {
    const { statement } = base();
    const before = JSON.stringify(statement);
    const a = JSON.stringify(tamperStatement(statement, 9, { amounts: 2, modifiedAt: true }));
    const b = JSON.stringify(tamperStatement(statement, 9, { amounts: 2, modifiedAt: true }));
    expect(a).toBe(b);
    expect(JSON.stringify(statement)).toBe(before);
  });

  it('refuses to do nothing, or to change more rows than exist', () => {
    const { statement } = base();
    expect(() => tamperStatement(statement, 1, {})).toThrow(/Nothing to tamper/);
    expect(() => tamperStatement(statement, 1, { amounts: 100_000 })).toThrow(RangeError);
  });
});

describe('modification-date tampering', () => {
  it('changes only the PDF metadata: amounts still reconcile, ModDate differs from CreationDate', async () => {
    const { statement, bank } = base();
    const tampered = tamperStatement(statement, 5, { modifiedAt: true });
    expect(verifyBalances(tampered).ok).toBe(true);
    expect(tampered.tampering?.amountChanges).toEqual([]);
    const pdf = await extractPdf(await renderPdf(tampered, bank));
    expect(pdf.info['ModDate']).not.toBe(pdf.info['CreationDate']);
    const expected = (tampered.tampering?.pdfModifiedAt ?? '').replace(/[-:T]/g, '').slice(0, 14);
    expect(pdf.info['ModDate']).toContain(expected);
  });

  it('accepts an explicit timestamp and rejects nonsense', () => {
    const { statement } = base();
    const tampered = tamperStatement(statement, 5, { modifiedAt: '2026-07-01T09:30:00Z' });
    expect(tampered.tampering?.pdfModifiedAt).toBe('2026-07-01T09:30:00.000Z');
    expect(() => tamperStatement(statement, 5, { modifiedAt: 'last tuesday' })).toThrow(RangeError);
  });
});

describe('the watermark stays', () => {
  it.each(BANKS.map((b) => b.id))('%s: still on every page when tampered', async (bankId) => {
    const { statement, bank } = base(3, 'trader', bankId);
    const tampered = tamperStatement(statement, 3, { amounts: 2, modifiedAt: true });
    const pdf = await extractPdf(await renderPdf(tampered, bank));
    for (const items of pdf.pages) {
      expect(items.filter((i) => i.str === WATERMARK_TEXT)).toHaveLength(1);
    }
  });
});
