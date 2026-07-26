import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import path from "path";

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

const exportFixture = {
  version: 1,
  exportedAt: Date.now(),
  source: "reflex-drill-ext",
  chordDrill: legacyChordDrill,
  arpeggio: [
    {
      chord: "Dm7",
      fromDeg: "Root",
      toDeg: "9",
      ms: 350,
      ts: Date.now() - 86400000,
    },
  ],
  arpeggioMiss: [
    {
      chord: "Dm7",
      fromDeg: "Root",
      toDeg: "9",
      played: "Eb",
      ts: Date.now() - 43200000,
    },
  ],
  rootCycle: [
    {
      mode: "chord",
      label: "Dm7",
      root: "D",
      ms: 1100,
      ts: Date.now() - 86400000,
    },
  ],
};

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

    await expect(page.locator("body")).toContainText("Import practice history");
    await page.getByRole("button", { name: "Import from this browser" }).click();

    // Wait for the import mutation to finish and the success report to appear.
    await expect(page.locator("body")).toContainText("Import complete", {
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

  test("signed-in user can import Reflex Drill EXT export file and render chart", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/tracking");

    await expect(page.locator("body")).toContainText("Import practice history");

    // Use the hidden file input to upload the export fixture.
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Choose file" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(
      path.join(__dirname, "fixtures", "reflex-drill-tracking-export.json")
    );

    // Wait for the import mutation to finish and the success report to appear.
    await expect(page.locator("body")).toContainText("Import complete", {
      timeout: 10000,
    });

    // The exported chord and arpeggio transition should now be visible.
    await expect(page.locator("body")).toContainText("Cmaj7");

    await page.getByRole("button", { name: "Arpeggios" }).click();
    await expect(page.locator("body")).toContainText("Dm7");
    await expect(page.locator("body")).toContainText("Root→9");
  });
});
