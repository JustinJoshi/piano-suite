import { test, expect } from "@playwright/test";

test.describe("home page mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test("renders the hero ticket and the no-MIDI promise without overflow", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator("main").getByRole("link", { name: /start playing/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeInViewport();
    await expect(page.getByText(/no midi keyboard needed/i).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("the hero drill hears a C major chord from the computer keys", async ({ page }) => {
    await page.goto("/");
    // The ledger only fills in after hydration, so the keys are live once it has.
    await expect(page.getByText(/nothing here yet/i)).toBeAttached();
    const piano = page.getByRole("group", { name: /on-screen piano/i });
    await piano.getByRole("button", { name: "C 4", exact: true }).focus();
    // Home row: A is C, D is E, G is G. Held together, like a chord.
    for (const key of ["a", "d", "g"]) await page.keyboard.down(key);
    for (const key of ["a", "d", "g"]) await page.keyboard.up(key);
    await expect(page.getByRole("status").filter({ hasText: /C major in/ })).toHaveCount(1);
  });

  test("deck download links stay on screen", async ({ page }) => {
    await page.goto("/");
    const links = page.getByRole("link", { name: /chord symbols/i });
    await expect(links).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    }
  });

  test("the four drills link to their pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Chord Drill", exact: true })).toHaveAttribute("href", "/tools/chord-drill");
    await expect(page.getByRole("link", { name: "Root Cycling", exact: true })).toHaveAttribute("href", "/tools/root-cycling");
  });
});
