import { expect, type Page } from "@playwright/test";

/**
 * Assert the page is not Clerk/Next bare-404 failure mode that previously
 * appeared when auth.protect() ran under Clerk development keys without a
 * dev-browser handshake.
 */
export async function expectNotBare404(page: Page) {
  await expect(page.getByText("This page could not be found")).toHaveCount(0);
  await expect(page.locator("h1", { hasText: "404" })).toHaveCount(0);
  expect(page.url()).not.toMatch(/\/404(?:\?|$)/);
}

/**
 * Assert Next.js did not render the generic application error shell.
 */
export async function expectNoApplicationError(page: Page) {
  await expect(
    page.getByText("Application error: a client-side exception has occurred")
  ).toHaveCount(0);
  await expect(page.getByText("Something went wrong")).toHaveCount(0);
  await expect(page.getByText(/this page could(n'?t| not) load/i)).toHaveCount(0);
}

/**
 * Assert an unauthenticated visit was sent to Clerk sign-in (not a bare 404).
 */
export async function expectRedirectedToSignIn(page: Page) {
  await expect(page).toHaveURL(/.*sign-in.*/);
  await expectNotBare404(page);
}

/** E2E auth suite requires real Clerk route protection. */
export function assertAuthBypassOffForE2E() {
  if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
    throw new Error(
      "Auth verification e2e requires NEXT_PUBLIC_AUTH_DISABLED to be unset " +
        "or not 'true'. Remove the bypass from .env.local (and restart Next) " +
        "so route protection and sign-in redirects can be tested."
    );
  }
}
