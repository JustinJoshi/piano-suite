import { Page, expect } from "@playwright/test";

const LINK_NAME_TO_TEST_ID: Record<string, string> = {
  Welcome: "sidebar-link-welcome",
  "Chord Drill": "sidebar-link-chord-drill",
  Arpeggios: "sidebar-link-arpeggios",
  "Root Cycling": "sidebar-link-root-cycling",
  Progression: "sidebar-link-progression",
  Technique: "sidebar-link-technique",
  Tracking: "sidebar-link-tracking",
  "Chladni Lab": "sidebar-link-chladni-lab",
  "Chladni Ripple": "sidebar-link-chladni-ripple",
  "Julia Lab": "sidebar-link-julia-lab",
  "Lissajous Lab": "sidebar-link-lissajous-lab",
  "Quasiperiodic Lab": "sidebar-link-quasiperiodic-lab",
  "Multigrid Lab": "sidebar-link-multigrid-lab",
  "Logo Lab": "sidebar-link-logo-lab",
  Theme: "sidebar-link-theme",
  Atmosphere: "sidebar-link-atmosphere",
  Audio: "sidebar-link-audio",
  Billing: "sidebar-link-billing",
};

/**
 * Page object for the dashboard sidebar.
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
    const testId = LINK_NAME_TO_TEST_ID[name];
    await this.page.getByTestId(testId).click();
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
