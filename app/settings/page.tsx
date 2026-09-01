"use client";

import { ThemeSettingsSection } from "@/components/settings/theme-settings";
import { AtmosphereSettingsSection } from "@/components/settings/atmosphere-settings";
import { AudioSettingsSection } from "@/components/settings/audio-settings";
import { BillingSettingsSection } from "@/components/settings/billing-settings";

/**
 * One settings page with sections (Phase 1.5): theme, atmosphere, audio,
 * billing — previously four sidebar rows and four URLs. The old paths
 * redirect here.
 */
export default function SettingsPage() {
  return (
    <div className="divide-y divide-border/50">
      <section id="theme" className="scroll-mt-16">
        <ThemeSettingsSection />
      </section>
      <section id="atmosphere" className="scroll-mt-16">
        <AtmosphereSettingsSection />
      </section>
      <section id="audio" className="scroll-mt-16">
        <AudioSettingsSection />
      </section>
      <section id="billing" className="scroll-mt-16">
        <BillingSettingsSection />
      </section>
    </div>
  );
}
