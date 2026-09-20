import { test, expect } from "@playwright/test";

test.describe("home page", () => {
  test("loads the public landing page", async ({ page }) => {
    await page.goto("/");

    // The landing page should render without requiring authentication.
    await expect(page.locator("body")).toContainText("Piano Suite");
  });

  test("links to no visualization lab route", async ({ page }) => {
    await page.goto("/");

    // The twelve-card tools grid is gone; labs are reachable from the
    // dashboard sidebar, never from the landing page (audit 1.6).
    const labRoutes = ["/tools/julia", "/tools/lissajous", "/tools/quasiperiodic", "/tools/multigrid"];
    for (const route of labRoutes) {
      await expect(
        page.locator(`a[href="${route}"], a[href="${route}/"]`),
      ).toHaveCount(0);
    }
  });
});
