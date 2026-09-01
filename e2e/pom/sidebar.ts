import { Page, expect } from "@playwright/test";

const LINK_NAME_TO_TEST_ID: Record<string, string> = {
  Workshop: "sidebar-link-workshop",
  "Guided routes": "sidebar-link-routes",
  "Chord Drill": "sidebar-link-chord-drill",
  Arpeggios: "sidebar-link-arpeggios",
  "Root Cycling": "sidebar-link-root-cycling",
  Progression: "sidebar-link-progression",
  Shelf: "sidebar-link-shelf",
  Technique: "sidebar-link-technique",
  Tracking: "sidebar-link-tracking",
  Settings: "sidebar-link-settings",
};

/**
 * Page object for the dashboard sidebar (Phase 1.5: four sections —
 * Workshop, Shelf, Progress, Settings; drills nest under the Workshop).
 */
export class Sidebar {
  constructor(public readonly page: Page) {}

  private async openMobileIfNeeded() {
    const menu = this.page.getByTestId("dashboard-menu-button");
    if (await menu.isVisible().catch(() => false)) {
      await menu.click();
      await expect(this.page.getByTestId("dashboard-sidebar")).toBeVisible();
    }
  }

  async navigateTo(name: keyof typeof LINK_NAME_TO_TEST_ID) {
    await this.openMobileIfNeeded();
    await this.page.getByTestId(LINK_NAME_TO_TEST_ID[name]).click();
  }

  async expectLinkActive(name: keyof typeof LINK_NAME_TO_TEST_ID) {
    const testId = LINK_NAME_TO_TEST_ID[name];
    const link = this.page.getByTestId(testId);
    await expect(link).toHaveClass(/bg-primary\/10/);
  }

  async closeMobile() {
    const backdrop = this.page.getByTestId("dashboard-sidebar-backdrop");
    if (await backdrop.isVisible().catch(() => false)) {
      await backdrop.click();
    }
  }
}
