import { Page, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export type TrackingTab = "chords" | "arpeggios" | "rootcycle";

/**
 * Page object for the Tracking dashboard.
 */
export class TrackingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto("/tools/tracking");
    await this.expectHeading("Tracking");
  }

  async clickTab(tab: TrackingTab) {
    await this.locator(`tracking-tab-${tab}`).click();
  }

  async expectTabActive(tab: TrackingTab) {
    await expect(this.locator(`tracking-tab-${tab}`)).toHaveClass(/bg-primary\/10/);
  }

  async expectPanelVisible() {
    await expect(this.locator("tracking-panel")).toBeVisible();
  }

  async expectChartVisible() {
    await expect(this.locator("tracking-chart")).toBeVisible();
  }

  async expectLocalPracticeBanner() {
    await expect(this.page.locator("body")).toContainText("Local practice mode");
  }

  async seedLocalChordDrillHistory(data: unknown) {
    await this.page.evaluate((value) => {
      localStorage.setItem("blocked-drill-first-chord-log", JSON.stringify(value));
    }, data);
  }

  async seedLocalArpeggioHistory(data: unknown) {
    await this.page.evaluate((value) => {
      localStorage.setItem("blocked-drill-arpeggio-log", JSON.stringify(value));
    }, data);
  }

  async clearLocalHistory() {
    await this.page.evaluate(() => {
      localStorage.removeItem("blocked-drill-first-chord-log");
      localStorage.removeItem("blocked-drill-arpeggio-log");
    });
  }
}
