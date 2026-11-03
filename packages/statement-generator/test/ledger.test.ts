import { describe, expect, it } from 'vitest';
import { runLedger, verifyBalances } from '../src/ledger';
import { naira } from '../src/money';
import type { PlannedEvent } from '../src/plan';

const event = (
  seq: number,
  day: number,
  category: PlannedEvent['category'],
  amount: number,
  parentSeq?: number,
): PlannedEvent => ({
  seq,
  parentSeq,
  date: { year: 2026, month: 1, day },
  category,
  amount: naira(amount),
  narration: `N${seq}`,
});

describe('runLedger', () => {
  it('applies events in date order and keeps running balances', () => {
    const { transactions, closing } = runLedger(naira(1_000), [
      event(0, 5, 'pos', 300),
      event(1, 2, 'salary', 500),
    ]);
    expect(transactions.map((t) => t.narration)).toEqual(['N1', 'N0']);
    expect(transactions.map((t) => t.balance)).toEqual([naira(1_500), naira(1_200)]);
    expect(closing).toBe(naira(1_200));
  });

  it('drops a debit that would overdraw, and its fee with it', () => {
    const { transactions } = runLedger(naira(100), [
      event(0, 1, 'transfer_out', 500),
      event(1, 1, 'bank_charge', 10, 0),
      event(2, 2, 'pos', 40),
    ]);
    expect(transactions.map((t) => t.narration)).toEqual(['N2']);
  });

  it('allows spending the exact balance down to zero', () => {
    const { closing } = runLedger(naira(100), [event(0, 1, 'pos', 100)]);
    expect(closing).toBe(0);
  });

  it('puts every amount on exactly one side', () => {
    const { transactions } = runLedger(naira(100), [
      event(0, 1, 'pos', 10),
      event(1, 1, 'salary', 5),
    ]);
    expect(transactions[0]).toMatchObject({ debit: naira(10), credit: 0 });
    expect(transactions[1]).toMatchObject({ debit: 0, credit: naira(5) });
  });
});

describe('verifyBalances', () => {
  const good = () => {
    const { transactions, closing } = runLedger(naira(100), [
      event(0, 1, 'salary', 50),
      event(1, 2, 'pos', 20),
      event(2, 3, 'pos', 10),
    ]);
    return { openingBalance: naira(100), closingBalance: closing, transactions };
  };

  it('passes an untouched ledger', () => {
    expect(verifyBalances(good())).toEqual({ ok: true, badRows: [], totalsMatch: true });
  });

  it('flags only the row whose amount was changed, and the totals', () => {
    const statement = good();
    statement.transactions = statement.transactions.map((tx, index) =>
      index === 1 ? { ...tx, debit: naira(25) } : tx,
    );
    expect(verifyBalances(statement)).toEqual({ ok: false, badRows: [1], totalsMatch: false });
  });

  it('flags a wrong closing balance even when every row is consistent', () => {
    const statement = { ...good(), closingBalance: naira(1) };
    expect(verifyBalances(statement)).toMatchObject({ ok: false, badRows: [], totalsMatch: false });
  });
});
