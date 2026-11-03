import { GIVEN_NAMES, SURNAMES } from './pools';
import type { Rng } from './rng';

export interface AccountHolder {
  name: string;
  /** Always starts with 000 so it cannot be mistaken for a live account. */
  accountNumber: string;
}

export function randomDigits(rng: Rng, length: number): string {
  return Array.from({ length }, () => String(rng.int(0, 9))).join('');
}

export function generateHolder(rng: Rng): AccountHolder {
  const name = `${rng.pick(GIVEN_NAMES)} ${rng.pick(SURNAMES)}`.toUpperCase();
  return { name, accountNumber: `000${randomDigits(rng, 7)}` };
}
