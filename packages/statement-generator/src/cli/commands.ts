import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BANKS } from '../banks';
import { toJson } from '../json';
import { generateStatement } from '../build';
import { parsePersona, type Persona } from '../personas';
import { BUILT_IN_PERSONAS } from '../personas-builtin';
import { renderPdf } from '../pdf/render';
import { createRng } from '../rng';
import { tamperStatement, type TamperOptions } from '../tamper';
import type { BatchArgs, GenerateArgs } from './args';

export interface WrittenFiles {
  json: string;
  pdf: string;
}

export interface ManifestEntry {
  file: string;
  persona: string;
  bank: string;
  seed: string;
  months: number;
  tampered: boolean;
}

/** Tamper recipes a batch picks from, so an eval set mixes amount, date and combined forgeries. */
const TAMPER_KINDS: TamperOptions[] = [
  { amounts: 1 },
  { amounts: 2 },
  { modifiedAt: true },
  { amounts: 1, modifiedAt: true },
];

const slug = (text: string): string => text.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');

function readPersonaFile(path: string): Persona {
  try {
    return parsePersona(JSON.parse(readFileSync(path, 'utf8')));
  } catch (error) {
    throw new Error(
      `Could not read persona file ${path}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

async function writeOne(
  args: { out: string; seed: string; months: number; start?: string },
  persona: string | Persona,
  bank: string,
  tamper: TamperOptions | undefined,
): Promise<{ files: WrittenFiles; entry: ManifestEntry }> {
  const generated = generateStatement({ ...args, persona, bank });
  const statement = tamper
    ? tamperStatement(generated.statement, args.seed, tamper)
    : generated.statement;
  const personaId = generated.statement.persona;
  const stem = [bank, personaId, slug(args.seed), `${args.months}m`, tamper ? 'tampered' : '']
    .filter(Boolean)
    .join('_');
  mkdirSync(args.out, { recursive: true });
  const files = { json: join(args.out, `${stem}.json`), pdf: join(args.out, `${stem}.pdf`) };
  writeFileSync(files.json, toJson(statement));
  writeFileSync(files.pdf, await renderPdf(statement, generated.bank));
  const entry = {
    file: `${stem}.json`,
    persona: personaId,
    bank,
    seed: args.seed,
    months: args.months,
    tampered: Boolean(tamper),
  };
  return { files, entry };
}

export async function runGenerate(args: GenerateArgs): Promise<WrittenFiles> {
  const persona = args.personaFile ? readPersonaFile(args.personaFile) : (args.persona as string);
  return (await writeOne(args, persona, args.bank, args.tamper)).files;
}

/** Every persona and bank combination appears before any repeats (5 x 4 = 20 per cycle). */
export async function runBatch(args: BatchArgs): Promise<ManifestEntry[]> {
  const chooser = createRng(`${args.seed}|batch`);
  const entries: ManifestEntry[] = [];
  for (let i = 0; i < args.count; i++) {
    const persona = BUILT_IN_PERSONAS[i % BUILT_IN_PERSONAS.length]?.id ?? '';
    const bank = BANKS[Math.floor(i / BUILT_IN_PERSONAS.length) % BANKS.length]?.id ?? '';
    const tampered = chooser.chance(args.tamperRatio);
    const tamper = tampered ? chooser.pick(TAMPER_KINDS) : undefined;
    const item = { ...args, seed: `${args.seed}-${i + 1}` };
    entries.push((await writeOne(item, persona, bank, tamper)).entry);
  }
  mkdirSync(args.out, { recursive: true });
  writeFileSync(join(args.out, 'manifest.json'), `${JSON.stringify(entries, null, 2)}\n`);
  return entries;
}
