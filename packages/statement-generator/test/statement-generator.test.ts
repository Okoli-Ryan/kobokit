import { describe, expect, it } from 'vitest';
import { describeStatementGenerator } from '../src';

describe('describeStatementGenerator', () => {
  it('returns the package name', () => {
    expect(describeStatementGenerator()).toBe('@kobokit/statement-generator');
  });
});
