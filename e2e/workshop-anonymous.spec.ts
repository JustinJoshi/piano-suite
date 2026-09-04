import { test, expect } from "@playwright/test";
import { expectNoApplicationError, expectNotBare404 } from "./auth-assertions";

// Signed-out visitor: the Workshop is the product's core and free,
// no-account use is the default (audit 2026-09, entry-flow §2).
test.describe("workshop anonymous (signed out)", () => {
  test.use({
    storageState: { cookies: [] as never[], origins: [] as never[] },
  });

  test("signed-out visitor opens the workshop, adds a block, keeps it across reload", async ({
    page,
  }) => {
    // The workshop loads signed out — the URL stays put and a positive
    // Workshop element is visible. Asserting only "no sign-in text" would
    // also pass on a redirect to /sign-in, so assert both.
    await page.goto("/tools/workshop");
    await expect(page).toHaveURL(/\/tools\/workshop$/);

    // A fresh browser also triggers the first-visit onboarding overlay;
    // it releases the dashboard with one click (never blocks).
    await page.getByRole("button", { name: /skip/i }).click();

    await expect(
      page.getByRole("link", { name: /open the block library/i })
    ).toBeVisible();
    await expect(page.getByTestId("workshop-signin-hint")).toBeVisible();

    // A fresh signed-out browser greets with the starter picker; dismiss
    // it into the grid before expecting workshop content.
    await expect(page.getByText("How do you want to start?")).toBeVisible();
    await page.getByRole("button", { name: /start from scratch/i }).click();
    await expect(page.getByTestId("workshop-grid")).toBeVisible();

    // The block library shows block cards signed out. The dev server
    // compiles routes on demand and the suite runs parallel workers, so
    // soft navigation after a click needs more than the default 5s.
    await page
      .getByRole("link", { name: /open the block library/i })
      .click();
    await expect(page).toHaveURL(/\/tools\/workshop\/blocks$/, {
      timeout: 15_000,
    });
    await expect(page.getByTestId("marketplace-card-metronome")).toBeVisible();

    // Add through the real UI; the card flips to its added state.
    await page.getByRole("button", { name: /add metronome/i }).click();
    await expect(
      page.getByRole("button", { name: /metronome added/i })
    ).toBeVisible({ timeout: 10_000 });

    // Back in the workshop the block is live, and it survives a reload.
    // Assert the specific block and value — a re-seeded default page
    // would show *a* tile but not this one.
    await page.getByRole("link", { name: /back to workshop/i }).click();
    await expect(page).toHaveURL(/\/tools\/workshop$/, { timeout: 15_000 });
    await expect(page.getByTestId("bpm-display")).toHaveText("120 BPM", {
      timeout: 10_000,
    });

    await page.reload();
    await expect(page.getByTestId("bpm-display")).toHaveText("120 BPM", {
      timeout: 10_000,
    });
  });

  test("signed-out /start stays public", async ({ page }) => {
    await page.goto("/start");
    await expect(page).toHaveURL("/start");
    await expectNotBare404(page);
    await expectNoApplicationError(page);
    await expect(page.getByTestId("door-play")).toBeVisible();
    await expect(page.getByTestId("door-build")).toBeVisible();
  });
});
