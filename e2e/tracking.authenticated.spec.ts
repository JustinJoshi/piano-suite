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

const legacyArpeggio = [
  {
    chord: "Dm7",
    fromDeg: "Root",
    toDeg: "9",
    ms: 350,
    ts: Date.now() - 86400000,
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

  test("signed-in Free user sees local practice banner (no Pro upload UI)", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/tracking");

    await expect(page.locator("body")).toContainText("Local practice mode");
    await expect(page.getByRole("link", { name: "See plans" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      "Upload practice history to Pro"
    );
  });

  test("signed-in user sees empty state for chord drill", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/tracking");
    await page.getByRole("button", { name: "Chord Drill" }).click();

    await expect(page.locator("body")).toContainText(
      "No first-chord attempts logged yet."
    );
  });

  test("signed-in Free user reads legacy localStorage chord history and renders chart", async ({
    page,
  }) => {
    await signInAsTestUser(page);

    // Seed legacy localStorage entries exactly like Reflex Drill EXT / Free drills store them.
    await page.evaluate((data) => {
      localStorage.setItem("blocked-drill-first-chord-log", JSON.stringify(data));
    }, legacyChordDrill);

    await page.goto("/tools/tracking");

    // Free tier reads browser history directly — no Convex import step.
    await expect(page.locator("body")).toContainText("Local practice mode");
    await expect(page.locator("body")).toContainText("Cmaj7");
    await expect(page.locator("[class*='recharts-wrapper'] svg")).toBeVisible();

    await page.evaluate(() => {
      localStorage.removeItem("blocked-drill-first-chord-log");
    });
  });

  test("signed-in Free user reads legacy localStorage arpeggio history", async ({
    page,
  }) => {
    await signInAsTestUser(page);

    await page.evaluate((data) => {
      localStorage.setItem("blocked-drill-arpeggio-log", JSON.stringify(data));
    }, legacyArpeggio);

    await page.goto("/tools/tracking");
    await page.getByRole("button", { name: "Arpeggios" }).click();

    await expect(page.locator("body")).toContainText("Dm7");
    await expect(page.locator("body")).toContainText("Root→9");

    await page.evaluate(() => {
      localStorage.removeItem("blocked-drill-arpeggio-log");
    });
  });
});
