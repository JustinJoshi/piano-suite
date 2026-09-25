import type { Metadata } from "next";
import Link from "next/link";
import { RollChordStrip } from "@/components/roll/chord-strip";
import { RollMain, RollPageHead } from "@/components/roll/page-head";
import { learningRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Guided routes",
  description:
    "Pick a path — music theory or finger flexibility — and go from knowing nothing about piano to a daily practice habit.",
};

/** A chord per route for its strip: Cmaj7 for theory, an open fifth for the hands. */
const ROUTE_CHORDS: Record<string, number[]> = {
  "music-theory": [60, 64, 67, 71],
  "finger-flexibility": [48, 55, 60, 67, 72],
};

export default function RoutesPage() {
  return (
    <>
      <RollPageHead
        label="Guided routes"
        note="The first route is close to how all of this started."
        eyebrow="If you’ve just got a keyboard"
        title="Pick a route"
        lede={
          <p>
            Choose the thing you want to get good at first. Each route is a short checklist: set up your tools, play
            your first drills, and finish with a practice page ready for tomorrow.
          </p>
        }
      />
      <RollMain className="roll-page-end">
        <div className="grid gap-5 sm:grid-cols-2">
          {learningRoutes.map((route) => (
            <Link
              key={route.id}
              href={`/routes/${route.id}`}
              data-testid={`route-card-${route.id}`}
              className="roll-card-paper group flex flex-col overflow-hidden text-foreground no-underline"
            >
              <RollChordStrip notes={ROUTE_CHORDS[route.id] ?? [60, 64, 67]} />
              <span className="flex flex-1 flex-col gap-2 p-6">
                <span className="roll-label" style={{ color: "var(--felt)" }}>
                  {route.tagline}
                </span>
                <span className="font-heading text-[1.75rem] leading-tight">{route.title.replace(/\s+route$/i, "")}</span>
                <span className="flex-1 text-base leading-relaxed text-muted-foreground">{route.description}</span>
                <span className="roll-link roll-link-arrow mt-2 self-start">Start the route</span>
              </span>
            </Link>
          ))}
        </div>
      </RollMain>
    </>
  );
}
