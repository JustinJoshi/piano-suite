import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

const SIDEBAR_TOOLS = [
  "Welcome",
  "Chord Drill",
  "Arpeggios",
  "Root Cycling",
  "Tracking",
  "Progression",
  "Technique",
];

test.describe("/tools dashboard", () => {
  test("redirects unauthenticated visitors to sign-in", async ({ page }) => {
    await page.goto("/tools");

    // Clerk middleware will redirect to /sign-in when there is no session.
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test("renders the authenticated tools page and sidebar navigation", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools");

    await expect(page.getByRole("heading", { name: "Tools" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Practice dashboard" })
    ).toBeVisible();

    for (const name of SIDEBAR_TOOLS) {
      await expect(
        page.locator("aside nav").getByRole("link", { name })
      ).toBeVisible();
    }
  });

  test("renders a card for each practice tool when authenticated", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools");

    for (const name of SIDEBAR_TOOLS) {
      await expect(
        page.locator("[data-testid='tool-card-title']", { hasText: name })
      ).toBeVisible();
    }
  });

  test("sidebar Welcome link navigates to the landing page", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools");

    await page.locator("aside nav").getByRole("link", { name: "Welcome" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("body")).toContainText("Anki MIDI Chord Trainer");
  });

  test("dashboard cards link to their tool routes", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools");

    await page.getByRole("main").getByRole("link", { name: "Tracking" }).click();
    await expect(page).toHaveURL("/tools/tracking");
    await expect(page.getByRole("heading", { name: "Tracking" })).toBeVisible();
  });
});
