import type { CalendarDate } from './dates';
import { randomDigits } from './identity';
import {
  BILLERS,
  BOOKIES,
  CHANNELS,
  EMPLOYERS,
  GIVEN_NAMES,
  LENDERS,
  MERCHANTS,
  MONTH_NAMES,
  SURNAMES,
  TELCOS,
} from './pools';
import type { Rng } from './rng';
import { getTemplates } from './templates';
import type { Category } from './types';

type Resolver = (rng: Rng, date: CalendarDate) => string;

const resolvers: Record<string, Resolver> = {
  ref: (rng) => randomDigits(rng, 10),
  terminal: (rng) => randomDigits(rng, 8),
  // 0700 is made-up filler, not a claim about the real numbering plan. TODO: check before reuse.
  phone: (rng) => `0700${randomDigits(rng, 7)}`,
  name: (rng) => `${rng.pick(GIVEN_NAMES)} ${rng.pick(SURNAMES)}`.toUpperCase(),
  merchant: (rng) => rng.pick(MERCHANTS),
  telco: (rng) => rng.pick(TELCOS),
  lender: (rng) => rng.pick(LENDERS),
  bookie: (rng) => rng.pick(BOOKIES),
  biller: (rng) => rng.pick(BILLERS),
  employer: (rng) => rng.pick(EMPLOYERS),
  channel: (rng) => rng.pick(CHANNELS),
  month: (_rng, date) => MONTH_NAMES[date.month - 1] ?? '',
};

/** An unknown {placeholder} throws, so a typo in a template file fails loudly, not silently. */
export function fillTemplate(text: string, rng: Rng, date: CalendarDate): string {
  return text.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const resolve = resolvers[key];
    if (!resolve) throw new RangeError(`Unknown placeholder {${key}} in template "${text}"`);
    return resolve(rng, date);
  });
}

export function makeNarration(category: Category, rng: Rng, date: CalendarDate): string {
  return fillTemplate(rng.pick(getTemplates(category)).text, rng, date);
}
