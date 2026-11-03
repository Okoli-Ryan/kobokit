import { describe, expect, it } from 'vitest';
import { BANKS } from '../src/banks';
import { generateStatement } from '../src/build';
import { PDF_PRODUCER, WATERMARK_TEXT } from '../src/constants';
import { formatKobo } from '../src/money';
import { renderPdf } from '../src/pdf/render';
import { BUILT_IN_PERSONAS } from '../src/personas-builtin';
import { extractPdf } from './helpers/pdf-text';

const build = async (bank: string, persona: string, months: number, seed = 42) => {
  const generated = generateStatement({ seed, persona, bank, months });
  const pdf = await extractPdf(await renderPdf(generated.statement, generated.bank));
  return { ...generated, pdf };
};

describe('round trip: every transaction is on the page the JSON says', () => {
  const cases = BANKS.flatMap((bank) => BUILT_IN_PERSONAS.map((p) => [bank.id, p.id] as const));

  it.each(cases)('%s / %s', async (bank, persona) => {
    const { statement, pdf } = await build(bank, persona, 3);
    for (const tx of statement.transactions) {
      const texts = (pdf.pages[tx.page - 1] ?? []).map((item) => item.str);
      expect(texts, `${tx.id} narration`).toContain(tx.narration);
      expect(texts, `${tx.id} balance`).toContain(formatKobo(tx.balance));
      expect(texts, `${tx.id} amount`).toContain(formatKobo(tx.debit > 0 ? tx.debit : tx.credit));
    }
  });

  it('a long statement spans several pages and page numbers match', async () => {
    const { statement, pdf } = await build('ember', 'trader', 12);
    expect(pdf.pages.length).toBeGreaterThan(5);
    expect(Math.max(...statement.transactions.map((t) => t.page))).toBe(pdf.pages.length);
  });

  it('lines run top to bottom in the order the JSON gives', async () => {
    const { statement, pdf } = await build('kola', 'trader', 4);
    pdf.pages.forEach((items, index) => {
      const onPage = statement.transactions.filter((t) => t.page === index + 1);
      const narrations = new Set(onPage.map((t) => t.narration));
      const drawnOrder = items
        .filter((item) => narrations.has(item.str))
        .sort((a, b) => (b.transform[5] ?? 0) - (a.transform[5] ?? 0))
        .map((item) => item.str);
      const expected = [...onPage].sort((a, b) => a.line - b.line).map((t) => t.narration);
      expect(drawnOrder).toEqual(expected);
    });
  });
});

describe('safety markings', () => {
  it.each(BANKS.map((b) => b.id))(
    '%s: watermark and footer on every page, watermark is diagonal',
    async (bank) => {
      const { pdf } = await build(bank, 'trader', 6);
      expect(pdf.pages.length).toBeGreaterThan(1);
      pdf.pages.forEach((items, index) => {
        const marks = items.filter((item) => item.str === WATERMARK_TEXT);
        expect(marks).toHaveLength(1);
        const [a, b] = marks[0]?.transform ?? [];
        expect(Math.abs(a ?? 0)).toBeGreaterThan(1);
        expect(Math.abs(b ?? 0)).toBeGreaterThan(1);
        const footer = items.find((item) => item.str.startsWith(`${WATERMARK_TEXT} | Page`));
        expect(footer?.str).toBe(`${WATERMARK_TEXT} | Page ${index + 1} of ${pdf.pages.length}`);
      });
    },
  );

  it('sets Producer and Creator, and does not claim a later modification', async () => {
    const { pdf } = await build('harmattan', 'salaried', 1);
    expect(pdf.info['Producer']).toBe(PDF_PRODUCER);
    expect(pdf.info['Creator']).toBe(PDF_PRODUCER);
    expect(pdf.info['CreationDate']).toBe(pdf.info['ModDate']);
  });

  it('prints the fictional account number and bank name', async () => {
    const { statement, pdf } = await build('harmattan', 'salaried', 1);
    const texts = (pdf.pages[0] ?? []).map((i) => i.str);
    expect(texts).toContain('Harmattan Bank');
    expect(texts).toContain(`Account number: ${statement.accountHolder.accountNumber}`);
  });
});

describe('determinism', () => {
  it('the same seed gives identical JSON and identical PDF bytes', async () => {
    const a = generateStatement({ seed: 7, persona: 'bettor', bank: 'savanna', months: 2 });
    const b = generateStatement({ seed: 7, persona: 'bettor', bank: 'savanna', months: 2 });
    expect(JSON.stringify(a.statement)).toBe(JSON.stringify(b.statement));
    expect(await renderPdf(a.statement, a.bank)).toEqual(await renderPdf(b.statement, b.bank));
  });
});
