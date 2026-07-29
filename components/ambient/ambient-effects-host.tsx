"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";

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
 * Welcome (`/`) keeps its own hero scrim, so the host scrim is hidden there.
 */
export function AmbientEffectsHost() {
  const pathname = usePathname() ?? "/";
  const {
    settings,
    backgroundFor,
    floatVisibleFor,
    setFloatEnabled,
    setFloatRect,
  } = useAmbientEffects();

  const backgroundKind = backgroundFor(pathname);
  const showFloat = floatVisibleFor(pathname);
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
