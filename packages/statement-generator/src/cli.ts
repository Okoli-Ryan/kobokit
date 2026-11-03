#!/usr/bin/env node
import { main } from './cli/main';

process.exitCode = await main(process.argv.slice(2), {
  log: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
});
