import { MONTHLY_FEE, REVERSIBLE, feeFor } from './charges';
import { addDays, addMonths, compareDates, daysBetween, type CalendarDate } from './dates';
import { kobo, type Kobo } from './money';
import { makeNarration } from './narration';
import { EMPLOYERS } from './pools';
import type { Persona } from './personas';
import { createRng, type Rng } from './rng';
import type { Category } from './types';

export interface Period {
  from: CalendarDate;
  to: CalendarDate;
}

export interface PlannedEvent {
  /** Creation order; breaks ties between events on the same day. */
  seq: number;
  /** A fee or reversal only happens if the transaction it belongs to was applied. */
  parentSeq?: number;
  date: CalendarDate;
  category: Category;
  amount: Kobo;
  narration: string;
}

type NewEvent = Pick<PlannedEvent, 'date' | 'category' | 'amount' | 'parentSeq'> & {
  tag?: string;
  fixed?: Readonly<Record<string, string>>;
};

interface PlanContext {
  persona: Persona;
  period: Period;
  reversalRng: Rng;
  add: (event: NewEvent) => number;
}

/** Most real amounts are whole naira, so snap most picks down, while staying in range. */
function pickAmount(rng: Rng, range: { min: number; max: number }): Kobo {
  const raw = rng.int(range.min, range.max);
  const snapped = Math.floor(raw / 100) * 100;
  return kobo(rng.chance(0.7) && snapped >= range.min ? snapped : raw);
}

function monthWindows(period: Period): Period[] {
  const windows: Period[] = [];
  for (let m = 0; compareDates(addMonths(period.from, m), period.to) <= 0; m++) {
    const end = addDays(addMonths(period.from, m + 1), -1);
    windows.push({
      from: addMonths(period.from, m),
      to: compareDates(end, period.to) > 0 ? period.to : end,
    });
  }
  return windows;
}

function planFollowUps(
  ctx: PlanContext,
  parentSeq: number,
  date: CalendarDate,
  category: Category,
  amount: Kobo,
): void {
  const fee = feeFor(category, amount);
  if (fee) ctx.add({ date, category: 'bank_charge', amount: fee.amount, parentSeq, tag: fee.tag });
  const reversalDate = addDays(date, 1);
  const reversed =
    REVERSIBLE.has(category) && ctx.reversalRng.chance(ctx.persona.reversalProbability);
  if (reversed && compareDates(reversalDate, ctx.period.to) <= 0) {
    ctx.add({ date: reversalDate, category: 'reversal', amount, parentSeq });
  }
}

function planActivity(ctx: PlanContext, activity: Persona['activities'][number], rng: Rng): void {
  for (const window of monthWindows(ctx.period)) {
    const planned = rng.int(activity.perMonth.min, activity.perMonth.max);
    for (let i = 0; i < planned; i++) {
      if (!rng.chance(activity.probability)) continue;
      const date = addDays(window.from, rng.int(0, daysBetween(window.from, window.to)));
      const amount = pickAmount(rng, activity.amount);
      if (amount === 0) continue;
      const seq = ctx.add({ date, category: activity.category, amount });
      planFollowUps(ctx, seq, date, activity.category, amount);
    }
  }
}

function planSalary(ctx: PlanContext, rng: Rng): void {
  const { salary } = ctx.persona;
  if (!salary) return;
  const amount = pickAmount(rng, salary.amount); // fixed for the whole statement
  if (amount === 0) return; // a zero-naira salary would print a row with neither debit nor credit
  const employer = rng.pick(EMPLOYERS); // so is the employer
  for (let day = ctx.period.from; compareDates(day, ctx.period.to) <= 0; day = addDays(day, 1)) {
    if (day.day === salary.dayOfMonth)
      ctx.add({ date: day, category: 'salary', amount, fixed: { employer } });
  }
}

export function planEvents(
  persona: Persona,
  period: Period,
  seed: string | number,
): PlannedEvent[] {
  const events: PlannedEvent[] = [];
  const narrationRng = createRng(`${seed}|narration`);
  const add = ({ tag, fixed, ...event }: NewEvent): number => {
    const narration = makeNarration(event.category, narrationRng, event.date, tag, fixed);
    events.push({ ...event, seq: events.length, narration });
    return events.length - 1;
  };
  const ctx: PlanContext = { persona, period, add, reversalRng: createRng(`${seed}|reversal`) };
  planSalary(ctx, createRng(`${seed}|salary`));
  persona.activities.forEach((activity, index) => {
    planActivity(ctx, activity, createRng(`${seed}|activity|${index}`));
  });
  for (const window of monthWindows(period)) {
    add({ date: window.to, category: 'bank_charge', amount: MONTHLY_FEE, tag: 'monthly' });
  }
  return events;
}
