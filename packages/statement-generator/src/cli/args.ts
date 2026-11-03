import { parseArgs } from 'node:util';
import type { TamperOptions } from '../tamper';

export class CliError extends Error {}

export interface CommonArgs {
  seed: string;
  out: string;
  months: number;
  start?: string;
}

export interface GenerateArgs extends CommonArgs {
  command: 'generate';
  persona?: string;
  personaFile?: string;
  bank: string;
  tamper?: TamperOptions;
}

export interface BatchArgs extends CommonArgs {
  command: 'batch';
  count: number;
  /** Share of statements (0 to 1) that get tampered, chosen by seed. */
  tamperRatio: number;
}

export type ParsedArgs = GenerateArgs | BatchArgs | { command: 'help' };

export const USAGE = `kobokit-statements: synthetic bank statements for testing (never real data)

Usage:
  kobokit-statements generate --persona <id> --bank <id> --seed <text> --out <dir>
      [--months 6] [--start 2026-01-01] [--tamper amount|date|amount,date]
      [--tamper-count 1] [--persona-file custom.json]
  kobokit-statements batch --count <n> --seed <text> --out <dir>
      [--months 6] [--start 2026-01-01] [--tamper-ratio 0.2]

Personas: salaried, trader, gig-worker, bettor, loan-stacker
Banks:    harmattan, kola, ember, savanna
`;

const OPTIONS = {
  persona: { type: 'string' },
  'persona-file': { type: 'string' },
  bank: { type: 'string' },
  seed: { type: 'string' },
  out: { type: 'string' },
  months: { type: 'string' },
  start: { type: 'string' },
  tamper: { type: 'string' },
  'tamper-count': { type: 'string' },
  count: { type: 'string' },
  'tamper-ratio': { type: 'string' },
  help: { type: 'boolean', short: 'h' },
} as const;

type Values = ReturnType<typeof parseArgs<{ options: typeof OPTIONS }>>['values'];

function required(value: string | undefined, flag: string): string {
  if (value === undefined || value === '') throw new CliError(`Missing --${flag}`);
  return value;
}

function wholeNumber(value: string | undefined, flag: string, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new CliError(`--${flag} must be a whole number of 1 or more`);
  return parsed;
}

export function parseTamper(kinds: string | undefined, count: number): TamperOptions | undefined {
  if (kinds === undefined) return undefined;
  const options: TamperOptions = {};
  for (const kind of kinds.split(',')) {
    if (kind === 'amount') options.amounts = count;
    else if (kind === 'date') options.modifiedAt = true;
    else throw new CliError(`Unknown --tamper "${kind}". Use amount, date or amount,date`);
  }
  return options;
}

function commonArgs(values: Values): CommonArgs {
  return {
    seed: required(values.seed, 'seed'),
    out: required(values.out, 'out'),
    months: wholeNumber(values.months, 'months', 6),
    start: values.start,
  };
}

function parseGenerate(values: Values): GenerateArgs {
  if (values.persona === undefined && values['persona-file'] === undefined) {
    throw new CliError('Missing --persona (or --persona-file)');
  }
  return {
    command: 'generate',
    ...commonArgs(values),
    persona: values.persona,
    personaFile: values['persona-file'],
    bank: required(values.bank, 'bank'),
    tamper: parseTamper(values.tamper, wholeNumber(values['tamper-count'], 'tamper-count', 1)),
  };
}

function parseBatch(values: Values): BatchArgs {
  const ratio = Number(values['tamper-ratio'] ?? 0);
  if (!(ratio >= 0 && ratio <= 1)) throw new CliError('--tamper-ratio must be between 0 and 1');
  return {
    command: 'batch',
    ...commonArgs(values),
    count: wholeNumber(values.count, 'count', 20),
    tamperRatio: ratio,
  };
}

export function parseCliArgs(argv: readonly string[]): ParsedArgs {
  let parsed;
  try {
    parsed = parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true });
  } catch (error) {
    throw new CliError(error instanceof Error ? error.message : String(error));
  }
  const { values, positionals } = parsed;
  const [command] = positionals;
  if (values.help || command === undefined) return { command: 'help' };
  if (command === 'generate') return parseGenerate(values);
  if (command === 'batch') return parseBatch(values);
  throw new CliError(`Unknown command "${command}"`);
}
