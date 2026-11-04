import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

// Keep unit tests independent of Oxygen, route generation and live Shopify.
export default defineConfig({
  resolve: {alias: {'~': fileURLToPath(new URL('./app', import.meta.url))}},
  test: {
    // Hydrogen and tests must share the same router context module.
    server: {deps: {inline: ['@shopify/hydrogen', 'react-router']}},
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: [
        'app/lib/**/*.ts',
        'app/components/**/*.{ts,tsx}',
        'app/routes/*',
      ],
      exclude: ['app/lib/context.ts', 'app/lib/fragments.ts'],
      reporter: ['text', 'html'],
    },
  },
});
