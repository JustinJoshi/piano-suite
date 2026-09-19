import { test, expect } from "@playwright/test";

// Phase 2 of the open-door run: a genuinely unseeded browser reaches the
// Chord Drill (Play door) and the Workshop (Build door) with no full-screen
// onboarding overlay in the way — phase 1 replaced it with an in-flow strip.
// The chromium project reuses the persisted auth storage state, so these
// tests override it with a fresh context; no onboarding key is pre-seeded.
test.describe("first visit (fresh, unseeded browser)", () => {
  test.use({
    storageState: { cookies: [] as never[], origins: [] as never[] },
  });

  test("play door reaches the chord drill with no overlay", async ({
    page,
  }) => {
    await page.goto("/start");
    await page.getByTestId("door-play").click();

    await expect(page).toHaveURL(/\/tools\/chord-drill$/);
    await expect(page.getByRole("heading", { name: "Chord Drill" })).toBeVisible();
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
  });

  test("build door reaches the workshop with the strip, not the overlay", async ({
    page,
  }) => {
    await page.goto("/start");
    await page.getByTestId("door-build").click();

    await expect(page).toHaveURL(/\/tools\/workshop$/);
    await expect(page.getByTestId("onboarding-strip")).toBeVisible();
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
  });
});
