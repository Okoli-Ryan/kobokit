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
    throw new RangeError(
      `Unknown bank "${String(id)}". Banks: ${BANKS.map((b) => b.id).join(', ')}`,
    );
  }
  return found;
}

/**
 * Only the built-in fictional banks may be drawn, so a real bank name can never be printed on a
 * statement. A profile must match a built-in one exactly; a renamed copy is rejected.
 */
export function requireKnownBank(bank: BankProfile): BankProfile {
  const known = BANKS.find((candidate) => candidate.id === bank.id);
  const matches =
    known?.name === bank.name && known.family === bank.family && known.dateStyle === bank.dateStyle;
  if (!known || !matches) {
    throw new RangeError(
      `Only the built-in fictional banks can be rendered (${BANKS.map((b) => b.id).join(', ')})`,
    );
  }
  return known;
}
