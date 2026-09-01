import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import {
  assertAuthBypassOffForE2E,
} from "./auth-assertions";

const SIDEBAR_TOOLS = [
  "Workshop",
  "Chord Drill",
  "Arpeggios",
  "Root Cycling",
  "Progression",
  "Technique",
  "Tracking",
];

const emptyStorageState = { cookies: [] as never[], origins: [] as never[] };

test.describe("/tools dashboard", () => {
  test.describe("unsigned", () => {
    test.use({ storageState: emptyStorageState });

    test("lands unsigned visitors on the public workshop", async ({ page }) => {
      assertAuthBypassOffForE2E();
      await page.goto("/tools");

      // next.config.ts 307s /tools → /tools/workshop before the proxy
      // runs, and the workshop is public (Change A).
      await expect(page).toHaveURL("/tools/workshop");
      await expect(
        page.getByRole("heading", { name: "Workshop" })
      ).toBeVisible();
    });
  });

  test("lands on the Workshop and renders sidebar navigation", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools");

    // /tools redirects to the Workshop, the core of the app.
    await expect(page).toHaveURL("/tools/workshop");
    await expect(
      page.getByRole("heading", { name: "Workshop" })
    ).toBeVisible();

    for (const name of SIDEBAR_TOOLS) {
      await expect(
        page.locator("aside nav").getByRole("link", { name })
      ).toBeVisible();
    }
  });

  test("sidebar collapses to four sections; labs live on the shelf", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/workshop");

    const nav = page.locator("aside nav");
    // The four sections: Workshop, Shelf, Progress, Settings.
    await expect(
      nav.getByRole("link", { name: "Workshop", exact: true })
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "Shelf" })).toBeVisible();
    await expect(nav.getByText("Progress", { exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Settings" })).toBeVisible();
    // Ready-made drills nest under the Workshop as starting points.
    await expect(
      nav.getByRole("link", { name: "Chord Drill" })
    ).toBeVisible();
    // No labs section anymore — they are reachable from the shelf.
    await expect(
      nav.getByRole("button", { name: "Labs" })
    ).toHaveCount(0);

    await nav.getByRole("link", { name: "Shelf" }).click();
    await expect(page).toHaveURL(/\/tools\/workshop\/marketplace$/);
    await expect(
      page.getByRole("heading", { name: "Shelf" })
    ).toBeVisible();
    // Labs stay one click away from the shelf.
    await expect(
      page.getByRole("link", { name: "Chladni Lab" })
    ).toBeVisible();
  });

  test("Workshop offers ready-made drill shortcuts", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/workshop");

    // First run shows the template picker; scratch past it to the grid,
    // which now carries the shortcuts as a tile.
    await page.getByRole("button", { name: /start from scratch/i }).click();

    const drillsTile = page.getByTestId("drill-shortcuts");
    await expect(
      drillsTile.getByText("In a hurry? Jump into a ready-made drill:")
    ).toBeVisible();

    await drillsTile
      .getByRole("link", { name: "Chord Drill" })
      .click();
    await expect(page).toHaveURL("/tools/chord-drill");
    await expect(
      page.getByRole("heading", { name: "Chord Drill" })
    ).toBeVisible();
  });

  test("sidebar brand link navigates to the landing page", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/workshop");

    await page
      .locator("aside")
      .getByRole("link", { name: "Piano Suite" })
      .click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("body")).toContainText("Piano Suite");
  });

  test("mobile menu opens the sidebar drawer and navigates", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signInAsTestUser(page);
    await page.goto("/tools/workshop");

    const menuButton = page.getByTestId("dashboard-menu-button");
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");

    const trackingLink = page
      .locator("aside nav")
      .getByRole("link", { name: "Tracking" });
    // Closed drawer uses CSS translate off-screen (still "visible" to Playwright).
    await expect(trackingLink).not.toBeInViewport();

    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(trackingLink).toBeInViewport();

    await trackingLink.click();
    await expect(page).toHaveURL("/tools/tracking");
    await expect(page.getByRole("heading", { name: "Tracking" })).toBeVisible();
  });
});
