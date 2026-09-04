import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests.
 * Tests run against the running dev/test server.
 *
 * See: https://playwright.dev/docs/test-configuration
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Max time per test
  timeout: 30_000,
  // Number of times to retry a failed test on CI
  retries: process.env.CI ? 2 : 0,
  // Parallel workers — use 1 in CI to avoid port conflicts
  workers: process.env.CI ? 1 : undefined,
  // Reporter: human-readable in dev, full HTML report in CI
  reporter: process.env.CI ? "html" : "list",

  use: {
    // Base URL so we can use relative paths in tests
    baseURL: BASE_URL,
    // Capture screenshot/video/trace on failure for easier debugging
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],

  // Automatically start the dev server before tests if not already running.
  // Comment this out if you start the server manually in CI.
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
