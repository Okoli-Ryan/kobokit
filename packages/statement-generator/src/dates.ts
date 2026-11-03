/**
 * Calendar dates with no clock and no timezone. Maths goes through UTC midnight day numbers, so
 * the result never depends on the machine's timezone or on the current time.
 */
export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export type DateStyle = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD Mon YYYY' | 'DD-Mon-YYYY';

const MS_PER_DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (value: number): string => String(value).padStart(2, '0');

function toDayNumber(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY;
}

function fromDayNumber(dayNumber: number): CalendarDate {
  const utc = new Date(dayNumber * MS_PER_DAY);
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

export function parseIsoDate(iso: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new RangeError(`Expected YYYY-MM-DD, got "${iso}"`);
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (toIsoDate(fromDayNumber(toDayNumber(date))) !== iso) {
    throw new RangeError(`Not a real calendar date: "${iso}"`);
  }
  return date;
}

export function toIsoDate(date: CalendarDate): string {
  return `${String(date.year).padStart(4, '0')}-${pad2(date.month)}-${pad2(date.day)}`;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Whole days from a to b (negative when b is earlier). */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  return toDayNumber(b) - toDayNumber(a);
}

export function daysInMonth(year: number, month: number): number {
  return fromDayNumber(toDayNumber({ year, month: month + 1, day: 1 }) - 1).day;
}

/** Moves by whole months and clamps the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const monthIndex = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return toDayNumber(a) - toDayNumber(b);
}

export function formatDate(date: CalendarDate, style: DateStyle): string {
  const mon = MONTHS[date.month - 1] ?? '';
  const day = pad2(date.day);
  switch (style) {
    case 'DD/MM/YYYY':
      return `${day}/${pad2(date.month)}/${date.year}`;
    case 'YYYY-MM-DD':
      return toIsoDate(date);
    case 'DD Mon YYYY':
      return `${day} ${mon} ${date.year}`;
    case 'DD-Mon-YYYY':
      return `${day}-${mon}-${date.year}`;
  }
}
