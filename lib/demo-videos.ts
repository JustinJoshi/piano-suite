export type ToolDemoVideo = {
  mp4: string;
  title: string;
  ariaLabel: string;
  /** First-visit overlay headline (welcomes to Piano Suite + the tool). */
  introHeadline: string;
  /** First-visit overlay body — warm, plain-spoken, tool-specific. */
  introBody: string;
  /** First-visit overlay primary CTA label. */
  introCta: string;
};

/** Per-tool localStorage flag namespace, consistent with `piano-suite:*`. */
export const DEMO_INTRO_FLAG_PREFIX = "piano-suite:demo-intro-seen:";

export function demoIntroFlagKey(href: string): string {
  return `${DEMO_INTRO_FLAG_PREFIX}${href}`;
}

/** True only when this device has dismissed this tool's overlay before. */
export function hasSeenDemoIntro(href: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(demoIntroFlagKey(href)) === "true";
  } catch {
    return false;
  }
}

/** Dismissal is device-local forever — never synced to Convex. */
export function markDemoIntroSeen(href: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(demoIntroFlagKey(href), "true");
  } catch {
    // Storage unavailable (private mode etc.) — overlay may re-show; fine.
  }
}

/**
 * Demo videos for ready-made drill pages and the Workshop, keyed by tool
 * href. Collapsed by default on each page ("Watch the demo") so the drill
 * stays primary; on a first visit the same entry drives the welcome
 * overlay. The welcome page embeds /demo-web2.mp4 separately.
 */
export const toolDemoVideos: Record<string, ToolDemoVideo> = {
  "/tools/chord-drill": {
    mp4: "/demo-chord-drill.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Chord Drill: practicing chords with the timer and MIDI scoring",
    introHeadline: "Welcome to Piano Suite — let's learn some chords",
    introBody:
      "Pick a root and a chord quality, press Start Drill, and hold the chord on your MIDI keyboard — the timer stops once every note is down. Play the round's reps, and your first-chord time is auto-graded and sent to Anki.",
    introCta: "Start practicing chords",
  },
  "/tools/arpeggios": {
    mp4: "/demo-arpeggios.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Arpeggios drill: practicing minor-11 arpeggio cells",
    introHeadline: "Welcome to Piano Suite — one small arpeggio at a time",
    introBody:
      "Hold the left-hand pedal, then play the right-hand sequence as the strip lights up note by note. Laps and misses are counted, and each chord is auto-graded to Anki when the lap completes.",
    introCta: "Start practicing arpeggios",
  },
  "/tools/root-cycling": {
    mp4: "/demo-root-cycling.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of Root Cycling: practicing one idea across all 12 keys",
    introHeadline: "Welcome to Piano Suite — this is Root Cycling",
    introBody:
      "Pick one chord quality and the drill calls it in a random key each rep — hold it down, then skip to the next root. Keep all twelve keys in the pool, or narrow it to the ones you're weak in.",
    introCta: "Start cycling keys",
  },
  "/tools/progression": {
    mp4: "/demo-progression.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Progression drill: practicing ii-V-I and blues loops",
    introHeadline: "Welcome to Piano Suite — play real progressions",
    introBody:
      "Pick ii-V-I or a 12-bar blues, choose your key, and press Start Loop — the strip walks you chord by chord, timing each transition. Your best step times are kept for every progression and key.",
    introCta: "Start playing progressions",
  },
  "/tools/workshop": {
    mp4: "/demo-workshop.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Workshop: building your own practice page from blocks",
    introHeadline: "Welcome to Piano Suite — this is your Workshop",
    introBody:
      "Your practice page is a grid of blocks — a metronome, a chord set, an on-screen keyboard, a practice report — arranged however you like. Start from a ready-made page, or fork one from the community marketplace.",
    introCta: "Open my Workshop",
  },
};

export function toolDemoVideoFor(href: string): ToolDemoVideo | undefined {
  return toolDemoVideos[href];
}
