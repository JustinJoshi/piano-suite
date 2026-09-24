"use client";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { DoorChooser } from "@/components/welcome/door-chooser";

/**
 * The three-door chooser (Phase 1.3). The hero CTA lands here; each door
 * leads somewhere immediately useful — no account, no scroll, no reading.
 */
export default function StartPage() {
  return (
    <WelcomeConfigProvider>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="relative flex flex-1 items-center justify-center outline-none"
        >
          <div
            aria-hidden
            className="staff-lines staff-lines-faded pointer-events-none absolute inset-0"
          />
          <div className="relative w-full">
            <DoorChooser />
          </div>
        </main>
        <SiteFooter compact />
      </div>
    </WelcomeConfigProvider>
  );
}
