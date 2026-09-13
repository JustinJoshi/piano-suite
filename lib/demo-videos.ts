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
    introHeadline: "Practice chords",
    introBody:
      "Pick a root and chord quality, then press **Start Drill**. Hold the chord on your MIDI keyboard. The timer stops when every note is down. Play the reps at your own pace. Your first-chord time is recorded for your practice history.",
    introCta: "Start practicing chords",
  },
  "/tools/arpeggios": {
    mp4: "/demo-arpeggios.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Arpeggios drill: practicing minor-11 arpeggio cells",
    introHeadline: "Master arpeggio shapes",
    introBody:
      "Hold the left-hand pedal, then play the sequence as the strip lights up note by note. Go as slowly as you need to. Laps and misses are counted. Use the miss filter to skip a difficult note while you settle in. Your practice is recorded when the lap completes.",
    introCta: "Start practicing arpeggios",
  },
  "/tools/root-cycling": {
    mp4: "/demo-root-cycling.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of Root Cycling: practicing one idea across all 12 keys",
    introHeadline: "Cycle through all keys",
    introBody:
      "Pick one chord quality. The drill calls it in a random key for each rep. Hold down the chord, then move to the next key whenever you're ready. Keep all twelve keys in the Root Pool, or focus on the keys you're still learning.",
    introCta: "Start cycling keys",
  },
  "/tools/progression": {
    mp4: "/demo-progression.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Progression drill: practicing ii-V-I and blues loops",
    introHeadline: "Play progressions",
    introBody:
      "Pick ii-V-I or 12-bar blues, choose your key, then press **Start Loop**. The strip guides you chord by chord, timing each transition. Your fastest times are saved for every progression and key. Watch your loops get smoother over time.",
    introCta: "Start playing progressions",
  },
  "/tools/workshop": {
    mp4: "/demo-workshop.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Workshop: building your own practice page from blocks",
    introHeadline: "Build your practice page",
    introBody:
      "Your practice page is a grid of blocks: metronome, chord sets, on-screen keyboard, and practice reports. Arrange them however works for you. Start from a ready-made page, or copy one from the community marketplace.",
    introCta: "Open my Workshop",
  },
};

export function toolDemoVideoFor(href: string): ToolDemoVideo | undefined {
  return toolDemoVideos[href];
}
