import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BANKS } from '../src/banks';
import { generateStatementData } from '../src/generate';
import { verifyBalances } from '../src/ledger';
import { BUILT_IN_PERSONAS } from '../src/personas-builtin';
import { PERSONA_CATEGORIES } from '../src/types';

const seeds = fc.oneof(fc.integer(), fc.string({ maxLength: 12 }));
const personas = fc.constantFrom(...BUILT_IN_PERSONAS.map((p) => p.id));
const banks = fc.constantFrom(...BANKS.map((b) => b.id));
const months = fc.integer({ min: 1, max: 12 });

/** A random but valid custom persona, so the properties hold beyond the five built-ins. */
const range = (max: number) =>
  fc
    .tuple(fc.nat(max), fc.nat(max))
    .map(([a, b]) => ({ min: Math.min(a, b), max: Math.max(a, b) }));
const customPersona = fc.record({
  id: fc.constant('custom'),
  label: fc.constant('Custom'),
  openingBalance: range(5_000_000),
  salary: fc.option(
    fc.record({ dayOfMonth: fc.integer({ min: 1, max: 28 }), amount: range(90_000_000) }),
    { nil: undefined },
  ),
  activities: fc.array(
    fc.record({
      category: fc.constantFrom(...PERSONA_CATEGORIES),
      perMonth: range(12),
      amount: range(4_000_000),
      probability: fc.double({ min: 0, max: 1, noNaN: true }),
    }),
    { maxLength: 6 },
  ),
  reversalProbability: fc.double({ min: 0, max: 1, noNaN: true }),
});

const anyOptions = fc.record({
  seed: seeds,
  persona: fc.oneof(personas, customPersona),
  bank: banks,
  months,
});

describe('generated statements reconcile (property tests)', () => {
  it('every running balance is right and the totals match, for any seed, persona, bank, length', () => {
    fc.assert(
      fc.property(anyOptions, (options) => {
        const statement = generateStatementData(options);
        expect(verifyBalances(statement)).toEqual({ ok: true, badRows: [], totalsMatch: true });
      }),
      { numRuns: 60 },
    );
  });

  it('balances are never negative, amounts are safe integers, and each row has one side', () => {
    fc.assert(
      fc.property(anyOptions, (options) => {
        const { transactions } = generateStatementData(options);
        for (const tx of transactions) {
          expect(tx.balance).toBeGreaterThanOrEqual(0);
          expect(Number.isSafeInteger(tx.debit) && Number.isSafeInteger(tx.credit)).toBe(true);
          expect(tx.debit > 0 !== tx.credit > 0).toBe(true);
        }
      }),
      { numRuns: 60 },
    );
  });

  it('dates are in order and inside the period; ids are unique', () => {
    fc.assert(
      fc.property(anyOptions, (options) => {
        const { transactions, period } = generateStatementData(options);
        const dates = transactions.map((t) => t.date);
        expect(dates).toEqual([...dates].sort());
        expect(dates.every((d) => d >= period.from && d <= period.to)).toBe(true);
        expect(new Set(transactions.map((t) => t.id)).size).toBe(transactions.length);
      }),
      { numRuns: 60 },
    );
  });
});

describe('determinism', () => {
  it('the same options give identical JSON; a different seed does not', () => {
    fc.assert(
      fc.property(anyOptions, (options) => {
        const first = JSON.stringify(generateStatementData(options));
        expect(JSON.stringify(generateStatementData(options))).toBe(first);
      }),
      { numRuns: 30 },
    );
    const base = { persona: 'trader', bank: 'kola', months: 3 };
    expect(JSON.stringify(generateStatementData({ ...base, seed: 1 }))).not.toBe(
      JSON.stringify(generateStatementData({ ...base, seed: 2 })),
    );
  });
});

describe('persona behaviour', () => {
  const run = (persona: string) =>
    generateStatementData({ seed: 42, persona, bank: 'harmattan', months: 6 });

  it('salaried: one salary a month, always on the 25th, always the same amount', () => {
    const salaries = run('salaried').transactions.filter((t) => t.category === 'salary');
    expect(salaries).toHaveLength(6);
    expect(salaries.every((t) => t.date.endsWith('-25'))).toBe(true);
    expect(new Set(salaries.map((t) => t.credit)).size).toBe(1);
  });

  it('trader has many more inflows than the salaried persona', () => {
    const inflows = (p: string) =>
      run(p).transactions.filter((t) => t.category === 'transfer_in').length;
    expect(inflows('trader')).toBeGreaterThan(inflows('salaried') * 3);
  });

  it('bettor bets often; loan stacker has loans in and repayments out', () => {
    const count = (p: string, category: string) =>
      run(p).transactions.filter((t) => t.category === category).length;
    expect(count('bettor', 'betting')).toBeGreaterThan(30);
    expect(count('loan-stacker', 'loan_disbursement')).toBeGreaterThan(0);
    expect(count('loan-stacker', 'loan_repayment')).toBeGreaterThan(0);
  });

  it('rejects bad months and unknown personas', () => {
    expect(() =>
      generateStatementData({ seed: 1, persona: 'trader', bank: 'kola', months: 13 }),
    ).toThrow(RangeError);
    expect(() =>
      generateStatementData({ seed: 1, persona: 'nope', bank: 'kola', months: 1 }),
    ).toThrow(/Unknown persona/);
  });

  it('uses a holder account number that starts with 000', () => {
    expect(run('trader').accountHolder.accountNumber).toMatch(/^000/);
  });
});
