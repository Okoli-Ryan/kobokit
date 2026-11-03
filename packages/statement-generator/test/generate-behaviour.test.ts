import { describe, expect, it } from 'vitest';
import { generateStatementData } from '../src/generate';

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

describe('salary narration', () => {
  it('names the same employer every month', () => {
    const { transactions } = generateStatementData({
      seed: 3,
      persona: 'salaried',
      bank: 'kola',
      months: 6,
    });
    const employers = transactions
      .filter((t) => t.category === 'salary')
      .map(
        (t) =>
          /(BAOBAB LOGISTICS|GINGER FOODS|HARBOUR STEEL|MERIDIAN HEALTH)/.exec(t.narration)?.[1],
      );
    expect(employers).toHaveLength(6);
    expect(new Set(employers).size).toBe(1);
  });
});

describe('regressions found by property tests', () => {
  it('a salary range of zero produces no salary rows (never a row with both sides zero)', () => {
    const { transactions } = generateStatementData({
      seed: 1,
      bank: 'kola',
      months: 3,
      persona: {
        id: 'zero-salary',
        label: 'Zero salary',
        openingBalance: { min: 0, max: 0 },
        salary: { dayOfMonth: 25, amount: { min: 0, max: 0 } },
        activities: [],
        reversalProbability: 0,
      },
    });
    expect(transactions.every((t) => t.debit > 0 || t.credit > 0)).toBe(true);
    expect(transactions.some((t) => t.category === 'salary')).toBe(false);
  });
});
