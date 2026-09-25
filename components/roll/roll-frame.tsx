"use client";

import { useRef, type ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { RollSoundProvider } from "@/hooks/useRollSound";
import { useRollReveal } from "@/hooks/useRollReveal";
import { cn } from "@/lib/utils";

/** The cut end of the roll, hooked onto the tracker bar by its tab. */
export function RollLeader() {
  return (
    <div className="roll-sheet roll-leader" aria-hidden="true">
      <div className="roll-leader-paper">
        <span className="roll-leader-ring" />
      </div>
    </div>
  );
}

/**
 * Every public page: the dark case, the tracker bar, one sheet of roll
 * paper, and the key slip. The landing page opens on the leader and turns on
 * the Sound toggle; other pages start on a plain edge.
 */
export function RollFrame({
  children,
  leader = false,
  sound = false,
  compactFooter = false,
  className,
}: {
  children: ReactNode;
  leader?: boolean;
  sound?: boolean;
  compactFooter?: boolean;
  className?: string;
}) {
  const mainRef = useRef<HTMLElement>(null);
  useRollReveal(mainRef);
  return (
    <RollSoundProvider>
      <div className="tone-roll roll-case relative z-10 flex min-h-screen flex-col">
        <Navbar sound={sound} />
        {leader ? <RollLeader /> : null}
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className={cn("roll-sheet roll-paper flex-1 outline-none", !leader && "roll-sheet-top", className)}
        >
          {children}
        </main>
        <SiteFooter compact={compactFooter} />
      </div>
    </RollSoundProvider>
  );
}
