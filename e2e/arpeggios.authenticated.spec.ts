import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

test.describe("Arpeggios (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/arpeggios");
    await page.waitForSelector("[data-testid='arpeggios-drill']", { timeout: 10000 });
  });

  test("loads the arpeggios page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Arpeggios" })).toBeVisible();
    await expect(page.getByTestId("arpeggios-drill")).toBeVisible();
    await expect(page.getByTestId("arpeggio-chord-name")).toHaveText("Bbm11");
  });

  test("toggles LH notes visibility", async ({ page }) => {
    const notes = page.getByTestId("arpeggio-lh-notes");
    await expect(notes).toHaveClass(/opacity-100/);

    const showLhRow = page.getByText("Show LH notes", { exact: true }).locator("xpath=../..");
    await showLhRow.getByRole("button", { name: "Off" }).click();
    await expect(notes).toHaveClass(/opacity-0/);
  });

  test("customizes the sequence order", async ({ page }) => {
    await page.getByTestId("customize-sequence-btn").click();

    const firstRow = page.locator("input[type='checkbox']").first();
    await expect(firstRow).toBeChecked();

    await page.getByRole("button", { name: "Reset to default order" }).click();
    await expect(page.getByTestId("arpeggio-chord-name")).toHaveText("Bbm11");
  });

  test("navigates to the next chord", async ({ page }) => {
    await page.getByTestId("next-chord-btn").click();
    await expect(page.getByTestId("arpeggio-chord-name")).toHaveText("Fm11");
  });

  test("shows the target note and cell strip", async ({ page }) => {
    await expect(page.getByTestId("arpeggio-target-note")).toBeVisible();
    await expect(page.getByTestId("arpeggio-cell-strip")).toBeVisible();
    const chips = page.getByTestId("arpeggio-cell-strip").locator("span");
    await expect(chips).toHaveCount(7);
  });

  test("miss filter auto-filters current chord notes by default", async ({ page }) => {
    await expect(page.getByText("Miss filter", { exact: true })).toBeVisible();

    // Auto-filter is on by default, so Bbm11 chord/sequence PCs are active.
    const autoPcs = [0, 1, 3, 5, 8, 10]; // C, Db, Eb, F, Ab, Bb
    for (const pc of autoPcs) {
      await expect(page.getByTestId(`miss-filter-pc-${pc}`)).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    }

    // A note outside the chord/sequence starts inactive and can be toggled.
    const dButton = page.getByTestId("miss-filter-pc-2");
    await expect(dButton).toHaveAttribute("aria-pressed", "false");
    await dButton.click();
    await expect(dButton).toHaveAttribute("aria-pressed", "true");

    // Turning auto-filter off removes the automatic PCs but keeps the manual one.
    const autoFilterRow = page
      .getByText("Add notes into filter by default", { exact: true })
      .locator("xpath=../..");
    await autoFilterRow.getByRole("button", { name: "Off" }).click();

    for (const pc of autoPcs) {
      await expect(page.getByTestId(`miss-filter-pc-${pc}`)).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    }
    await expect(dButton).toHaveAttribute("aria-pressed", "true");

    // Use chord & sequence preset fills the manual filter.
    await page.getByRole("button", { name: "Use chord & sequence" }).click();
    for (const pc of autoPcs) {
      await expect(page.getByTestId(`miss-filter-pc-${pc}`)).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    }

    await page.getByRole("button", { name: "Clear" }).click();
    for (let pc = 0; pc < 12; pc++) {
      await expect(page.getByTestId(`miss-filter-pc-${pc}`)).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    }
  });
});
