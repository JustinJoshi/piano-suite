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

/**
 * Dev machines often reserve port 3000 (e.g. a personal proxy service).
 * Set E2E_PORT to run the app under test on another port; unset behavior
 * is unchanged.
 */
const E2E_PORT = Number(process.env.E2E_PORT || 3000);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
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
  webServer: process.env.CI
    ? {
        command: "npm run start",
        url: `http://localhost:${E2E_PORT}`,
        reuseExistingServer: false,
      }
    : {
        command: E2E_PORT === 3000 ? "npm run dev" : `PORT=${E2E_PORT} npm run dev`,
        url: `http://localhost:${E2E_PORT}`,
        reuseExistingServer: true,
      },
});
