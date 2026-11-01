import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findUndocumentedWorkspaces } from './readme-guard.mjs';

const root = { name: 'kobokit', path: '' };
const math = { name: '@kobokit/statement-math', path: 'packages/statement-math' };
const api = { name: '@kobokit/analyser-api', path: 'apps/analyser-api' };

describe('findUndocumentedWorkspaces', () => {
  it('passes when every workspace path appears in backticks', () => {
    const readme = '| `packages/statement-math` | maths |\n| `apps/analyser-api` | API |';

    assert.deepEqual(findUndocumentedWorkspaces([root, math, api], readme), []);
  });

  it('ignores the root workspace', () => {
    assert.deepEqual(findUndocumentedWorkspaces([root], ''), []);
  });

  it('flags a workspace that is missing', () => {
    const problems = findUndocumentedWorkspaces([math, api], '`packages/statement-math`');

    assert.equal(problems.length, 1);
    assert.match(problems[0], /@kobokit\/analyser-api is missing from the README/);
  });

  it('does not accept the path without backticks', () => {
    const problems = findUndocumentedWorkspaces([math], 'we have packages/statement-math here');

    assert.equal(problems.length, 1);
  });
});
