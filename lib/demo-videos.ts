export type ToolDemoVideo = {
  mp4: string;
  title: string;
  ariaLabel: string;
};

/**
 * Demo videos for ready-made drill pages and the Workshop, keyed by tool
 * href. Collapsed by default on each page ("Watch the demo") so the drill
 * stays primary. The welcome page embeds /demo-web2.mp4 separately.
 */
export const toolDemoVideos: Record<string, ToolDemoVideo> = {
  "/tools/chord-drill": {
    mp4: "/demo-chord-drill.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Chord Drill: practicing chords with the timer and MIDI scoring",
  },
  "/tools/arpeggios": {
    mp4: "/demo-arpeggios.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Arpeggios drill: practicing minor-11 arpeggio cells",
  },
  "/tools/root-cycling": {
    mp4: "/demo-root-cycling.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of Root Cycling: practicing one idea across all 12 keys",
  },
  "/tools/progression": {
    mp4: "/demo-progression.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Progression drill: practicing ii-V-I and blues loops",
  },
  "/tools/workshop": {
    mp4: "/demo-workshop.mp4",
    title: "Watch the demo",
    ariaLabel:
      "Video demo of the Workshop: building your own practice page from blocks",
  },
};

export function toolDemoVideoFor(href: string): ToolDemoVideo | undefined {
  return toolDemoVideos[href];
}
