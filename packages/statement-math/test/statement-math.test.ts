import { describe, expect, it } from 'vitest';
import { describeStatementMath } from '../src';

describe('describeStatementMath', () => {
  it('returns the package name', () => {
    expect(describeStatementMath()).toBe('@kobokit/statement-math');
  });
});
