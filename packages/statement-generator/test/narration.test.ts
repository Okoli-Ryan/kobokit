import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/types';
import { fillTemplate, makeNarration } from '../src/narration';
import { createRng } from '../src/rng';
import { getTemplates } from '../src/templates';

const date = { year: 2026, month: 3, day: 25 };

describe('templates', () => {
  it.each(CATEGORIES)('%s has templates and every one is marked invented', (category) => {
    const templates = getTemplates(category);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((t) => t.origin === 'invented')).toBe(true);
  });

  it('every template of every category fills with no placeholder left over', () => {
    const rng = createRng('all-templates');
    for (const category of CATEGORIES) {
      for (const template of getTemplates(category)) {
        expect(fillTemplate(template.text, rng, date)).not.toMatch(/[{}]/);
      }
    }
  });
});

describe('fillTemplate', () => {
  it('uses the transaction date for {month}', () => {
    expect(fillTemplate('SALARY {month}', createRng(1), date)).toBe('SALARY MARCH');
  });

  it('throws on an unknown placeholder', () => {
    expect(() => fillTemplate('X {typo}', createRng(1), date)).toThrow(/typo/);
  });
});

describe('makeNarration', () => {
  it('is deterministic per seed', () => {
    expect(makeNarration('pos', createRng(7), date)).toBe(makeNarration('pos', createRng(7), date));
  });
});
