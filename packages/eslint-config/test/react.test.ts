import { describe, expect, it } from 'vitest';
import { ruleIdsFor } from './rule-ids-for';

const cleanComponent = `export function Hello({ name }: { name: string }) {
  return <p>Hello {name}</p>;
}
`;

const conditionalHook = `import { useState } from 'react';

export function Broken({ on }: { on: boolean }) {
  if (on) {
    useState(0);
  }
  return null;
}
`;

describe('react preset', () => {
  it('accepts a small component without importing React', async () => {
    expect(await ruleIdsFor(cleanComponent, 'src/Hello.tsx', 'react')).toEqual([]);
  });

  it('rejects hooks called conditionally', async () => {
    const ids = await ruleIdsFor(conditionalHook, 'src/Broken.tsx', 'react');
    expect(ids).toContain('react-hooks/rules-of-hooks');
  });

  it('keeps the base readability rules', async () => {
    const ids = await ruleIdsFor('export const x: any = 1;\n', 'src/x.ts', 'react');
    expect(ids).toContain('@typescript-eslint/no-explicit-any');
  });
});
