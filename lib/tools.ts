import {
  Music,
  Zap,
  RefreshCw,
  BarChart3,
  ArrowRightLeft,
  Timer,
  Waves,
  Sparkles,
  Infinity,
  Hexagon,
  LayoutGrid,
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
  {
    title: "Julia Lab",
    description:
      "Wander through swirling fractal worlds that morph as you explore.",
    icon: Sparkles,
    href: "/tools/julia",
    category: "lab",
  },
  {
    title: "Lissajous Lab",
    description:
      "See what musical intervals look like — elegant curves drawn from harmony itself.",
    icon: Infinity,
    href: "/tools/lissajous",
    category: "lab",
  },
  {
    title: "Quasiperiodic Lab",
    description:
      "Mix overlapping waves into dreamy patterns, then set your favorite as the homepage mood.",
    icon: Hexagon,
    href: "/tools/quasiperiodic",
    category: "lab",
  },
  {
    title: "Multigrid Lab",
    description:
      "Tinker with kaleidoscopic tilings — crisp grids that bloom into colored mosaics.",
    icon: LayoutGrid,
    href: "/tools/multigrid",
    category: "lab",
  },
];

export const tools: ToolDef[] = [
  workshopTool,
  ...drillTools,
  ...insightTools,
  ...labTools,
];
