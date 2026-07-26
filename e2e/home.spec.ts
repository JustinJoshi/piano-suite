import { test, expect } from "@playwright/test";

test.describe("home page", () => {
  test("loads the public landing page", async ({ page }) => {
    await page.goto("/");

    // The landing page should render without requiring authentication.
    await expect(page.locator("body")).toContainText("Anki MIDI Chord Trainer");
  });
});
