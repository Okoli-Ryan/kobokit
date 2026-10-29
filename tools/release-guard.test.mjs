import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findReleaseProblems } from './release-guard.mjs';

const internal = [
  { name: '@kobokit/analyser-api', path: 'apps/analyser-api', private: true },
  { name: '@kobokit/tsconfig', path: 'packages/tsconfig', private: true },
  { name: '@kobokit/eslint-config', path: 'packages/eslint-config', private: true },
];
const library = { name: '@kobokit/statement-math', path: 'packages/statement-math' };

describe('findReleaseProblems', () => {
  it('passes when apps and config packages are private and libraries are public', () => {
    assert.deepEqual(findReleaseProblems([...internal, library]), []);
  });

  it('flags an app that is not private', () => {
    const publicApp = { name: '@kobokit/new-app', path: 'apps/new-app' };
    const problems = findReleaseProblems([...internal, publicApp, library]);

    assert.equal(problems.length, 1);
    assert.match(problems[0], /@kobokit\/new-app .* must be "private": true/);
  });

  it('flags a shared config package that is not private', () => {
    const publicConfig = { name: '@kobokit/tsconfig', path: 'packages/tsconfig' };
    const rest = internal.filter((workspace) => workspace.path !== 'packages/tsconfig');

    assert.equal(findReleaseProblems([...rest, publicConfig]).length, 1);
  });

  it('flags a guard prefix that no longer matches anything', () => {
    const withoutEslintConfig = internal.filter((w) => w.path !== 'packages/eslint-config');
    const problems = findReleaseProblems(withoutEslintConfig);

    assert.equal(problems.length, 1);
    assert.match(problems[0], /packages\/eslint-config.*matches no workspace/);
  });
});
