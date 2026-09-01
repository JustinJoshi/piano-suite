import { test, expect } from "@playwright/test";

test.describe("home page mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test("renders hero CTA without overflow", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Start free" });
    await expect(cta).toBeVisible();
    await expect(cta).toBeInViewport();
  });

  test("shows Workshop how-it-works steps on mobile", async ({ page }) => {
    await page.goto("/");
    const steps = [
      "Pick a starter drill or begin with a blank page",
      "Press start and play, timed on real keys",
      "Tweak the blocks or build your own routine",
    ];
    for (const text of steps) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
  });

  test("three doors stack without horizontal overflow on mobile", async ({
    page,
  }) => {
    await page.goto("/");
    for (const id of ["door-play", "door-build", "door-learn"]) {
      const door = page.getByTestId(id);
      await expect(door).toBeVisible();
      // Doors are below the hero fold on phones; they must not overflow.
      const box = await door.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    }
  });

  test("feature cards are readable on mobile", async ({ page }) => {
    await page.goto("/");
    const firstFeature = page.getByText(
      "Re-reading a chord chart feels like practice. It isn't."
    );
    await expect(firstFeature).toBeVisible();
  });
});
