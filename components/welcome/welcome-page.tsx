"use client";

import { Navbar } from "@/components/navbar";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import { useHeroChladniSettings } from "@/hooks/useHeroChladniSettings";
import { useHeroQuasiperiodicSettings } from "@/hooks/useHeroQuasiperiodicSettings";
import { useHeroMultigridSettings } from "@/hooks/useHeroMultigridSettings";
import { WelcomeConfigProvider } from "./welcome-config-provider";
import { WelcomeContent } from "./welcome-content";
import { HeroSection } from "./hero-section";

/**
 * Welcome / marketing page.
 *
 * Full-bleed atmosphere is owned by AmbientEffectsHost in the root layout.
 * This page supplies content + the hero scrim pocket, wrapped in the welcome
 * config provider so copy and style tokens can be edited from the dev lab.
 */
export function WelcomePage() {
  const { settings: ambient, backgroundFor } = useAmbientEffects();
  const { settings: chladniSettings } = useHeroChladniSettings();
  const { settings: quasiperiodicSettings } = useHeroQuasiperiodicSettings();
  const { settings: multigridSettings } = useHeroMultigridSettings();

  const kind = backgroundFor("/");
  const heroScrimSettings =
    kind === "multigrid"
      ? multigridSettings
      : kind === "quasiperiodic"
        ? quasiperiodicSettings
        : kind === "chladni"
          ? chladniSettings
          : { scrimDarkness: ambient.scrimDarkness };

  return (
    <WelcomeConfigProvider>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <HeroSection settings={heroScrimSettings} />
          <WelcomeContent />
        </main>
      </div>
    </WelcomeConfigProvider>
  );
}
