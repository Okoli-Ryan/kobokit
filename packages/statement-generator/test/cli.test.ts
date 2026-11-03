import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateStatement } from '../src/build';
import { main } from '../src/cli/main';
import { toJson } from '../src/json';
import { verifyBalances } from '../src/ledger';
import type { Statement } from '../src/statement';

let dir = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'kobokit-cli-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = async (args: string[]) => {
  const logs: string[] = [];
  const errors: string[] = [];
  const code = await main(args, { log: (m) => logs.push(m), error: (m) => errors.push(m) });
  return { code, logs: logs.join('\n'), errors: errors.join('\n') };
};
const readStatement = (file: string): Statement =>
  JSON.parse(readFileSync(join(dir, file), 'utf8'));
const generateArgs = [
  'generate',
  '--persona',
  'salaried',
  '--months',
  '3',
  '--bank',
  'harmattan',
  '--seed',
  '42',
];

describe('generate', () => {
  it('writes a PDF and a JSON file matching the library output', async () => {
    const { code } = await run([...generateArgs, '--out', dir]);
    expect(code).toBe(0);
    expect(readdirSync(dir).sort()).toEqual([
      'harmattan_salaried_42_3m.json',
      'harmattan_salaried_42_3m.pdf',
    ]);
    const expected = generateStatement({
      seed: '42',
      persona: 'salaried',
      bank: 'harmattan',
      months: 3,
    });
    expect(readFileSync(join(dir, 'harmattan_salaried_42_3m.json'), 'utf8')).toBe(
      toJson(expected.statement),
    );
  });

  it('gives byte-identical files on a second run with the same seed', async () => {
    const other = mkdtempSync(join(tmpdir(), 'kobokit-cli-'));
    await run([...generateArgs, '--out', dir]);
    await run([...generateArgs, '--out', other]);
    for (const file of readdirSync(dir)) {
      expect(readFileSync(join(other, file)).equals(readFileSync(join(dir, file)))).toBe(true);
    }
    rmSync(other, { recursive: true, force: true });
  });

  it('--tamper amount changes balances reconciliation and says so in the JSON', async () => {
    await run([...generateArgs, '--tamper', 'amount', '--tamper-count', '2', '--out', dir]);
    const statement = readStatement('harmattan_salaried_42_3m_tampered.json');
    expect(statement.tampering?.amountChanges).toHaveLength(2);
    expect(verifyBalances(statement).badRows).toEqual(
      statement.tampering?.amountChanges.map((c) => c.index),
    );
  });

  it('accepts a custom persona file', async () => {
    const file = join(dir, 'mine.json');
    writeFileSync(
      file,
      JSON.stringify({
        id: 'mine',
        label: 'Mine',
        openingBalance: { min: 100000, max: 200000 },
        activities: [
          {
            category: 'pos',
            perMonth: { min: 2, max: 3 },
            amount: { min: 1000, max: 5000 },
            probability: 1,
          },
        ],
      }),
    );
    const out = join(dir, 'out');
    expect(
      (
        await run([
          'generate',
          '--persona-file',
          file,
          '--bank',
          'kola',
          '--seed',
          'a',
          '--months',
          '1',
          '--out',
          out,
        ])
      ).code,
    ).toBe(0);
    expect(readdirSync(out)).toContain('kola_mine_a_1m.json');
  });
});
