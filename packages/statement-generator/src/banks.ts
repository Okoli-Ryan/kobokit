import type { DateStyle } from './dates';

export type FormatFamily = 'single-amount-drcr' | 'debit-credit-columns' | 'grouped-by-date';

export interface BankProfile {
  id: string;
  name: string;
  family: FormatFamily;
  dateStyle: DateStyle;
}

/** All four are invented. No real bank name, logo or layout is copied. */
export const BANKS: readonly BankProfile[] = [
  {
    id: 'harmattan',
    name: 'Harmattan Bank',
    family: 'single-amount-drcr',
    dateStyle: 'DD/MM/YYYY',
  },
  { id: 'kola', name: 'Kola Digital', family: 'debit-credit-columns', dateStyle: 'YYYY-MM-DD' },
  { id: 'ember', name: 'Ember Wallet', family: 'grouped-by-date', dateStyle: 'DD Mon YYYY' },
  {
    id: 'savanna',
    name: 'Savanna Trust',
    family: 'debit-credit-columns',
    dateStyle: 'DD-Mon-YYYY',
  },
];

export function getBank(id: string): BankProfile {
  const found = BANKS.find((bank) => bank.id === id);
  if (!found) {
    throw new RangeError(`Unknown bank "${id}". Banks: ${BANKS.map((b) => b.id).join(', ')}`);
  }
  return found;
}
