/**
 * The limits from docs/CODING_RULES.md, as ESLint rules.
 * Blank lines and comments do not count towards the size limits.
 */
const countOnlyCode = { skipBlankLines: true, skipComments: true };

export const readabilityRules = {
  'max-lines': ['error', { max: 150, ...countOnlyCode }],
  'max-lines-per-function': ['error', { max: 30, ...countOnlyCode }],
  complexity: ['error', 8],
  'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
  '@typescript-eslint/consistent-type-imports': 'error',
};

/** Test bodies are long by nature (describe blocks wrap many cases). */
export const testFileRules = {
  'max-lines-per-function': 'off',
};

/** Tools such as Vite and ESLint itself require a default export. */
export const toolConfigFileRules = {
  'no-restricted-exports': 'off',
};
