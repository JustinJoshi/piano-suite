import { Page, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export type ThemeId = "amber" | "rose" | "emerald" | "ocean" | "violet" | "slate";

/**
 * Page object for settings pages (theme and atmosphere).
 */
export class SettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoTheme() {
    await super.goto("/settings/theme");
    await this.expectHeading("Theme");
  }

  async gotoAtmosphere() {
    await super.goto("/settings/atmosphere");
    await this.expectHeading("Atmosphere");
  }

  async selectTheme(theme: ThemeId) {
    await this.page.getByTestId(`theme-card-${theme}`).click();
  }

  async expectThemeActive(theme: ThemeId) {
    await expect(this.page.getByTestId(`theme-card-${theme}`)).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  }

  async toggleExperimentalFeatures(enabled: boolean) {
    const checkbox = this.page.getByTestId("enable-experimental-features");
    if ((await checkbox.isChecked()) !== enabled) {
      await checkbox.click();
    }
  }

  async setDefaultBackground(kind: string) {
    await this.page.getByTestId("ambient-default-kind").selectOption(kind);
  }

  async setRouteBackground(routeHref: string, kind: string | "inherit") {
    await this.page
      .getByTestId(`ambient-route-${routeHref}`)
      .selectOption(kind);
  }

  async toggleApplyEverywhere(on: boolean) {
    const checkbox = this.page.getByTestId("ambient-apply-everywhere");
    if ((await checkbox.isChecked()) !== on) {
      await checkbox.click();
    }
  }
}
