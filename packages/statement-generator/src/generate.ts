import { getBank, type BankProfile } from './banks';
import { addDays, addMonths, parseIsoDate, toIsoDate } from './dates';
import { generateHolder } from './identity';
import { runLedger } from './ledger';
import { kobo, type Kobo } from './money';
import { parsePersona, type Persona } from './personas';
import { getBuiltInPersona } from './personas-builtin';
import { planEvents } from './plan';
import { createRng } from './rng';
import type { UnpagedStatement } from './statement';

export interface GenerateOptions {
  seed: string | number;
  /** A built-in persona id, or a custom persona object (validated here). */
  persona: string | Persona;
  /** A bank id such as "harmattan". */
  bank: string | BankProfile;
  /** 1 to 12. */
  months: number;
  /** First day of the statement, YYYY-MM-DD. Fixed default so output never depends on today's date. */
  start?: string;
}

export const DEFAULT_START = '2026-01-01';

function pickOpeningBalance(seed: string | number, range: { min: number; max: number }): Kobo {
  const raw = createRng(`${seed}|opening`).int(range.min, range.max);
  return kobo(Math.max(range.min, Math.floor(raw / 100) * 100)); // whole naira, still in range
}

export function generateStatementData(options: GenerateOptions): UnpagedStatement {
  const { seed, months } = options;
  if (!Number.isInteger(months) || months < 1 || months > 12) {
    throw new RangeError(`months must be a whole number from 1 to 12, got ${months}`);
  }
  const persona =
    typeof options.persona === 'string'
      ? getBuiltInPersona(options.persona)
      : parsePersona(options.persona);
  const bank = typeof options.bank === 'string' ? getBank(options.bank) : options.bank;
  const from = parseIsoDate(options.start ?? DEFAULT_START);
  const period = { from, to: addDays(addMonths(from, months), -1) };

  const openingBalance = pickOpeningBalance(seed, persona.openingBalance);
  const { transactions, closing } = runLedger(openingBalance, planEvents(persona, period, seed));

  return {
    bank: bank.name,
    format: bank.family,
    persona: persona.id,
    accountHolder: generateHolder(createRng(`${seed}|identity`)),
    period: { from: toIsoDate(period.from), to: toIsoDate(period.to) },
    openingBalance,
    closingBalance: closing,
    transactions,
  };
}
