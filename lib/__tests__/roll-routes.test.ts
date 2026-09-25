import { describe, expect, it } from "vitest";
import { isRollRoute } from "@/lib/roll-routes";

describe("isRollRoute", () => {
  it.each(["/", "/start", "/pricing", "/terms", "/privacy", "/marketplace", "/marketplace/abc", "/routes/music-theory", "/articles/x", "/sign-in", "/sign-in/factor-one", "/sign-up", "/pricing/"])(
    "puts %s on the roll",
    (path) => expect(isRollRoute(path)).toBe(true)
  );

  it.each(["/tools/workshop", "/tools/chord-drill", "/settings/theme", "/dev/welcome-lab", "/marketplaces", "/startup"])(
    "leaves %s to the workspace preset",
    (path) => expect(isRollRoute(path)).toBe(false)
  );
});
