import { Page } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
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
 * We intentionally do NOT call `setupClerkTestingToken()` here. That helper is
 * only valid for Clerk development instances and silently no-ops (or breaks)
 * on production (`pk_live_*`) keys. The backend sign-in token used by
 * `clerk.signIn()` is instance-agnostic, so we rely on it alone and accept the
 * bot-detection risk in CI.
 *
 * This helper also marks the `/tools` onboarding flow as completed in
 * localStorage so existing specs are not blocked by the fullscreen overlay.
 * Specs that explicitly test onboarding can still force it with `?onboarding=reset`.
 */
export async function signInAsTestUser(page: Page) {
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: E2E_CLERK_USER_EMAIL });
  await page.evaluate((key) => {
    localStorage.setItem(key, "true");
  }, ONBOARDING_STORAGE_KEY);
}
