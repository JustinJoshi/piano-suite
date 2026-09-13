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
      "This is the Chord Drill, the friendliest place to start. Pick a chord, press play, and find it on your keyboard before the timer runs out. Your MIDI keyboard is scored note by note — but there's an on-screen keyboard too, so you can try it right now without any gear.",
    introCta: "Start practicing chords",
  },
  "/tools/arpeggios": {
    mp4: "/demo-arpeggios.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Arpeggios drill: practicing minor-11 arpeggio cells",
    introHeadline: "Welcome to Piano Suite — meet the Arpeggios drill",
    introBody:
      "Arpeggios are how chords learn to move. This drill walks you through one small arpeggio cell at a time — play it, hear it, repeat it. It sounds fancier than it is, and the 30-second demo shows exactly what your hands will do.",
    introCta: "Start practicing arpeggios",
  },
  "/tools/root-cycling": {
    mp4: "/demo-root-cycling.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of Root Cycling: practicing one idea across all 12 keys",
    introHeadline: "Welcome to Piano Suite — this is Root Cycling",
    introBody:
      "Take one small idea and carry it through all twelve keys, one at a time. It's the habit that makes everything else on the piano feel familiar. No rush — the drill moves at your pace and scores each key as you land it.",
    introCta: "Start cycling keys",
  },
  "/tools/progression": {
    mp4: "/demo-progression.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Progression drill: practicing ii-V-I and blues loops",
    introHeadline: "Welcome to Piano Suite — play real progressions",
    introBody:
      "Chords are words; progressions are sentences. This drill loops you through ii-V-I and a 12-bar blues — the two progressions you'll hear in almost everything. Watch the 30-second demo, then play along.",
    introCta: "Start playing progressions",
  },
  "/tools/workshop": {
    mp4: "/demo-workshop.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Workshop: building your own practice page from blocks",
    introHeadline: "Welcome to Piano Suite — this is your Workshop",
    introBody:
      "The Workshop is where you build your own practice page: drag in a metronome, a chord set, a keyboard — whatever today's session needs. It's blocks, not code. The demo shows a page coming together in under a minute.",
    introCta: "Open my Workshop",
  },
};

export function toolDemoVideoFor(href: string): ToolDemoVideo | undefined {
  return toolDemoVideos[href];
}
