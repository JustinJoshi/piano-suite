import { test, expect } from "@playwright/test";

/**
 * Guided routes are public (activation starts before sign-up); progress is
 * device-local, so these tests run in an unauthenticated context.
 */
test.describe("/routes", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("route picker is reachable without signing in", async ({ page }) => {
    await page.goto("/routes");

    await expect(page.getByTestId("route-card-music-theory")).toBeVisible();
    await expect(page.getByTestId("route-card-finger-flexibility")).toBeVisible();
  });

  test("music-theory guide lists steps and persists a done toggle", async ({
    page,
  }) => {
    await page.goto("/routes/music-theory");

    const steps = page.getByTestId("route-step");
    await expect(steps).toHaveCount(6);
    await expect(page.getByTestId("route-progress")).toContainText(
      "0 of 6 steps"
    );

    await page
      .getByRole("button", { name: /mark "why theory first" done/i })
      .click();
    await expect(steps.first()).toHaveAttribute("data-done", "true");

    await page.reload();
    await expect(steps.first()).toHaveAttribute("data-done", "true");
    await expect(page.getByTestId("route-progress")).toContainText(
      "1 of 6 steps"
    );
  });

  test("the assistant button copies a prompt containing the decks", async ({
    page,
  }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/routes/music-theory");

    await page.getByTestId("copy-anki-prompt").click();

    const clipboard = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboard).toContain("2055492159");
    expect(clipboard).toContain("chord-symbols-CGDAEno11.txt");
  });
});
