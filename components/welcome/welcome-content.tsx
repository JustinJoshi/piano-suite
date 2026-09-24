"use client";

import { FeatureSection } from "./feature-section";
import { FlowSection } from "./flow-section";
import { DeckSection } from "./deck-section";
import { CtaSection } from "./cta-section";
import { WorkshopHowItWorks } from "./workshop-how-it-works";
import { StarterTemplatesSection } from "./starter-templates-section";
import { DemoVideoSection } from "./demo-video-section";
import { SiteFooter } from "@/components/site-footer";
import { DeckCardIllustration } from "./deck-card-illustration";
import { MovementMark } from "./movement-mark";

/**
 * Pure marketing content for the welcome page.
 *
 * Rendered by `WelcomePage` (production) and by the dev lab preview.
 * It intentionally does not include the Navbar, ambient host, or hero scrim
 * so the lab can frame it however it wants.
 *
 * Sections alternate treatment on purpose — staff texture, an inverse band,
 * open space — so scrolling has a sense of arrival instead of one long
 * column of identical cards.
 */
export function WelcomeContent() {
  return (
    <>
      <WorkshopHowItWorks />
      <StarterTemplatesSection />
      <FeatureSection id="build-your-practice" />
      <FeatureSection id="start-from-something-that-works">
        <FlowSection />
      </FeatureSection>
      <FeatureSection id="why-these-drills-work" tone="inverse" />
      <FeatureSection id="who-made-this" />

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-surface sm:p-10 lg:grid-cols-[1fr_minmax(0,19rem)] lg:items-center lg:gap-14">
            <div>
              <MovementMark number="05" label="anki companion decks" />
              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Ready-to-import Anki decks for chord drilling.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Two tab-separated Anki exports: root-position 7ths and diminished
                7ths across five keys (C-G-D-A-E), and the extended 9/11/13
                voicings with LH/RH fingering. Import via Anki’s File → Import
                (Basic notetype) and they work with the Workshop’s chord blocks
                out of the box — no add-on needed beyond AnkiConnect.
              </p>
              <DeckSection />
            </div>
            <DeckCardIllustration className="hidden py-4 lg:block" />
          </div>
        </div>
      </section>

      <DemoVideoSection />

      <CtaSection />

      <SiteFooter />
    </>
  );
}
