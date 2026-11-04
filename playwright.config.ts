import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', {outputFile: 'test-results/results.json'}],
    ['html', {open: 'never'}],
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'mobile-chromium', use: {...devices['Pixel 7']}},
  ],
  webServer: {
    command: 'npm run test:e2e:serve',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
