import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { readabilityRules, testFileRules, toolConfigFileRules } from './readability-rules.js';

const generatedOutput = [
  '**/dist/**',
  '**/.output/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/.tanstack/**',
  '**/routeTree.gen.ts',
];

export const baseConfig = defineConfig([
  globalIgnores(generatedOutput),
  js.configs.recommended,
  tseslint.configs.strict,
  { rules: readabilityRules },
  { files: ['**/*.test.{ts,tsx}'], rules: testFileRules },
  { files: ['**/*.config.{js,mjs,cjs,ts}'], rules: toolConfigFileRules },
]);
