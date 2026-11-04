import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['src/**/*.test.ts'],
      exclude: ['src/**/*.integration.test.ts'],
    },
  },
  {
    test: {
      name: 'integration',
      include: ['src/**/*.integration.test.ts'],
      globalSetup: './src/test/globalSetup.ts',
      setupFiles: ['./src/test/setup.ts'],
      fileParallelism: false,
      testTimeout: 30_000,
    },
  },
]);
