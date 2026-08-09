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

  test("miss filter can be toggled and preset to the root chord", async ({ page }) => {
    await expect(page.getByText("Miss filter")).toBeVisible();

    const cButton = page.getByTestId("miss-filter-pc-0");
    await expect(cButton).toHaveAttribute("aria-pressed", "false");
    await cButton.click();
    await expect(cButton).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Use root chord" }).click();

    const rootPcs = [10, 5, 8]; // Bb, F, Ab for Bbm11
    for (const pc of rootPcs) {
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
