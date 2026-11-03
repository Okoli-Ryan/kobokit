import type { FormatFamily } from './banks';
import type { AccountHolder } from './identity';
import type { Kobo } from './money';
import type { Category } from './types';

/** A transaction before the layout has decided which page and line it lands on. */
export interface DraftTransaction {
  id: string;
  /** ISO date, YYYY-MM-DD. The PDF formats it per bank; the JSON keeps one machine-friendly form. */
  date: string;
  narration: string;
  /** Zero when the transaction is a credit. */
  debit: Kobo;
  /** Zero when the transaction is a debit. */
  credit: Kobo;
  /** Running balance after this transaction. */
  balance: Kobo;
  category: Category;
}

export interface Transaction extends DraftTransaction {
  page: number;
  line: number;
}

export interface StatementHeader {
  bank: string;
  format: FormatFamily;
  persona: string;
  accountHolder: AccountHolder;
  period: { from: string; to: string };
  openingBalance: Kobo;
  closingBalance: Kobo;
}

export interface UnpagedStatement extends StatementHeader {
  transactions: DraftTransaction[];
}

/** One amount that was changed after the balances were computed. */
export interface AmountChange {
  id: string;
  /** Position in the transactions array. */
  index: number;
  page: number;
  line: number;
  field: 'debit' | 'credit';
  original: Kobo;
  tampered: Kobo;
}

/** The answer key for a fraud detector: exactly what was altered. */
export interface TamperRecord {
  amountChanges: AmountChange[];
  /** ISO timestamp written to the PDF modification date, when that was tampered with. */
  pdfModifiedAt?: string;
}

export interface Statement extends StatementHeader {
  transactions: Transaction[];
  /** Present only on tampered statements. */
  tampering?: TamperRecord;
}
