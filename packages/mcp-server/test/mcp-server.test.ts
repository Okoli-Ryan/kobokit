import { describe, expect, it } from 'vitest';
import { describeMcpServer } from '../src';

describe('describeMcpServer', () => {
  it('returns the package name', () => {
    expect(describeMcpServer()).toBe('@kobokit/mcp-server');
  });
});
