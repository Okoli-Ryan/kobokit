import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { baseConfig } from '../src/base.js';
import { reactConfig } from '../src/react.js';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

const presets = { base: baseConfig, react: reactConfig };

export type Preset = keyof typeof presets;

/** Lint a snippet as if it lived at `filename`, returning the ids of the rules that fired. */
export async function ruleIdsFor(
  code: string,
  filename: string,
  preset: Preset = 'base',
): Promise<string[]> {
  const eslint = new ESLint({
    cwd: packageRoot,
    overrideConfigFile: true,
    overrideConfig: presets[preset],
  });
  const [result] = await eslint.lintText(code, { filePath: `${packageRoot}${filename}` });
  return (result?.messages ?? []).map((message) => message.ruleId ?? 'parse-error');
}
