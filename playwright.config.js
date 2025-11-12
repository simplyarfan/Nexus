const { defineConfig, devices } = require('@playwright/test');

// Use environment variable for frontend URL, fallback to localhost for local development
const FRONTEND_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') // Remove /api suffix if present
  : process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL
  : 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './frontend/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only start dev server in local development, not in CI
  ...(process.env.CI ? {} : {
    webServer: {
      command: 'cd frontend && npm run dev',
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: 120000,
    },
  }),
});
