import { test } from "@playwright/test";
import {
  assertAuthBypassOffForE2E,
  expectRedirectedToSignIn,
} from "./auth-assertions";

const emptyStorageState = { cookies: [] as never[], origins: [] as never[] };

test.use({ storageState: emptyStorageState });

test.describe("/tools/tracking unauthenticated", () => {
  test("redirects unauthenticated visitors to sign-in", async ({ page }) => {
    assertAuthBypassOffForE2E();
    await page.goto("/tools/tracking");
    await expectRedirectedToSignIn(page);
  });
});
