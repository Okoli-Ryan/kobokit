import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateStatement } from '../src/build';
import { toJson } from '../src/json';
import { tamperStatement } from '../src/tamper';

const sample = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../sample-output/${name}.json`, import.meta.url)), 'utf8');

const make = (persona: string, bank: string) =>
  generateStatement({ seed: 'sample', persona, bank, months: 2 }).statement;

/** If a generator change alters these files, run `pnpm build && pnpm samples` and review the diff. */
describe('committed sample-output stays in sync with the generator', () => {
  it.each([
    ['harmattan_salaried_sample_2m', 'salaried', 'harmattan'],
    ['kola_trader_sample_2m', 'trader', 'kola'],
    ['ember_gig-worker_sample_2m', 'gig-worker', 'ember'],
    ['savanna_loan-stacker_sample_2m', 'loan-stacker', 'savanna'],
  ])('%s', (file, persona, bank) => {
    expect(sample(file)).toBe(toJson(make(persona, bank)));
  });

  it('the tampered sample', () => {
    const tampered = tamperStatement(make('salaried', 'harmattan'), 'sample', {
      amounts: 2,
      modifiedAt: true,
    });
    expect(sample('harmattan_salaried_sample_2m_tampered')).toBe(toJson(tampered));
  });
});
