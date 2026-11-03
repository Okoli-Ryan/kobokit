import { kobo, type Kobo } from './money';
import { creationDateFor } from './pdf/metadata';
import { createRng, type Rng } from './rng';
import type { AmountChange, Statement, TamperRecord, Transaction } from './statement';

export interface TamperOptions {
  /** How many amounts to change (each one leaves its running balance untouched). */
  amounts?: number;
  /** An ISO timestamp, or true to derive a believable later one from the seed. */
  modifiedAt?: string | true;
}

/** Rows below this are skipped so a changed amount never collapses to zero. */
const MIN_TAMPERABLE: Kobo = kobo(10_000);

const sideOf = (tx: Transaction): 'debit' | 'credit' => (tx.debit > 0 ? 'debit' : 'credit');

function pickRows(statement: Statement, count: number, rng: Rng): number[] {
  const pool = statement.transactions.flatMap((tx, index) =>
    tx[sideOf(tx)] >= MIN_TAMPERABLE ? [index] : [],
  );
  if (pool.length < count) {
    throw new RangeError(`Cannot change ${count} amounts: only ${pool.length} are large enough`);
  }
  const chosen: number[] = [];
  while (chosen.length < count) {
    const [picked] = pool.splice(rng.int(0, pool.length - 1), 1);
    if (picked !== undefined) chosen.push(picked);
  }
  return chosen.sort((a, b) => a - b);
}

/** Credits are inflated and debits shrunk, the direction a forger would choose. */
function changeAmount(tx: Transaction, index: number, rng: Rng): AmountChange {
  const field = sideOf(tx);
  const original = tx[field];
  const delta = Math.max(1, Math.floor((original * rng.int(10, 90)) / 100));
  const tampered = kobo(field === 'credit' ? original + delta : original - delta);
  return { id: tx.id, index, page: tx.page, line: tx.line, field, original, tampered };
}

function resolveModifiedAt(statement: Statement, option: string | true, rng: Rng): string {
  if (option !== true) {
    const parsed = new Date(option);
    if (Number.isNaN(parsed.getTime())) throw new RangeError(`Invalid modifiedAt "${option}"`);
    return parsed.toISOString();
  }
  const created = creationDateFor(statement).getTime();
  const later =
    created + rng.int(2, 60) * 86_400_000 + rng.int(8, 18) * 3_600_000 + rng.int(0, 59) * 60_000;
  return new Date(later).toISOString();
}

/**
 * Edits a finished statement the way a forger might: amounts change but running balances and the
 * closing balance are left alone, so reconciliation breaks on exactly the recorded rows.
 */
export function tamperStatement(
  statement: Statement,
  seed: string | number,
  options: TamperOptions,
): Statement {
  const { amounts = 0, modifiedAt } = options;
  if (amounts === 0 && modifiedAt === undefined) {
    throw new RangeError('Nothing to tamper with: set amounts and/or modifiedAt');
  }
  const rng = createRng(`${seed}|tamper`);
  const amountChanges = pickRows(statement, amounts, rng).map((index) =>
    changeAmount(statement.transactions[index] as Transaction, index, rng),
  );
  const byIndex = new Map(amountChanges.map((change) => [change.index, change]));
  const record: TamperRecord = { amountChanges };
  if (modifiedAt !== undefined)
    record.pdfModifiedAt = resolveModifiedAt(statement, modifiedAt, rng);
  return {
    ...statement,
    transactions: statement.transactions.map((tx, index) => {
      const change = byIndex.get(index);
      return change ? { ...tx, [change.field]: change.tampered } : tx;
    }),
    tampering: record,
  };
}
