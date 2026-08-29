import { test, expect } from "@playwright/test";

test.describe("home page mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test("renders hero CTA and supporting text without overflow", async ({
    page,
  }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /enter the workshop/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeInViewport();

    const supporting = page.getByText(/explore the community gallery freely/i);
    await expect(supporting).toBeVisible();
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

  test("shows Workshop flow steps in a vertical layout on mobile", async ({
    page,
  }) => {
    await page.goto("/");
    const steps = [
      "Choose a starter template or start from scratch",
      "Snap metronome, timer, and chord blocks together",
      "Press Start and practice on real keys",
      "Publish to the community or fork someone else's drill",
    ];
    for (const text of steps) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
  });

  test("deck download buttons stack without overflowing", async ({ page }) => {
    await page.goto("/");
    const buttons = page.getByRole("link", { name: /chord symbols/i });
    const count = await buttons.count();
    expect(count).toBe(2);
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeVisible();
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
