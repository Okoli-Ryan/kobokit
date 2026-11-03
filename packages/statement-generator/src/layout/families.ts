import type { FormatFamily } from '../banks';
import { formatDate, parseIsoDate, type DateStyle } from '../dates';
import { formatKobo, type Kobo } from '../money';
import type { DraftTransaction } from '../statement';

export interface Column {
  header: string;
  x: number;
  width: number;
  align: 'left' | 'right';
}

/** One printed line of the table body: a transaction row, or a date heading. */
export interface BodyLine {
  kind: 'row' | 'group';
  cells: string[];
  /** Index into the statement's transactions; only rows have one. */
  txIndex?: number;
}

interface Family {
  columns: Column[];
  buildLines(transactions: readonly DraftTransaction[], dateStyle: DateStyle): BodyLine[];
}

const left = (header: string, x: number, width: number): Column => ({
  header,
  x,
  width,
  align: 'left',
});
const right = (header: string, x: number, width: number): Column => ({
  header,
  x,
  width,
  align: 'right',
});

const blankIfZero = (amount: Kobo): string => (amount === 0 ? '' : formatKobo(amount));
const datePart = (tx: DraftTransaction, style: DateStyle): string =>
  formatDate(parseIsoDate(tx.date), style);

function oneAmountRow(tx: DraftTransaction, txIndex: number, style: DateStyle): BodyLine {
  const isDebit = tx.debit > 0;
  const amount = isDebit ? tx.debit : tx.credit;
  const cells = [datePart(tx, style), tx.narration, blankIfZero(amount), isDebit ? 'DR' : 'CR'];
  return { kind: 'row', txIndex, cells: [...cells, formatKobo(tx.balance)] };
}

function twoColumnRow(tx: DraftTransaction, txIndex: number, style: DateStyle): BodyLine {
  const cells = [datePart(tx, style), tx.narration, blankIfZero(tx.debit), blankIfZero(tx.credit)];
  return { kind: 'row', txIndex, cells: [...cells, formatKobo(tx.balance)] };
}

function groupedLines(transactions: readonly DraftTransaction[], style: DateStyle): BodyLine[] {
  const lines: BodyLine[] = [];
  let currentDate = '';
  transactions.forEach((tx, txIndex) => {
    if (tx.date !== currentDate) {
      currentDate = tx.date;
      lines.push({ kind: 'group', cells: [datePart(tx, style)] });
    }
    const cells = [
      tx.narration,
      blankIfZero(tx.debit),
      blankIfZero(tx.credit),
      formatKobo(tx.balance),
    ];
    lines.push({ kind: 'row', txIndex, cells });
  });
  return lines;
}

/**
 * Three layouts that differ the way real statements are said to: one amount plus a DR/CR marker,
 * separate debit and credit columns, and rows grouped under a date heading. All are our own design.
 */
export const FAMILIES: Record<FormatFamily, Family> = {
  'single-amount-drcr': {
    columns: [
      left('Date', 36, 62),
      left('Narration', 102, 232),
      right('Amount', 338, 76),
      left('DR/CR', 424, 30),
      right('Balance', 460, 99),
    ],
    buildLines: (txs, style) => txs.map((tx, i) => oneAmountRow(tx, i, style)),
  },
  'debit-credit-columns': {
    columns: [
      left('Date', 36, 62),
      left('Narration', 102, 232),
      right('Debit', 338, 72),
      right('Credit', 414, 72),
      right('Balance', 490, 69),
    ],
    buildLines: (txs, style) => txs.map((tx, i) => twoColumnRow(tx, i, style)),
  },
  'grouped-by-date': {
    columns: [
      left('Narration', 36, 262),
      right('Debit', 302, 80),
      right('Credit', 386, 80),
      right('Balance', 470, 89),
    ],
    buildLines: (txs, style) => groupedLines(txs, style),
  },
};
