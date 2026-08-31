import { Page } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { AGE_GATE_STORAGE_KEY } from "@/lib/age-gate";
import fs from "fs";
import path from "path";

const E2E_CLERK_USER_EMAIL =
  process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com";

const testingTokenFile = path.join(
  process.cwd(),
  "playwright",
  ".auth",
  "clerk-testing.json"
);

function ensureTestingToken() {
  if (process.env.CLERK_FAPI && process.env.CLERK_TESTING_TOKEN) {
    return;
  }
  if (fs.existsSync(testingTokenFile)) {
    const data = JSON.parse(fs.readFileSync(testingTokenFile, "utf-8")) as {
      CLERK_FAPI?: string;
      CLERK_TESTING_TOKEN?: string;
    };
    if (data.CLERK_FAPI) process.env.CLERK_FAPI = data.CLERK_FAPI;
    if (data.CLERK_TESTING_TOKEN) {
      process.env.CLERK_TESTING_TOKEN = data.CLERK_TESTING_TOKEN;
    }
  }
}

/**
 * Prepare an already-authenticated Playwright page for an authenticated test.
 *
 * The E2E suite now signs in once during global setup and reuses the saved
 * storage state for every test, so this helper only needs to:
 *   1. Install Clerk's testing-token bypass on the current context (in case the
 *      worker process did not inherit the token from the setup project).
 *   2. Mark the /tools onboarding flow as completed so existing specs are not
 *      blocked by the fullscreen overlay. Specs that explicitly test onboarding
 *      can still force it with `?onboarding=reset`.
 *
 * If you run a single spec locally without the global setup (not recommended),
 * the helper falls back to a one-off ticket sign-in.
 */
export async function signInAsTestUser(page: Page) {
  ensureTestingToken();
  await setupClerkTestingToken({ page });
  // The age gate renders before Clerk (COPPA); tests that exercise sign-in
  // must present an already-passed gate or the Clerk UI never mounts.
  await page.addInitScript(
    ({ key }) => localStorage.setItem(key, "eligible"),
    { key: AGE_GATE_STORAGE_KEY }
  );
  await page.goto("/");

  const isSignedIn = await page
    .evaluate(() => window.Clerk?.user !== null)
    .catch(() => false);

  if (!isSignedIn) {
    await clerk.signIn({ page, emailAddress: E2E_CLERK_USER_EMAIL });
    await page.waitForFunction(() => window.Clerk?.user !== null, {
      timeout: 10000,
    });
  }

  // Refresh the session JWT before returning. Every worker starts from the
  // same storage state, and a stale __session cookie can get the next
  // navigation bounced to /sign-in when many workers burst at once.
  await page.evaluate(async () => {
    await window.Clerk?.session?.getToken();
  });

  await page.evaluate((key) => {
    localStorage.setItem(key, "true");
  }, ONBOARDING_STORAGE_KEY);
}
