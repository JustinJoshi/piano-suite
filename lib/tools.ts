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

export interface ToolDef {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  category: "practice" | "lab";
}

export const tools: ToolDef[] = [
  {
    title: "Chord Drill",
    description:
      "Blocked-practice chord drill with timer, stats, and AnkiConnect integration.",
    icon: Music,
    href: "/tools/chord-drill",
    category: "practice",
  },
  {
    title: "Arpeggios",
    description:
      "Practice 7-note minor-11 arpeggio cells with two-phase root and sequence drilling.",
    icon: Zap,
    href: "/tools/arpeggios",
    category: "practice",
  },
  {
    title: "Root Cycling",
    description:
      "Drill one fixed chord or arpeggio idea across random roots in all 12 keys.",
    icon: RefreshCw,
    href: "/tools/root-cycling",
    category: "practice",
  },
  {
    title: "Progression",
    description:
      "Loop ii-V-I and 12-bar blues progressions with per-chord transition timing.",
    icon: ArrowRightLeft,
    href: "/tools/progression",
    category: "practice",
  },
  {
    title: "Technique",
    description:
      "Daily technique habit tracker with metronome, BPM log, and a 28-day grid.",
    icon: Timer,
    href: "/tools/technique",
    category: "practice",
  },
  {
    title: "Tracking",
    description:
      "Review first-chord times, transition times, misses, and streaks over time.",
    icon: BarChart3,
    href: "/tools/tracking",
    category: "practice",
  },
  {
    title: "Workshop",
    description:
      "Build your own practice page from reusable features.",
    icon: Wrench,
    href: "/tools/workshop",
    category: "practice",
  },
  {
    title: "Chladni Lab",
    description:
      "Interactive square-plate waveform explorer for the hero background shader.",
    icon: Waves,
    href: "/tools/chladni",
    category: "lab",
  },
  {
    title: "Chladni Ripple",
    description:
      "Drive Chladni nodal patterns from live MIDI notes — pitch, octave, and velocity.",
    icon: Activity,
    href: "/tools/chladni-ripple",
    category: "lab",
  },
  {
    title: "Julia Lab",
    description:
      "Interactive escape-time Julia set explorer with morphing complex parameters.",
    icon: Sparkles,
    href: "/tools/julia",
    category: "lab",
  },
  {
    title: "Lissajous Lab",
    description:
      "Interactive frequency-ratio curve explorer mapped to musical intervals.",
    icon: Infinity,
    href: "/tools/lissajous",
    category: "lab",
  },
  {
    title: "Quasiperiodic Lab",
    description:
      "Interactive N-fold wave interference explorer with Apply-to-home atmosphere.",
    icon: Hexagon,
    href: "/tools/quasiperiodic",
    category: "lab",
  },
  {
    title: "Multigrid Lab",
    description:
      "De Bruijn multigrid dual tiling explorer — crisp grids and colored rhombus tilings.",
    icon: LayoutGrid,
    href: "/tools/multigrid",
    category: "lab",
  },
];

export const practiceTools = tools.filter((tool) => tool.category === "practice");
export const labTools = tools.filter((tool) => tool.category === "lab");
