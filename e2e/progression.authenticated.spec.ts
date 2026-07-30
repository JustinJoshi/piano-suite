import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

test.describe("Progression (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/progression");
    await page.waitForSelector("[data-testid='progression-drill']", {
      timeout: 10000,
    });
    // Parallel workers share one Clerk test user; reset to known defaults so
    // persisted Convex/local settings from sibling tests cannot flake asserts.
    await page.getByTestId("progression-type-ii-V-I").click();
    await page.getByTestId("progression-key-C").click();
    await expect(page.getByTestId("progression-current-chord")).toHaveText(
      "Dm7"
    );
  });

  test("loads the progression page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Progression" })).toBeVisible();
    await expect(page.getByTestId("progression-drill")).toBeVisible();
    await expect(page.getByTestId("progression-current-chord")).toHaveText("Dm7");
    await expect(page.getByTestId("progression-scale-line")).toContainText("Dorian");
  });

  test("switches progression type", async ({ page }) => {
    await page.getByTestId("progression-type-blues12").click();
    await expect(page.getByTestId("progression-current-chord")).toHaveText("C7");

    const steps = page.getByTestId("progression-step-strip").locator("div");
    await expect(steps).toHaveCount(12);
  });

  test("switches key", async ({ page }) => {
    await page.getByTestId("progression-type-ii-V-I").click();
    await page.getByTestId("progression-key-G").click();
    await expect(page.getByTestId("progression-current-chord")).toHaveText("Am7");
    await expect(page.getByTestId("progression-scale-line")).toContainText("Dorian");
  });

  test("renders the step strip for ii-V-I", async ({ page }) => {
    await page.getByTestId("progression-type-ii-V-I").click();
    await page.getByTestId("progression-key-C").click();
    const steps = page.getByTestId("progression-step-strip").locator("div");
    await expect(steps).toHaveCount(3);
    await expect(steps.first()).toHaveText("Dm7");
    await expect(steps.nth(1)).toHaveText("G7");
    await expect(steps.nth(2)).toHaveText("Cmaj7");
  });

  test("toggles settings", async ({ page }) => {
    const ankiRow = page.getByText("Anki Sync", { exact: true }).locator("xpath=../..");
    await ankiRow.getByRole("button", { name: "Flip on loop" }).click();

    const stepChimeRow = page.getByText("Step chime", { exact: true }).locator("xpath=../..");
    await stepChimeRow.getByRole("button", { name: "Off" }).click();

    // Reload and verify persistence would require a real Convex backend;
    // for now we just verify the toggles are clickable and change state.
    await expect(stepChimeRow.getByRole("button", { name: "On" })).toBeVisible();
  });
});
