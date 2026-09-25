"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { isRollRoute } from "@/lib/roll-routes";

const AmbientBackground = dynamic(
  () =>
    import("@/components/ambient/ambient-background").then(
      (m) => m.AmbientBackground
    ),
  { ssr: false }
);

const AmbientFloatPanel = dynamic(
  () =>
    import("@/components/ambient/ambient-float-panel").then(
      (m) => m.AmbientFloatPanel
    ),
  { ssr: false }
);

/**
 * Root-layout host: one full-bleed ambient background + optional float panel.
 * Float / pop-out is Pro-only (`canUseFloatPanel`). Public pages wear the
 * roll (`lib/roll-routes.ts`), so the background is off behind them.
 */
export function AmbientEffectsHost() {
  const pathname = usePathname() ?? "/";
  const { canUseFloatPanel } = useAuthAccess();
  const {
    settings,
    backgroundFor,
    floatVisibleFor,
    setFloatEnabled,
    setFloatRect,
  } = useAmbientEffects();

  // Roll pages are opaque paper on a dark case; nothing would show through.
  const backgroundKind = isRollRoute(pathname) ? "none" : backgroundFor(pathname);
  const showFloat = canUseFloatPanel && floatVisibleFor(pathname);
  const hideScrim = pathname === "/";

  return (
    <>
      <AmbientBackground
        kind={backgroundKind}
        scrimDarkness={settings.scrimDarkness}
        hideScrim={hideScrim}
      />
      {showFloat && (
        <AmbientFloatPanel
          key={settings.float.kind}
          kind={settings.float.kind}
          rect={settings.float.rect}
          onRectChange={setFloatRect}
          onClose={() => setFloatEnabled(false)}
        />
      )}
    </>
  );
}
