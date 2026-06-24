import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  /* Maximum time one test can run */
  timeout: 60 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'artifacts/html-report' }],
    ['json', { outputFile: 'artifacts/test-results.json' }],
    ['list'],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on',

    /* Screenshot on all tests (for Web3 debugging) */
    screenshot: 'on',

    /* Video on all tests (for Web3 debugging) */
    video: 'on',

    /* Capture console logs */
    launchOptions: {
      slowMo: 100, // Slow down by 100ms for better visual debugging
    },

    /* Enable Web3 features */
    ignoreHTTPSErrors: true,

    /* Extended timeout for blockchain transactions */
    actionTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write'],
        },
      },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Output folders */
  outputDir: 'artifacts/test-output',
});
