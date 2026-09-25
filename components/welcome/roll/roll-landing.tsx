"use client";

import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { RollInterlude, RollPlaybackProvider } from "@/components/roll/roll-passage";
import { RollHero } from "./hero";
import { RollDrills } from "./drills";
import { RollRoutes } from "./routes";
import { RollOrigin } from "./origin";
import { RollCatalogue } from "./catalogue";
import { RollComposer } from "./composer";
import { RollPiece, RollShelf, RollReading, RollCost } from "./sections";
import { RollLedger } from "./ledger";
import { RollFine } from "./fine";

/**
 * The landing page as a player-piano roll, top to bottom. Between sections
 * run real perforated passages that play as they pass the tracker bar.
 *
 * Order follows who is reading: the brand-new beginner (hero drill, the
 * drills, routes), then where it came from, then the plateaued self-learner
 * (ready-made pages), then the tinkerer (the Workshop), then the shelf,
 * reading, progress, and what it costs.
 */
export function RollLandingSections() {
  const { config } = useWelcomeConfig();
  const captions = config.roll.interludes;
  return (
    <RollPlaybackProvider>
      <RollHero />
      <RollDrills />
      <RollInterlude id="scale" caption={captions.scale} />
      <RollRoutes />
      <hr className="roll-crease" aria-hidden="true" />
      <RollOrigin />
      <RollInterlude id="circle" caption={captions.circle} />
      <RollCatalogue />
      <RollComposer />
      <RollPiece />
      <hr className="roll-crease" aria-hidden="true" />
      <RollShelf />
      <RollInterlude id="penta" caption={captions.penta} />
      <RollReading />
      <RollLedger />
      <hr className="roll-crease" aria-hidden="true" />
      <RollCost />
      <RollFine />
    </RollPlaybackProvider>
  );
}
