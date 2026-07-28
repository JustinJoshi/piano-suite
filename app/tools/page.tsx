import {
  Home,
  Music,
  Zap,
  RefreshCw,
  BarChart3,
  ArrowRightLeft,
  Timer,
  Search,
  Bell,
  Waves,
  Sparkles,
  Infinity,
  Hexagon,
  Activity,
} from "lucide-react";
import { AppUserButton } from "@/components/app-user-button";
import { DashboardMenuButton } from "@/components/tools/dashboard-nav";
import { ToolCard } from "@/components/tools/tool-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const tools = [
  {
    title: "Welcome",
    description:
      "Overview and getting-started hub for the practice suite.",
    icon: Home,
    href: "/",
  },
  {
    title: "Chord Drill",
    description:
      "Blocked-practice chord drill with timer, stats, and AnkiConnect integration.",
    icon: Music,
    href: "/tools/chord-drill",
  },
  {
    title: "Arpeggios",
    description:
      "Practice 7-note minor-11 arpeggio cells with two-phase root and sequence drilling.",
    icon: Zap,
    href: "/tools/arpeggios",
  },
  {
    title: "Root Cycling",
    description:
      "Drill one fixed chord or arpeggio idea across random roots in all 12 keys.",
    icon: RefreshCw,
    href: "/tools/root-cycling",
  },
  {
    title: "Tracking",
    description:
      "Review first-chord times, transition times, misses, and streaks over time.",
    icon: BarChart3,
    href: "/tools/tracking",
  },
  {
    title: "Progression",
    description:
      "Loop ii-V-I and 12-bar blues progressions with per-chord transition timing.",
    icon: ArrowRightLeft,
    href: "/tools/progression",
  },
  {
    title: "Technique",
    description:
      "Daily technique habit tracker with metronome, BPM log, and a 28-day grid.",
    icon: Timer,
    href: "/tools/technique",
  },
  {
    title: "Chladni Lab",
    description:
      "Interactive square-plate waveform explorer for the hero background shader.",
    icon: Waves,
    href: "/tools/chladni",
  },
  {
    title: "Chladni Ripple",
    description:
      "Drive Chladni nodal patterns from live MIDI notes — pitch, octave, and velocity.",
    icon: Activity,
    href: "/tools/chladni-ripple",
  },
  {
    title: "Julia Lab",
    description:
      "Interactive escape-time Julia set explorer with morphing complex parameters.",
    icon: Sparkles,
    href: "/tools/julia",
  },
  {
    title: "Lissajous Lab",
    description:
      "Interactive frequency-ratio curve explorer mapped to musical intervals.",
    icon: Infinity,
    href: "/tools/lissajous",
  },
  {
    title: "Quasiperiodic Lab",
    description:
      "Interactive N-fold wave interference explorer with Apply-to-home atmosphere.",
    icon: Hexagon,
    href: "/tools/quasiperiodic",
  },
  {
    title: "Multigrid Lab",
    description:
      "De Bruijn multigrid dual tiling explorer — crisp grids and colored rhombus tilings.",
    icon: LayoutGrid,
    href: "/tools/multigrid",
  },
];

export default function ToolsPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <DashboardMenuButton />
          <h1 className="font-heading text-lg font-semibold text-foreground">
            Tools
          </h1>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            justin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              className="h-8 w-64 rounded-lg border border-border bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-4 w-4" />
          </Button>
          <AppUserButton />
        </div>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Practice dashboard
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a tool to start drilling. Your progress syncs across devices.
            </p>
          </div>

          <Separator className="mb-8 bg-border" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard
                key={tool.title}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                href={tool.href}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
