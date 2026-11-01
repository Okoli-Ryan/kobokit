import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { findUndocumentedWorkspaces } from './readme-guard.mjs';
import { findReleaseProblems } from './release-guard.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

function listWorkspaces() {
  // A fixed string with no user input, so the shell is safe; it is needed for pnpm.cmd on Windows.
  const output = execSync('pnpm ls -r --depth -1 --json', { cwd: repoRoot, encoding: 'utf8' });
  return JSON.parse(output).map((entry) => ({
    name: entry.name,
    private: entry.private,
    path: path.relative(repoRoot, entry.path).split(path.sep).join('/'),
  }));
}

const workspaces = listWorkspaces();
const readme = readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
const problems = [
  ...findReleaseProblems(workspaces),
  ...findUndocumentedWorkspaces(workspaces, readme),
];

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Release guard passed: apps and config packages cannot be published.');
console.log('README guard passed: every workspace is listed in the package table.');
