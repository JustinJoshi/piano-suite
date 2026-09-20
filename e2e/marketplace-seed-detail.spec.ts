import { test, expect } from "@playwright/test";
import { expectNoApplicationError } from "./auth-assertions";

// First entry of marketplaceSeeds in lib/marketplace-seeds.ts.
const SEED_ID = "first-chords";
const SEED_TITLE = "Play your first Cmaj7";

test.describe("/marketplace seed detail", () => {
  test("renders a featured seed page signed out", async ({ page }) => {
    await page.goto(`/marketplace/${SEED_ID}`);

    await expectNoApplicationError(page);
    await expect(
      page.getByRole("heading", { name: SEED_TITLE })
    ).toBeVisible();
    await expect(page.getByText("featured page")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /fork to my workshop/i })
    ).toBeVisible();
  });

  test("links back to the marketplace", async ({ page }) => {
    await page.goto(`/marketplace/${SEED_ID}`);
    await expect(
      page.getByRole("heading", { name: SEED_TITLE })
    ).toBeVisible();

    await page.getByRole("main").getByRole("link", { name: "Marketplace" }).click();
    // Dev server compiles routes on demand, so the soft navigation needs
    // more than the default 5s window.
    await expect(page).toHaveURL(/\/marketplace$/, { timeout: 15_000 });
  });
});
