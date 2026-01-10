import { defineConfig } from 'vitest/config';

const viteConfig = {
  test: {
    environment: 'node',
    include: [
      './src/**/*.{test,spec}.{js,ts}',
    ],
    reporters: [
      'default',
      'junit',
    ],
    outputFile: {
      junit: './test-reports/junit.xml',
    },
    // globalSetup: [
    setupFiles: [
      './src/lib/test-setup.ts',
    ],
  }
};

export default defineConfig(viteConfig);
