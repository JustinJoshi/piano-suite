import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

test.describe("Root Cycling (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/root-cycling");
    await page.waitForSelector("[data-testid='root-cycling-drill']", {
      timeout: 10000,
    });
  });

  test("loads the root cycling page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Root Cycling" })).toBeVisible();
    await expect(page.getByTestId("root-cycling-drill")).toBeVisible();
    await expect(page.getByTestId("rc-mode-chord")).toHaveClass(/bg-primary/);
    await expect(page.getByTestId("rc-quality-m7")).toHaveClass(/bg-primary/);
  });

  test("switches practice mode", async ({ page }) => {
    await page.getByTestId("rc-mode-arpeggio").click();
    await expect(page.getByTestId("rc-mode-arpeggio")).toHaveClass(/bg-primary/);
    await expect(page.getByTestId("rc-cell-strip")).toBeVisible();

    await page.getByTestId("rc-mode-chord").click();
    await expect(page.getByTestId("rc-mode-chord")).toHaveClass(/bg-primary/);
  });

  test("switches quality in chord mode", async ({ page }) => {
    await page.getByTestId("rc-quality-7").click();
    await expect(page.getByTestId("rc-quality-7")).toHaveClass(/bg-primary/);
    await expect(page.getByTestId("rc-quality-m7")).not.toHaveClass(/bg-primary/);
  });

  test("customizes the root pool", async ({ page }) => {
    await page.getByTestId("rc-customize-btn").click();

    // Deselect several roots.
    await page.getByTestId("rc-root-Db").click();
    await page.getByTestId("rc-root-Eb").click();
    await page.getByTestId("rc-root-Ab").click();

    await expect(page.getByTestId("rc-root-Db")).not.toHaveClass(/bg-primary/);
    await expect(page.getByTestId("rc-root-C")).toHaveClass(/bg-primary/);

    // Close customization.
    await page.getByTestId("rc-customize-btn").click();

    // The remaining roots are still reflected in the settings summary.
    await expect(page.getByText("9 of 12 selected")).toBeVisible();
  });

  test("disables start when no roots are selected", async ({ page }) => {
    await page.getByTestId("rc-customize-btn").click();

    for (const root of [
      "C",
      "Db",
      "D",
      "Eb",
      "E",
      "F",
      "F#",
      "G",
      "Ab",
      "A",
      "Bb",
      "B",
    ]) {
      const btn = page.getByTestId(`rc-root-${root}`);
      if (await btn.evaluate((el) => el.classList.contains("bg-primary"))) {
        await btn.click();
      }
    }

    await expect(page.getByTestId("rc-start-btn")).toBeDisabled();
  });
});
