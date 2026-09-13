import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { toolDemoVideos } from "../demo-videos";

const publicDir = join(process.cwd(), "public");

describe("toolDemoVideos", () => {
  it("covers the five ready-made drills and the Workshop", () => {
    expect(Object.keys(toolDemoVideos).sort()).toEqual(
      [
        "/tools/arpeggios",
        "/tools/chord-drill",
        "/tools/progression",
        "/tools/root-cycling",
        "/tools/workshop",
      ].sort(),
    );
  });

  it("maps every href to an existing file in public/", () => {
    for (const [href, demo] of Object.entries(toolDemoVideos)) {
      expect(href.startsWith("/tools/"), href).toBe(true);
      expect(demo.mp4.startsWith("/demo-"), href).toBe(true);
      expect(existsSync(join(publicDir, demo.mp4)), `${href} -> ${demo.mp4}`).toBe(
        true,
      );
    }
  });

  it("gives every entry a title and aria-label", () => {
    for (const [href, demo] of Object.entries(toolDemoVideos)) {
      expect(demo.title.length, href).toBeGreaterThan(0);
      expect(demo.ariaLabel.length, href).toBeGreaterThan(0);
    }
  });
});
