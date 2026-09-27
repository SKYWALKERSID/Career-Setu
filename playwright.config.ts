import { defineConfig, devices } from '@playwright/test';

const required = ['BASE_URL', 'QA_EMAIL', 'QA_PASSWORD'] as const;
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  throw new Error('BASE_URL, QA_EMAIL, and QA_PASSWORD must be configured before running Playwright QA tests.');
}

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/qa-student.json',
      },
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
