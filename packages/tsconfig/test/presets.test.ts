import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

type Preset = 'base' | 'react';

/** Resolve a preset the way tsc does, including its `extends` chain. */
function resolvePreset(preset: Preset): ts.CompilerOptions {
  const path = fileURLToPath(new URL(`../${preset}.json`, import.meta.url));
  const { config } = ts.readConfigFile(path, ts.sys.readFile);
  return ts.parseJsonConfigFileContent(config, ts.sys, dirname(path)).options;
}

describe.each<Preset>(['base', 'react'])('%s preset', (preset) => {
  const options = resolvePreset(preset);

  it('turns on strict mode', () => {
    expect(options.strict).toBe(true);
  });

  it('makes array and record indexing return T | undefined', () => {
    expect(options.noUncheckedIndexedAccess).toBe(true);
  });

  it('never emits; tsup owns the build output', () => {
    expect(options.noEmit).toBe(true);
  });
});

describe('react preset', () => {
  const options = resolvePreset('react');

  it('uses the automatic JSX runtime', () => {
    expect(options.jsx).toBe(ts.JsxEmit.ReactJSX);
  });

  it('adds DOM typings that the base preset leaves out', () => {
    expect(options.lib).toContain('lib.dom.d.ts');
    expect(resolvePreset('base').lib).not.toContain('lib.dom.d.ts');
  });
});
