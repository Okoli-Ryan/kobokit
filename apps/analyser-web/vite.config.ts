import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  // The React plugin must come after the Start plugin.
  plugins: [tanstackStart(), viteReact()],
});
