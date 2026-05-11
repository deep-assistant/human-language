// Playwright config for the e2e suite.
//
// The same file drives two CI jobs:
//   * pull request — `BASE_URL` is the local static server on port 8000.
//   * post-deploy — `BASE_URL` is the GitHub Pages URL, set by `js.yml`
//     after `actions/deploy-pages` resolves the deploy URL.
//
// Both jobs run the same specs.

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.mjs',
  // Each spec is independent; parallelism is safe.
  fullyParallel: true,
  // Fail fast on accidental `test.only` left in a spec.
  forbidOnly: !!process.env.CI,
  // One retry on CI smooths over the rare Wikidata flake.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
