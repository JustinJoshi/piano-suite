"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { BookOpen, Hammer, Play, type LucideIcon } from "lucide-react";
import { RollChordStrip } from "@/components/roll/chord-strip";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import type { WelcomeDoorItemConfig } from "@/lib/welcome-config";
import { captureEvent } from "@/lib/analytics";

const DOOR_ICONS: Record<WelcomeDoorItemConfig["id"], LucideIcon> = {
  play: Play,
  build: Hammer,
  learn: BookOpen,
};

/**
 * Each door keeps its own hue (`--door-*`) and punches its own chord into
 * the strip across its top. Build borrows the Explore hue: it is the door
 * into the Workshop and its marketplace.
 */
const DOOR_TONES: Record<WelcomeDoorItemConfig["id"], { hue: string; chord: number[]; cta: string }> = {
  play: { hue: "var(--door-play)", chord: [60, 64, 67], cta: "Start playing" },
  build: { hue: "var(--door-explore)", chord: [62, 65, 69, 72], cta: "Open the Workshop" },
  learn: { hue: "var(--door-learn)", chord: [64, 67, 71], cta: "Read" },
};

/**
 * The second screen: the doors. Play and Build carry almost all the intent,
 * so they get two large cards; Learn is a smaller row underneath, not an
 * equal third column. The page supplies the heading (see app/start). Copy
 * lives in `lib/welcome-config.ts` so `/dev/welcome-lab` can tune it.
 */
export function DoorChooser() {
  const { config } = useWelcomeConfig();
  const { doors } = config;
  const primary = doors.items.filter((door) => door.id !== "learn");
  const secondary = doors.items.filter((door) => door.id === "learn");

  return (
    <div className="roll-doors">
      <div className="roll-doors-primary">
        {primary.map((door) => {
          const Icon = DOOR_ICONS[door.id] ?? Play;
          const tone = DOOR_TONES[door.id];
          return (
            <Link
              key={door.id}
              href={door.href}
              data-testid={`door-${door.id}`}
              data-emphasis="primary"
              onClick={() => captureEvent("door_clicked", { doorId: door.id })}
              className="roll-door roll-card-paper"
              style={{ "--door": tone.hue } as CSSProperties}
            >
              <RollChordStrip notes={tone.chord} />
              <span className="roll-door-body">
                <span className="roll-door-icon" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="roll-door-name">{door.label}</span>
                <span className="roll-door-desc">{door.description}</span>
                <span className="roll-link roll-link-arrow roll-door-cta">{tone.cta}</span>
              </span>
            </Link>
          );
        })}
      </div>
      {secondary.map((door) => {
        const Icon = DOOR_ICONS[door.id] ?? BookOpen;
        const tone = DOOR_TONES[door.id];
        return (
          <Link
            key={door.id}
            href={door.href}
            data-testid={`door-${door.id}`}
            data-emphasis="secondary"
            onClick={() => captureEvent("door_clicked", { doorId: door.id })}
            className="roll-door-row roll-card-paper"
            style={{ "--door": tone.hue } as CSSProperties}
          >
            <span className="roll-door-icon" aria-hidden="true">
              <Icon className="h-4 w-4" />
            </span>
            <span className="roll-door-row-name">{door.label}</span>
            <span className="roll-door-row-desc">{door.description}</span>
            <span className="roll-link roll-link-arrow" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}
