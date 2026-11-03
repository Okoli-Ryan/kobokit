import { kobo, type Kobo } from './money';
import type { Category } from './types';

/** Debits that can plausibly fail and be refunded. */
export const REVERSIBLE: ReadonlySet<Category> = new Set(['pos', 'transfer_out', 'airtime_data']);

// Invented fee schedule, only there to make statements look lived-in.
// TODO: replace with sourced figures before anyone treats these as real tariffs.
export const MONTHLY_FEE: Kobo = kobo(15_000);
const ATM_FEE: Kobo = kobo(3_500);
const SMALL_TRANSFER_FEE: Kobo = kobo(1_000);
const LARGE_TRANSFER_FEE: Kobo = kobo(2_500);
const SMALL_TRANSFER_LIMIT = 500_000;

export interface Fee {
  amount: Kobo;
  /** Picks a matching narration template, so an ATM fee never reads as a transfer fee. */
  tag: string;
}

export function feeFor(category: Category, amount: Kobo): Fee | undefined {
  if (category === 'atm') return { amount: ATM_FEE, tag: 'atm' };
  if (category !== 'transfer_out') return undefined;
  const small = amount <= SMALL_TRANSFER_LIMIT;
  return { amount: small ? SMALL_TRANSFER_FEE : LARGE_TRANSFER_FEE, tag: 'transfer' };
}
