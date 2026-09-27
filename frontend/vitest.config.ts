import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
      // `server-only` throws outside Next's server bundle by design; tests run server-side anyway.
      'server-only': path.resolve(__dirname, 'src/evidence/__tests__/server-only-stub.ts'),
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
