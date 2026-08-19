import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import { ChordDrillPage } from "./pom/chord-drill-page";

test.describe("Chord Drill (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test("loads the chord drill page", async ({ page }) => {
    const drill = new ChordDrillPage(page);
    await drill.goto();
    await drill.expectLoaded();
    await drill.expectSymbol("Cmaj7");
  });

  test("can change mode, root, and quality", async ({ page }) => {
    const drill = new ChordDrillPage(page);
    await drill.goto();

    await drill.selectMode("family");
    const familySymbol = await drill.getSymbol();
    await expect(familySymbol).toContain("maj7");

    await drill.selectRoot(7); // G
    const rootSymbol = await drill.getSymbol();
    await expect(rootSymbol).toContain("G");

    await drill.selectMode("single");
    await drill.selectQuality("m7");
    await drill.expectSymbol("Gm7");
  });

  test("toggling chord notes visibility", async ({ page }) => {
    const drill = new ChordDrillPage(page);
    await drill.goto();

    await drill.expectNotesHidden();
    await drill.toggleChordNotes(true);
    await drill.expectNotesVisible();
  });

  test("start button is visible", async ({ page }) => {
    const drill = new ChordDrillPage(page);
    await drill.goto();
    await expect(drill.locator("start-drill-btn")).toBeVisible();
  });

  test("rep target custom input", async ({ page }) => {
    const drill = new ChordDrillPage(page);
    await drill.goto();
    await drill.setCustomRepTarget(16);
  });

  test("shuffle picks a different chord", async ({ page }) => {
    const drill = new ChordDrillPage(page);
    await drill.goto();
    const before = await drill.getSymbol();
    await drill.shuffle();
    const after = await drill.getSymbol();
    expect(after).not.toEqual(before);
  });

  test("per-chord reps modal opens and closes", async ({ page }) => {
    const drill = new ChordDrillPage(page);
    await drill.goto();
    await drill.openPerChordReps();
    await drill.savePerChordReps();
  });
});
