"use client";

import { RollFrame } from "@/components/roll/roll-frame";
import { RollMain, RollPageHead } from "@/components/roll/page-head";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { DoorChooser } from "@/components/welcome/door-chooser";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

function StartContent() {
  const { config } = useWelcomeConfig();
  return (
    <>
      <RollPageHead label="Start here" note="Two ways in, and a third for reading." eyebrow={config.doors.eyebrow} title={config.doors.title} />
      <RollMain className="roll-page-end">
        <DoorChooser />
      </RollMain>
    </>
  );
}

/**
 * The doors. The hero's ticket lands here; each door leads somewhere
 * immediately useful.
 */
export default function StartPage() {
  return (
    <WelcomeConfigProvider>
      <RollFrame compactFooter>
        <StartContent />
      </RollFrame>
    </WelcomeConfigProvider>
  );
}
