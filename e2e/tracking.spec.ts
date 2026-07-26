import { test, expect } from "@playwright/test";

test.describe("/tools/tracking unauthenticated", () => {
  test("redirects unauthenticated visitors to sign-in", async ({ page }) => {
    await page.goto("/tools/tracking");
    await expect(page).toHaveURL(/.*sign-in.*/);
  });
});
