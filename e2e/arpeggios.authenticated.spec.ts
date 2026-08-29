import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import { ArpeggiosPage } from "./pom/arpeggios-page";

test.describe("Arpeggios (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test("loads the arpeggios page", async ({ page }) => {
    const arpeggios = new ArpeggiosPage(page);
    await arpeggios.goto();
    await arpeggios.expectLoaded();
    await arpeggios.expectChordName("Bbm11");
  });

  test("toggles LH notes visibility", async ({ page }) => {
    const arpeggios = new ArpeggiosPage(page);
    await arpeggios.goto();

    await arpeggios.expectLhNotesVisible();
    await arpeggios.toggleLhNotes(false);
    await arpeggios.expectLhNotesHidden();
  });

  test("customizes the sequence order", async ({ page }) => {
    const arpeggios = new ArpeggiosPage(page);
    await arpeggios.goto();

    await arpeggios.openCustomizeSequence();
    const firstCheckbox = page.locator("input[type='checkbox']").first();
    await expect(firstCheckbox).toBeChecked();

    await arpeggios.resetSequenceOrder();
    await arpeggios.expectChordName("Bbm11");
  });

  test("navigates to the next chord", async ({ page }) => {
    const arpeggios = new ArpeggiosPage(page);
    await arpeggios.goto();

    await arpeggios.nextChord();
    await arpeggios.expectChordName("Fm11");
  });

  test("shows the target note and cell strip", async ({ page }) => {
    const arpeggios = new ArpeggiosPage(page);
    await arpeggios.goto();

    await arpeggios.expectTargetNoteVisible();
    await arpeggios.expectCellStripCount(7);
  });

  test("miss filter auto-filters current chord notes by default", async ({ page }) => {
    const arpeggios = new ArpeggiosPage(page);
    await arpeggios.goto();

    await expect(page.getByText("Miss filter", { exact: true })).toBeVisible();

    // Auto-filter is on by default, so Bbm11 chord/sequence PCs are active.
    const autoPcs = [0, 1, 3, 5, 8, 10]; // C, Db, Eb, F, Ab, Bb
    for (const pc of autoPcs) {
      await arpeggios.expectMissFilterPc(pc, true);
    }

    // A note outside the chord/sequence starts inactive and can be toggled.
    await arpeggios.expectMissFilterPc(2, false);
    await arpeggios.toggleMissFilterPc(2);
    await arpeggios.expectMissFilterPc(2, true);

    // Turning auto-filter off removes the automatic PCs but keeps the manual one.
    await arpeggios.toggleAutoFilter(false);
    for (const pc of autoPcs) {
      await arpeggios.expectMissFilterPc(pc, false);
    }
    await arpeggios.expectMissFilterPc(2, true);

    // Use chord & sequence preset fills the manual filter.
    await arpeggios.useChordMissFilter();
    for (const pc of autoPcs) {
      await arpeggios.expectMissFilterPc(pc, true);
    }

    await arpeggios.clearMissFilter();
    for (let pc = 0; pc < 12; pc++) {
      await arpeggios.expectMissFilterPc(pc, false);
    }
  });
});
