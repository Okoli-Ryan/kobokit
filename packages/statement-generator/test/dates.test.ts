import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  compareDates,
  daysInMonth,
  formatDate,
  parseIsoDate,
  toIsoDate,
} from '../src/dates';

const anyDate = fc
  .date({
    min: new Date('1990-01-01T00:00:00Z'),
    max: new Date('2060-12-31T00:00:00Z'),
    noInvalidDate: true,
  })
  .map((d) => ({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }));

describe('parseIsoDate / toIsoDate', () => {
  it('round-trips any valid date', () => {
    fc.assert(
      fc.property(anyDate, (date) => {
        expect(parseIsoDate(toIsoDate(date))).toEqual(date);
      }),
    );
  });

  it.each(['2026-02-30', '2026-13-01', '26-01-01', '2026-1-1', ''])('rejects "%s"', (bad) => {
    expect(() => parseIsoDate(bad)).toThrow(RangeError);
  });
});

describe('calendar maths', () => {
  it('knows leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28);
  });

  it('crosses month and year boundaries', () => {
    expect(toIsoDate(addDays(parseIsoDate('2026-12-31'), 1))).toBe('2027-01-01');
    expect(toIsoDate(addDays(parseIsoDate('2026-03-01'), -1))).toBe('2026-02-28');
  });

  it('addDays is undone by the negative step', () => {
    fc.assert(
      fc.property(anyDate, fc.integer({ min: -2000, max: 2000 }), (date, days) => {
        expect(addDays(addDays(date, days), -days)).toEqual(date);
      }),
    );
  });

  it('clamps the day when adding months', () => {
    expect(toIsoDate(addMonths(parseIsoDate('2026-01-31'), 1))).toBe('2026-02-28');
    expect(toIsoDate(addMonths(parseIsoDate('2026-11-15'), 3))).toBe('2027-02-15');
    expect(toIsoDate(addMonths(parseIsoDate('2026-01-15'), -2))).toBe('2025-11-15');
  });

  it('orders dates', () => {
    expect(compareDates(parseIsoDate('2026-01-02'), parseIsoDate('2026-01-01'))).toBeGreaterThan(0);
  });
});

describe('formatDate', () => {
  const date = parseIsoDate('2026-03-07');
  it.each([
    ['DD/MM/YYYY', '07/03/2026'],
    ['YYYY-MM-DD', '2026-03-07'],
    ['DD Mon YYYY', '07 Mar 2026'],
    ['DD-Mon-YYYY', '07-Mar-2026'],
  ] as const)('formats as %s', (style, expected) => {
    expect(formatDate(date, style)).toBe(expected);
  });
});
