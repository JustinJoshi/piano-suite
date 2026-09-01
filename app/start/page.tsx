"use client";

import { Navbar } from "@/components/navbar";
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
        <main className="flex flex-1 items-center justify-center">
          <div className="w-full">
            <DoorChooser />
          </div>
        </main>
      </div>
    </WelcomeConfigProvider>
  );
}
