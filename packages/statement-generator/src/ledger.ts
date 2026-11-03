import { compareDates, toIsoDate } from './dates';
import { addKobo, kobo, subtractKobo, type Kobo } from './money';
import type { PlannedEvent } from './plan';
import type { DraftTransaction } from './statement';
import { DIRECTION_OF } from './types';

const ZERO = kobo(0);

/**
 * The only place balances are computed. Events are applied in date order; one that would overdraw
 * the account is dropped (and so are its fee and reversal), so the balance never goes negative.
 */
export function runLedger(
  opening: Kobo,
  events: readonly PlannedEvent[],
): { transactions: DraftTransaction[]; closing: Kobo } {
  const ordered = [...events].sort((a, b) => compareDates(a.date, b.date) || a.seq - b.seq);
  const applied = new Set<number>();
  const transactions: DraftTransaction[] = [];
  let balance = opening;
  for (const event of ordered) {
    if (event.parentSeq !== undefined && !applied.has(event.parentSeq)) continue;
    const isDebit = DIRECTION_OF[event.category] === 'debit';
    if (isDebit && event.amount > balance) continue;
    balance = isDebit ? subtractKobo(balance, event.amount) : addKobo(balance, event.amount);
    applied.add(event.seq);
    transactions.push(toTransaction(event, transactions.length + 1, isDebit, balance));
  }
  return { transactions, closing: balance };
}

function toTransaction(
  event: PlannedEvent,
  position: number,
  isDebit: boolean,
  balance: Kobo,
): DraftTransaction {
  return {
    id: `TX${String(position).padStart(6, '0')}`,
    date: toIsoDate(event.date),
    narration: event.narration,
    debit: isDebit ? event.amount : ZERO,
    credit: isDebit ? ZERO : event.amount,
    balance,
    category: event.category,
  };
}

export interface BalanceCheck {
  ok: boolean;
  /** Rows whose balance is not the previous row's balance + credit - debit. */
  badRows: number[];
  /** Whether opening + all credits - all debits equals the stated closing balance. */
  totalsMatch: boolean;
}

interface Reconcilable {
  openingBalance: Kobo;
  closingBalance: Kobo;
  transactions: readonly { debit: Kobo; credit: Kobo; balance: Kobo }[];
}

/** Checks each row against the row before it, then the whole statement against its totals. */
export function verifyBalances(statement: Reconcilable): BalanceCheck {
  const badRows: number[] = [];
  let previous: number = statement.openingBalance;
  let total: number = statement.openingBalance;
  statement.transactions.forEach((tx, index) => {
    if (tx.balance !== previous + tx.credit - tx.debit) badRows.push(index);
    previous = tx.balance;
    total += tx.credit - tx.debit;
  });
  const totalsMatch = total === statement.closingBalance && previous === statement.closingBalance;
  return { ok: badRows.length === 0 && totalsMatch, badRows, totalsMatch };
}
