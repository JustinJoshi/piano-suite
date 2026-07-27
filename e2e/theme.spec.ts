import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

test.describe("/settings/theme", () => {
  test("lets an authenticated user switch themes", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/settings/theme");

    await expect(page.getByRole("heading", { name: "Theme" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Amber", exact: false })
    ).toBeVisible();

    // Select a non-default theme.
    await page.getByTestId("theme-card-rose").click();

    // The <html> element should gain the theme class.
    await expect(page.locator("html")).toHaveClass(/rose/);

    // Switch back to the default.
    await page.getByTestId("theme-card-amber").click();
    await expect(page.locator("html")).toHaveClass(/amber/);
  });

  test("sidebar links to the theme settings page", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools");

    await page.locator("aside nav").getByRole("link", { name: "Theme" }).click();
    await expect(page).toHaveURL("/settings/theme");
    await expect(page.getByRole("heading", { name: "Theme" })).toBeVisible();
  });
});
