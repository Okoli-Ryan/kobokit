export const CATEGORIES = [
  'salary',
  'transfer_in',
  'transfer_out',
  'pos',
  'atm',
  'airtime_data',
  'bill',
  'betting',
  'loan_disbursement',
  'loan_repayment',
  'bank_charge',
  'reversal',
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Direction = 'credit' | 'debit';

/** Money in or out is fixed by the category, so a persona cannot say "a salary that debits". */
export const DIRECTION_OF: Readonly<Record<Category, Direction>> = {
  salary: 'credit',
  transfer_in: 'credit',
  transfer_out: 'debit',
  pos: 'debit',
  atm: 'debit',
  airtime_data: 'debit',
  bill: 'debit',
  betting: 'debit',
  loan_disbursement: 'credit',
  loan_repayment: 'debit',
  bank_charge: 'debit',
  reversal: 'credit',
};

/** Categories a persona may schedule itself; the rest are produced by the generator. */
export const PERSONA_CATEGORIES = [
  'transfer_in',
  'transfer_out',
  'pos',
  'atm',
  'airtime_data',
  'bill',
  'betting',
  'loan_disbursement',
  'loan_repayment',
] as const satisfies readonly Category[];
