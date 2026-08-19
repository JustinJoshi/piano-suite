import { Page, Locator, expect } from "@playwright/test";

/**
 * Shared helpers for all page objects.
 */
export class BasePage {
  constructor(public readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async expectUrl(pathOrPattern: string | RegExp) {
    await expect(this.page).toHaveURL(pathOrPattern);
  }

  async waitForLoaded(testId: string, options?: { timeout?: number }) {
    await expect(this.page.getByTestId(testId)).toBeVisible({
      timeout: options?.timeout ?? 10000,
    });
  }

  locator(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  async clickByRole(role: "button" | "link" | "tab", name: string | RegExp) {
    await this.page.getByRole(role, { name }).click();
  }

  async expectHeading(name: string | RegExp) {
    await expect(this.page.getByRole("heading", { name })).toBeVisible();
  }
}
