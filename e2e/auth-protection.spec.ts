import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import {
  assertAuthBypassOffForE2E,
  expectNoApplicationError,
  expectNotBare404,
  expectRedirectedToSignIn,
} from "./auth-assertions";

const PROTECTED_ROUTES = [
  "/tools",
  "/tools/chord-drill",
  "/tools/tracking",
  "/tools/technique",
  "/articles",
  "/chat",
  "/settings/theme",
] as const;

test.describe("auth protection (bypass off)", () => {
  test.beforeAll(() => {
    assertAuthBypassOffForE2E();
  });

  for (const route of PROTECTED_ROUTES) {
    test(`unsigned ${route} redirects to sign-in (not bare 404)`, async ({
      page,
    }) => {
      await page.goto(route);
      await expectRedirectedToSignIn(page);
    });
  }

  test("unsigned home stays public", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expectNotBare404(page);
    await expect(page.locator("body")).toContainText("Anki MIDI Chord Trainer");
  });

  test("unsigned Pattern Lab stays public", async ({ page }) => {
    await page.goto("/tools/chladni");
    await expect(page).toHaveURL("/tools/chladni");
    await expectNotBare404(page);
    await expect(
      page.getByRole("heading", { name: "Chladni Pattern Lab" })
    ).toBeVisible();
  });

  test("unsigned /pricing stays public", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveURL("/pricing");
    await expectNotBare404(page);
    await expectNoApplicationError(page);
    await expect(
      page.getByRole("heading", {
        name: /Practice free\. Sync when you're ready\./i,
      })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Pricing" })).toBeVisible();
  });

  test("signed-in user can open /tools after sign-in", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools");
    await expectNotBare404(page);
    await expectNoApplicationError(page);
    await expect(page.getByRole("heading", { name: "Tools" })).toBeVisible();
  });

  test("signed-in homepage loads without application error", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expectNotBare404(page);
    await expectNoApplicationError(page);
    await expect(page.locator("body")).toContainText("Anki MIDI Chord Trainer");
  });

  test("deep link to tracking after sign-in reaches the tool", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/tracking");
    await expectNotBare404(page);
    await expectNoApplicationError(page);
    await expect(page).toHaveURL(/\/tools\/tracking/);
    await expect(page.getByRole("heading", { name: "Tracking" })).toBeVisible();
  });
});
