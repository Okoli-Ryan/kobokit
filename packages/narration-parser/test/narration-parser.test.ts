import { describe, expect, it } from 'vitest';
import { describeNarrationParser } from '../src';

describe('describeNarrationParser', () => {
  it('returns the package name', () => {
    expect(describeNarrationParser()).toBe('@kobokit/narration-parser');
  });
});
