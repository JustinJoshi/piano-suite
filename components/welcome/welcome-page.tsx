"use client";

import { DevToolsLink } from "@/components/dev-tools-link";
import { RollFrame } from "@/components/roll/roll-frame";
import { WelcomeConfigProvider } from "./welcome-config-provider";
import { WelcomeContent } from "./welcome-content";

/**
 * The welcome page: roll paper hanging from the tracker bar by its leader,
 * with the Sound toggle on so the roll can play as it scrolls.
 */
export function WelcomePage() {
  return (
    <WelcomeConfigProvider>
      <RollFrame leader sound>
        <WelcomeContent />
      </RollFrame>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50">
        <DevToolsLink className="pointer-events-auto" />
      </div>
    </WelcomeConfigProvider>
  );
}
