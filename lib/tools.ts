import {
  Music,
  Zap,
  RefreshCw,
  BarChart3,
  ArrowRightLeft,
  Timer,
  Waves,
  Activity,
  Wrench,
  LucideIcon,
} from "lucide-react";

/**
 * Tool registry powering the sidebar sections and the Workshop landing.
 *
 * Group order mirrors the information architecture: the Workshop is the
 * core of the app, ready-made drills are shortcuts (templates), progress
 * tools review practice history, and labs are exploratory visualizations.
 */

export interface ToolDef {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  category: "workshop" | "drill" | "insight" | "lab";
}

export const workshopTool: ToolDef = {
  title: "Workshop",
  description: "Your practice bench — snap friendly blocks into a page that fits you.",
  icon: Wrench,
  href: "/tools/workshop",
  category: "workshop",
};

export const drillTools: ToolDef[] = [
  {
    title: "Chord Drill",
    description:
      "Learn your chords hands-on — a gentle timer keeps score, and Anki remembers for you.",
    icon: Music,
    href: "/tools/chord-drill",
    category: "drill",
  },
  {
    title: "Arpeggios",
    description:
      "Roll through lush 7-note arpeggio shapes, one gentle step at a time.",
    icon: Zap,
    href: "/tools/arpeggios",
    category: "drill",
  },
  {
    title: "Root Cycling",
    description:
      "Take one chord shape on a trip through all 12 keys until it feels like home everywhere.",
    icon: RefreshCw,
    href: "/tools/root-cycling",
    category: "drill",
  },
  {
    title: "Progression",
    description:
      "Loop ii-V-I and 12-bar blues until the changes flow under your fingers.",
    icon: ArrowRightLeft,
    href: "/tools/progression",
    category: "drill",
  },
];

export const insightTools: ToolDef[] = [
  {
    title: "Technique",
    description:
      "A cozy daily habit tracker — log your tempo, watch your 28-day streak grow.",
    icon: Timer,
    href: "/tools/technique",
    category: "insight",
  },
  {
    title: "Tracking",
    description:
      "See how far you've come — times, misses, and streaks, all in one gentle view.",
    icon: BarChart3,
    href: "/tools/tracking",
    category: "insight",
  },
];

// Demoted to two entries by the September 2026 audit (Phase 1.5): Julia,
// Lissajous, Quasiperiodic and Multigrid left the registry. Chladni and
// Chladni Ripple stay — they power the ambient/hero and MIDI-reactive
// visual layer. The four removed labs' routes still exist and render by
// direct URL; only their navigation rows are gone.
export const labTools: ToolDef[] = [
  {
    title: "Chladni Lab",
    description:
      "Play with shimmering wave patterns — the same ones that dance behind our homepage.",
    icon: Waves,
    href: "/tools/chladni",
    category: "lab",
  },
  {
    title: "Chladni Ripple",
    description:
      "Watch your playing become light — every note you press ripples across the screen.",
    icon: Activity,
    href: "/tools/chladni-ripple",
    category: "lab",
  },
];

export const tools: ToolDef[] = [
  workshopTool,
  ...drillTools,
  ...insightTools,
  ...labTools,
];
