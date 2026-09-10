import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    // Not `npm run preview`: Astro 7's `astro preview` always daemonizes
    // itself now, which breaks Playwright's expectation that the command
    // it runs stays attached in the foreground (see scripts/staticServer.mjs).
    command: 'npm run preview:e2e',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
});
