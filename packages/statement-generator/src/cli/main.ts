import { CliError, USAGE, parseCliArgs } from './args';
import { runBatch, runGenerate } from './commands';

export interface Output {
  log(message: string): void;
  error(message: string): void;
}

/** Returns the exit code instead of exiting, so tests can call it directly. */
export async function main(argv: readonly string[], output: Output): Promise<number> {
  try {
    const args = parseCliArgs(argv);
    if (args.command === 'help') {
      output.log(USAGE);
    } else if (args.command === 'generate') {
      const files = await runGenerate(args);
      output.log(`Wrote ${files.pdf}\nWrote ${files.json}`);
    } else {
      const entries = await runBatch(args);
      output.log(`Wrote ${entries.length} statements and manifest.json to ${args.out}`);
    }
    return 0;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    if (error instanceof CliError) output.error('\nRun with --help for usage.');
    return error instanceof CliError ? 2 : 1;
  }
}
