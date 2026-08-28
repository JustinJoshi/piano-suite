"use client";

import { FeatureSection } from "./feature-section";
import { DeckSection } from "./deck-section";
import { CtaSection } from "./cta-section";
import { ToolsGridSection } from "./tools-grid-section";
import { WorkshopHowItWorks } from "./workshop-how-it-works";
import { StarterTemplatesSection } from "./starter-templates-section";

/**
 * Pure marketing content for the welcome page.
 *
 * Rendered by `WelcomePage` (production) and by the dev lab preview.
 * It intentionally does not include the Navbar, ambient host, or hero scrim
 * so the lab can frame it however it wants.
 */
export function WelcomeContent() {
  return (
    <>
      <WorkshopHowItWorks />
      <StarterTemplatesSection />
      <FeatureSection id="why-it-works" />
      <FeatureSection id="the-actual-point" />
      <FeatureSection id="not-new" />
      <FeatureSection id="companion-deck">
        <DeckSection />
      </FeatureSection>
      <FeatureSection id="who-made-this" />

      <ToolsGridSection />

      <CtaSection />

      <footer className="border-t border-border/50 bg-card/80 py-8 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          Piano Suite — a free practice community for self-taught pianists.
        </div>
      </footer>
    </>
  );
}
