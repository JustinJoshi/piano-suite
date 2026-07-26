import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Playwright configuration for the Piano Suite Next.js app.
 *
 * Loads `.env.local` so Clerk and Convex environment variables are available
 * to the test runner and global setup.
 *
 * @see https://playwright.dev/docs/test-configuration
 * @see https://clerk.com/docs/guides/development/testing/playwright/overview
 */
try {
  process.loadEnvFile(path.join(__dirname, ".env.local"));
} catch {
  // .env.local may not exist in CI; rely on injected environment variables.
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      teardown: "teardown",
    },
    {
      name: "teardown",
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
