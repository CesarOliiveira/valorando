import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    assetsDir: 'build',
  },
  test: {
    environment: 'node',
  },
});
