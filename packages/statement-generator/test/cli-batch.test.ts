import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { main } from '../src/cli/main';
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

describe('batch', () => {
  it('writes N statements across all personas and banks, plus a manifest', async () => {
    const { code } = await run([
      'batch',
      '--count',
      '20',
      '--months',
      '2',
      '--seed',
      'eval',
      '--tamper-ratio',
      '0.5',
      '--out',
      dir,
    ]);
    expect(code).toBe(0);
    const manifest: { persona: string; bank: string; tampered: boolean; file: string }[] =
      JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    expect(manifest).toHaveLength(20);
    expect(new Set(manifest.map((e) => e.persona)).size).toBe(5);
    expect(new Set(manifest.map((e) => e.bank)).size).toBe(4);
    expect(manifest.some((e) => e.tampered)).toBe(true);
    expect(manifest.some((e) => !e.tampered)).toBe(true);
    for (const entry of manifest) {
      const hasRecord = readStatement(entry.file).tampering !== undefined;
      expect(hasRecord).toBe(entry.tampered);
    }
  });
});

describe('errors', () => {
  it.each([
    [['generate', '--bank', 'kola', '--seed', '1', '--out', 'x'], /Missing --persona/],
    [['generate', '--persona', 'trader', '--bank', 'kola', '--seed', '1'], /Missing --out/],
    [[...generateArgs, '--out', 'x', '--tamper', 'colour'], /Unknown --tamper/],
    [[...generateArgs, '--out', 'x', '--months', '0'], /--months/],
    [['explode'], /Unknown command/],
    [['generate', '--nope'], /nope/],
  ])('%j fails with a clear message', async (args, message) => {
    const { code, errors } = await run(args);
    expect(code).toBe(2);
    expect(errors).toMatch(message);
  });

  it('reports unknown banks as a runtime error', async () => {
    const { code, errors } = await run([
      'generate',
      '--persona',
      'trader',
      '--bank',
      'x',
      '--seed',
      '1',
      '--out',
      dir,
    ]);
    expect(code).toBe(1);
    expect(errors).toMatch(/Unknown bank/);
  });

  it('prints usage for --help and for no arguments', async () => {
    expect((await run(['--help'])).logs).toContain('Usage:');
    expect((await run([])).code).toBe(0);
  });
});
