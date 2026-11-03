// Dev tool: rebuilds sample-output/ with the built CLI (run `pnpm build` first).
// One statement per fictional bank, each with a different persona, plus one tampered example.
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../dist/cli.mjs', import.meta.url));
const out = fileURLToPath(new URL('../sample-output/', import.meta.url));

const samples = [
  ['salaried', 'harmattan', []],
  ['trader', 'kola', []],
  ['gig-worker', 'ember', []],
  ['loan-stacker', 'savanna', []],
  ['salaried', 'harmattan', ['--tamper', 'amount,date', '--tamper-count', '2']],
];

rmSync(out, { recursive: true, force: true });
for (const [persona, bank, extra] of samples) {
  const args = [
    'generate',
    '--persona',
    persona,
    '--bank',
    bank,
    '--seed',
    'sample',
    '--months',
    '2',
  ];
  execFileSync(process.execPath, [cli, ...args, '--out', out, ...extra], { stdio: 'inherit' });
}
