import { describe, expect, it } from 'vitest';
import { ruleIdsFor } from './rule-ids-for';

const lines = (count: number, makeLine: (index: number) => string): string =>
  Array.from({ length: count }, (_, index) => makeLine(index)).join('\n');

const longFunction = `export function long(): number {\n${lines(31, (i) => `  const a${i} = ${i};`)}\n  return 1;\n}`;

const branchyFunction = `export function branchy(n: number): number {\n${lines(9, (i) => `  if (n === ${i}) return ${i};`)}\n  return -1;\n}`;

describe('base preset', () => {
  it('accepts small, typed, named-export code', async () => {
    const code = 'export const add = (a: number, b: number): number => a + b;\n';
    expect(await ruleIdsFor(code, 'src/add.ts')).toEqual([]);
  });

  it('rejects any', async () => {
    const ids = await ruleIdsFor('export const x: any = 1;\n', 'src/x.ts');
    expect(ids).toContain('@typescript-eslint/no-explicit-any');
  });

  it('rejects type-only imports written as value imports', async () => {
    const code = "import { ESLint } from 'eslint';\nexport type Linter = ESLint;\n";
    expect(await ruleIdsFor(code, 'src/x.ts')).toContain(
      '@typescript-eslint/consistent-type-imports',
    );
  });

  it('rejects default exports in source files', async () => {
    const ids = await ruleIdsFor('const x = 1;\nexport default x;\n', 'src/x.ts');
    expect(ids).toContain('no-restricted-exports');
  });

  it('allows default exports in tool config files', async () => {
    const ids = await ruleIdsFor('const x = 1;\nexport default x;\n', 'vite.config.ts');
    expect(ids).not.toContain('no-restricted-exports');
  });
});

describe('base preset size limits', () => {
  it('rejects a file over 150 lines of code', async () => {
    const code = lines(151, (i) => `export const value${i} = ${i};`);
    expect(await ruleIdsFor(code, 'src/big.ts')).toContain('max-lines');
  });

  it('rejects a function over 30 lines', async () => {
    expect(await ruleIdsFor(longFunction, 'src/long.ts')).toContain('max-lines-per-function');
  });

  it('allows long functions inside test files', async () => {
    expect(await ruleIdsFor(longFunction, 'src/long.test.ts')).not.toContain(
      'max-lines-per-function',
    );
  });

  it('rejects a function with complexity above 8', async () => {
    expect(await ruleIdsFor(branchyFunction, 'src/branchy.ts')).toContain('complexity');
  });
});
