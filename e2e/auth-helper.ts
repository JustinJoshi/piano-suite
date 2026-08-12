import { Page } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

const E2E_CLERK_USER_EMAIL =
  process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com";

/**
 * Sign in the deterministic Playwright test user through Clerk's real UI flow.
 *
 * `clerk.signIn()` uses a backend-generated sign-in token (ticket strategy) so
 * Clerk sets the HTTPOnly session cookie recognized by Next.js middleware and
 * by Convex. This is required for SSR/Edge auth; the client-side-only
 * `signInParams` approach would not pass server-side checks.
 *
 * This helper also bypasses Clerk's bot detection with a testing token, and
 * marks the `/tools` onboarding flow as completed in localStorage so existing
 * specs are not blocked by the fullscreen overlay. Specs that explicitly test
 * onboarding can still force it with `?onboarding=reset`.
 */
export async function signInAsTestUser(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: E2E_CLERK_USER_EMAIL });
  await page.evaluate((key) => {
    localStorage.setItem(key, "true");
  }, ONBOARDING_STORAGE_KEY);
}
