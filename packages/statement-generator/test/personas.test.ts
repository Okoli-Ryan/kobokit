import { describe, expect, it } from 'vitest';
import { BUILT_IN_PERSONAS, getBuiltInPersona } from '../src/personas-builtin';
import { parsePersona } from '../src/personas';

describe('built-in personas', () => {
  it('ships the five required personas', () => {
    expect(BUILT_IN_PERSONAS.map((p) => p.id)).toEqual([
      'salaried',
      'trader',
      'gig-worker',
      'bettor',
      'loan-stacker',
    ]);
  });

  it('gives only salaried-style personas a salary', () => {
    expect(getBuiltInPersona('salaried').salary?.dayOfMonth).toBe(25);
    expect(getBuiltInPersona('trader').salary).toBeUndefined();
  });

  it('has loan stackers repaying more often than they borrow', () => {
    const { activities } = getBuiltInPersona('loan-stacker');
    const max = (category: string) =>
      activities.find((a) => a.category === category)?.perMonth.max ?? 0;
    expect(max('loan_repayment')).toBeGreaterThan(max('loan_disbursement'));
  });

  it('rejects an unknown id and lists the valid ones', () => {
    expect(() => getBuiltInPersona('nope')).toThrow(/salaried/);
  });
});

describe('parsePersona (custom personas)', () => {
  const valid = {
    id: 'custom',
    label: 'Custom',
    openingBalance: { min: 0, max: 100 },
    activities: [
      {
        category: 'pos',
        perMonth: { min: 1, max: 2 },
        amount: { min: 100, max: 200 },
        probability: 1,
      },
    ],
  };

  it('accepts a valid persona and fills defaults', () => {
    expect(parsePersona(valid).reversalProbability).toBe(0.02);
  });

  it.each([
    ['inverted range', { ...valid, openingBalance: { min: 5, max: 1 } }],
    ['float kobo', { ...valid, openingBalance: { min: 0.5, max: 1 } }],
    ['bad probability', { ...valid, activities: [{ ...valid.activities[0], probability: 2 }] }],
    ['salary category', { ...valid, activities: [{ ...valid.activities[0], category: 'salary' }] }],
    ['salary day 31', { ...valid, salary: { dayOfMonth: 31, amount: { min: 1, max: 2 } } }],
  ])('rejects %s', (_label, input) => {
    expect(() => parsePersona(input)).toThrow(TypeError);
  });
});
