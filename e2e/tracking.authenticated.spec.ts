import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

const legacyChordDrill = [
  {
    chord: "Cmaj7",
    ms: 1200,
    grade: 3,
    gradeLabel: "Good",
    isRedo: false,
    ts: Date.now() - 86400000,
  },
  {
    chord: "Cmaj7",
    ms: 900,
    grade: 3,
    gradeLabel: "Good",
    isRedo: false,
    ts: Date.now() - 43200000,
  },
];

test.describe("/tools/tracking authenticated", () => {
  test("signed-in user sees tracking dashboard", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/tracking");

    await expect(page.getByRole("heading", { name: "Tracking" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Chord Drill" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Arpeggios" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Root Cycling" })).toBeVisible();
  });

  test("signed-in user sees empty state for chord drill", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/tracking");
    await page.getByRole("button", { name: "Chord Drill" }).click();

    await expect(page.locator("body")).toContainText(
      "No first-chord attempts logged yet."
    );
  });

  test("signed-in user can import legacy localStorage tracking data and render chart", async ({
    page,
  }) => {
    await signInAsTestUser(page);

    // Seed legacy localStorage entries exactly like Reflex Drill EXT stored them.
    await page.evaluate((data) => {
      localStorage.setItem("blocked-drill-first-chord-log", JSON.stringify(data));
    }, legacyChordDrill);

    // Load the tracking page so the import card detects the local data on mount.
    await page.goto("/tools/tracking");

    await expect(page.locator("body")).toContainText("Import local tracking data?");
    await page.getByRole("button", { name: "Import to cloud" }).click();

    // Wait for the import mutation to finish and the card to disappear.
    await expect(page.locator("body")).not.toContainText("Import local tracking data?", {
      timeout: 10000,
    });

    // The chord should now appear in the sidebar and the chart should render.
    await expect(page.locator("body")).toContainText("Cmaj7");
    await expect(page.locator("[class*='recharts-wrapper'] svg")).toBeVisible();

    // Clean up imported data so subsequent runs start fresh.
    await page.evaluate(() => {
      localStorage.removeItem("blocked-drill-first-chord-log");
    });
  });
});
