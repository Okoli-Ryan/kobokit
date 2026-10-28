import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The first lint in each file loads typescript-eslint and the React plugin, which can take
    // several seconds when many turbo tasks run at once. The 5s default is too tight.
    testTimeout: 30_000,
  },
});
