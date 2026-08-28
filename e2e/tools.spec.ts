import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import {
  assertAuthBypassOffForE2E,
  expectRedirectedToSignIn,
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

    test("redirects unauthenticated visitors to sign-in", async ({ page }) => {
      assertAuthBypassOffForE2E();
      await page.goto("/tools");

      // Clerk middleware will redirect to /sign-in when there is no session.
      await expectRedirectedToSignIn(page);
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

  test("sidebar groups tools into sections", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/workshop");

    const nav = page.locator("aside nav");
    await expect(nav.getByText("Ready-made drills")).toBeVisible();
    await expect(nav.getByText("Progress", { exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Labs" })).toBeVisible();

    // Labs are tucked away but stay one click away.
    const labsToggle = nav.getByRole("button", { name: "Labs" });
    await expect(labsToggle).toHaveAttribute("aria-expanded", "false");
    await labsToggle.click();
    await expect(labsToggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      nav.getByRole("link", { name: "Chladni Lab" })
    ).toBeVisible();
  });

  test("Workshop offers ready-made drill shortcuts", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/workshop");

    await expect(
      page.getByText("In a hurry? Jump into a ready-made drill:")
    ).toBeVisible();

    await page
      .getByRole("main")
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
