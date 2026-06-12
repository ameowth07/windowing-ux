import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  base: '/windowing-ux/',
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@mdi/legacy-ribbon/tokens.css',
        replacement: path.resolve(dir, 'packages/legacy-ribbon/src/tokens.css'),
      },
      {
        find: '@mdi/legacy-ribbon',
        replacement: path.resolve(dir, 'packages/legacy-ribbon/src/index.ts'),
      },
    ],
  },
  server: {
    port: 5180,
    strictPort: true,
  },
});
