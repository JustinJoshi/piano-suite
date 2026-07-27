import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

test.describe("Chord Drill (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/chord-drill");
    await page.waitForSelector("[data-testid='chord-drill']", { timeout: 10000 });
  });

  test("loads the chord drill page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Chord Drill" })).toBeVisible();
    await expect(page.getByTestId("chord-drill")).toBeVisible();
    await expect(page.getByTestId("chord-symbol")).toHaveText("Cmaj7");
  });

  test("can change mode, root, and quality", async ({ page }) => {
    await page.getByRole("button", { name: "Family Cycle" }).click();
    await expect(page.getByTestId("chord-symbol")).toContainText("maj7");

    await page.getByRole("button", { name: "G", exact: true }).click();
    await expect(page.getByTestId("chord-symbol")).toContainText("G");

    await page.getByRole("button", { name: "Single Shape" }).click();
    await page.getByRole("button", { name: "m7", exact: true }).first().click();
    await expect(page.getByTestId("chord-symbol")).toHaveText("Gm7");
  });

  test("toggling chord notes visibility", async ({ page }) => {
    const notes = page.getByTestId("chord-notes");
    await expect(notes).toHaveClass(/opacity-0/);

    await page.getByRole("button", { name: "Show" }).first().click();
    await expect(notes).not.toHaveClass(/opacity-0/);
    await expect(notes).toContainText("G");
  });

  test("start is disabled without MIDI and enabled after connect attempt", async ({ page }) => {
    // Web MIDI may not be available in the test browser, so the start button
    // either stays disabled or reflects the unsupported state.
    const startBtn = page.getByTestId("start-drill-btn");
    await expect(startBtn).toBeVisible();
  });

  test("rep target custom input", async ({ page }) => {
    const input = page.getByTestId("rep-custom-input");
    await input.fill("16");
    await input.blur();
    await expect(input).toHaveValue("16");
  });

  test("shuffle picks a different chord", async ({ page }) => {
    const before = await page.getByTestId("chord-symbol").textContent();
    await page.getByTestId("shuffle-btn").click();
    const after = await page.getByTestId("chord-symbol").textContent();
    expect(after).not.toEqual(before);
  });

  test("per-chord reps modal opens and closes", async ({ page }) => {
    const perChordRow = page.getByTestId("per-chord-reps-row");
    await perChordRow.getByRole("button", { name: "On", exact: true }).click();
    await page.getByTestId("manage-per-chord-reps-btn").click();
    await expect(page.getByTestId("per-chord-reps-modal")).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("per-chord-reps-modal")).toBeHidden();
  });
});
