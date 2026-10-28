import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests do not boot the TanStack Start server plugin.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
});
